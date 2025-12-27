# Turbozap Backend - WhatsApp Message Broadcasting Platform

A high-performance Express.js backend for simulating Turbozap, a WhatsApp message sending platform. Supports bulk messaging through multiple sessions with queue-based request processing and parallel worker management.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Usage Examples](#usage-examples)
- [How It Works](#how-it-works)
- [Project Structure](#project-structure)
- [Message Types](#message-types)

## Features

- **Multi-Session Support**: Handle multiple WhatsApp sessions simultaneously
- **Queue-Based Processing**: Requests are queued and processed sequentially per session
- **Throttling**: 1-minute interval between messages to avoid rate limiting
- **Parallel Execution**: Different sessions execute independently and in parallel
- **Type Safety**: Full TypeScript support with Zod validation
- **WAHA Integration**: Compatible with WAHA (WhatsApp HTTP API)
- **Campaign Management**: Create, monitor, and manage messaging campaigns
- **Worker Pool**: Automatic worker spawning and management per session

## Architecture

```
Frontend Request
       ↓
Campaign Creation (stores WAHA requests)
       ↓
Queue Manager (per-session queues)
       ↓
Session Workers (parallel execution)
       ↓
WAHA API (WhatsApp delivery)
```

### Components

- **Campaign Manager**: Stores campaigns and builds WAHA API requests
- **Request Queue**: Maintains request status and metadata
- **Session Workers**: Execute queued requests with timing control
- **Queue Manager**: Orchestrates multiple sessions and workers

## Installation

```bash
# Clone and navigate to backend directory
cd d:\Dispatcher\backend

# Install dependencies
npm install

# Development mode with auto-reload
npm run dev

# Build for production
npm run build

# Production mode
npm start
```

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3000

# WAHA API Configuration
WAHA_BASE_URL=http://localhost:3001
WAHA_API_KEY=yoursecretkey
```

### Request Execution Settings

Edit [src/services/worker.ts](src/services/worker.ts) to adjust:
- `EXECUTION_INTERVAL`: Time between requests (default: 60000ms = 1 minute)
- `timeout`: HTTP request timeout (default: 30000ms = 30 seconds)

## API Documentation

### Campaign Endpoints

#### 1. Create Campaign

**Endpoint**: `POST /api/campaigns/create`

Creates a new campaign and builds all WAHA API requests in memory.

**Request Body**:
```json
{
  "session": "default",
  "messages": [
    {
      "type": "text",
      "content": "Hello, this is a test message!"
    },
    {
      "type": "photo",
      "content": "https://example.com/image.jpg",
      "caption": "Optional caption",
      "filename": "image.jpg"
    },
    {
      "type": "audio",
      "content": "https://example.com/audio.opus"
    },
    {
      "type": "video",
      "content": "https://example.com/video.mp4",
      "caption": "Check this video!",
      "filename": "video.mp4",
      "asNote": false
    }
  ],
  "contacts": [
    "5511999999999",
    "5511888888888",
    "5511777777777"
  ]
}
```

**Response**:
```json
{
  "success": true,
  "campaignId": "campaign_1703001234567_abc123def",
  "message": "Campaign created successfully with 12 requests to execute"
}
```

**Status Code**: `201 Created`

---

#### 2. Get Campaign Summary

**Endpoint**: `GET /api/campaigns/:campaignId`

Retrieves campaign information without sensitive data.

**Response**:
```json
{
  "success": true,
  "data": {
    "campaignId": "campaign_1703001234567_abc123def",
    "createdAt": "2024-01-20T10:30:45.123Z",
    "status": "pending",
    "totalMessages": 4,
    "totalContacts": 3,
    "totalRequests": 12,
    "session": "default"
  }
}
```

**Status Code**: `200 OK` | `404 Not Found`

---

#### 3. Get Campaign WAHA Requests

**Endpoint**: `GET /api/campaigns/:campaignId/requests`

Retrieves all built WAHA API requests for a campaign.

**Response**:
```json
{
  "success": true,
  "totalRequests": 12,
  "data": [
    {
      "method": "POST",
      "url": "http://localhost:3001/messages/send",
      "headers": {
        "accept": "application/json",
        "Content-Type": "application/json",
        "X-Api-Key": "yoursecretkey"
      },
      "data": {
        "session": "default",
        "chatId": "5511999999999@c.us",
        "text": "Hello, this is a test message!"
      }
    },
    ...
  ]
}
```

**Status Code**: `200 OK` | `404 Not Found`

---

#### 4. List All Campaigns

**Endpoint**: `GET /api/campaigns`

Retrieves all campaigns with their summaries.

**Response**:
```json
{
  "success": true,
  "totalCampaigns": 2,
  "data": [
    {
      "campaignId": "campaign_1703001234567_abc123def",
      "createdAt": "2024-01-20T10:30:45.123Z",
      "status": "pending",
      "totalMessages": 4,
      "totalContacts": 3,
      "totalRequests": 12,
      "session": "default"
    },
    ...
  ]
}
```

**Status Code**: `200 OK`

---

### Execution Endpoints

#### 5. Execute Campaign

**Endpoint**: `POST /api/campaigns/:campaignId/execute`

Starts execution of a campaign. Enqueues all WAHA requests and spawns a worker for the session.

**Request Body**: (empty)

**Response**:
```json
{
  "success": true,
  "campaignId": "campaign_1703001234567_abc123def",
  "message": "Campaign execution started",
  "worker": {
    "session": "default",
    "isActive": true,
    "totalRequests": 12,
    "pendingRequests": 11
  }
}
```

**Status Code**: `202 Accepted` | `404 Not Found`

---

#### 6. Stop Campaign

**Endpoint**: `POST /api/campaigns/:campaignId/stop`

Stops and removes a campaign from the queue.

**Request Body**: (empty)

**Response**:
```json
{
  "success": true,
  "campaignId": "campaign_1703001234567_abc123def",
  "message": "Campaign stopped"
}
```

**Status Code**: `200 OK` | `404 Not Found`

---

### Queue Management Endpoints

#### 7. Get Queue Status

**Endpoint**: `GET /api/campaigns/queue/status`

Retrieves current queue and worker statistics across all sessions.

**Response**:
```json
{
  "success": true,
  "stats": {
    "totalSessions": 2,
    "activeSessions": 2,
    "totalRequests": 24,
    "totalPending": 18
  },
  "workers": [
    {
      "session": "default",
      "isActive": true,
      "totalRequests": 12,
      "pendingRequests": 11
    },
    {
      "session": "session2",
      "isActive": true,
      "totalRequests": 12,
      "pendingRequests": 7
    }
  ]
}
```

**Status Code**: `200 OK`

---

#### 8. Stop All Workers

**Endpoint**: `POST /api/campaigns/queue/stop-all`

Stops all active workers across all sessions.

**Request Body**: (empty)

**Response**:
```json
{
  "success": true,
  "message": "All workers stopped"
}
```

**Status Code**: `200 OK`

---

#### 9. Health Check

**Endpoint**: `GET /health`

Simple health check endpoint to verify backend is running.

**Response**:
```json
{
  "success": true,
  "message": "Turbozap backend is running"
}
```

**Status Code**: `200 OK`

---

## Usage Examples

### Example 1: Simple Text Campaign

```bash
# Create campaign
curl -X POST http://localhost:3000/api/campaigns/create \
  -H 'Content-Type: application/json' \
  -d '{
    "session": "default",
    "messages": [
      {
        "type": "text",
        "content": "Hello from Turbozap!"
      }
    ],
    "contacts": ["5511999999999", "5511888888888"]
  }'

# Response: campaignId = "campaign_..."

# Execute campaign
curl -X POST http://localhost:3000/api/campaigns/campaign_1234567890_abc123def/execute

# Check status
curl http://localhost:3000/api/campaigns/queue/status
```

### Example 2: Multi-Message Campaign with Images

```bash
curl -X POST http://localhost:3000/api/campaigns/create \
  -H 'Content-Type: application/json' \
  -d '{
    "session": "session_sales",
    "messages": [
      {
        "type": "text",
        "content": "Check out our new product!"
      },
      {
        "type": "photo",
        "content": "https://example.com/product.jpg",
        "caption": "New Product - Limited Offer",
        "filename": "product.jpg"
      },
      {
        "type": "text",
        "content": "Click here to buy: https://example.com"
      }
    ],
    "contacts": [
      "5511999999999",
      "5511888888888",
      "5511777777777"
    ]
  }'
```

### Example 3: Multiple Sessions in Parallel

```bash
# Campaign 1 - Session A
curl -X POST http://localhost:3000/api/campaigns/create \
  -H 'Content-Type: application/json' \
  -d '{
    "session": "session_a",
    "messages": [{"type": "text", "content": "Message from Session A"}],
    "contacts": ["5511111111111"]
  }' > campaign1.json

# Campaign 2 - Session B
curl -X POST http://localhost:3000/api/campaigns/create \
  -H 'Content-Type: application/json' \
  -d '{
    "session": "session_b",
    "messages": [{"type": "text", "content": "Message from Session B"}],
    "contacts": ["5522222222222"]
  }' > campaign2.json

