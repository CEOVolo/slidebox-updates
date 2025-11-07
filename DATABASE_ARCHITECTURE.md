# 🗄️ SlideDeck 2.0 Database Architecture

## 📋 Overview

**TWO** separate databases on **ONE** Hetzner server with complete isolation between development and production environments.

- **🛠️ Development**: `slidebox_dev` - for local development
- **🚀 Production**: `slidebox_prod` - for production

## 🎯 Connection Schema

```
🖥️ Your Computer (Development)
└── 📡 135.181.148.104:5432
    ├── 🛠️ slidebox_dev (Development Database)
    └── 🚀 slidebox_prod (Production Database)

🌐 Hetzner Server (Production)
└── 📡 localhost:5432  
    ├── 🛠️ slidebox_dev (Development Database)
    └── 🚀 slidebox_prod (Production Database)
```

## 🔄 Connection Details

### 🛠️ Development Database
```
Host: 135.181.148.104:5432
Database: slidebox_dev
User: slidebox_dev_user
Password: andersen_win
```

### 🚀 Production Database
```
Host: 135.181.148.104:5432
Database: slidebox_prod
User: slidebox_ad
Password: andersen_win
```

## 🚀 Complete Setup Guide

### Step 1: Create Development Database on Server

**Execute on Hetzner server:**

```bash
# SSH to server
ssh root@135.181.148.104

# Find PostgreSQL container
POSTGRES_CONTAINER=$(docker ps --filter "name=postgres" --format "{{.ID}}" | head -1)

# Create development user and database
docker exec -i $POSTGRES_CONTAINER psql -U slidebox_ad -d postgres << 'EOSQL'
-- Create user for development
CREATE USER slidebox_dev_user WITH PASSWORD 'andersen_win';

-- Create development database
CREATE DATABASE slidebox_dev OWNER slidebox_dev_user;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE slidebox_dev TO slidebox_dev_user;

-- Grant database creation rights (required for Prisma shadow database)
ALTER USER slidebox_dev_user CREATEDB;
EOSQL

# Grant additional permissions for public schema
docker exec -i $POSTGRES_CONTAINER psql -U slidebox_dev_user -d slidebox_dev << 'EOSQL'
-- Public schema permissions
GRANT ALL ON SCHEMA public TO slidebox_dev_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO slidebox_dev_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO slidebox_dev_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO slidebox_dev_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO slidebox_dev_user;
EOSQL

# Verify connection
docker exec $POSTGRES_CONTAINER psql -U slidebox_dev_user -d slidebox_dev -c "SELECT version();"
```

### Step 2: Configure Network Access

**On Hetzner server:**

```bash
# Open port 5432 in firewall
ufw allow 5432

# Configure PostgreSQL for external connections
POSTGRES_CONTAINER=$(docker ps --filter "name=postgres" --format "{{.ID}}" | head -1)

# Enable external connections
docker exec $POSTGRES_CONTAINER sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" /var/lib/postgresql/data/postgresql.conf

# Allow connections from any IP
docker exec $POSTGRES_CONTAINER sh -c "echo 'host all all 0.0.0.0/0 md5' >> /var/lib/postgresql/data/pg_hba.conf"

# Add port mapping to docker-compose.prod.yml
# Edit the postgres service to include:
# ports:
#   - "5432:5432"

# Restart PostgreSQL container
docker restart $POSTGRES_CONTAINER

# Verify port is open
netstat -tulpn | grep :5432
```

### Step 3: Local Development Setup

**On your development machine:**

Create `.env.local` file:

```env
# DEVELOPMENT ENVIRONMENT - Remote dev database on Hetzner
NODE_ENV=development

# PostgreSQL Database (Remote dev database on Hetzner)
DATABASE_URL="postgresql://slidebox_dev_user:andersen_win@135.181.148.104:5432/slidebox_dev?schema=public"

# Figma API
FIGMA_ACCESS_TOKEN="your_figma_token_here"

# NextAuth settings (development)
NEXTAUTH_SECRET="dev_secret_bonobo_1345"
NEXTAUTH_URL="http://localhost:3000"

# Debug mode (enabled for development)
DEBUG=true

# Logging
LOG_LEVEL=debug
```

### Step 4: Initialize Database Schema

**On your development machine:**

```bash
# Install dependencies
npm install

# Generate Prisma Client
npx prisma generate

# Apply schema to development database
npx prisma db push

# Verify tables were created
npx prisma db pull

# Start development server
npm run dev
```

## 🛡️ Security & Isolation

### ✅ Architecture Benefits:

1. **Same PostgreSQL** in dev and prod environments
2. **Complete data isolation** between environments
3. **Remote access** - works from anywhere
4. **Unified management** - both databases on one server
5. **Production-like development** - same database engine

### 🔒 Security Rules:

