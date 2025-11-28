# Quick Start Guide

Get Eclipse Brand Analyzer up and running in 5 minutes!

## Prerequisites Check

Before you begin, ensure you have:

- ✅ **Node.js 18+** - [Download here](https://nodejs.org)
- ✅ **PostgreSQL** - [Download here](https://www.postgresql.org/download/)
- ✅ **Git** - [Download here](https://git-scm.com/downloads)

Verify installations:
```bash
node --version    # Should be v18.0.0 or higher
npm --version     # Should be 9.0.0 or higher
psql --version    # PostgreSQL should be installed
```

## 5-Minute Setup

### Step 1: Clone the Repository (30 seconds)

```bash
git clone https://github.com/numosh/eclipse-standalone.git
cd eclipse-brand-analyzer
```

### Step 2: Automated Setup (3 minutes)

Run the setup script:

```bash
chmod +x setup.sh
./setup.sh
```

The script will:
- ✅ Check prerequisites
- ✅ Install dependencies
- ✅ Create `.env` file
- ✅ Generate security secrets
- ✅ Set up database
- ✅ Run migrations

**Or** manual setup:

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your settings (see Step 3)
nano .env

# Setup database
npm run db:setup
```

### Step 3: Configure Environment (1 minute)

If the setup script didn't auto-generate secrets, edit `.env`:

```bash
# Generate secrets
openssl rand -base64 32  # Copy this for NEXTAUTH_SECRET
openssl rand -hex 32     # Copy this for INTERNAL_API_TOKEN
```

**Minimum required configuration:**

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/eclipse_db"
NEXTAUTH_SECRET="<paste-generated-secret-here>"
INTERNAL_API_TOKEN="<paste-generated-token-here>"
TMS_API_KEY="your-tms-api-key"  # Get from TMS dashboard
```

**Optional (for AI insights):**
```env
OLLAMA_API_URL="https://api.virtueai.id/api/generate"
OLLAMA_MODEL="glm4:latest"
```

### Step 4: Start the Application (30 seconds)

```bash
npm run dev
```

Open your browser:
```
http://localhost:3000
```

### Step 5: Login and Explore (30 seconds)

Default credentials:
- **Username:** `admin`
- **Password:** `admin123`

**🚨 IMPORTANT:** Change this password immediately!

## Quick Test

### Create Your First Analysis

1. Click **"New Analysis"** button
2. Fill in the form:
   ```
   Title: "Test Brand Analysis"
   Focus Brand: "Nike"
   Instagram Handle: "nike"
   Competitor: "Adidas"
   Instagram Handle: "adidas"
   Universe Keywords: "sports, footwear, athletic"
   ```
3. Click **"Start Analysis"**
4. Wait 2-5 minutes for results
5. View insights in Overview, Conversation, and Content tabs
6. Export as DOCX or PDF

## Common Issues

### Port 3000 Already in Use

```bash
# Find and kill the process
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
```

### Database Connection Error

```bash
# Check PostgreSQL is running
brew services list  # macOS
systemctl status postgresql  # Linux
net start postgresql-x64-14  # Windows

# Create database manually
psql -U postgres
CREATE DATABASE eclipse_db;
\q

# Run setup again
npm run db:setup
```

### Prisma Client Error

```bash
# Regenerate Prisma client
npx prisma generate

# Reset database if needed
npm run db:reset
```

### Module Not Found

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Next Steps

### 1. Configure API Keys

Get your API keys:
- **TMS API**: [https://tms-api.com/dashboard](https://tms-api.com/dashboard)
- **Ollama** (optional): [https://ollama.ai](https://ollama.ai)

Add to `.env`:
```env
TMS_API_KEY="your-actual-tms-key"
OLLAMA_API_URL="your-ollama-url"
```

### 2. Explore Features

- **Dashboard**: View all analyses
- **New Analysis**: Create brand comparisons
- **Buznes**: Manage influencer campaigns
- **Export**: Download reports in multiple formats

### 3. Customize

- Change admin password
- Create additional users (via Prisma Studio)
- Customize branding (update logos in components)
- Configure analysis parameters

### 4. Production Deployment

Ready to deploy? See [README.md](README.md#production-deployment) for:
- Vercel deployment
- Railway deployment
- Docker setup
- Environment configuration

## Useful Commands

### Development
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Check code quality
```

### Database
```bash
npm run db:studio    # Open database GUI
npm run db:migrate   # Create new migration
npm run db:reset     # Reset database (deletes data!)
```

### Debugging
```bash
# View logs
tail -f logs/app.log

# Test API endpoint
curl http://localhost:3000/api/health

# Check database
psql -U postgres -d eclipse_db
\dt  # List tables
```

## Getting Help

### Documentation
- [README.md](README.md) - Full documentation
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guide
- [API Documentation](#) - API reference

### Support
- **Issues**: [GitHub Issues](https://github.com/numosh/eclipse-standalone/issues)
- **Discussions**: [GitHub Discussions](https://github.com/numosh/eclipse-standalone/discussions)
- **Email**: support@yourcompany.com

### Community
- [Discord](#) - Join our community
- [Twitter](#) - Follow for updates

## Tips for Success

### Performance
- Use PostgreSQL indexes for large datasets
- Enable caching for API calls
- Optimize images and assets
- Use production build for deployment

### Security
- Never commit `.env` file
- Use strong passwords
- Enable HTTPS in production
- Regularly update dependencies

### Best Practices
- Run analyses during off-peak hours
- Export reports regularly
- Back up your database
- Monitor API rate limits

## Quick Reference

### Default Login
```
Username: admin
Password: admin123
```

### Environment Variables
```env
DATABASE_URL          # PostgreSQL connection
NEXTAUTH_SECRET       # Auth encryption key
INTERNAL_API_TOKEN    # API security token
TMS_API_KEY          # Social media data
OLLAMA_API_URL       # AI insights (optional)
```

### Key URLs
```
Application:    http://localhost:3000
Database GUI:   npm run db:studio
API Health:     http://localhost:3000/api/health
```

### Important Directories
```
/app         - Application pages and API routes
/components  - React components
/lib         - Core business logic
/prisma      - Database schema and migrations
```

## Success!

You're all set! Start analyzing brands and gaining insights.

Questions? Check [README.md](README.md) or open an issue.

Happy analyzing! 🚀
