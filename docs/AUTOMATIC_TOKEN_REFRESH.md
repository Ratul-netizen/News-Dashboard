# Automatic Token Refresh System

This document explains how to use the automatic token refresh system to get access tokens without manual intervention.

## Overview

The application includes a sophisticated automatic token refresh system that can:
- Automatically authenticate with external APIs using credentials
- Cache tokens and refresh them before expiration
- Store tokens persistently (file or database)
- Schedule background refresh to prevent expiration
- Monitor token health and provide alerts
- Support multiple authentication strategies

## How It Works

### 1. **Automatic Authentication**
The system automatically attempts to authenticate with external APIs using:
- Email/password credentials
- OAuth2 client credentials flow
- Multiple authentication endpoints
- Various request formats (JSON, form-encoded)

### 2. **Token Management**
- **Caching**: Tokens are cached in memory for fast access
- **Persistence**: Tokens are stored persistently (file or database)
- **Expiry Detection**: JWT tokens are parsed to determine expiry times
- **Automatic Refresh**: Tokens are refreshed 5 minutes before expiration

### 3. **Background Scheduling**
- **Scheduled Refresh**: Tokens are refreshed every 10 minutes
- **Health Monitoring**: Token health is checked every 5 minutes
- **Recovery**: Automatic recovery attempts after consecutive failures

## Configuration

### Environment Variables

Add these to your `docker.env` file:

```bash
# Basic Authentication
EXTERNAL_AUTH_URL=http://192.168.100.35:9055/api/login/
EXTERNAL_API_EMAIL=test_demo01@gmail.com
EXTERNAL_API_PASSWORD=Test@123

# OAuth2 Configuration (optional)
OAUTH_CLIENT_ID=your_client_id
OAUTH_CLIENT_SECRET=your_client_secret
OAUTH_SCOPE=your_scope

# Manual Token Fallback (optional)
EXTERNAL_API_TOKEN=your_manual_token_here
```

### Database Schema

If using database storage, add this to your Prisma schema:

```prisma
model TokenCache {
  id                    String   @id @default(cuid())
  service               String   @unique // e.g., 'external_api'
  token                 String
  expiresAt             DateTime
  refreshToken          String?
  tokenType             String   @default("Bearer")
  createdAt             DateTime @default(now())
  lastUsed              DateTime @default(now())
  
  @@map("token_cache")
}
```

## Usage

### 1. **Automatic Mode (Recommended)**

The system automatically handles token refresh. Just ensure your credentials are configured:

```bash
# Set these in docker.env
EXTERNAL_AUTH_URL=http://your-api.com/api/login/
EXTERNAL_API_EMAIL=your_email@example.com
EXTERNAL_API_PASSWORD=your_password
```

### 2. **OAuth2 Client Credentials**

For OAuth2 APIs:

```bash
# Set these in docker.env
EXTERNAL_AUTH_URL=http://your-api.com/oauth/token
OAUTH_CLIENT_ID=your_client_id
OAUTH_CLIENT_SECRET=your_client_secret
OAUTH_SCOPE=your_scope
```

### 3. **Manual Token Fallback**

If automatic authentication fails, you can provide a manual token:

```bash
# Set this in docker.env
EXTERNAL_API_TOKEN=your_jwt_token_here
```

## API Endpoints

### Token Status
- **URL**: `/api/token/status`
- **Method**: `GET`
- **Response**: Token health information

### Force Refresh
- **URL**: `/api/token/refresh`
- **Method**: `POST`
- **Response**: New token information

### Clear Cache
- **URL**: `/api/token`
- **Method**: `DELETE`
- **Response**: Success confirmation

## Monitoring Dashboard

The system includes a token monitoring dashboard component (`TokenMonitor`) that shows:
- Current token status
- Expiration time
- Time until expiry
- Scheduler status
- Manual refresh controls

## Authentication Strategies

The system tries multiple authentication strategies automatically:

### 1. **Configured Endpoint**
Uses the `EXTERNAL_AUTH_URL` with email/password

