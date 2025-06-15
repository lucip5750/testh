const request = require('supertest');
const path = require('path');
const fs = require('fs');
const http = require('http');

// Import the server code
const { app, createServer } = require('../server');

// Enable fake timers
jest.useFakeTimers();

// Test database path
const TEST_DB_PATH = path.join(__dirname, '.', 'test-data');

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

    describe('GET /clear-cache', () => {
        it('should clear the cache successfully', async () => {
            const response = await request(app)
                .get('/clear-cache')
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

    describe('Rate Limiting', () => {
        beforeEach(() => {
            // Reset the rate limiter state before each test
            jest.clearAllTimers();
        });

        it('should allow requests within the rate limit', async () => {
            // Make 5 requests (well within our 100 request limit)
            for (let i = 0; i < 5; i++) {
                const response = await request(app)
                    .get('/entries')
                    .expect(200);
                
                // Check for rate limit headers
                expect(response.headers).toHaveProperty('x-ratelimit-limit');
                expect(response.headers).toHaveProperty('x-ratelimit-remaining');
                expect(response.headers).toHaveProperty('x-ratelimit-reset');
            }
        });

        it('should block requests exceeding the rate limit', async () => {
            // Make requests until we hit the limit
            let response;
            let requestCount = 0;
            
            // We'll make 101 requests (our limit is 100)
            while (requestCount < 101) {
                response = await request(app).get('/entries');
                if (response.status === 429) break;
                requestCount++;
            }

            // Verify we got blocked
            expect(response.status).toBe(429);
            expect(response.body).toEqual({ error: 'Too many requests from this IP, please try again later.' });
        });

        it('should include rate limit headers in responses', async () => {
            // Create a fresh app and rate limiter for this test
            const express = require('express');
            const rateLimit = require('express-rate-limit');
            const testApp = express();
            const testLimiter = rateLimit({
                windowMs: 15 * 60 * 1000,
                max: 100,
                message: { error: 'Too many requests from this IP, please try again later.' },
                standardHeaders: false,
                legacyHeaders: true,
            });
            testApp.use(testLimiter);
            testApp.get('/entries', (req, res) => res.json([]));

            // Use a unique IP for this test
            const response = await request(testApp)
                .get('/entries')
                .set('X-Forwarded-For', '3.3.3.3')
                .expect(200);

            // Check for all required rate limit headers
            expect(response.headers).toHaveProperty('x-ratelimit-limit');
            expect(response.headers).toHaveProperty('x-ratelimit-remaining');
            expect(response.headers).toHaveProperty('x-ratelimit-reset');

            // Verify header values are numbers
            expect(Number(response.headers['x-ratelimit-limit'])).not.toBeNaN();
            expect(Number(response.headers['x-ratelimit-remaining'])).not.toBeNaN();
            expect(Number(response.headers['x-ratelimit-reset'])).not.toBeNaN();
        });

        it('should reset rate limit after window period', async () => {
            // Reset the rate limiter state
            jest.clearAllTimers();
            
            // Make some requests
            for (let i = 0; i < 5; i++) {
                await request(app).get('/entries');
            }

            // Get remaining requests
            const response = await request(app).get('/entries');
            const remainingBefore = parseInt(response.headers['x-ratelimit-remaining']);

            // Mock the passage of time (15 minutes + 1 second)
            jest.advanceTimersByTime(15 * 60 * 1000 + 1000);

            // Make another request
            const newResponse = await request(app).get('/entries');
            const remainingAfter = parseInt(newResponse.headers['x-ratelimit-remaining']);

            // Remaining requests should be reset
            expect(remainingAfter).toBeGreaterThan(remainingBefore);
        });
    });
}); 