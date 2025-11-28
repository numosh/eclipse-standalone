#!/bin/bash

# =============================================================================
# Eclipse Brand Analyzer - Setup Script
# =============================================================================
# This script automates the initial setup process for Eclipse Brand Analyzer
# Run this after cloning the repository for the first time
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Main setup process
main() {
    print_header "Eclipse Brand Analyzer - Setup"

    # Check Node.js
    print_info "Checking prerequisites..."
    if ! command_exists node; then
        print_error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org"
        exit 1
    fi

    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ is required. Current version: $(node -v)"
        exit 1
    fi
    print_success "Node.js $(node -v) detected"

    # Check npm
    if ! command_exists npm; then
        print_error "npm is not installed"
        exit 1
    fi
    print_success "npm $(npm -v) detected"

    # Check for .env file
    print_info "Checking environment configuration..."
    if [ ! -f ".env" ]; then
        print_warning ".env file not found"
        if [ -f ".env.example" ]; then
            echo -ne "Would you like to create .env from .env.example? (y/n): "
            read -r response
            if [[ "$response" =~ ^[Yy]$ ]]; then
                cp .env.example .env
                print_success ".env file created from template"
                print_warning "IMPORTANT: Edit .env file with your actual credentials before continuing!"
                echo -ne "Press Enter after you've updated .env file..."
                read -r
            else
                print_error "Setup cannot continue without .env file"
                exit 1
            fi
        else
            print_error ".env.example not found. Cannot proceed."
            exit 1
        fi
    else
        print_success ".env file exists"
    fi

    # Validate critical environment variables
    print_info "Validating environment variables..."
    source .env

    MISSING_VARS=()

    if [ -z "$DATABASE_URL" ] || [ "$DATABASE_URL" = "postgresql://postgres:password@localhost:5432/eclipse_db" ]; then
        MISSING_VARS+=("DATABASE_URL")
    fi

    if [ -z "$NEXTAUTH_SECRET" ] || [ "$NEXTAUTH_SECRET" = "your-secret-key-here-replace-with-generated-secret" ]; then
        MISSING_VARS+=("NEXTAUTH_SECRET")
    fi

    if [ -z "$INTERNAL_API_TOKEN" ] || [ "$INTERNAL_API_TOKEN" = "your-internal-token-here-replace-with-generated-token" ]; then
        MISSING_VARS+=("INTERNAL_API_TOKEN")
    fi

    if [ ${#MISSING_VARS[@]} -gt 0 ]; then
        print_warning "The following environment variables need to be configured:"
        for var in "${MISSING_VARS[@]}"; do
            echo "  - $var"
        done
        print_info "Generating secrets..."

        if [[ " ${MISSING_VARS[@]} " =~ " NEXTAUTH_SECRET " ]]; then
            SECRET=$(openssl rand -base64 32)
            print_success "Generated NEXTAUTH_SECRET: $SECRET"
            sed -i.bak "s|NEXTAUTH_SECRET=\".*\"|NEXTAUTH_SECRET=\"$SECRET\"|" .env
        fi

        if [[ " ${MISSING_VARS[@]} " =~ " INTERNAL_API_TOKEN " ]]; then
            TOKEN=$(openssl rand -hex 32)
            print_success "Generated INTERNAL_API_TOKEN: $TOKEN"
            sed -i.bak "s|INTERNAL_API_TOKEN=\".*\"|INTERNAL_API_TOKEN=\"$TOKEN\"|" .env
        fi

        rm -f .env.bak
        print_success "Secrets have been generated and added to .env"
    else
        print_success "All critical environment variables are configured"
    fi

    # Install dependencies
    print_header "Installing Dependencies"
    print_info "Running npm install..."
    npm install
    print_success "Dependencies installed"

    # Check PostgreSQL connection
    print_header "Database Setup"
    print_info "Checking database connection..."

    if command_exists psql; then
        print_success "PostgreSQL client detected"
    else
        print_warning "PostgreSQL client (psql) not found. Make sure PostgreSQL is installed."
    fi

    # Run Prisma setup
    print_info "Setting up database schema..."

    # Generate Prisma client
    print_info "Generating Prisma client..."
    npx prisma generate
    print_success "Prisma client generated"

    # Run migrations
    print_info "Running database migrations..."
    if npx prisma migrate deploy 2>/dev/null; then
        print_success "Database migrations completed"
    else
        print_warning "Migration failed. Trying alternative approach..."
        if npx prisma db push; then
            print_success "Database schema pushed successfully"
        else
            print_error "Database setup failed. Please check your DATABASE_URL and ensure PostgreSQL is running"
            print_info "You can run 'npm run db:setup' manually after fixing the database connection"
        fi
    fi

    # Check for Playwright browsers
    print_header "Browser Setup (Optional)"
    print_info "Checking Playwright browsers..."

    if npx playwright --version >/dev/null 2>&1; then
        echo -ne "Would you like to install Playwright browsers for web scraping? (y/n): "
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            npx playwright install chromium
            print_success "Playwright browsers installed"
        else
            print_warning "Skipping browser installation. Web scraping may not work."
        fi
    fi

    # Summary
    print_header "Setup Complete!"
    print_success "Eclipse Brand Analyzer is ready to use!"

    echo -e "\n${GREEN}Next steps:${NC}"
    echo "1. Review your .env file and ensure all API keys are set"
    echo "2. Start the development server: ${BLUE}npm run dev${NC}"
    echo "3. Open your browser: ${BLUE}http://localhost:3000${NC}"
    echo "4. Login with default credentials: ${YELLOW}admin / admin123${NC}"
    echo "5. ${RED}IMPORTANT: Change the default password!${NC}"

    echo -e "\n${BLUE}Optional steps:${NC}"
    echo "- Install Ollama for AI insights: https://ollama.ai"
    echo "- Get TMS API key: https://tms-api.com/dashboard"
    echo "- Open Prisma Studio to manage data: ${BLUE}npm run db:studio${NC}"

    echo -e "\n${GREEN}Happy analyzing! 🚀${NC}\n"
}

# Run main function
main
