const express = require('express');
const { open } = require('lmdb');
const path = require('path');

const app = express();
const port = 3000;

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
async function getAllEntries() {
    const startTime = process.hrtime();
    const cacheKey = 'all_entries';
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
    
    for await (const entry of iterator) {
        entries.push({
            key: entry.key,
            value: entry.value
        });
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
setInterval(cleanupCache, 60 * 1000);

app.get('/entries', async (req, res) => {
    const requestStartTime = process.hrtime();
    try {
        // Set headers for JSON streaming
        res.setHeader('Content-Type', 'application/json');
        res.write('['); // Start JSON array

        // Get entries from cache or database
        const entries = await getAllEntries();
        
        // Handle client disconnect
        req.on('close', () => {
            if (isResponseWritable(res)) {
                res.end();
            }
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
                    res.once('drain', resolve);
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
app.post('/clear-cache', (req, res) => {
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

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 