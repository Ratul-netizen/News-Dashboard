#!/bin/bash

echo "🚀 Starting News Dashboard with Docker..."

# Function to check if the app is ready
wait_for_app() {
    echo "⏳ Waiting for application to be ready..."
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost:3000 > /dev/null 2>&1; then
            echo "✅ Application is ready!"
            return 0
        fi
        
        echo "⏳ Attempt $attempt/$max_attempts: Application not ready yet..."
        sleep 10
        attempt=$((attempt + 1))
    done
    
    echo "❌ Application failed to start within expected time"
    return 1
}

# Function to initialize database
init_database() {
    echo "🗄️ Initializing database..."
    
    # Generate Prisma client if needed
    npx prisma generate
    
    # Push database schema
    npx prisma db push
    
    echo "✅ Database initialized successfully"
}

# Function to clear existing data
clear_data() {
    echo "🧹 Clearing existing data..."
    curl -X DELETE http://localhost:3000/api/ingest || echo "No data to clear or clear failed"
    sleep 3
}

# Function to fetch initial data
fetch_initial_data() {
    echo "📡 Fetching initial data from external API..."
    local max_attempts=5
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        echo "🔄 Attempt $attempt/$max_attempts to fetch data..."
        
        if curl -X POST http://localhost:3000/api/ingest; then
            echo "✅ Initial data fetched successfully!"
            return 0
        fi
        
        echo "❌ Attempt $attempt failed, retrying in 10 seconds..."
        sleep 10
        attempt=$((attempt + 1))
    done
    
    echo "❌ Failed to fetch initial data after $max_attempts attempts"
    return 1
}

# Function to setup cron jobs
setup_cron() {
    echo "⏰ Setting up cron jobs..."
    
    # Create cron job file
    cat > /tmp/crontab << EOF
# Data ingestion every 10 minutes
*/10 * * * * curl -X POST http://localhost:3000/api/ingest >> /var/log/cron.log 2>&1

# Health check every 5 minutes
*/5 * * * * curl -f http://localhost:3000 >> /var/log/cron.log 2>&1 || echo "Health check failed at \$(date)" >> /var/log/cron.log
EOF
    
    # Install cron job
    crontab /tmp/crontab
    
    # Start cron daemon (use -b to run in background; some builds lack -l)
    crond -b
    
    echo "✅ Cron jobs configured and started"
}

# Function to monitor and restart cron if needed
monitor_cron() {
    while true; do
        if ! pgrep crond > /dev/null; then
            echo "⚠️ Cron daemon stopped, restarting..."
            crond -b
        fi
        sleep 60
    done
}

# Main execution
main() {
    # Wait for application to be ready
    if ! wait_for_app; then
        echo "❌ Failed to start application"
        exit 1
    fi
    
    # Initialize database
    init_database
    
    # Clear existing data
    clear_data
    
    # Fetch initial data
    if ! fetch_initial_data; then
        echo "⚠️ Warning: Failed to fetch initial data, but continuing..."
    fi
    
    # Setup cron jobs
    setup_cron
    
    echo "🎉 Startup completed successfully!"
    echo "🌐 Access your dashboard at: http://localhost:3000"
    echo "⏰ Data will auto-refresh every 10 minutes"
    
    # Start Prisma Studio
    echo "🔧 Starting Prisma Studio..."
    npx prisma studio --hostname 0.0.0.0 --port 5555 --browser none &
    echo "✅ Prisma Studio available at: http://localhost:5555"
    
    # Start monitoring
    monitor_cron
}

# Run main function
main "$@"
