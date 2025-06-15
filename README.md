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
   git clone https://github.com/lucip5750/testh.git
   cd testh
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
- `GET /clear-cache` - Manually clear the cache
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
- `__tests__/` — Test directory containing all test files
  - `server.test.js` — Integration tests for server endpoints and cache functionality

## Testing

The project includes a comprehensive test suite to ensure reliability and functionality:

1. **Run all tests**
   ```sh
   npm test
   ```

Test files are located in the `__tests__` directory and follow the Jest testing framework conventions. The test suite is organized as follows:

- `__tests__/server.test.js`: Contains all server-related tests including:
  - API endpoint testing
  - Cache functionality verification
  - Error handling scenarios
  - Client disconnection handling
  - Cache statistics and clearing

## Notes
- `node_modules` is excluded from git via `.gitignore`.
- To add more mock data, edit `seed.js` and re-run it.
- Cache TTL is set to 5 minutes by default

## Requirements
- Node.js 16 or higher

## Rate Limiting

This server implements rate limiting to prevent abuse. The rate limiter is configured as follows:

- **Time Window:** 15 minutes
- **Request Limit:** 100 requests per IP address within the time window
- **Headers:** Uses legacy `X-RateLimit-*` headers
- **Error Message:** Returns a 429 status code with the message: `{ error: 'Too many requests from this IP, please try again later.' }`

### Example

If a client exceeds the rate limit, they will receive a response like this:

```json
{
  "error": "Too many requests from this IP, please try again later."
}
```

### Testing

Rate limiting is tested in the test suite. See `__tests__/server.test.js` for details.

## CORS Configuration

This server implements CORS (Cross-Origin Resource Sharing) to control which domains can access the API. The CORS configuration is as follows:

- **Allowed Origins:** Configurable via `ALLOWED_ORIGINS` environment variable (comma-separated list) or defaults to `['http://localhost:3000']`
- **Allowed Methods:** GET, POST, PUT, DELETE, OPTIONS
- **Allowed Headers:** Content-Type, Authorization
- **Credentials:** Allowed (for authenticated requests)
- **Max Age:** 24 hours (86400 seconds) for preflight requests

### Environment Variables

To configure allowed origins, set the `ALLOWED_ORIGINS` environment variable:

```bash
ALLOWED_ORIGINS=https://example.com,https://api.example.com
```

### Example

A successful CORS request will include the following headers:

```
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS
Access-Control-Allow-Headers: Content-Type,Authorization
Access-Control-Max-Age: 86400
```

### Testing

CORS functionality is tested in the test suite. See `__tests__/server.test.js` for details.

## Request Validation

The server uses `express-validator` to ensure data integrity and security.

### Entries Endpoint (`GET /entries`)

- **Query Parameters:**
  - `limit` (optional): Number of entries to return. Must be an integer between 1 and 100. Defaults to all entries.
  - `offset` (optional): Number of entries to skip. Must be a non-negative integer. Defaults to 0.

- **Example Valid Request:**
  ```
  GET /entries?limit=10&offset=0
  ```

- **Example Error Response:**
  ```json
  {
    "errors": [
      {
        "msg": "Limit must be between 1 and 100",
        "param": "limit",
        "location": "query"
      }
    ]
  }
  ```

### Cache Operations

- **Query Parameters:**
  - No query parameters required.

- **Example Valid Request:**
  ```
  GET /clear-cache
  ```

Request validation is tested in the test suite located at `__tests__/server.test.js`.

## Input Sanitization

The server implements input sanitization to prevent injection attacks and ensure data integrity. All user input is sanitized before processing:

### Query Parameters Sanitization

- **Numeric Parameters:**
  - `limit` and `offset` are converted to integers
  - Invalid values are rejected
  - Values are escaped to prevent injection

- **String Parameters:**
  - All string inputs are trimmed of whitespace
  - Special characters are escaped
  - Input is validated against allowed patterns

### Security Features

- **SQL Injection Prevention:**
  - All user input is escaped
  - Query parameters are strictly typed
  - Pattern matching for allowed characters

- **XSS Prevention:**
  - HTML special characters are escaped
  - Input is sanitized before being used in responses
  - Content-Type headers are properly set

### Example

Raw input:
```
GET /entries?limit=10&offset=0&param=<script>alert('xss')</script>
```

Sanitized input:
```
GET /entries?limit=10&offset=0&param=%3Cscript%3Ealert%28%27xss%27%29%3C%2Fscript%3E
```

Input sanitization is tested in the test suite located at `__tests__/server.test.js`.