# Execute both (they run in parallel)
CAMPAIGN_ID_1=$(jq -r '.campaignId' campaign1.json)
CAMPAIGN_ID_2=$(jq -r '.campaignId' campaign2.json)

curl -X POST http://localhost:3000/api/campaigns/$CAMPAIGN_ID_1/execute
curl -X POST http://localhost:3000/api/campaigns/$CAMPAIGN_ID_2/execute

# Check status - both workers active
curl http://localhost:3000/api/campaigns/queue/status
```

### Example 4: Validation Errors

```bash
# Missing required field
curl -X POST http://localhost:3000/api/campaigns/create \
  -H 'Content-Type: application/json' \
  -d '{
    "session": "default",
    "messages": []
  }'

# Response: 400 Bad Request
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "path": "messages",
      "message": "Array must contain at least 1 element(s)"
    },
    {
      "path": "contacts",
      "message": "Required"
    }
  ]
}
```

## How It Works

### Request Flow

1. **Campaign Creation**
   - Frontend sends campaign with session, messages, and contacts
   - Backend validates using Zod schemas
   - Generates unique campaign ID
   - Builds all WAHA API requests (messages × contacts)
   - Stores campaign in memory

2. **Campaign Execution**
   - Frontend triggers execution endpoint
   - Backend creates/retrieves queue for session
   - Enqueues all WAHA requests
   - Spawns worker if not running
   - Worker begins processing

3. **Message Processing**
   - Worker fetches next pending request
   - Marks as "executing"
   - Makes HTTP call to WAHA API
   - On success: marks as "completed"
   - On error: marks as "failed" with error message
   - Waits 1 minute before next request
   - Repeats until queue empty

### Example Timeline (2 contacts, 2 messages per contact)

```
Session "default" (4 total requests)

