# Eclipse Brand Analyzer - Installation Summary

This document provides a complete overview of the standalone Eclipse Brand Analyzer project, ready for GitHub distribution.

## Project Overview

**Eclipse Brand Analyzer** is a comprehensive AI-powered brand analytics platform designed for social media intelligence and competitive analysis. This standalone version is packaged for easy installation on any computer.

## What's Included

### Core Application Files

```
eclipse-brand-analyzer/
├── app/                    # Next.js application (pages & API routes)
├── components/             # React UI components
├── lib/                    # Core business logic & utilities
├── prisma/                 # Database schema & migrations
├── types/                  # TypeScript type definitions
├── package.json            # Dependencies & scripts
├── tsconfig.json           # TypeScript configuration
├── next.config.mjs         # Next.js configuration
├── tailwind.config.ts      # TailwindCSS configuration
└── postcss.config.mjs      # PostCSS configuration
```

### Documentation

```
├── README.md               # Complete documentation (main guide)
├── QUICKSTART.md           # 5-minute setup guide
├── DEPLOYMENT.md           # Production deployment guide
├── CONTRIBUTING.md         # Contribution guidelines
└── INSTALLATION_SUMMARY.md # This file
```

### Setup & Configuration

```
├── .env.example            # Environment variables template
├── .gitignore              # Git ignore rules
├── setup.sh                # Automated setup script (Unix/Mac)
└── LICENSE                 # MIT License
```

## Key Features

### Analytics Capabilities
- ✅ Multi-brand competitive analysis
- ✅ Social media data from Instagram, TikTok, Twitter, YouTube, Facebook
- ✅ Audience demographics and engagement metrics
- ✅ AI-powered sentiment analysis
- ✅ Influencer profiling and discovery
- ✅ Keyword clustering and trend detection
- ✅ Share of Voice analysis
- ✅ Data quality validation

### Export Options
- ✅ Microsoft Word (DOCX) with full formatting
- ✅ PDF with embedded graphics
- ✅ PDF text-only reports
- ✅ Raw JSON data export

### Campaign Management
- ✅ Buzznesia influencer campaign tracking
- ✅ ROI and performance metrics
- ✅ Multi-campaign analytics

## Installation Methods

### Method 1: Automated Setup (Recommended)

```bash
# Clone repository
git clone https://github.com/numosh/eclipse-standalone.git
cd eclipse-brand-analyzer

# Run setup script
chmod +x setup.sh
./setup.sh

# Start application
npm run dev
```

### Method 2: Manual Setup

```bash
# Clone repository
git clone https://github.com/numosh/eclipse-standalone.git
cd eclipse-brand-analyzer

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Setup database
npm run db:setup

# Start application
npm run dev
```

### Method 3: Docker

```bash
# Build and run with Docker Compose
docker-compose up -d
```

## Prerequisites

### Required
- **Node.js** 18.0 or higher
- **npm** 9.0 or higher
- **PostgreSQL** database (local or cloud)

### API Keys
- **TMS API Key** - For social media data fetching (required)
- **Ollama API** - For AI insights (optional but recommended)

### Optional
- **Git** - For version control
- **Docker** - For containerized deployment

## Environment Configuration

### Minimum Required Variables

```env
DATABASE_URL="postgresql://user:pass@host:5432/db"
NEXTAUTH_SECRET="<generate-with-openssl-rand>"
INTERNAL_API_TOKEN="<generate-with-openssl-rand>"
TMS_API_KEY="your-tms-api-key"
```

### Optional Variables

```env
OLLAMA_API_URL="https://api.virtueai.id/api/generate"
OLLAMA_MODEL="glm4:latest"
NEXTAUTH_URL="http://localhost:3000"
```

## Quick Start Commands

```bash
# Install dependencies
npm install

# Setup database
npm run db:setup

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Open database GUI
npm run db:studio

# Run linting
npm run lint
```

## Default Credentials

After installation, login with:

```
Username: admin
Password: admin123
```

**⚠️ IMPORTANT:** Change these credentials immediately!

