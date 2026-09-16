# Vercel Deployment Guide

This guide will help you deploy the AI-Oriented Class Management System to Vercel.

## Prerequisites

- Vercel account (free tier works)
- GitHub account (for automatic deployments)
- A production MySQL database (PlanetScale, Neon, or similar cloud database)

## Step 1: Push to GitHub

1. Initialize git repository (if not already done):
```bash
git init
git add .
git commit -m "Initial commit"
```

2. Create a new repository on GitHub
3. Push your code:
```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

## Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Node.js
   - **Root Directory**: `./`
   - **Build Command**: `npm install`
   - **Output Directory**: (leave empty)
   - **Install Command**: `npm install`

## Step 3: Set Environment Variables

In Vercel project settings, add these environment variables:

### Required Variables:
- `NODE_ENV`: `production`
- `PORT`: `3000`
- `JWT_SECRET`: (generate a strong random string - use: `openssl rand -base64 32`)

### Database Variables (Choose one option):

#### Option A: PlanetScale (Recommended for MySQL)
- `DATABASE_URL`: Your PlanetScale database connection string
- Example: `mysql://xxx:pscale_pw_xxx@aws.connect.psdb.cloud/smart_class_db?sslaccept=strict`

#### Option B: Traditional MySQL
- `DB_HOST`: Your database host
- `DB_USER`: Your database username
- `DB_PASSWORD`: Your database password
- `DB_NAME`: `smart_class_db`
- `DB_PORT`: `3306`

## Step 4: Set Up Production Database

### Option 1: PlanetScale (Free MySQL Database)

1. Go to [planetscale.com](https://planetscale.com) and sign up
2. Create a new database named `smart_class_db`
3. Create a new branch and get your connection string
4. Run the database schema:
```bash
mysql -h xxx.aws.connect.psdb.cloud -u xxx -p smart_class_db < database.sql
```

### Option 2: Other Cloud MySQL Providers

- **Neon**: PostgreSQL alternative (requires code changes)
- **Railway**: MySQL hosting
- **Aiven**: Managed MySQL

## Step 5: Deploy

1. Click "Deploy" in Vercel
2. Wait for deployment to complete
3. Your app will be available at `https://your-project.vercel.app`

## Step 6: Post-Deployment Setup

1. **Create Admin User**: You'll need to create an admin user via the API or database
2. **Test Authentication**: Verify login/registration works
3. **Check Database**: Ensure all tables are created
4. **Test File Uploads**: Configure storage for file uploads (Vercel serverless functions have limitations)

## Important Notes

### File Uploads
Vercel serverless functions have limitations for file uploads. Consider:
- Using Vercel Blob Storage for file uploads
- Or using a service like AWS S3, Cloudinary, or similar

### Database Connection
- Use connection pooling for better performance
- PlanetScale is recommended for serverless environments
- Ensure SSL is enabled for database connections

### Environment Variables
- Never commit `.env` file to git
- Use Vercel's environment variable management
- Different variables for development/staging/production

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` or individual DB variables are correct
- Ensure SSL is enabled in production
- Check database firewall settings

### Build Failures
- Check that `package.json` has correct scripts
- Verify all dependencies are listed
- Check Vercel build logs for specific errors

### Runtime Errors
- Check Vercel function logs
- Verify environment variables are set
- Ensure database schema is created

## Continuous Deployment

After initial setup:
- Push to GitHub main branch → Auto-deploys to production
- Create other branches → Preview deployments
- Use Vercel CLI for local testing: `vercel dev`

## Cost Considerations

- **Vercel**: Free tier includes:
  - 100GB bandwidth
  - Unlimited deployments
  - Serverless functions (100GB-hrs execution time)
  
- **Database**: PlanetScale free tier includes:
  - 5GB storage
  - 1 billion rows read
  - 10 million rows written per month
