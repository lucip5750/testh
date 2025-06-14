# LMDB Streaming NodeJS Server

This project is a simple NodeJS HTTP server that streams all entries from an LMDB store using [lmdb-js](https://github.com/DoctorEvidence/lmdb-js). Entries are streamed as JSON, with proper handling of network back-pressure and client disconnects.

## Features
- Streams all LMDB entries as a JSON array
- Handles network back-pressure (pauses/resumes streaming as needed)
- Cleans up if the client disconnects
- Includes a script to seed the database with mock data
- Implements in-memory caching with TTL (Time To Live)
- Performance monitoring with request timing

## Installation

1. **Clone the repository**
   ```sh
   git clone <your-repo-url>
   cd <project-directory>
   ```

2. **Install dependencies**
   ```sh
   npm install
   ```

3. **Seed the database with mock data**
   ```sh
   node seed.js
   ```

4. **Start the server**
   ```sh
   node server.js
   ```

## API Endpoints

### Main Endpoints
- `GET /entries` - Stream all entries from the database
  - Returns a JSON array of all entries
  - Implements caching (5-minute TTL)
  - Handles back-pressure automatically

### Cache Management
- `GET /cache-stats` - Get cache statistics
  - Returns information about cache size, keys, and TTL
  - Example response:
    ```json
    {
      "size": 1,
      "keys": ["all_entries"],
      "ttl": 300000
    }
    ```
- `POST /clear-cache` - Manually clear the cache
  - Returns success message when cache is cleared
  - Example response:
    ```json
    {
      "message": "Cache cleared successfully"
    }
    ```

## Performance Monitoring

The server logs timing information for each request:
- Cache hit/miss timing
- Database fetch duration
- Total request duration

Example log output:
```
Cache hit: returning cached entries (0.15ms)
Request completed in 5.23ms
```
or
```
Cache miss: fetching from database
Database fetch completed (25.45ms)
Request completed in 30.12ms
```

## Project Structure
- `server.js` — Main HTTP server with caching implementation
- `seed.js` — Script to populate the LMDB store with mock data
- `data/` — LMDB database files (auto-created)

## Notes
- `node_modules` is excluded from git via `.gitignore`.
- To add more mock data, edit `seed.js` and re-run it.
- Cache TTL is set to 5 minutes by default
- Cache is automatically cleaned up every minute

## Requirements
- Node.js 16 or higher

---

Feel free to modify and extend this project as needed! 