Time 0:00  → Request 1 executing: Text to 5511999999999
Time 0:30  → Request 1 completed
Time 1:00  → Request 2 executing: Photo to 5511999999999
Time 1:30  → Request 2 completed
Time 2:00  → Request 3 executing: Text to 5511888888888
Time 2:30  → Request 3 completed
Time 3:00  → Request 4 executing: Photo to 5511888888888
Time 3:30  → Request 4 completed
Time 3:30  → Queue empty, worker idle
```

### Multi-Session Parallel Processing

```
Session A | Time 0:00 → Request executing
Session B | Time 0:00 → Request executing (simultaneous)
Session A | Time 1:00 → Request executing
Session B | Time 1:00 → Request executing (simultaneous)
```

## Project Structure

```
backend/
├── src/
│   ├── types/
│   │   ├── campaign.ts          # Campaign types and Zod schemas
│   │   └── waha.ts              # WAHA API payload types
│   ├── middleware/
│   │   └── validation.ts        # Request validation middleware
│   ├── services/
│   │   ├── campaign-manager.ts  # Campaign storage and WAHA request building
│   │   ├── waha-builder.ts      # WAHA API request construction
│   │   ├── request-queue.ts     # Queue data structure
│   │   ├── worker.ts            # Session worker execution logic
│   │   └── queue-manager.ts     # Multi-session queue orchestration
│   ├── routes/
│   │   └── campaigns.ts         # Campaign API endpoints
│   └── index.ts                 # Express app setup
├── package.json                 # Dependencies
├── tsconfig.json                # TypeScript configuration
└── README.md                    # This file
```

## Message Types

### Text Message

```json
{
  "type": "text",
  "content": "Your message text here"
}
```

**WAHA Payload**:
```json
{
  "session": "default",
  "chatId": "5511999999999@c.us",
  "text": "Your message text here"
}
```

---

### Photo Message

```json
{
  "type": "photo",
  "content": "https://example.com/image.jpg",
  "caption": "Optional caption",
  "filename": "image.jpg"
}
```

**WAHA Payload**:
```json
{
  "session": "default",
  "chatId": "5511999999999@c.us",
  "file": {
    "mimetype": "image/jpeg",
    "url": "https://example.com/image.jpg",
    "filename": "image.jpg"
  },
  "caption": "Optional caption"
}
```

---

### Audio Message

```json
{
  "type": "audio",
  "content": "https://example.com/audio.opus"
}
```

**WAHA Payload**:
```json
{
  "session": "default",
  "chatId": "5511999999999@c.us",
  "file": {
    "mimetype": "audio/ogg; codecs=opus",
    "url": "https://example.com/audio.opus"
  },
  "convert": false
}
```

---

### Video Message

```json
{
  "type": "video",
  "content": "https://example.com/video.mp4",
  "caption": "Optional caption",
  "filename": "video.mp4",
  "asNote": false
}
```

**WAHA Payload**:
```json
{
  "session": "default",
  "chatId": "5511999999999@c.us",
  "file": {
    "mimetype": "video/mp4",
    "url": "https://example.com/video.mp4",
    "filename": "video.mp4"
  },
  "caption": "Optional caption",
  "asNote": false,
  "convert": false
}
```

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Detailed error messages"]
}
```

