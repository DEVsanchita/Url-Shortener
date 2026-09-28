# URL Shortener with Rate Limiter

A full-stack URL shortener built with the MERN stack, featuring a custom **Base62 encoding system** and a **token-bucket rate limiter implemented from scratch using Redis**.

### Website Link: https://url-shortener-frontend-adyq.onrender.com

## Features

* Shorten long URLs into compact Base62 codes
* Custom Base62 encoding without external libraries
* Fast redirect route for efficient read-heavy access
* Redis-based token-bucket rate limiter for API protection
* Click analytics with total clicks and recent click history
* Top 10 most-clicked links
* Duplicate URL detection
* Dynamic token refill based on elapsed time
* `429 Too Many Requests` response with `Retry-After` header
* Rate limiting applied only to API routes while keeping redirects fast

## Tech Stack

### Frontend

* React
* Vite

### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* Redis
* ioredis

### Other Tools

* Git & GitHub
* Postman
* Autocannon

## Architecture

```text
                    React + Vite
                         |
                         | REST API
                         ↓
                  Node.js + Express
                         |
              ┌──────────┴──────────┐
              ↓                     ↓
          MongoDB                  Redis
              |                     |
       URL & Analytics       Rate Limiting
              |
              ↓
       Short URL Mapping
              |
              ↓
       Redirect Controller
              |
              ↓
        Original Long URL
```

## Core Implementation

### 1. Base62 URL Encoding

Each new URL is assigned an auto-incrementing integer ID using a MongoDB counter document.

The integer ID is then converted into a Base62 string using:

```text
0-9 + a-z + A-Z
```

This produces short and URL-friendly codes.

For example:

```text
12345 → dnh
```

Using sequential IDs also avoids collision-retry logic associated with randomly generated short codes.

### 2. Token-Bucket Rate Limiter

The API uses a custom token-bucket rate limiter implemented with Redis.

Each client IP gets a bucket containing a limited number of tokens.

Default configuration:

```text
Bucket Capacity : 10 tokens
Refill Rate     : 1 token / 2 seconds
```

For every API request:

```text
Request
   ↓
Identify Client IP
   ↓
Read Bucket from Redis
   ↓
Calculate Token Refill
   ↓
Token Available?
   ├── Yes → Consume Token → Allow Request
   │
   └── No  → Reject Request
                ↓
          HTTP 429 Response
```

Tokens are refilled lazily based on elapsed time instead of using a background process.

When the bucket is empty, the API returns:

```text
429 Too Many Requests
```

along with a `Retry-After` header.

The rate limiter protects the `/api` routes while the short-link redirect route remains unrestricted for fast access.

### 3. Duplicate URL Detection

Before creating a new short URL, the backend checks whether the same long URL already exists.

If it exists:

```text
Existing URL
     ↓
Return existing short code
```

Otherwise, a new ID is generated and encoded into a Base62 short code.

This prevents unnecessary duplicate entries.

### 4. Click Analytics

Each short URL tracks usage information such as:

* Total clicks
* Recent click history
* Most-clicked links

The application also provides a top-10 list of the most frequently accessed short URLs.

## API Endpoints

| Method | Endpoint               | Description                  |
| ------ | ---------------------- | ---------------------------- |
| `POST` | `/api/shorten`         | Create a short URL           |
| `GET`  | `/api/analytics/:code` | Retrieve click analytics     |
| `GET`  | `/api/top`             | Retrieve top 10 links        |
| `GET`  | `/:code`               | Redirect to the original URL |

> Update these endpoints if your implementation uses different routes.

## Project Structure

```text
url-shortener/
│
├── backend/
│   ├── config/
│   ├── middleware/
│   │   └── rateLimiter.js
│   ├── models/
│   ├── routes/
│   ├── utils/
│   │   └── base62.js
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── src/
│   ├── package.json
│   └── ...
│
└── README.md
```

## Setup

### Prerequisites

Make sure you have:

* Node.js 18+
* MongoDB locally or MongoDB Atlas
* Redis locally or an Upstash Redis instance
* Git

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd url-shortener
```

### 2. Configure Backend

```bash
cd backend
npm install
```

Create a `.env` file:

```env
PORT=5000
MONGO_URI=<your-mongodb-connection-string>
REDIS_URL=<your-redis-connection-string>
BASE_URL=http://localhost:5000

RATE_LIMIT_BUCKET_SIZE=10
RATE_LIMIT_REFILL_RATE_MS=2000
```

**Do not commit the `.env` file to GitHub.**

### 3. Start Backend

```bash
npm run dev
```

Backend:

```text
http://localhost:5000
```

### 4. Start Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend:

```text
http://localhost:5173
```

## Load Testing

The project can be tested using **Autocannon** to measure backend performance.

For example:

```bash
npx autocannon -c 100 -d 10 http://localhost:5000/api/top
```

Where:

```text
-c 100 → 100 concurrent connections
-d 10  → 10 second test duration
```

Autocannon reports metrics such as:

* Requests per second
* Average latency
* Throughput
* Total requests

### Rate Limiter Testing

The rate limiter can be tested by repeatedly calling the shorten endpoint:

```bash
npx autocannon -c 1 -d 5 -m POST \
-H "Content-Type: application/json" \
-b '{"longUrl":"https://example.com"}' \
http://localhost:5000/api/shorten
```

After the available tokens are consumed, requests should receive:

```text
HTTP 429 Too Many Requests
```

## Performance

Performance metrics should be recorded from actual load tests rather than estimated values.

Example:

```text
Concurrent Connections : 100
Test Duration          : 10 seconds
Requests/sec           : <actual result>
Average Latency        : <actual result>
Throughput             : <actual result>
```

## Security & Configuration

* Environment variables are used for database and Redis credentials.
* `.env` should never be committed to GitHub.
* API routes are protected using Redis-based rate limiting.
* The redirect route is intentionally kept outside the API rate limiter for fast access.

## Future Improvements

* Custom aliases for short URLs
* Link expiration using TTL
* QR code generation
* User authentication
* Per-user rate limiting
* Advanced analytics dashboard
* Geographic click analytics
* Redis caching for frequently accessed URLs
* Production deployment with monitoring

## Learning Outcomes

This project demonstrates practical implementation of:

* REST API development
* Node.js and Express.js
* MongoDB and Mongoose
* Redis
* Base62 encoding
* Token-bucket rate limiting
* API middleware
* Caching and in-memory data handling
* Database queries
* Click analytics
* Load testing
* Full-stack application development

## Author

**Sanchita Majumdar**
