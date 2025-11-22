# Vercel Deployment Guide

## Database URL Configuration Issue

If your Vercel deployment is not picking up the DATABASE_URL, follow these steps:

### 1. Set Environment Variables in Vercel Dashboard

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add these variables:

```
DATABASE_URL = your_postgresql_connection_string
GROQ_API_KEY = your_groq_api_key
NODE_ENV = production
```

**Important**: Make sure to set these for **Production**, **Preview**, and **Development** environments.

### 2. Verify Environment Variables

After setting the variables, redeploy your project:

```bash
vercel --prod
```

### 3. Test Database Connection

After deployment, test the connection:

```
https://your-app.vercel.app/api/health
```

This should return:
```json
{
  "status": "healthy",
  "database": "connected",
  "responseTime": "XXXms",
  "timestamp": "..."
}
```

### 4. Common Issues & Solutions

#### Issue: "DATABASE_URL not configured"

**Solution**: 
- Ensure DATABASE_URL is set in Vercel environment variables
- Redeploy after adding the variable
- Check the variable name is exactly `DATABASE_URL` (case-sensitive)

#### Issue: SSL Connection Errors

**Solution**: 
- For Neon/Supabase, ensure your connection string includes `?sslmode=require`
- Example: `postgresql://user:pass@host/db?sslmode=require`

#### Issue: Connection Timeout

**Solution**:
- Verify your database allows connections from Vercel's IP ranges
- Check if your database is in sleep mode (common with free tiers)

### 5. Database Setup Commands

After setting DATABASE_URL in Vercel:

```bash
# Pull environment variables locally
vercel env pull .env.local

# Push database schema
pnpm db:push

# Initialize database with default user
pnpm db:init
```

### 6. Debugging Steps

1. **Check health endpoint**: Visit `/api/health` to see detailed error info
2. **Check Vercel logs**: Go to Vercel Dashboard → Functions → View logs
3. **Verify connection string**: Ensure it's properly formatted for PostgreSQL

### 7. Environment Variable Format

Your DATABASE_URL should look like:
```
postgresql://username:password@hostname:port/database?sslmode=require
```

For Neon:
```
postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/dbname?sslmode=require
```

For Supabase:
```
postgresql://postgres:password@db.xxx.supabase.co:5432/postgres?sslmode=require
```

### 8. Redeploy After Changes

Always redeploy after changing environment variables:

```bash
vercel --prod
```

Or trigger a redeploy from the Vercel dashboard.