# Deployment Guide

Complete guide for deploying Eclipse Brand Analyzer to production.

## Table of Contents

- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Vercel Deployment](#vercel-deployment-recommended)
- [Railway Deployment](#railway-deployment)
- [Docker Deployment](#docker-deployment)
- [Manual VPS Deployment](#manual-vps-deployment)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Post-Deployment](#post-deployment)
- [Troubleshooting](#troubleshooting)

## Pre-Deployment Checklist

Before deploying, ensure you have:

- [ ] PostgreSQL database (not SQLite)
- [ ] TMS API key
- [ ] Generated secure `NEXTAUTH_SECRET` and `INTERNAL_API_TOKEN`
- [ ] (Optional) Ollama API access for AI features
- [ ] Domain name configured (optional)
- [ ] SSL certificate (handled automatically by most platforms)

## Vercel Deployment (Recommended)

Vercel offers the easiest deployment for Next.js applications.

### Step 1: Prepare Your Repository

```bash
# Ensure your code is pushed to GitHub
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### Step 2: Set Up Database

Use a managed PostgreSQL service:

**Recommended Providers:**
- [Supabase](https://supabase.com) - Free tier available
- [Neon](https://neon.tech) - Serverless PostgreSQL
- [Railway](https://railway.app) - PostgreSQL addon
- [Digital Ocean](https://www.digitalocean.com/products/managed-databases) - Managed database

Get your `DATABASE_URL` from your chosen provider.

### Step 3: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"New Project"**
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset:** Next.js
   - **Root Directory:** ./
   - **Build Command:** `npm run build`
   - **Output Directory:** .next

### Step 4: Configure Environment Variables

In Vercel dashboard, add these environment variables:

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname?sslmode=require

# Authentication
NEXTAUTH_SECRET=<generated-secret>
NEXTAUTH_URL=https://your-domain.vercel.app

# API Security
INTERNAL_API_TOKEN=<generated-token>

# TMS API
TMS_API_KEY=your-tms-api-key

# Ollama (Optional)
OLLAMA_API_URL=https://api.virtueai.id/api/generate
OLLAMA_MODEL=glm4:latest
```

### Step 5: Deploy

1. Click **"Deploy"**
2. Wait for deployment to complete
3. Visit your URL: `https://your-app.vercel.app`

### Step 6: Run Database Migrations

After first deployment, run migrations:

```bash
# Clone the deployment
vercel env pull .env.production

# Run migrations
DATABASE_URL="<your-production-db-url>" npx prisma migrate deploy

# Or use Vercel CLI
vercel exec -- npm run db:setup
```

### Custom Domain (Optional)

1. In Vercel dashboard → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update `NEXTAUTH_URL` in environment variables

---

## Railway Deployment

Railway offers integrated database and application hosting.

### Step 1: Create Railway Project

1. Go to [railway.app](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your repository

### Step 2: Add PostgreSQL Database

1. Click **"New"** → **"Database"** → **"PostgreSQL"**
2. Railway will create a database and set `DATABASE_URL`

### Step 3: Configure Environment Variables

In Railway project settings, add:

```env
# Authentication (DATABASE_URL is auto-set by Railway)
NEXTAUTH_SECRET=<generated-secret>
NEXTAUTH_URL=${{RAILWAY_PUBLIC_DOMAIN}}

# API Security
INTERNAL_API_TOKEN=<generated-token>

# TMS API
TMS_API_KEY=your-tms-api-key

# Ollama
OLLAMA_API_URL=https://api.virtueai.id/api/generate
OLLAMA_MODEL=glm4:latest
```

### Step 4: Configure Build

Create `railway.json`:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npx prisma generate && npm run build"
  },
  "deploy": {
    "startCommand": "npx prisma migrate deploy && npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Step 5: Install Playwright (For Scraping)

Add to build command:

```json
{
  "build": {
    "buildCommand": "npm install && npx playwright install --with-deps chromium && npx prisma generate && npm run build"
  }
}
```

### Step 6: Deploy

Railway automatically deploys on git push.

```bash
git add railway.json
git commit -m "Add Railway config"
git push origin main
```

---

## Docker Deployment

For containerized deployments.

### Step 1: Create Dockerfile

Create `Dockerfile` in project root:

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy built app and necessary files
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Install Playwright for scraping
RUN npx playwright install --with-deps chromium

# Expose port
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Start application
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
```

### Step 2: Create .dockerignore

```
node_modules
.next
.git
.env
.env.*
*.log
README.md
Dockerfile
.dockerignore
```

### Step 3: Build and Run

```bash
# Build image
docker build -t eclipse-analyzer .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e NEXTAUTH_SECRET="..." \
  -e NEXTAUTH_URL="http://localhost:3000" \
  -e INTERNAL_API_TOKEN="..." \
  -e TMS_API_KEY="..." \
  eclipse-analyzer
```

### Step 4: Docker Compose (Recommended)

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/eclipse
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - INTERNAL_API_TOKEN=${INTERNAL_API_TOKEN}
      - TMS_API_KEY=${TMS_API_KEY}
      - OLLAMA_API_URL=${OLLAMA_API_URL}
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=eclipse
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

volumes:
  postgres_data:
```

Run with:
```bash
docker-compose up -d
```

---

## Manual VPS Deployment

For Ubuntu/Debian servers.

### Step 1: Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Nginx (reverse proxy)
sudo apt install -y nginx

# Install PM2 (process manager)
sudo npm install -g pm2
```

### Step 2: Database Setup

```bash
# Create database
sudo -u postgres psql
CREATE DATABASE eclipse_db;
CREATE USER eclipse_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE eclipse_db TO eclipse_user;
\q
```

### Step 3: Deploy Application

```bash
# Clone repository
cd /var/www
sudo git clone https://github.com/numosh/eclipse-standalone.git
cd eclipse-brand-analyzer

# Install dependencies
sudo npm install

# Create .env file
sudo nano .env
# Add your environment variables

# Run migrations
sudo npx prisma migrate deploy

# Build application
sudo npm run build

# Start with PM2
sudo pm2 start npm --name "eclipse-analyzer" -- start
sudo pm2 save
sudo pm2 startup
```

### Step 4: Configure Nginx

Create `/etc/nginx/sites-available/eclipse`:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/eclipse /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 5: SSL with Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## Environment Configuration

### Required Variables

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="https://yourdomain.com"
INTERNAL_API_TOKEN="..."
TMS_API_KEY="..."
```

### Optional Variables

```env
OLLAMA_API_URL="..."
OLLAMA_MODEL="glm4:latest"
LOG_LEVEL="info"
NODE_ENV="production"
```

### Generating Secrets

```bash
# NEXTAUTH_SECRET
openssl rand -base64 32

# INTERNAL_API_TOKEN
openssl rand -hex 32
```

---

## Database Setup

### Running Migrations

```bash
# Deploy migrations
npx prisma migrate deploy

# Or reset database (WARNING: deletes data)
npx prisma migrate reset
```

### Backup and Restore

```bash
# Backup
pg_dump -U username -d eclipse_db > backup.sql

# Restore
psql -U username -d eclipse_db < backup.sql
```

---

## Post-Deployment

### Health Check

Test your deployment:

```bash
curl https://yourdomain.com/api/health
```

### Create Admin User

Use Prisma Studio or SQL:

```bash
npx prisma studio
```

### Monitoring

Set up monitoring:

1. **Application Logs:**
   - Vercel: Dashboard → Logs
   - Railway: Project → Logs
   - PM2: `pm2 logs eclipse-analyzer`

2. **Error Tracking:**
   - [Sentry](https://sentry.io)
   - [LogRocket](https://logrocket.com)

3. **Uptime Monitoring:**
   - [UptimeRobot](https://uptimerobot.com)
   - [Pingdom](https://www.pingdom.com)

### Backups

Automate database backups:

```bash
# Add to crontab
0 2 * * * pg_dump -U user -d eclipse_db > /backups/db_$(date +\%Y\%m\%d).sql
```

---

## Troubleshooting

### Application Won't Start

```bash
# Check logs
pm2 logs eclipse-analyzer  # PM2
docker logs <container-id>  # Docker
vercel logs  # Vercel

# Common issues:
# - Missing environment variables
# - Database connection failed
# - Port already in use
```

### Database Connection Error

```bash
# Test connection
psql "postgresql://user:pass@host:5432/db"

# Check SSL mode
DATABASE_URL="postgresql://...?sslmode=require"
```

### Build Failures

```bash
# Clear cache
rm -rf .next node_modules
npm install
npm run build

# Check Node version
node --version  # Should be 18+
```

### Prisma Issues

```bash
# Regenerate client
npx prisma generate

# Check migrations
npx prisma migrate status
```

---

## Security Best Practices

1. **Use strong secrets** - Never use default values
2. **Enable HTTPS** - Force SSL in production
3. **Restrict database access** - Use firewall rules
4. **Keep dependencies updated** - Run `npm audit`
5. **Use environment variables** - Never hardcode secrets
6. **Enable rate limiting** - Protect API endpoints
7. **Regular backups** - Automate database backups
8. **Monitor logs** - Watch for suspicious activity

---

## Performance Optimization

1. **Enable caching:**
   ```env
   CACHE_DURATION_HOURS=24
   ```

2. **Use CDN** for static assets

3. **Optimize database:**
   ```sql
   CREATE INDEX idx_sessions_user ON "AnalysisSession"("userId");
   ```

4. **Enable compression** in Nginx:
   ```nginx
   gzip on;
   gzip_types text/plain application/json;
   ```

---

## Support

Need help with deployment?

- Check [GitHub Issues](https://github.com/numosh/eclipse-standalone/issues)
- Email: support@yourcompany.com
- Documentation: [README.md](README.md)

---

**Congratulations! Your Eclipse Brand Analyzer is now live! 🚀**
