# Contributing to Eclipse Brand Analyzer

Thank you for your interest in contributing to Eclipse Brand Analyzer! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Submitting Changes](#submitting-changes)
- [Reporting Issues](#reporting-issues)
- [Feature Requests](#feature-requests)

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

### Our Standards

- Be respectful and inclusive
- Accept constructive criticism gracefully
- Focus on what's best for the project
- Show empathy towards other contributors

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Git
- Text editor (VS Code recommended)

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/eclipse-brand-analyzer.git
   cd eclipse-brand-analyzer
   ```

3. Add the upstream repository:
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/eclipse-brand-analyzer.git
   ```

### Initial Setup

1. Run the setup script:
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

2. Or manually:
   ```bash
   npm install
   cp .env.example .env
   # Edit .env with your settings
   npm run db:setup
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Development Workflow

### Creating a Feature Branch

Always create a new branch for your work:

```bash
git checkout -b feature/your-feature-name
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Adding tests
- `chore/` - Maintenance tasks

### Making Changes

1. Write your code following our coding standards
2. Test your changes thoroughly
3. Update documentation if needed
4. Add tests for new features

### Running Tests

```bash
# Run linting
npm run lint

# Run type checking
npx tsc --noEmit

# Test database migrations
npm run db:reset
```

### Keeping Your Fork Updated

```bash
git fetch upstream
git checkout main
git merge upstream/main
git push origin main
```

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Prefer interfaces over types for object definitions
- Use meaningful variable and function names
- Add JSDoc comments for complex functions

Example:
```typescript
/**
 * Analyzes brand sentiment from social media posts
 * @param posts - Array of social media posts
 * @param brandName - Name of the brand to analyze
 * @returns Sentiment analysis results
 */
async function analyzeBrandSentiment(
  posts: Post[],
  brandName: string
): Promise<SentimentResult> {
  // Implementation
}
```

### React Components

- Use functional components with hooks
- Keep components small and focused
- Use TypeScript for props
- Extract reusable logic into custom hooks

Example:
```typescript
interface AnalysisCardProps {
  title: string;
  data: AnalysisData;
  onExport?: () => void;
}

export function AnalysisCard({ title, data, onExport }: AnalysisCardProps) {
  // Component implementation
}
```

### File Structure

- One component per file
- Group related files in directories
- Use index.ts for clean imports
- Keep API routes organized by feature

### Naming Conventions

- Components: PascalCase (e.g., `AnalysisCard.tsx`)
- Utilities: camelCase (e.g., `formatDate.ts`)
- Constants: UPPER_SNAKE_CASE (e.g., `MAX_RETRIES`)
- Database models: PascalCase (e.g., `AnalysisSession`)

### Code Style

We use ESLint and Prettier. Before committing:

```bash
npm run lint
```

### Git Commit Messages

Follow the Conventional Commits specification:

```
type(scope): subject

body (optional)

footer (optional)
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

Examples:
```
feat(analysis): add keyword clustering visualization

fix(api): handle null values in TMS API response

docs(readme): update installation instructions

refactor(database): optimize author profile queries
```

## Submitting Changes

### Pull Request Process

1. **Update your branch** with the latest main:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

3. **Create a Pull Request** on GitHub:
   - Use a clear, descriptive title
   - Reference any related issues
   - Describe what you changed and why
   - Add screenshots for UI changes
   - List any breaking changes

4. **PR Template**:
   ```markdown
   ## Description
   Brief description of the changes

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update

   ## Testing
   - [ ] Tested locally
   - [ ] All tests pass
   - [ ] Added new tests

   ## Screenshots (if applicable)
   [Add screenshots here]

   ## Related Issues
   Closes #123
   ```

5. **Code Review**:
   - Address review comments promptly
   - Make requested changes in new commits
   - Don't force-push during review
   - Request re-review when ready

6. **Merging**:
   - Maintainers will merge your PR
   - Squash commits may be used
   - Your contribution will be credited

### PR Checklist

Before submitting:

- [ ] Code follows the style guidelines
- [ ] Self-reviewed my own code
- [ ] Commented complex code sections
- [ ] Updated documentation
- [ ] No new warnings or errors
- [ ] Added tests for new features
- [ ] All tests pass locally
- [ ] Updated CHANGELOG.md (if applicable)

## Reporting Issues

### Bug Reports

When reporting bugs, include:

1. **Environment**:
   - OS and version
   - Node.js version
   - Browser (if applicable)

2. **Steps to Reproduce**:
   - Clear, numbered steps
   - Expected behavior
   - Actual behavior

3. **Additional Context**:
   - Error messages
   - Screenshots
   - Relevant logs
   - Configuration (sanitized)

Example:
```markdown
**Environment:**
- OS: macOS 14.0
- Node.js: 18.17.0
- Browser: Chrome 119

**Steps to Reproduce:**
1. Create new analysis
2. Add brand with Instagram handle
3. Click "Start Analysis"

**Expected:** Analysis starts successfully

**Actual:** Error: "Failed to fetch Instagram data"

**Error Message:**
```
TypeError: Cannot read property 'followers' of undefined
```

**Screenshots:**
[Attach screenshot]
```

### Security Issues

**DO NOT** open public issues for security vulnerabilities.

Instead, email security concerns to: security@yourcompany.com

## Feature Requests

We welcome feature requests! Please:

1. **Check existing issues** first to avoid duplicates
2. **Describe the feature** clearly
3. **Explain the use case** and benefits
4. **Suggest implementation** (if you have ideas)

Example:
```markdown
**Feature:** Export reports to Excel format

**Use Case:**
Users want to analyze data in Excel for custom reporting

**Benefits:**
- More export options
- Better data manipulation
- Familiar tool for users

**Suggested Implementation:**
- Add "Export to Excel" button
- Use xlsx library
- Include all tabs in separate sheets
```

## Development Tips

### Database Changes

When modifying the schema:

```bash
# Create migration
npx prisma migrate dev --name descriptive_name

# Test migration
npm run db:reset
```

### Testing API Endpoints

Use the built-in API testing:

```bash
curl -X POST http://localhost:3000/api/sessions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"title": "Test Analysis"}'
```

### Debugging

- Use browser DevTools for frontend
- Check server logs in terminal
- Use Prisma Studio for database: `npm run db:studio`
- Enable verbose logging in `.env`:
  ```
  LOG_LEVEL=debug
  DEBUG=true
  ```

### Performance

- Profile with React DevTools
- Monitor database queries
- Check bundle size: `npm run build`
- Use Lighthouse for audits

## Questions?

- Open a discussion on GitHub
- Ask in issue comments
- Email: support@yourcompany.com

## Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Credited in release notes
- Acknowledged in the project

Thank you for contributing to Eclipse Brand Analyzer!
