const express = require('express');
const { open } = require('lmdb');
const path = require('path');

const app = express();
const port = 3000;

// Initialize LMDB
const db = open({
    path: path.join(__dirname, 'data'),
    compression: true
});

// Helper function to check if the response is still writable
function isResponseWritable(res) {
    return !res.writableEnded && !res.destroyed;
}

app.get('/entries', async (req, res) => {
    try {
        // Set headers for JSON streaming
        res.setHeader('Content-Type', 'application/json');
        res.write('['); // Start JSON array

        let isFirst = true;
        const iterator = db.getRange({});
        
        // Handle client disconnect
        req.on('close', () => {
            if (isResponseWritable(res)) {
                res.end();
            }
        });

        // Process entries with back-pressure handling
        for await (const entry of iterator) {
            if (!isResponseWritable(res)) {
                return;
            }

            // Add comma between entries
            if (!isFirst) {
                res.write(',');
            }
            isFirst = false;

            // Write the entry as JSON
            const entryJson = JSON.stringify({
                key: entry.key,
                value: entry.value
            });

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
    } catch (error) {
        console.error('Error streaming entries:', error);
        if (isResponseWritable(res)) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 