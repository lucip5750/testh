const express = require('express');
const { open } = require('lmdb');
const path = require('path');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const { body, query, validationResult } = require('express-validator');

const app = express();
const port = process.env.PORT || 3000;

// CORS configuration
const corsOptions = {
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400 // 24 hours
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Rate limiting configuration
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: { error: 'Too many requests from this IP, please try again later.' },
    standardHeaders: false, // Disable the `RateLimit-*` headers
    legacyHeaders: true, // Enable the `X-RateLimit-*` headers
});

// Apply rate limiting to all routes
app.use(limiter);

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
const cache = new Map();

// Cache entry structure
class CacheEntry {
    constructor(data, timestamp) {
        this.data = data;
        this.timestamp = timestamp;
    }

    isExpired() {
        return Date.now() - this.timestamp > CACHE_TTL;
    }
}

// Initialize LMDB
const db = open({
    path: path.join(__dirname, 'data'),
    compression: true
});

// Helper function to check if the response is still writable
function isResponseWritable(res) {
    return !res.writableEnded && !res.destroyed;
}

// Helper function to get all entries from cache or database
async function getAllEntries(limit, offset) {
    const startTime = process.hrtime();
    const cacheKey = `all_entries_${limit}_${offset}`;
    const cachedEntry = cache.get(cacheKey);

    // Return cached data if it exists and is not expired
    if (cachedEntry && !cachedEntry.isExpired()) {
        const [seconds, nanoseconds] = process.hrtime(startTime);
        const duration = seconds * 1000 + nanoseconds / 1000000;
        console.log(`Cache hit: returning cached entries (${duration.toFixed(2)}ms)`);
        return cachedEntry.data;
    }

    // If no cache or expired, fetch from database
    console.log('Cache miss: fetching from database');
    const entries = [];
    const iterator = db.getRange({});
    let skipped = 0;
    let added = 0;

    for await (const entry of iterator) {
        if (skipped < offset) {
            skipped++;
            continue;
        }
        if (limit !== undefined && added >= limit) break;
        entries.push({
            key: entry.key,
            value: entry.value
        });
        added++;
    }

    // Update cache
    cache.set(cacheKey, new CacheEntry(entries, Date.now()));
    
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const duration = seconds * 1000 + nanoseconds / 1000000;
    console.log(`Database fetch completed (${duration.toFixed(2)}ms)`);
    
    return entries;
}

// Cache cleanup function
function cleanupCache() {
    const now = Date.now();
    for (const [key, entry] of cache.entries()) {
        if (entry.isExpired()) {
            cache.delete(key);
        }
    }
}

// Run cache cleanup every minute
let cleanupInterval;
if (process.env.NODE_ENV !== 'test') {
    cleanupInterval = setInterval(cleanupCache, 60 * 1000);
}

// Validation middleware
const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// Validation schemas
const entryValidation = [
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be a positive number'),
    validateRequest
];

// Apply validation to routes
app.get('/entries', entryValidation, async (req, res) => {
    const requestStartTime = process.hrtime();
    try {
        // Set headers for JSON streaming
        res.setHeader('Content-Type', 'application/json');
        res.write('['); // Start JSON array

        // Get entries from cache or database
        const entries = await getAllEntries(req.query.limit, req.query.offset);
        
        // Handle client disconnect
        req.on('close', () => {
            res.end();
        });

        // Process entries with back-pressure handling
        for (let i = 0; i < entries.length; i++) {
            if (!isResponseWritable(res)) {
                return;
            }

            // Add comma between entries
            if (i > 0) {
                res.write(',');
            }

            // Write the entry as JSON
            const entryJson = JSON.stringify(entries[i]);

            // Check if we can write to the response
            const canWrite = res.write(entryJson);
            
            // If we can't write (back-pressure), wait for drain
            if (!canWrite) {
                await new Promise(resolve => {
                    res.once('drain', () => {
                        resolve();
                    });
                });
            }
        }

        // End the JSON array and response
        if (isResponseWritable(res)) {
            res.write(']');
            res.end();
        }

        const [seconds, nanoseconds] = process.hrtime(requestStartTime);
        const totalDuration = seconds * 1000 + nanoseconds / 1000000;
        console.log(`Request completed in ${totalDuration.toFixed(2)}ms`);

    } catch (error) {
        console.error('Error streaming entries:', error);
        if (isResponseWritable(res)) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

// Add a route to manually clear the cache
app.get('/clear-cache', (req, res) => {
    cache.clear();
    res.json({ message: 'Cache cleared successfully' });
});

// Add a route to get cache statistics
app.get('/cache-stats', (req, res) => {
    const stats = {
        size: cache.size,
        keys: Array.from(cache.keys()),
        ttl: CACHE_TTL
    };
    res.json(stats);
});

// Create and start server
function createServer(port = process.env.PORT || 3000) {
    return new Promise((resolve, reject) => {
        const server = app.listen(port, () => {
            console.log(`Server running at http://localhost:${port}`);
            resolve(server);
        }).on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                // Try the next port
                createServer(port + 1).then(resolve).catch(reject);
            } else {
                reject(err);
            }
        });
    });
}

// Only start the server if this file is run directly
if (require.main === module) {
    createServer().catch(console.error);
}

// Export for testing
module.exports = {
    app,
    createServer,
    cleanupCache,
    cleanupInterval
}; 