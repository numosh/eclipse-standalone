# GitHub Setup Instructions

Quick guide to push your Eclipse Brand Analyzer to GitHub.

## Step 1: Create GitHub Repository

1. Go to [github.com](https://github.com) and login
2. Click the **"+"** button → **"New repository"**
3. Fill in the details:
   - **Repository name:** `eclipse-brand-analyzer`
   - **Description:** "AI-powered brand analytics platform for social media intelligence"
   - **Visibility:** Public or Private (your choice)
   - **Do NOT** initialize with README, .gitignore, or license (we already have these)
4. Click **"Create repository"**

## Step 2: Initialize Git in Your Project

```bash
# Navigate to your project directory
cd /Users/anugrah/Documents/Windsurf/eclipse-standalone

# Initialize git repository
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit: Eclipse Brand Analyzer v1.0.0"
```

## Step 3: Connect to GitHub

Replace `YOUR_USERNAME` with your GitHub username:

```bash
# Add remote repository
git remote add origin https://github.com/YOUR_USERNAME/eclipse-brand-analyzer.git

# Verify remote was added
git remote -v
```

## Step 4: Push to GitHub

```bash
# Push to main branch
git branch -M main
git push -u origin main
```

If prompted for credentials:
- **Username:** Your GitHub username
- **Password:** Use a Personal Access Token (not your password)

### Creating a Personal Access Token

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Give it a name: `Eclipse Analyzer Deployment`
4. Select scopes: `repo` (full control of private repositories)
5. Click **"Generate token"**
6. **Copy the token immediately** (you won't see it again!)
7. Use this token as your password when pushing

## Step 5: Verify Upload

Visit your repository:
```
https://github.com/YOUR_USERNAME/eclipse-brand-analyzer
```

You should see:
- ✅ All project files
- ✅ README.md displayed on the homepage
- ✅ License badge
- ✅ Complete documentation

## Step 6: Configure Repository Settings

### Add Topics (Optional)

1. Go to your repository
2. Click the gear icon next to "About"
3. Add topics:
   - `nextjs`
   - `typescript`
   - `brand-analytics`
   - `social-media`
   - `ai-powered`
   - `instagram-analytics`
   - `tiktok-analytics`
   - `prisma`
   - `postgresql`

### Add Description

Add this description in the "About" section:
```
AI-powered brand analytics platform for social media intelligence and competitive analysis. Built with Next.js, TypeScript, and Prisma.
```

### Add Website (Optional)

If you've deployed the app, add the URL in the "Website" field.

## Step 7: Create Releases (Optional)

### Tag Your First Release

```bash
# Create a tag
git tag -a v1.0.0 -m "Release version 1.0.0"

# Push the tag
git push origin v1.0.0
```

### Create GitHub Release

1. Go to your repository → Releases → **"Create a new release"**
2. Choose tag: `v1.0.0`
3. Release title: `Eclipse Brand Analyzer v1.0.0`
4. Description:
   ```markdown
   ## Initial Release 🚀

   Eclipse Brand Analyzer v1.0.0 - AI-powered brand analytics platform

   ### Features
   - Multi-brand competitive analysis
   - Social media intelligence (Instagram, TikTok, Twitter, YouTube, Facebook)
   - AI-powered sentiment analysis
   - Influencer profiling
   - Export to DOCX, PDF, JSON
   - Campaign management (Buzznesia module)

   ### Installation
   See [README.md](README.md) for complete installation instructions.

   ### Quick Start
   ```bash
   git clone https://github.com/YOUR_USERNAME/eclipse-brand-analyzer.git
   cd eclipse-brand-analyzer
   ./setup.sh
   npm run dev
   ```

   ### Requirements
   - Node.js 18+
   - PostgreSQL
   - TMS API Key

   ### Documentation
   - [Quick Start Guide](QUICKSTART.md)
   - [Deployment Guide](DEPLOYMENT.md)
   - [Contributing Guidelines](CONTRIBUTING.md)
   ```

5. Click **"Publish release"**

## Step 8: Set Up GitHub Pages (Optional)

If you want to create a documentation website:

1. Create a `docs` branch
2. Go to Settings → Pages
3. Select `docs` branch as source
4. Your docs will be available at: `https://YOUR_USERNAME.github.io/eclipse-brand-analyzer`

## Step 9: Add README Badges

Update your README.md with dynamic badges:

```markdown
![GitHub stars](https://img.shields.io/github/stars/YOUR_USERNAME/eclipse-brand-analyzer)
![GitHub forks](https://img.shields.io/github/forks/YOUR_USERNAME/eclipse-brand-analyzer)
![GitHub issues](https://img.shields.io/github/issues/YOUR_USERNAME/eclipse-brand-analyzer)
![GitHub license](https://img.shields.io/github/license/YOUR_USERNAME/eclipse-brand-analyzer)
![GitHub release](https://img.shields.io/github/v/release/YOUR_USERNAME/eclipse-brand-analyzer)
```

## Step 10: Invite Collaborators (Optional)

If you want others to contribute:

1. Go to Settings → Collaborators
2. Click **"Add people"**
3. Enter their GitHub username or email
4. Select permission level (Write, Maintain, or Admin)

## Common Git Commands

### Daily Workflow

```bash
# Check status
git status

# Add changes
git add .

# Commit changes
git commit -m "Description of changes"

# Push to GitHub
git push origin main
```

### Working with Branches

```bash
# Create new branch
git checkout -b feature/new-feature

# Switch branches
git checkout main

# Merge branch
git merge feature/new-feature

# Delete branch
git branch -d feature/new-feature
```

### Updating from Remote

```bash
# Fetch latest changes
git fetch origin

# Pull and merge
git pull origin main
```

## Protecting Your Secrets

### What NOT to Commit

Never commit these files (already in .gitignore):
- `.env` - Contains your actual secrets
- `node_modules/` - Dependencies
- `.next/` - Build output
- `*.db` - Database files
- `*.log` - Log files

### Double-Check Before Pushing

```bash
# View what will be committed
git status

# View file contents
git diff

# Remove accidentally staged file
git reset HEAD .env
```

## Cloning Your Repository

Others (or you on another computer) can clone with:

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/eclipse-brand-analyzer.git
cd eclipse-brand-analyzer

# Install and setup
./setup.sh

# Start development
npm run dev
```

## Repository Structure

After pushing, your GitHub repo will look like:

```
eclipse-brand-analyzer/
├── .github/                 # GitHub-specific files (optional)
│   ├── ISSUE_TEMPLATE/      # Issue templates
│   └── PULL_REQUEST_TEMPLATE.md
├── app/                     # Application code
├── components/              # React components
├── lib/                     # Business logic
├── prisma/                  # Database schema
├── types/                   # TypeScript types
├── .env.example             # Environment template
├── .gitignore               # Git ignore rules
├── CONTRIBUTING.md          # Contribution guide
├── DEPLOYMENT.md            # Deployment guide
├── INSTALLATION_SUMMARY.md  # Installation overview
├── LICENSE                  # MIT License
├── QUICKSTART.md            # Quick start guide
├── README.md                # Main documentation
├── package.json             # Dependencies
├── setup.sh                 # Setup script
└── tsconfig.json            # TypeScript config
```

## Customization

Before pushing, customize these files:

### README.md
- Replace `YOUR_USERNAME` with your GitHub username
- Update repository URL
- Add your contact email
- Add deployment URL if available

### package.json
- Update `author` field
- Update `repository.url` field
- Add your name/company

### LICENSE
- Update copyright year
- Update copyright holder name

### CONTRIBUTING.md
- Update contact email
- Update security email

## Troubleshooting

### Push Rejected

```bash
# If remote has changes you don't have
git pull origin main --rebase
git push origin main
```

### Wrong Remote URL

```bash
# Remove wrong remote
git remote remove origin

# Add correct remote
git remote add origin https://github.com/YOUR_USERNAME/eclipse-brand-analyzer.git
```

### Accidentally Committed Secrets

```bash
# Remove file from git history (CAREFUL!)
git rm --cached .env
git commit -m "Remove .env from repository"
git push origin main

# Then regenerate all secrets in .env
```

**IMPORTANT:** If you accidentally pushed secrets, regenerate them immediately!

## Next Steps After GitHub Setup

1. ✅ Share your repository with the team
2. ✅ Set up CI/CD (GitHub Actions)
3. ✅ Enable Dependabot for security updates
4. ✅ Add issue templates
5. ✅ Create project boards for task tracking
6. ✅ Set up branch protection rules
7. ✅ Deploy to production (Vercel, Railway, etc.)

## Questions?

- **GitHub Docs:** [docs.github.com](https://docs.github.com)
- **Git Guide:** [git-scm.com/doc](https://git-scm.com/doc)
- **This Project:** See [README.md](README.md)

---

**Congratulations! Your Eclipse Brand Analyzer is now on GitHub! 🎉**

Share your repository:
```
https://github.com/YOUR_USERNAME/eclipse-brand-analyzer
```
