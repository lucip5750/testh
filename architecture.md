# Project Architecture

This document provides a visual representation of the project's architecture using Mermaid diagrams.

## System Overview

```mermaid
graph TB
    Client[Client] -->|HTTP Requests| API[Express API Server]
    API -->|Rate Limiting| RateLimiter[Rate Limiter]
    API -->|CORS| CORS[CORS Middleware]
    API -->|Validation| Validator[Request Validator]
    API -->|API Key Check| Auth[API Key Auth]
    API -->|Cache Check| Cache[In-Memory Cache]
    Cache -->|Cache Miss| DB[LMDB Database]
    DB -->|Store Data| DataDir[Data Directory]
    
    subgraph Security
        RateLimiter
        CORS
        Auth
    end
    
    subgraph Data Layer
        Cache
        DB
        DataDir
    end
```

## Request Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant RateLimiter
    participant Validator
    participant Cache
    participant DB
    
    Client->>API: HTTP Request
    API->>RateLimiter: Check Rate Limit
    RateLimiter-->>API: Rate Limit OK
    API->>Validator: Validate Request
    Validator-->>API: Validation OK
    API->>Cache: Check Cache
    alt Cache Hit
        Cache-->>API: Return Cached Data
    else Cache Miss
        Cache->>DB: Fetch Data
        DB-->>Cache: Return Data
        Cache-->>API: Return Data
    end
    API-->>Client: HTTP Response
```

## Components Description

1. **Client**
   - External applications making HTTP requests to the API
   - Must include valid API key in headers

2. **Express API Server**
   - Main application server
   - Handles HTTP requests and responses
   - Implements middleware pipeline

3. **Security Layer**
   - Rate Limiter: Prevents abuse (100 requests per 15 minutes)
   - CORS: Controls cross-origin requests
   - API Key Authentication: Validates API keys

4. **Data Layer**
   - In-Memory Cache: 5-minute TTL for frequently accessed data
   - LMDB Database: Persistent storage
   - Data Directory: Physical storage location

5. **Validation**
   - Request validation using express-validator
   - Input sanitization and type checking
   - Custom validation rules for endpoints 