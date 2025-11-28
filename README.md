# Eclipse Brand Analyzer

A comprehensive AI-powered brand analytics platform for social media intelligence and competitive analysis.

![Next.js](https://img.shields.io/badge/Next.js-14.2-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC)

## Features

### Core Analysis
- **Multi-Brand Comparison**: Analyze focus brand vs competitors across social platforms
- **Audience Intelligence**: Deep follower demographics and engagement analysis
- **Content Performance**: Track posts across Instagram, TikTok, Twitter, YouTube, Facebook
- **Sentiment Analysis**: AI-powered sentiment detection on conversations
- **Share of Voice**: Measure brand visibility across the social landscape

### Advanced Analytics
- **Conversation Analysis**: Analyze post themes, hashtags, mentions, and trending topics
- **Author Profiling**: Identify and categorize key influencers and brand advocates
- **Keyword Clustering**: Discover trending topics and conversation themes
- **Network Analysis**: Visualize brand relationships and influence networks
- **Voice Comparison**: Own Voice vs Earned Voice analysis
- **Data Quality Validation**: Comprehensive data quality reports per brand/platform

### Export Options
- **DOCX Export**: Fully editable Word documents with tables and formatting
- **PDF Export**: Text-only reports
- **PDF with Graphics**: Full visual reports with embedded charts
- **Raw JSON**: Complete data export for custom analysis

### AI-Powered Insights
- Powered by GLM-4 via Ollama
- Automated competitive analysis recommendations
- Content strategy suggestions
- Sentiment-driven insights

### Campaign Management (Buzznesia)
- Influencer campaign tracking
- ROI and performance metrics
- Multi-campaign analytics
- Influencer vetting tools

## Tech Stack

- **Framework**: Next.js 14.2 with App Router
- **Language**: TypeScript 5.0
- **Database**: PostgreSQL (via Prisma ORM)
- **Authentication**: NextAuth.js with credential-based auth
- **UI**: TailwindCSS + shadcn/ui components
- **Charts**: Recharts + Nivo (network graphs, Sankey diagrams)
- **AI**: Ollama API (GLM-4 model)
- **Scraping**: Playwright + Puppeteer
- **Export**: docx, jsPDF, pdf-lib

## Prerequisites

Before installing, ensure you have:

- **Node.js** 18.0 or higher
- **npm** or **yarn**
- **PostgreSQL** database (local or cloud)
- **TMS API Key** (for social media data)
- **Ollama API** access (optional, for AI insights)

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/numosh/eclipse-standalone.git
cd eclipse-brand-analyzer
```

### 2. Install Dependencies

```bash
npm install
```

This will automatically run `prisma generate` after installation.

### 3. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and configure the following required variables:

```env
# Database (PostgreSQL)
DATABASE_URL="postgresql://username:password@localhost:5432/eclipse_db"

# NextAuth Configuration
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Internal API Security
INTERNAL_API_TOKEN="your-internal-token-here"

# TMS API (Required for social data)
TMS_API_KEY="your-tms-api-key-here"

# Ollama API (Optional - for AI insights)
OLLAMA_API_URL="https://api.virtueai.id/api/generate"
OLLAMA_MODEL="glm4:latest"
```

#### Generate Secure Secrets

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate INTERNAL_API_TOKEN
openssl rand -hex 32
```

### 4. Set Up the Database

Create your PostgreSQL database, then run migrations:

```bash
# Run migrations
npx prisma migrate deploy

# Or use the npm script
npm run db:setup
```

### 5. Create Admin User (Optional)

The system comes with a default admin account:
- **Username**: `admin`
- **Password**: `admin123`

**IMPORTANT**: Change this password immediately in production!

To create a custom admin user, you can use Prisma Studio:

```bash
npm run db:studio
```

Or run the seed script (if available):

```bash
npx prisma db seed
```

### 6. Start the Development Server

```bash
npm run dev
```

Open your browser and navigate to:
```
http://localhost:3000
```

### 7. Login and Start Analyzing

1. Login with your credentials
2. Click "New Analysis"
3. Add your focus brand and competitors
4. Enter universe keywords
5. Start the analysis!

## Production Deployment

### Environment Setup

For production, ensure you:

1. Use a production-grade PostgreSQL database
2. Set strong `NEXTAUTH_SECRET` and `INTERNAL_API_TOKEN`
3. Configure `NEXTAUTH_URL` to your production domain
4. Enable SSL for database connections
5. Set up proper CORS and security headers

### Build and Start

```bash
# Install dependencies
npm install

# Build the application
npm run build

# Start production server
npm start
```

### Deployment Platforms

This application can be deployed to:

#### Vercel (Recommended)
1. Push your code to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy automatically

#### Railway
1. Create new project on [Railway](https://railway.app)
2. Add PostgreSQL database service
3. Connect GitHub repository
4. Add environment variables
5. Deploy

#### Docker
```bash
# Build image
docker build -t eclipse-analyzer .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL="your-db-url" \
  -e NEXTAUTH_SECRET="your-secret" \
  eclipse-analyzer
```

## Project Structure

```
eclipse-brand-analyzer/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── analyze/              # Analysis orchestration
│   │   ├── auth/                 # NextAuth endpoints
│   │   ├── export/               # Export handlers (DOCX, PDF)
│   │   ├── sessions/             # Session management
│   │   └── buznes/               # Campaign management
│   ├── auth/                     # Auth pages
│   │   └── login/                # Login page
│   ├── dashboard/                # Main application
│   │   ├── analysis/[id]/        # Analysis results
│   │   ├── buznes/               # Campaign management
│   │   └── new/                  # Create new analysis
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page
│
├── components/                   # React Components
│   ├── ui/                       # shadcn/ui components
│   ├── analysis/                 # Analysis-specific components
│   └── visualizations/           # Chart components
│
├── lib/                          # Core Logic
│   ├── analysis-engine.ts        # Main orchestration
│   ├── post-content-analyzer.ts  # Conversation analysis
│   ├── author-profiler.ts        # Influencer detection
│   ├── tms-api.ts               # Social media API
│   ├── ollama-api.ts            # AI integration
│   ├── data-quality.ts          # Data validation
│   └── db.ts                    # Prisma client
│
├── prisma/                       # Database
│   ├── schema.prisma             # Database schema
│   └── migrations/               # Migration history
│
└── types/                        # TypeScript types
```

## Available Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm start                # Start production server
npm run lint             # Run ESLint

# Database
npm run db:setup         # Generate Prisma client + run migrations
npm run db:migrate       # Create new migration
npm run db:studio        # Open Prisma Studio (database GUI)
npm run db:reset         # Reset database (WARNING: deletes all data)

# Full setup (install + database)
npm run setup            # Run install and db:setup
```

## Usage Guide

### Creating an Analysis

1. **Navigate to Dashboard**: Click "New Analysis" button
2. **Enter Details**:
   - Analysis title (e.g., "Q4 2024 Brand Comparison")
   - Focus brand name and social handles
   - Competitor brands (1-5 competitors)
   - Universe keywords (topics people discuss)
3. **Start Analysis**: Click "Start Analysis"

The system will:
- Fetch data from Instagram, TikTok, Twitter, YouTube, Facebook
- Scrape fallback data using Playwright/Puppeteer if APIs fail
- Analyze audience demographics and engagement
- Profile influencers mentioning your brands
- Extract conversations and sentiment
- Generate AI insights (if Ollama is configured)
- Validate data quality per platform

**Analysis Duration**: 2-10 minutes depending on data volume.

### Viewing Results

Analysis results are organized in three tabs:

#### 1. Overview Tab
- Executive summary
- Audience comparison (followers by platform)
- Post channel distribution
- Brand equity scores
- Share of Voice metrics

#### 2. Audience Conversation Tab
- Hashtag analysis and trends
- Keyword clustering
- Sentiment breakdown
- Top influencers and advocates
- Network visualization
- AI-generated insights

#### 3. Content Analysis Tab
- Post timing and frequency
- Engagement rate by post type
- Voice analysis (Own vs Earned)
- Content performance metrics

### Exporting Reports

Click any export button in the analysis view:

- **Export DOCX**: Microsoft Word format with tables (best for editing)
- **PDF with Graphics**: Visual report with embedded charts
- **PDF (Text Only)**: Simple text-based report
- **Export Raw JSON**: Complete data dump for custom processing

### Campaign Management (Buzznesia)

Navigate to "Buznes" tab to:
- Track influencer campaigns
- Monitor ROI and performance
- Manage multiple clients
- Vet influencers for collaboration

## Configuration

### Database Configuration

The app uses PostgreSQL. Configure your connection string in `.env`:

```env
DATABASE_URL="postgresql://user:password@host:port/database?schema=public"
```

For SSL connections (recommended for production):
```env
DATABASE_URL="postgresql://user:password@host:port/database?schema=public&sslmode=require"
```

### API Configuration

#### TMS API
Required for fetching social media data. Get your API key from TMS dashboard.

```env
TMS_API_KEY="your-tms-api-key"
```

#### Ollama API (Optional)
For AI-powered insights. Can use local or hosted Ollama:

```env
# Hosted (Virtue.id)
OLLAMA_API_URL="https://api.virtueai.id/api/generate"
OLLAMA_MODEL="glm4:latest"

# Local (requires Ollama installed)
# OLLAMA_API_URL="http://localhost:11434/api/generate"
# OLLAMA_MODEL="glm4:latest"
```

If Ollama is unavailable, the analysis will skip AI insights but continue normally.

## Troubleshooting

### Analysis Stuck in "Pending"

**Causes**:
- TMS API key invalid or rate-limited
- Ollama API unreachable (analysis will continue without AI)
- Database connection issues

**Solutions**:
1. Check API keys in `.env`
2. Verify database connectivity
3. Check browser console for errors
4. View application logs for detailed errors

### No Social Media Data

**Causes**:
- Invalid social media handles
- Accounts are private or deleted
- API rate limits exceeded

**Solutions**:
1. Verify social handles are correct (without @ symbol)
2. Check account visibility (public vs private)
3. Wait for rate limit reset (TMS API)
4. System will attempt fallback scraping automatically

### Export Not Working

**Causes**:
- Analysis not fully loaded
- Browser blocking downloads
- Large dataset causing timeout

**Solutions**:
1. Wait for all analysis tabs to load completely
2. Allow downloads in browser settings
3. Try different export format (JSON is fastest)
4. Check browser console for errors

### Database Migration Errors

**Causes**:
- Existing database schema mismatch
- Migration conflicts

**Solutions**:
```bash
# Reset database (WARNING: deletes all data)
npm run db:reset

# Or manually fix
npx prisma migrate resolve --applied "migration_name"
npx prisma migrate deploy
```

### Playwright Browser Installation

For Railway/Docker deployments:
```bash
# Install Playwright browsers
npx playwright install --with-deps chromium
```

## Security Considerations

1. **Change Default Credentials**: The default admin/admin123 account should be changed immediately
2. **Use Strong Secrets**: Generate cryptographically secure secrets for `NEXTAUTH_SECRET` and `INTERNAL_API_TOKEN`
3. **Enable HTTPS**: Always use HTTPS in production
4. **Database Security**: Use SSL for database connections
5. **API Rate Limiting**: Implement rate limiting on API routes
6. **Input Validation**: The app uses Zod for input validation
7. **SQL Injection Protection**: Prisma provides automatic protection

## Performance Optimization

### Analysis Performance
- Analyses run asynchronously to prevent blocking
- Database indexes on frequently queried fields
- Caching for Instagram/TikTok data (reduces API calls)
- Non-blocking AI insights (continues if Ollama unavailable)

### Database Optimization
- Composite indexes on analysis queries
- Cascading deletes to maintain data integrity
- JSON fields for flexible data storage

### Frontend Performance
- Server-side rendering for initial load
- Client-side chart rendering with Recharts/Nivo
- Lazy loading of heavy visualizations

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/AmazingFeature`
3. Commit your changes: `git commit -m 'Add some AmazingFeature'`
4. Push to the branch: `git push origin feature/AmazingFeature`
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write meaningful commit messages
- Update documentation for new features
- Test thoroughly before submitting PR

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues, questions, or feature requests:

- **GitHub Issues**: [https://github.com/numosh/eclipse-standalone/issues](https://github.com/numosh/eclipse-standalone/issues)
- **Email**: support@yourcompany.com
- **Documentation**: See additional docs in the repository

## Roadmap

Future enhancements planned:

- [ ] Multi-user support with role-based access control
- [ ] Scheduled automated analyses
- [ ] Email report delivery
- [ ] Custom branding for exports
- [ ] Public API for external integrations
- [ ] Mobile app (React Native)
- [ ] Real-time monitoring dashboards
- [ ] Historical trend tracking
- [ ] Advanced ML-based predictions
- [ ] Multi-language support

## Acknowledgments

Built with amazing open-source tools:

- [Next.js](https://nextjs.org/) - React framework
- [Prisma](https://www.prisma.io/) - Database ORM
- [NextAuth.js](https://next-auth.js.org/) - Authentication
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Recharts](https://recharts.org/) - Charts library
- [Nivo](https://nivo.rocks/) - Advanced visualizations
- [TailwindCSS](https://tailwindcss.com/) - Styling
- [Playwright](https://playwright.dev/) - Browser automation
- [Ollama](https://ollama.ai/) - AI integration

## Credits

**Developed and maintained by Anugra Prahasta**
**Trans Media Sosial © 2025**

Data powered by TMS API
AI powered by Virtue.id Ollama (GLM-4)

---

**Made for brand intelligence professionals who demand comprehensive, AI-powered analytics.**
