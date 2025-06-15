# LMDB Streaming NodeJS Server

A high-performance NodeJS HTTP server that streams entries from an LMDB store with advanced features like caching, rate limiting, and security measures.

## Quick Start

1. **Clone and install**
   ```sh
   git clone https://github.com/lucip5750/testh.git
   cd testh
   npm install
   ```

2. **Seed the database**
   ```sh
   node seed.js
   ```

3. **Start the server**
   ```sh
   node server.js
   ```

## Key Features

- 🚀 High-performance LMDB data streaming
- 🔒 API key authentication
- 🛡️ Rate limiting and CORS protection
- 💾 In-memory caching with TTL
- 📊 Performance monitoring
- 🧪 Comprehensive test suite

## API Endpoints

- `GET /entries` - Stream database entries
- `GET /cache-stats` - View cache statistics
- `GET /clear-cache` - Clear the cache

## Documentation

For detailed documentation, including:
- Complete API reference
- Configuration options
- Security features
- Performance optimizations
- Development guidelines

Please see [DOCUMENTATION.md](DOCUMENTATION.md)

## Requirements

- Node.js 16 or higher
- npm

## License

ISC License
