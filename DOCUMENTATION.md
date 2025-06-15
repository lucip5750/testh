# Project Documentation

## Overview
This is a Node.js-based API server that provides a secure and efficient way to handle data storage and retrieval using LMDB (Lightning Memory-Mapped Database). The application implements various security measures, caching mechanisms, and follows best practices for API development.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [API Endpoints](#api-endpoints)
5. [Security Features](#security-features)
6. [Performance Optimizations](#performance-optimizations)
7. [Testing](#testing)
8. [Development](#development)

## Prerequisites
- Node.js (v14 or higher)
- npm (Node Package Manager)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd testh
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (optional):
Create a `.env` file in the root directory with the following variables:
```
PORT=3000
API_KEY=your-api-key
ALLOWED_ORIGINS=http://localhost:3000
NODE_ENV=development
```

## Configuration

### Environment Variables
- `PORT`: Server port (default: 3000)
- `API_KEY`: API key for authentication
- `ALLOWED_ORIGINS`: Comma-separated list of allowed CORS origins
- `NODE_ENV`: Environment mode (development/production)

### Rate Limiting
- Window: 15 minutes
- Max requests: 100 per IP
- Headers: X-RateLimit-* (legacy headers enabled)

### Caching
- TTL: 5 minutes
- In-memory cache implementation
- Automatic cache cleanup every minute

## API Endpoints

### GET /entries
Retrieves entries from the database with pagination support.

**Query Parameters:**
- `limit` (optional): Number of entries to return (1-100, default: 100)
- `offset` (optional): Number of entries to skip (default: 0)

**Headers Required:**
- `x-api-key`: API key for authentication

**Response:**
```json
[
  {
    "key": "entry-key",
    "value": "entry-value"
  }
]
```

## Security Features

### API Key Authentication
- Required for all endpoints
- Configured via environment variable
- Validates through `x-api-key` header

### CORS Protection
- Configurable allowed origins
- Secure headers configuration
- Pre-flight request handling

### Rate Limiting
- IP-based request limiting
- Configurable time window
- Custom error messages

### Input Validation
- Request parameter validation
- Input sanitization
- Type checking

## Performance Optimizations

### Caching Strategy
- In-memory cache with TTL
- Automatic cache invalidation
- Cache cleanup on interval

### Database Optimization
- LMDB for high-performance storage
- Compression enabled
- Efficient data retrieval

### Response Handling
- JSON streaming support
- Back-pressure handling
- Client disconnect detection

## Testing

Run the test suite:
```bash
npm test
```

The project uses Jest for testing with the following features:
- Automatic handle detection
- Force exit on completion
- Supertest for HTTP assertions

## Development

### Project Structure
```
.
├── server.js          # Main application file
├── seed.js           # Database seeding script
├── data/             # LMDB data directory
├── test-data/        # Test data directory
├── __tests__/        # Test files
└── package.json      # Project configuration
```

### Available Scripts
- `npm start`: Start the server
- `npm test`: Run tests
- `node seed.js`: Seed the database

### Best Practices
1. Always validate input data
2. Use environment variables for configuration
3. Follow the established error handling patterns
4. Maintain test coverage
5. Document API changes

## Error Handling

The application implements comprehensive error handling:
- Input validation errors (400)
- Authentication errors (401)
- Rate limit errors (429)
- Server errors (500)

Each error response includes:
- Error message
- Status code
- Additional context when applicable

## Monitoring and Logging

The application includes built-in logging for:
- Cache hits/misses
- Database operations
- Request processing time
- Error conditions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License
ISC License 