## Project Structure Details

### API Routes (`/app/api/`)

```
api/
├── analyze/          # Analysis orchestration
├── auth/             # NextAuth authentication
├── export/           # Report export (DOCX, PDF)
├── sessions/         # Analysis session management
└── buznes/           # Campaign management endpoints
```

### Components (`/components/`)

```
components/
├── ui/               # shadcn/ui base components
├── analysis/         # Analysis-specific components
└── visualizations/   # Chart and graph components
```

### Core Logic (`/lib/`)

```
lib/
├── analysis-engine.ts           # Main analysis orchestrator
├── post-content-analyzer.ts     # Conversation analysis
├── author-profiler.ts           # Influencer detection
├── tms-api.ts                   # Social media API client
├── ollama-api.ts                # AI integration
├── data-quality-validator.ts    # Data validation
├── instagram-scraper.ts         # Instagram fallback scraper
├── tiktok-scraper.ts           # TikTok fallback scraper
└── db.ts                        # Prisma client
```

## Technology Stack

### Frontend
- **Framework:** Next.js 14.2 with App Router
- **Language:** TypeScript 5.0
- **Styling:** TailwindCSS 3.4
- **UI Components:** shadcn/ui (Radix UI)
- **Charts:** Recharts + Nivo

### Backend
- **Runtime:** Node.js 18+
- **Database:** PostgreSQL (via Prisma ORM)
- **Authentication:** NextAuth.js
- **API:** Next.js API Routes

### Data Collection
- **API Client:** TMS API
- **Web Scraping:** Playwright + Puppeteer
- **AI Analysis:** Ollama (GLM-4 model)

### Export
- **DOCX:** docx library
- **PDF:** jsPDF + pdf-lib
- **Graphics:** html2canvas

## Database Schema

### Main Models

- **User** - Admin users and authentication
- **AnalysisSession** - Brand analysis sessions
- **Brand** - Focus brand and competitors
- **BrandData** - Social media metrics per platform
- **AnalysisResult** - Computed analytics and insights
- **AuthorProfile** - Influencer profiles
- **PostComment** - Social media comments
- **CommentAnalysis** - Comment analytics
- **BuznesiaClient** - Campaign clients
- **BuznesiaCampaign** - Influencer campaigns
- **BuznesiaInfluencer** - Influencer database
- **BuznesiaContent** - Campaign content tracking

## Available Scripts Reference

### Development

```bash
npm run dev              # Start development server on port 3000
npm run build            # Build optimized production bundle
npm start                # Start production server
npm run lint             # Run ESLint code quality checks
```

### Database Management

```bash
npm run db:setup         # Generate Prisma client + deploy migrations
npm run db:migrate       # Create a new database migration
npm run db:studio        # Open Prisma Studio (visual database editor)
npm run db:reset         # Reset database (WARNING: deletes all data)
```

### Full Setup

```bash
npm run setup            # Install dependencies + setup database
```

## Deployment Options

### Cloud Platforms