### 2. **Common OAuth2 Endpoints**
Tries these common patterns:
- `/oauth/token`
- `/api/oauth/token`
- `/auth/oauth/token`
- `/api/auth/token`
- `/api/login`
- `/api/auth/login`

### 3. **Multiple Request Formats**
Tries different request formats:
- JSON with email/password
- JSON with username/password
- Form-encoded credentials
- OAuth2 client credentials

### 4. **Token Extraction**
Extracts tokens from various response formats:
- `access_token`
- `access`
- `token`
- `auth_token`
- `jwt`
- Authorization headers

## Storage Options

### 1. **File Storage (Default)**
Tokens are stored in `./data/token-cache.json`

### 2. **Database Storage**
Tokens are stored in the `TokenCache` table

To use database storage:
```typescript
import { initializeTokenService } from './lib/services/token-refresh-service'
import { prisma } from './lib/db'

const config = {
  authUrl: process.env.EXTERNAL_AUTH_URL!,
  email: process.env.EXTERNAL_API_EMAIL!,
  password: process.env.EXTERNAL_API_PASSWORD!,
}

// Use database storage
initializeTokenService(config, true, prisma)
```

## Error Handling

The system includes comprehensive error handling:
- **Rate Limiting**: Prevents excessive authentication attempts
- **Retry Logic**: Automatic retry on 401 errors
- **Fallback**: Falls back to unauthenticated requests if auth fails
- **Recovery**: Automatic recovery after consecutive failures
- **Logging**: Detailed logging for debugging

## Security Considerations

### 1. **Credential Storage**
- Store credentials securely in environment variables
- Never commit credentials to version control
- Use Docker secrets or Kubernetes secrets in production

### 2. **Token Security**
- Tokens are stored securely (encrypted in database)
- Tokens are cleared on logout/restart
- Automatic token rotation prevents long-term exposure

### 3. **Network Security**
- Use HTTPS for all authentication endpoints
- Validate SSL certificates
- Implement proper timeout handling

## Troubleshooting

### Common Issues

1. **Authentication Fails**
   - Check credentials in environment variables
   - Verify authentication endpoint URL
   - Check network connectivity
   - Review authentication logs

2. **Token Expires Quickly**
   - Check token expiry parsing
   - Verify JWT token format
   - Adjust refresh buffer time

3. **Scheduler Not Working**
   - Check if scheduler is started
   - Verify interval settings
   - Check for errors in logs

### Debug Mode

Enable debug logging:
```bash
LOG_LEVEL=debug
```

### Manual Testing

Test token refresh manually:
```bash
curl -X POST http://localhost:3000/api/token/refresh
```

## Integration Examples

### 1. **Using in API Routes**

```typescript
import { getTokenService } from '@/lib/services/token-refresh-service'

export async function GET() {
  const tokenService = getTokenService()
  const headers = await tokenService?.getAuthHeaders()
  
  const response = await fetch('https://api.example.com/data', {
    headers
  })
  
  return response.json()
}
```

### 2. **Using in Components**

```typescript
import { TokenMonitor } from '@/components/token-monitor'

export default function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <TokenMonitor />
    </div>
  )
}
```

### 3. **Starting the Scheduler**

```typescript
import { startTokenScheduler } from '@/lib/services/token-scheduler'

// Start background token refresh
startTokenScheduler()
```

## Best Practices

1. **Always use automatic mode** unless you have specific requirements
2. **Monitor token health** using the dashboard component
3. **Set up alerts** for authentication failures
4. **Test authentication** before deploying to production
5. **Rotate credentials** regularly
6. **Use HTTPS** for all authentication endpoints
7. **Implement proper logging** for debugging

## Migration from Manual Tokens

If you're currently using manual tokens:

1. **Add credentials** to environment variables
2. **Remove manual token** from configuration
3. **Test automatic authentication**
4. **Monitor token health** using the dashboard
5. **Remove manual token handling** from your code

The system will automatically fall back to manual tokens if automatic authentication fails, so you can migrate gradually.