1. **DIFFERENT users** for dev and prod
2. **DIFFERENT passwords** for each environment
3. **NEVER** mix up DATABASE_URL
4. **ALWAYS** verify which database is active
5. **SEPARATE** Prisma migrations for each environment

## 🧪 Connection Testing

### Test Development Database:
```bash
# Test connection
npx prisma db pull

# View data in browser
npx prisma studio

# Direct PostgreSQL connection
psql "postgresql://slidebox_dev_user:andersen_win@135.181.148.104:5432/slidebox_dev"
```

### Test Production Database (READ ONLY):
```bash
# ONLY FOR VIEWING!
DATABASE_URL="postgresql://slidebox_ad:andersen_win@135.181.148.104:5432/slidebox_prod" npx prisma studio
```

## 🔄 Environment Switching

### Quick Environment Switch:

```bash
# Development database (default in .env.local)
npm run dev

# Production database (temporary for viewing)
$env:DATABASE_URL="postgresql://slidebox_ad:andersen_win@135.181.148.104:5432/slidebox_prod"
npx prisma studio
```

## 📊 Database Monitoring

### Useful Commands:

```bash
# Connection status on server
docker exec [postgres_container] psql -U slidebox_ad -d postgres -c "SELECT datname, usename, application_name, client_addr FROM pg_stat_activity WHERE datname IN ('slidebox_dev', 'slidebox_prod');"

# Database sizes
docker exec [postgres_container] psql -U slidebox_ad -d postgres -c "SELECT datname, pg_size_pretty(pg_database_size(datname)) as size FROM pg_database WHERE datname IN ('slidebox_dev', 'slidebox_prod');"

# List all databases
docker exec [postgres_container] psql -U slidebox_ad -d postgres -c "\l"

# List all users
docker exec [postgres_container] psql -U slidebox_ad -d postgres -c "\du"
```

## 🚨 Troubleshooting

### Issue: "Can't reach database server"
```bash
# Check port on server
netstat -tulpn | grep :5432

# Check firewall
ufw status

# Open port if needed
ufw allow 5432

# Restart PostgreSQL container
docker restart [postgres_container_id]
```

### Issue: "Authentication failed"
```bash
# Check users in database
docker exec [postgres_container] psql -U slidebox_ad -d postgres -c "\du"

# Recreate user if needed
docker exec [postgres_container] psql -U slidebox_ad -d postgres -c "DROP USER IF EXISTS slidebox_dev_user; CREATE USER slidebox_dev_user WITH PASSWORD 'andersen_win' CREATEDB;"
```

### Issue: "Type 'datetime' does not exist"
```bash
# Use db push instead of migrations (SQLite → PostgreSQL compatibility)
npx prisma db push

# Instead of:
# npx prisma migrate dev
```

### Issue: "Permission denied to create database"
```bash
# Grant database creation rights
docker exec [postgres_container] psql -U slidebox_ad -d postgres -c "ALTER USER slidebox_dev_user CREATEDB;"
```

## 📈 Backup Strategy

### Automated Backups:

```bash
# Backup development database
docker exec [postgres_container] pg_dump -U slidebox_dev_user slidebox_dev > backup_dev_$(date +%Y%m%d).sql

# Backup production database  
docker exec [postgres_container] pg_dump -U slidebox_ad slidebox_prod > backup_prod_$(date +%Y%m%d).sql

# Restore development database (if needed)
docker exec -i [postgres_container] psql -U slidebox_dev_user slidebox_dev < backup_dev_20240101.sql
```

## 🔧 Development Workflow

### Daily Development:

1. **Start development**: `npm run dev`
2. **View database**: `npx prisma studio`
3. **Schema changes**: `npx prisma db push`
4. **Generate types**: `npx prisma generate`

### Schema Updates:

1. **Modify** `prisma/schema.prisma`
2. **Apply changes**: `npx prisma db push`
3. **Regenerate client**: `npx prisma generate`
4. **Test locally**
5. **Deploy to production** when ready

## 📋 File Structure

```
SlideDeck 2.0/
├── .env.local                 # Development environment variables
├── .env.example              # Environment template for production
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── migrations/           # Database migrations (legacy)
├── scripts/
│   ├── dev-with-remote-db.ps1 # Setup script for Windows
│   └── dev-status.ps1        # Status check script
└── README.Database.md        # This documentation
```

## 🎯 Results

**Achieved professional database architecture:**

- ✅ **Development/Production isolation**
- ✅ **Same PostgreSQL engine** in both environments
- ✅ **Remote development database** accessible from anywhere
- ✅ **Production-ready setup** with proper security
- ✅ **Easy environment switching**
- ✅ **Complete data separation**

---

**📞 Support**: If you encounter any issues, check the troubleshooting section and ensure you're using the correct environment variables for your target environment. 