# News Dashboard - Feature List

## Overview
A comprehensive news aggregation and analytics dashboard that collects, processes, and visualizes social media news posts from multiple sources. The system intelligently groups similar posts, calculates trending scores, and provides detailed analytics.

---

## 🔐 Authentication & Security

### HTTP Basic Authentication
- HTTP Basic Auth middleware protection
- Custom login page (`/login`)
- Session management with authentication hooks
- Environment-based credential configuration
- Automatic redirect to login for unauthenticated users
- Logout functionality

### Token Management
- **Automatic Token Refresh System**
  - Automatic authentication with external APIs
  - JWT token caching and refresh before expiration
  - Multiple authentication strategies (email/password, OAuth2)
  - Token persistence (file or database storage)
  - Background token refresh scheduler (every 10 minutes)
  - Token health monitoring (every 5 minutes)
  - Automatic recovery from authentication failures
  - Rate limiting to prevent excessive auth attempts
  - Support for static token fallback

---

## 📊 Data Management

### Data Ingestion
- **External API Integration**
  - Fetches posts from external API with pagination support
  - Fetches sources data from external API
  - Automatic authentication with external services
  - Handles multiple API response formats
  - Retry logic for failed requests
  - Manual data refresh trigger
  - Automatic data refresh (every 5 minutes on dashboard)
  - Data ingestion logging

### Data Processing
- **Post Transformation**
  - Normalizes data from external API format
  - Handles various field name variations
  - Sentiment normalization (positive/negative/neutral)
  - Date parsing and normalization
  - Image path handling

- **Intelligent Post Grouping**
  - Groups similar posts into NewsItems using Jaccard similarity (≥0.3 threshold)
  - Groups by category and time window
  - Deduplicates same news stories from multiple sources
  - Creates aggregated metrics (total reactions, shares, comments)
  - Calculates average trending scores per group

### Database Structure
- **Two-Tier Architecture**
  - **Post Model**: Individual social media posts (299+ records)
  - **NewsItem Model**: Grouped/clustered posts (103+ records)
  - Many-to-one relationship (multiple Posts → one NewsItem)
  - Source management with active/inactive status
  - Daily aggregation tracking
  - Data ingestion logs

---

## 🎯 Content Scoring & Ranking

### Advanced Scoring System
- **Source Weight Calculation**
  - Evaluates source quality based on likes, followers, and posting frequency
  - Formula: `(Like Weight + Follower Weight) × Post Per Day Weight`

- **News Flow Weight**
  - Calculates post performance based on engagement metrics
  - Formula: `(Like Weight + Share Weight + Comment Weight) × Date Weight × Category Weight`
  - Engagement multipliers: Reactions (50×), Shares (70×), Comments (90×)
  - Time decay factor (newer content prioritized)

- **Category-Based Weighting**
  - Critical categories: Crime/Corruption/Cyber Crime (10.0×), Politics (9.5×)
  - High priority: Accident (9.0×), National (8.0×), International (7.5×)
  - Medium priority: Business (7.0×), Technology (6.5×)
  - Low priority: Entertainment (4.0×), Other (1.0×)

- **Virality Score**
  - Measures content spread across sources and dates
  - Range: 1 (low) to 7 (viral)
  - Formula based on source diversity and date diversity

- **Final Trending Score**
  - Combines all factors into single meaningful score
  - Scaled relative to maximum trending score
  - Multiplied by virality score

---

## 📈 Dashboard Features

### Main Dashboard View
- **Top 10 Viral Posts Table**
  - Sorted by trending score
  - Customizable columns
  - Pagination support
  - Sortable columns
  - Post analysis modal

- **All News Posts Table**
  - Complete list of all news items
  - Pagination (20 posts per page)
  - Same column customization as viral posts
  - Filtered by current search and filters

### Highlight Cards
- **Key Metrics Display**
  - Most Liked Post (highest reactions)
  - Most Shared Post (highest shares)
  - Most Commented Post (highest comments)
  - Shows post preview, source, sentiment, and link
  - Updates dynamically based on filters

