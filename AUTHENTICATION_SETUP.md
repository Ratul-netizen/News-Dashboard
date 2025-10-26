# HTTP Basic Authentication Setup

This document explains how to set up and configure HTTP Basic Authentication for the News Dashboard application.

## Overview

The application now includes HTTP Basic Authentication to secure access to the dashboard. Users must provide valid credentials to access the application.

## Configuration

### Environment Variables

Add the following environment variables to your configuration:

```bash
# Basic Authentication Configuration
BASIC_AUTH_USERNAME=test_demo1@gmail.com
BASIC_AUTH_PASSWORD=Test@123
```

### Default Credentials

- **Username**: `test_demo1@gmail.com`
- **Password**: `Test@123`

**⚠️ IMPORTANT**: Change these default credentials in production!

## How It Works

### 1. Middleware Protection

The `middleware.ts` file protects all routes except:
- `/login` - Login page
- `/api/*` - API routes (handled separately)
- `/_next/*` - Next.js static files
- `/favicon.ico` - Favicon

### 2. Authentication Flow

1. User visits any protected route
2. Browser prompts for username/password (HTTP Basic Auth)
3. Credentials are validated against environment variables
4. If valid, user gains access; if invalid, 401 Unauthorized

### 3. Frontend Integration

- Custom login page at `/login` for better UX
- Authentication hook (`useAuth`) manages session state
- Automatic redirect to login if not authenticated
- Logout functionality clears session

## Files Added/Modified

### New Files
- `middleware.ts` - Next.js middleware for route protection
- `app/login/page.tsx` - Custom login page
- `app/api/auth/check/route.ts` - Authentication verification API
- `hooks/use-auth.ts` - Authentication hook for frontend

### Modified Files
- `app/page.tsx` - Added authentication integration
- `components/dashboard-header.tsx` - Added logout button
- `docker.env` - Added authentication environment variables

## Usage

### For Users

1. Visit the application URL
2. Enter username and password when prompted
3. Access the dashboard after successful authentication
4. Use the logout button to end the session

### For Developers

#### Local Development

1. Set environment variables in `.env.local`:
```bash
BASIC_AUTH_USERNAME=your_username
BASIC_AUTH_PASSWORD=your_password
```

2. Run the development server:
```bash
npm run dev
```

#### Docker Deployment

1. Update `docker.env` with your credentials:
```bash
BASIC_AUTH_USERNAME=your_username
BASIC_AUTH_PASSWORD=your_password
```

2. Rebuild and run:
```bash
docker compose up --build
```

## Security Considerations

### Production Deployment

1. **Change Default Credentials**: Never use default credentials in production
2. **Use Strong Passwords**: Use complex, unique passwords
3. **Environment Security**: Store credentials securely (e.g., Docker secrets, Kubernetes secrets)
4. **HTTPS**: Always use HTTPS in production to protect credentials in transit
5. **Regular Rotation**: Rotate credentials regularly

### Additional Security Options

Consider implementing:
- Session timeouts
- Account lockout after failed attempts
- Multi-factor authentication
- LDAP/Active Directory integration
- OAuth2/SAML integration

## Troubleshooting

### Common Issues

1. **401 Unauthorized**: Check username/password in environment variables
2. **Infinite Redirect Loop**: Ensure middleware configuration is correct
3. **Login Page Not Loading**: Check that `/login` route is excluded from middleware

### Debug Mode

Enable debug logging by setting:
```bash
LOG_LEVEL=debug
```

## API Endpoints

### Authentication Check
- **URL**: `/api/auth/check`
- **Method**: `GET`
- **Headers**: `Authorization: Basic <base64-encoded-credentials>`
- **Response**: `{ "authenticated": true/false }`

## Customization

### Changing Authentication Method

To implement a different authentication method:

1. Modify `middleware.ts` to use your preferred auth method
2. Update `hooks/use-auth.ts` for frontend integration
3. Modify login page if needed
4. Update API routes to handle new auth method

### Adding User Management

For multiple users or user management:

1. Create a user database table
2. Implement user registration/login APIs
3. Replace basic auth with session-based auth
4. Add user roles and permissions

## Support

For issues or questions regarding authentication setup, please check:
1. Environment variable configuration
2. Middleware configuration
3. Browser developer tools for network errors
4. Application logs for authentication errors