### Common Error Codes

- **400 Bad Request**: Validation failed
- **404 Not Found**: Campaign or session not found
- **500 Internal Server Error**: Server-side error during processing

## Performance Considerations

1. **In-Memory Storage**: Campaigns and queues stored in memory (suitable for single-server deployments)
2. **Request Throttling**: 1-minute intervals prevent rate limiting and server overload
3. **Parallel Sessions**: Multiple sessions execute independently without blocking
4. **Connection Pooling**: Axios handles HTTP connection reuse
5. **Timeout Protection**: 30-second timeout on WAHA API calls prevents hanging requests

## Future Enhancements

- Database persistence (MongoDB, PostgreSQL)
- Request retry logic with exponential backoff
- Campaign scheduling (send at specific time)
- Delivery reports and analytics
- Rate limiting per session
- WebSocket real-time updates
- Campaign templates
- Contact list management
- API key authentication

## Troubleshooting

### Worker Not Executing Requests

1. Check if campaign was executed: `GET /api/campaigns/queue/status`
2. Verify WAHA API is running on configured URL
3. Check logs for error messages in console

### Requests Stuck in Queue

1. Check worker status
2. Verify WAHA API connectivity
3. Check request timeout in logs
4. Stop campaign and retry: `POST /:campaignId/stop`

### Contact Not Receiving Messages

1. Verify contact format (with or without @c.us suffix)
2. Check WAHA session validity
3. Verify WAHA API key is correct
4. Check WAHA logs for delivery errors

## License

ISC

## Support

For issues, questions, or contributions, please refer to the project repository.