### Dynamic Column Management
- **Customizable Table Columns**
  - Add/remove columns dynamically
  - Drag-and-drop column reordering
  - Fixed columns (ID, Post Text, Category, Source)
  - Optional columns: Date, Sentiment, Reactions, Shares, Comments, Source Count, Virality Score, Source Weight, News Flow Weight, Final Trending Score
  - Save column configurations
  - Reset to default configuration
  - Column management panel

### Search Functionality
- **Full-Text Search**
  - Search across post text, source, category, and platform
  - Real-time search suggestions
  - Search results with scoring
  - Minimum 2 characters required
  - Search API with limit parameter

### Filtering System
- **Multi-Dimensional Filters**
  - **Date Range Filter**: Custom date range selection (default: last year)
  - **Category Filter**: Multi-select category filtering
  - **Source Filter**: Multi-select source filtering
  - **Platform Filter**: Multi-select platform filtering
  - Filters apply to all dashboard components (tables, charts, highlights)
  - Filter options dynamically loaded from database

---

## 📊 Analytics & Visualization

### Charts Section
- **News Flow by Category (Pie Chart)**
  - Distribution of news by category
  - Shows count, reactions, shares, comments per category
  - Color-coded segments
  - Interactive tooltips

- **Source Engagement (Bar Chart)**
  - Top 12 sources by engagement
  - Shows reactions, shares, and comments
  - Stacked bar chart
  - Color-coded engagement types

- **Category Trending (Bar Chart)**
  - Number of posts per category
  - Horizontal bar chart

- **Category Reactions (Bar Chart)**
  - Total reactions per category
  - Visual comparison of engagement

- **Sentiment Distribution (Pie Chart)**
  - Positive, negative, and neutral sentiment breakdown
  - Percentage distribution

### Post Analysis
- **Detailed Post View**
  - Individual post analysis modal
  - Shows all related posts in a NewsItem
  - Post analysis JSON with:
    - Source list
    - Platform list
    - Sample texts
    - Post links
    - Total engagement
    - Sentiment breakdown
  - Daily engagement timeline
  - Related posts panel

### Related Posts
- **Content Discovery**
  - Find related posts by content similarity
  - API endpoint for related posts (`/api/posts/related/[id]`)
  - Similarity-based recommendations

---

## 🎨 User Interface