1. **Vercel** (Recommended)
   - Automatic Next.js optimization
   - Zero-config deployment
   - Free tier available
   - See: [DEPLOYMENT.md](DEPLOYMENT.md#vercel-deployment-recommended)

2. **Railway**
   - Integrated PostgreSQL
   - GitHub auto-deploy
   - Simple configuration
   - See: [DEPLOYMENT.md](DEPLOYMENT.md#railway-deployment)

3. **Docker**
   - Portable containerized deployment
   - Includes Docker Compose setup
   - See: [DEPLOYMENT.md](DEPLOYMENT.md#docker-deployment)

4. **VPS (Ubuntu/Debian)**
   - Full server control
   - Nginx reverse proxy
   - PM2 process manager
   - See: [DEPLOYMENT.md](DEPLOYMENT.md#manual-vps-deployment)

## Common Use Cases

### For Brand Managers
1. Compare your brand against competitors
2. Identify influential advocates
3. Track sentiment and engagement
4. Export reports for stakeholders

### For Marketing Agencies
1. Manage multiple client analyses
2. Track campaign performance (Buznes module)
3. Identify collaboration opportunities
4. Generate client reports

### For Researchers
1. Analyze social media trends
2. Study brand positioning
3. Export raw data for further analysis
4. Track conversation themes

## Troubleshooting

### Installation Issues

**Port 3000 in use:**
```bash
PORT=3001 npm run dev
```

**Database connection failed:**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql
# Or create database manually
createdb eclipse_db
```

**Prisma client errors:**
```bash
npx prisma generate
```

### Runtime Issues

**Analysis stuck in pending:**
- Check TMS API key is valid
- Verify Ollama API is accessible (or disable in .env)
- Check browser console for errors

**No social media data:**
- Verify social media handles are correct
- Check accounts are public
- TMS API may have rate limits

**Export not working:**
- Ensure analysis is fully loaded
- Check browser allows downloads
- Try different export format

## Security Considerations

### Before Going to Production

1. ✅ Change default admin password
2. ✅ Generate strong `NEXTAUTH_SECRET`
3. ✅ Generate strong `INTERNAL_API_TOKEN`
4. ✅ Use HTTPS (SSL certificate)
5. ✅ Enable PostgreSQL SSL mode
6. ✅ Set up firewall rules
7. ✅ Regular dependency updates
8. ✅ Enable rate limiting
9. ✅ Set up backup automation
10. ✅ Monitor application logs

## Performance Tips

1. **Database Optimization:**
   - Use indexes for large datasets
   - Regular vacuum/analyze operations
   - Connection pooling

2. **Caching:**
   - Instagram/TikTok data cached 24 hours
   - Reduce API calls with cache

3. **Scraping:**
   - Run during off-peak hours
   - Respect rate limits
   - Use headless browsers efficiently

4. **Frontend:**
   - Lazy load heavy visualizations
   - Optimize chart rendering
   - Use production build

## Support & Resources

### Documentation
- [README.md](README.md) - Complete documentation
- [QUICKSTART.md](QUICKSTART.md) - Quick setup guide
- [DEPLOYMENT.md](DEPLOYMENT.md) - Production deployment
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contributing guide

### Getting Help
- **GitHub Issues:** Report bugs and request features
- **GitHub Discussions:** Ask questions and share ideas
- **Email Support:** support@yourcompany.com

### External Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [Ollama Documentation](https://ollama.ai/docs)

## Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

## Roadmap

Planned features:

- [ ] Multi-user support with RBAC
- [ ] Scheduled automated analyses
- [ ] Email report delivery
- [ ] Custom report branding
- [ ] Public API
- [ ] Mobile app
- [ ] Real-time dashboards
- [ ] Historical trend tracking
- [ ] ML-based predictions

## Acknowledgments

Built with amazing open-source technologies:

- [Next.js](https://nextjs.org/)
- [Prisma](https://www.prisma.io/)
- [NextAuth.js](https://next-auth.js.org/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Recharts](https://recharts.org/)
- [Nivo](https://nivo.rocks/)
- [TailwindCSS](https://tailwindcss.com/)
- [Playwright](https://playwright.dev/)

## Version

**Current Version:** 1.0.0

**Release Date:** November 2024

**Node.js:** 18.0+

**Next.js:** 14.2.21

---

## Quick Reference Card

### Installation
```bash
git clone <repo-url>
cd eclipse-brand-analyzer
./setup.sh
npm run dev
```

### Environment
```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="<generate>"
INTERNAL_API_TOKEN="<generate>"
TMS_API_KEY="<your-key>"
```

### Default Login
```
admin / admin123
```

### Key Commands
```bash
npm run dev          # Start
npm run db:studio    # Database GUI
npm run build        # Build
```

### Support
- GitHub: [Issues](https://github.com/numosh/eclipse-standalone/issues)
- Email: support@yourcompany.com

---

**Ready to analyze! Navigate to http://localhost:3000 after setup.**

**Questions? Check README.md or open an issue on GitHub.**

Happy analyzing! 🚀
