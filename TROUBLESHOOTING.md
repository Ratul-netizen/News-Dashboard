# Troubleshooting Guide

## Data Not Being Saved to Database

### 1. Database Connection Issues
- **Problem**: Database tables don't exist or connection fails
- **Solution**: Run the setup script:
  ```bash
  node setup.js
  ```
  Or manually:
  ```bash
  npx prisma generate
  npx prisma db push
  ```

### 2. External API Connection Issues
- **Problem**: Cannot connect to external API at `http://192.168.100.35:9051/api/posts/?page=1&page_size=200`
- **Solution**: 
  - Check if the external API server is running
  - Verify the IP address and port are correct
  - Check firewall settings
  - Update the `EXTERNAL_API_URL` environment variable if needed

### 3. Database File Permissions
- **Problem**: Cannot write to database file
- **Solution**: 
  - Check file permissions on `prisma/dev.db`
  - Ensure the application has write access to the prisma directory

## Application Not Fetching New Data

### 1. Auto-refresh Not Working
- **Problem**: Data doesn't update automatically
- **Solution**: 
  - The app now auto-refreshes every 5 minutes
  - Check browser console for any errors
  - Use the manual "Refresh Data" button

### 2. Caching Issues
- **Problem**: Old data keeps showing
- **Solution**: 
  - Added cache-busting headers to API calls
  - Browser cache is bypassed
  - Data is fetched fresh on each request

### 3. API Endpoint Issues
- **Problem**: Dashboard API returns errors
- **Solution**: 
  - Check browser console for API errors
  - Verify the `/api/dashboard` endpoint is working
  - Check if database has data

## Quick Fixes

### Reset Everything
```bash
# Stop the application
# Delete the database
rm prisma/dev.db

# Run setup again
node setup.js

# Start the application
npm run dev
```

### Check Database Status
```bash
# Open Prisma Studio to view database
npx prisma studio

# Check database schema
npx prisma db pull
```

### Manual Data Ingestion
```bash
# Trigger data ingestion manually
curl -X POST http://localhost:3000/api/ingest

# Check ingestion logs
curl -X GET http://localhost:3000/api/ingest
```

## Common Error Messages

### "Unique constraint failed"
- **Cause**: Trying to insert duplicate data
- **Solution**: The ingest API handles this automatically by updating existing records

### "Database is locked"
- **Cause**: Multiple processes trying to access SQLite database
- **Solution**: Ensure only one instance of the app is running

### "External API timeout"
- **Cause**: External API is slow or unreachable
- **Solution**: Check external API status, increase timeout if needed

## Environment Variables

Create a `.env.local` file in your project root:

```env
# External API URL (update this to your actual API endpoint)
EXTERNAL_API_URL=http://192.168.100.35:9051/api/posts/?page=1&page_size=200

# Database URL (SQLite by default)
DATABASE_URL="file:./prisma/dev.db"

# Node environment
NODE_ENV=development
```

## Still Having Issues?

1. Check the browser console for error messages
2. Check the terminal where you're running the app for server logs
3. Verify the external API is accessible from your machine
4. Ensure all dependencies are installed: `npm install`
5. Try clearing browser cache and cookies
