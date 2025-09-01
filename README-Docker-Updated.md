# News Dashboard - Docker Setup

This guide will help you run the News Dashboard using Docker with automatic database initialization, data ingestion, and monitoring.

## 🚀 Quick Start

### 1. Build and Run with Docker Compose

```bash
# Build and start all services
docker-compose up --build

# Or run in background
docker-compose up -d --build
```

### 2. Access the Dashboard

- **Main Dashboard**: http://localhost:3000
- **Health Check**: http://localhost:3000/api/dashboard

## 🔧 What Docker Does Automatically

### Database Management
- ✅ **Auto-initializes** Prisma database schema
- ✅ **Persists data** between container restarts
- ✅ **Handles migrations** automatically
- ✅ **Creates tables** if they don't exist

### Data Ingestion
- ✅ **Fetches initial data** on startup
- ✅ **Runs cron jobs** every 10 minutes for fresh data
- ✅ **Handles API failures** gracefully with retries
- ✅ **Monitors ingestion** status

### Application Health
- ✅ **Health checks** every 30 seconds
- ✅ **Auto-restart** on failures
- ✅ **External API monitoring**
- ✅ **Cron job monitoring**

## 📁 File Structure

```
news-dashboard/
├── Dockerfile                 # Main container definition
├── docker-compose.yml         # Multi-service orchestration
├── docker.env                 # Environment configuration
├── scripts/
│   ├── docker-startup.sh     # Docker startup script
│   └── init-db.ts            # Database initialization
└── prisma/
    ├── schema.prisma         # Database schema
    └── dev.db               # SQLite database (persisted)
```

## ⚙️ Configuration

### Environment Variables (docker.env)

```env
# External API URL - UPDATE THIS TO YOUR ACTUAL API
EXTERNAL_API_URL=http://192.168.100.35:9051/api/posts/?page=1&page_size=200

# Database settings
DATABASE_URL=file:./prisma/dev.db

# Ingestion intervals
INGESTION_INTERVAL_MINUTES=10
HEALTH_CHECK_INTERVAL_MINUTES=5
```

### Update External API URL

**IMPORTANT**: Update the `EXTERNAL_API_URL` in `docker.env` to point to your actual API endpoint.

## 🐳 Docker Commands

### Basic Operations

```bash
# Start services
docker-compose up

# Start in background
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f news-dashboard

# Rebuild and restart
docker-compose up --build --force-recreate
```

### Database Operations

```bash
# Access database directly
docker-compose exec news-dashboard npx prisma studio

# Run database commands
docker-compose exec news-dashboard npx prisma db push
docker-compose exec news-dashboard npx prisma generate

# View database file
docker-compose exec news-dashboard ls -la prisma/
```

### Monitoring

```bash
# Check container status
docker-compose ps

# View health check status
docker inspect news-dashboard | grep Health -A 10

# Check cron logs
docker-compose exec news-dashboard tail -f /var/log/cron.log
```

## 🔍 Troubleshooting

### Common Issues

#### 1. External API Not Accessible
```bash
# Check if external API is reachable
curl "http://192.168.100.35:9051/api/posts/?page=1&page_size=200"

# Update docker.env with correct URL
# Rebuild container
docker-compose up --build
```

#### 2. Database Issues
```bash
# Reset database
docker-compose down
rm -rf prisma/dev.db
docker-compose up --build
```

#### 3. Container Won't Start
```bash
# Check logs
docker-compose logs news-dashboard

# Check health status
docker-compose ps

# Restart with fresh build
docker-compose down
docker-compose up --build --force-recreate
```

#### 4. Data Not Updating
```bash
# Check cron status
docker-compose exec news-dashboard crontab -l

# Manual data refresh
curl -X POST http://localhost:3000/api/ingest

# Check cron logs
docker-compose exec news-dashboard tail -f /var/log/cron.log
```

### Reset Everything

```bash
# Complete reset
docker-compose down -v
docker system prune -f
rm -rf prisma/dev.db
docker-compose up --build
```

## 📊 Monitoring and Logs

### Health Checks
- **Application**: Every 30 seconds
- **Database**: On startup and via cron
- **External API**: Before data ingestion

### Log Locations
- **Application logs**: `docker-compose logs -f news-dashboard`
- **Cron logs**: `/var/log/cron.log` inside container
- **Database logs**: Prisma query logs in application output

### Performance Metrics
- **Startup time**: ~2-3 minutes (includes API checks)
- **Data refresh**: Every 10 minutes
- **Health monitoring**: Every 5 minutes

## 🔄 Data Flow

1. **Container starts** → Next.js app starts
2. **Wait for app** → Health check passes
3. **Initialize DB** → Prisma schema push
4. **Clear old data** → DELETE /api/ingest
5. **Fetch new data** → POST /api/ingest
6. **Setup cron** → Automatic ingestion every 10 minutes
7. **Monitor health** → Continuous monitoring

## 🚨 Important Notes

- **External API must be accessible** from the Docker host
- **Database persists** between container restarts
- **Cron jobs run** inside the container
- **Health checks** ensure service availability
- **Auto-restart** on failures

## 🆘 Getting Help

If you encounter issues:

1. Check the troubleshooting section above
2. View container logs: `docker-compose logs -f`
3. Check health status: `docker-compose ps`
4. Verify external API accessibility
5. Check database status with Prisma Studio

## 🎯 Success Indicators

Your setup is working correctly when you see:

- ✅ Container starts without errors
- ✅ Database initializes successfully
- ✅ Initial data is fetched
- ✅ Cron jobs are scheduled
- ✅ Health checks pass
- ✅ Dashboard loads at http://localhost:3000
- ✅ Data refreshes automatically every 10 minutes
