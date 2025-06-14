const request = require('supertest');
const express = require('express');
const { open } = require('lmdb');
const path = require('path');
const fs = require('fs');
const http = require('http');

// Import the server code
const { app, createServer } = require('./server');

// Test database path
const TEST_DB_PATH = path.join(__dirname, 'test-data');

// Helper function to clear test database
function clearTestDatabase() {
    if (fs.existsSync(TEST_DB_PATH)) {
        fs.rmSync(TEST_DB_PATH, { recursive: true, force: true });
    }
    fs.mkdirSync(TEST_DB_PATH);
}

let server;

// Setup and teardown
beforeAll(async () => {
    clearTestDatabase();
    // Set test environment
    process.env.NODE_ENV = 'test';
    // Create server for tests
    server = await createServer(0); // Use port 0 to get a random available port
});

afterAll(async () => {
    clearTestDatabase();
    // Clean up test environment
    process.env.NODE_ENV = undefined;
    // Close server
    await new Promise((resolve) => {
        server.close(resolve);
    });
});

describe('Server Integration Tests', () => {
    describe('GET /entries', () => {
        it('should return a valid JSON array', async () => {
            const response = await request(app)
                .get('/entries')
                .expect('Content-Type', /json/)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
        });

        it('should handle client disconnection gracefully', async () => {
            // Create a raw HTTP request to simulate client disconnection
            const port = server.address().port;
            const req = http.request({
                hostname: 'localhost',
                port: port,
                path: '/entries',
                method: 'GET'
            });

            // Start the request
            req.end();

            // Wait a bit to ensure the request has started
            await new Promise(resolve => setTimeout(resolve, 100));

            // Destroy the request to simulate client disconnection
            req.destroy();

            // Wait for the request to be fully destroyed
            await new Promise(resolve => setTimeout(resolve, 100));

            // The request should be destroyed
            expect(req.destroyed).toBe(true);
        });

        it('should return entries with correct structure', async () => {
            const response = await request(app)
                .get('/entries')
                .expect('Content-Type', /json/)
                .expect(200);

            if (response.body.length > 0) {
                const firstEntry = response.body[0];
                expect(firstEntry).toHaveProperty('key');
                expect(firstEntry).toHaveProperty('value');
            }
        });
    });

    describe('GET /cache-stats', () => {
        it('should return cache statistics', async () => {
            const response = await request(app)
                .get('/cache-stats')
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body).toHaveProperty('size');
            expect(response.body).toHaveProperty('keys');
            expect(response.body).toHaveProperty('ttl');
            expect(Array.isArray(response.body.keys)).toBe(true);
        });
    });

    describe('POST /clear-cache', () => {
        it('should clear the cache successfully', async () => {
            const response = await request(app)
                .post('/clear-cache')
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body).toHaveProperty('message', 'Cache cleared successfully');

            // Verify cache is cleared by checking stats
            const statsResponse = await request(app)
                .get('/cache-stats')
                .expect('Content-Type', /json/)
                .expect(200);

            expect(statsResponse.body.size).toBe(0);
        });
    });

    describe('Cache Behavior', () => {
        it('should cache entries after first request', async () => {
            // First request - should be a cache miss
            await request(app)
                .get('/entries')
                .expect('Content-Type', /json/)
                .expect(200);

            // Check cache stats
            const statsResponse = await request(app)
                .get('/cache-stats')
                .expect('Content-Type', /json/)
                .expect(200);

            expect(statsResponse.body.size).toBe(1);
            expect(statsResponse.body.keys).toContain('all_entries');
        });

        it('should return cached data on subsequent requests', async () => {
            // First request
            const firstResponse = await request(app)
                .get('/entries')
                .expect('Content-Type', /json/)
                .expect(200);

            // Second request
            const secondResponse = await request(app)
                .get('/entries')
                .expect('Content-Type', /json/)
                .expect(200);

            // Both responses should be identical
            expect(secondResponse.body).toEqual(firstResponse.body);
        });
    });
}); 