### Design & Theme
- **Dark Theme**
  - Modern dark UI (#1E1E1E background)
  - Consistent color scheme
  - Theme provider support
  - Responsive design

### Components
- **UI Component Library**
  - Comprehensive shadcn/ui components
  - Tables, cards, buttons, badges, dialogs
  - Charts (Recharts integration)
  - Form components
  - Navigation components
  - Toast notifications

### User Experience
- **Interactive Elements**
  - Sortable tables
  - Pagination controls
  - Modal dialogs for detailed views
  - Loading states
  - Error handling
  - Auto-refresh indicators
  - Last refresh timestamp

---

## 🔧 Technical Features

### API Endpoints
- **Dashboard API** (`/api/dashboard`)
  - Returns trending posts, all posts, highlight metrics, chart data, filter options
  - Supports query parameters for filtering
  - Dynamic data fetching

- **Ingest API** (`/api/ingest`)
  - POST: Triggers data ingestion from external API
  - DELETE: Clears all data
  - Handles pagination automatically
  - Processes posts and sources
  - Creates/updates NewsItems

- **Search API** (`/api/search`)
  - Full-text search across posts and news items
  - Returns search suggestions
  - Scoring integration

- **News Item API** (`/api/news-item/[id]`)
  - Get detailed news item information
  - Includes all related posts
  - Daily engagement calculation

- **Related Posts API** (`/api/posts/related/[id]`)
  - Find similar posts
  - Content similarity matching

- **Token API** (`/api/token`)
  - Token status monitoring
  - Force refresh
  - Clear cache

- **Auth API** (`/api/auth/check`)
  - Authentication verification

### Data Processing
- **Text Similarity**
  - Jaccard similarity calculation
  - Base key generation for grouping
  - Content deduplication

- **Score Formatting**
  - Human-readable score formatting
  - Virality score visualization
  - Category weight color coding

### Performance
- **Optimization**
  - Memoized filtering and sorting
  - Efficient database queries
  - Pagination for large datasets
  - Caching strategies
  - Auto-refresh intervals

---

## 🐳 Deployment & Infrastructure

### Docker Support
- **Containerization**
  - Docker Compose configuration
  - Multi-service orchestration
  - Automatic database initialization
  - Data persistence
  - Health checks
  - Auto-restart on failures

### Database
- **Prisma ORM**
  - SQLite database (dev)
  - Schema migrations
  - Type-safe database access
  - Prisma Studio support

### Scripts & Automation
- **Startup Scripts**
  - Database initialization
  - Data seeding
  - Cron job setup
  - Docker startup scripts
  - Token refresh testing

### Environment Configuration
- **Configurable Settings**
  - External API URLs
  - Authentication credentials
  - Database configuration
  - Token refresh settings
  - Docker environment variables

---

## 📝 Data Models

### Post Model
- Individual post data (postId, postText, postDate, platform, source, category)
- Engagement metrics (reactions, shares, comments)
- Sentiment analysis
- Trending score
- Featured images
- Links to NewsItem

### NewsItem Model
- Aggregated news story data
- Total engagement metrics
- Source and platform counts
- Average trending score
- Post analysis JSON
- Date range (first/last post date)

### Source Model
- Source information (name, platform, URL)
- Active/inactive status
- Category classification
- Description

### DailyAgg Model
- Daily aggregation statistics
- Category breakdowns
- Top sources tracking

### TokenCache Model
- Token storage and management
- Expiration tracking
- Refresh token support

### DataIngestionLog Model
- Ingestion process tracking
- Success/error status
- Processing statistics

---

## 🔄 Automation & Scheduling

### Background Jobs
- **Automatic Data Refresh**
  - Dashboard auto-refresh every 5 minutes
  - Cron job support for scheduled ingestion
  - Token refresh scheduler (every 10 minutes)
  - Health monitoring (every 5 minutes)

### Data Synchronization
- **External API Sync**
  - Automatic fetching from external APIs
  - Pagination handling
  - Error recovery
  - Rate limiting

---

## 📚 Documentation

### Available Documentation
- Database structure explanation
- Authentication setup guide
- Scoring system documentation
- Automatic token refresh guide
- Docker setup instructions
- Troubleshooting guide
- Rebuild instructions

---

## 🎯 Key Capabilities Summary

1. **Multi-Source News Aggregation**: Collects posts from multiple social media sources
2. **Intelligent Content Grouping**: Automatically groups similar posts to avoid duplicates
3. **Advanced Scoring Algorithm**: Sophisticated trending score calculation
4. **Real-Time Analytics**: Live dashboard with auto-refresh
5. **Comprehensive Filtering**: Multi-dimensional filter system
6. **Visual Analytics**: Multiple chart types for data visualization
7. **Search & Discovery**: Full-text search with suggestions
8. **Customizable Views**: Dynamic column management
9. **Secure Access**: HTTP Basic Auth with token management
10. **Docker Deployment**: Containerized with automated setup

---

## 🚀 Future Enhancement Opportunities

- Machine learning for dynamic weight adjustment
- User feedback integration
- Real-time updates via WebSockets
- A/B testing for scoring algorithms
- Performance metrics tracking
- Export functionality (CSV, PDF)
- Email alerts for trending stories
- User roles and permissions
- Advanced sentiment analysis
- Topic modeling and clustering
- Social media integration (direct posting)
- Mobile app support
- API rate limiting and quotas
- Multi-language support

