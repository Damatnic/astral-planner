# 🚀 Astral Planner - Production Setup Guide

## Overview

This guide provides step-by-step instructions for setting up the Astral Planner application in a production environment. The application is now fully production-ready with enterprise-grade security, performance optimizations, and comprehensive error handling.

## ✅ Production Readiness Checklist

### Authentication & Security
- ✅ Stack Auth integration implemented
- ✅ Production-ready middleware with proper authentication
- ✅ Comprehensive security headers
- ✅ Rate limiting and CORS protection
- ✅ Input validation and sanitization
- ✅ Proper error handling and logging

### Database & API
- ✅ Complete database schema with relations
- ✅ Real database operations (no mock data)
- ✅ Connection pooling and optimization
- ✅ Comprehensive API endpoints
- ✅ Proper transaction handling

### Performance & Monitoring
- ✅ Optimized webpack configuration
- ✅ Bundle splitting and tree shaking
- ✅ Comprehensive logging with Winston
- ✅ Error monitoring with Sentry
- ✅ Performance monitoring ready

## 🏗️ Infrastructure Requirements

### Minimum Requirements
- **Node.js**: 18.0.0 or higher
- **PostgreSQL**: 13+ (with SSL support)
- **Memory**: 512MB RAM minimum, 2GB recommended
- **CPU**: 1 core minimum, 2+ cores recommended

### Recommended Services
- **Database**: Neon, Supabase, or AWS RDS PostgreSQL
- **Authentication**: Stack Auth (configured)
- **Hosting**: Vercel, Railway, or AWS
- **Email**: Resend (recommended) or SendGrid
- **Monitoring**: Sentry for error tracking
- **Cache**: Redis (optional but recommended)

## 🔧 Environment Setup

### 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd astral-planner
npm install
```

### 2. Environment Configuration

Run the automated setup script:

```bash
node setup-environment.js
```

Or manually create `.env.local` with the following variables:

```bash
# Application Environment
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Stack Auth (Required)
STACK_PROJECT_ID=your-stack-project-id
STACK_SECRET_SERVER_KEY=your-stack-secret-server-key
STACK_PUBLISHABLE_CLIENT_KEY=your-stack-publishable-client-key

# Database (Required)
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
DIRECT_DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require

# Security Keys (Generate secure random values)
SESSION_SECRET=your-super-secure-session-secret
JWT_SECRET=your-super-secure-jwt-secret

# Feature Flags
NEXT_PUBLIC_FEATURE_AI_PARSING=true
NEXT_PUBLIC_FEATURE_CALENDAR_INTEGRATION=true
NEXT_PUBLIC_FEATURE_REALTIME_COLLABORATION=true
NEXT_PUBLIC_FEATURE_ANALYTICS=true
NEXT_PUBLIC_FEATURE_TEMPLATES=true
```

### 3. Database Setup

```bash
# Run database migrations
npm run db:migrate

# Seed initial data
npm run db:seed
```

### 4. Build and Test

```bash
# Type check
npm run type-check

# Build the application
npm run build

# Test the production build
npm start
```

## 🌐 Deployment

### Vercel (Recommended)

1. **Connect Repository**: Link your GitHub repository to Vercel
2. **Environment Variables**: Add all environment variables in Vercel dashboard
3. **Build Settings**: 
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`
4. **Deploy**: Vercel will automatically deploy on push to main branch

### Railway

1. **Create Project**: Connect your GitHub repository
2. **Environment Variables**: Set all required environment variables
3. **Deploy**: Railway will automatically build and deploy

### Docker (Self-hosted)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 📊 Monitoring & Observability

### Error Monitoring (Sentry)

Add to your environment variables:

```bash
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
SENTRY_AUTH_TOKEN=your-auth-token
```

### Performance Monitoring

```bash
# Enable Vercel Analytics
NEXT_PUBLIC_VERCEL_ANALYTICS=1
NEXT_PUBLIC_VERCEL_SPEED_INSIGHTS=1
```

### Logging

The application uses structured logging with Winston:
- **Production**: JSON format, info level and above
- **Development**: Pretty format, debug level and above

Logs include:
- Request/response times
- Database operations
- Authentication events
- Error stack traces
- Performance metrics

## 🔒 Security Considerations

### Environment Security
- ✅ Never commit `.env` files to version control
- ✅ Use strong, unique secrets for production
- ✅ Regularly rotate API keys and secrets
- ✅ Use SSL/TLS for all database connections

### Application Security
- ✅ Authentication required for all protected routes
- ✅ Input validation and sanitization
- ✅ SQL injection protection
- ✅ XSS protection headers
- ✅ CSRF protection
- ✅ Rate limiting implemented

### Database Security
- ✅ Connection pooling with limits
- ✅ SSL-only connections in production
- ✅ Prepared statements for all queries
- ✅ Regular backups configured

## 📈 Performance Optimization

### Build Optimizations
- ✅ Bundle splitting by vendor and feature
- ✅ Tree shaking enabled
- ✅ Code compression (gzip)
- ✅ Static asset caching
- ✅ Image optimization

### Runtime Optimizations
- ✅ Database connection pooling
- ✅ Query optimization with indexes
- ✅ Response caching headers
- ✅ Lazy loading for components
- ✅ Optimistic UI updates

### Recommended CDN Setup
- Use a CDN for static assets
- Configure proper cache headers
- Enable compression at CDN level

## 🔄 Maintenance & Updates

### Regular Tasks
1. **Security Updates**: Keep dependencies updated
2. **Database Maintenance**: Regular backups and optimization
3. **Log Analysis**: Monitor error patterns and performance
4. **Performance Review**: Regular performance audits

### Monitoring Alerts
Set up alerts for:
- High error rates (>5%)
- Slow response times (>2s)
- Database connection issues
- High memory usage (>80%)

### Backup Strategy
- **Database**: Daily automated backups with 30-day retention
- **File Storage**: Regular backups of uploaded content
- **Code**: Version control with tagged releases

## 🆘 Troubleshooting

### Common Issues

#### Authentication Issues
- Check Stack Auth configuration
- Verify environment variables are set
- Check middleware logs for auth failures

#### Database Issues
- Verify connection string format
- Check SSL requirements
- Monitor connection pool usage

#### Performance Issues
- Check bundle sizes with `npm run analyze`
- Monitor database query performance
- Review server-side rendering times

### Debug Mode
To enable debug logging in production (temporarily):

```bash
LOG_LEVEL=debug
```

### Health Checks
The application provides health check endpoints:
- `/api/health` - Overall application health
- `/api/health/db` - Database connection status
- `/api/health/simple` - Basic ping check

## 📞 Support

For production support:
1. Check the troubleshooting section above
2. Review application logs for errors
3. Use health check endpoints for diagnostics
4. Check Sentry dashboard for error reports

## 🚀 Post-Deployment Checklist

- [ ] All environment variables configured
- [ ] Database migrations completed successfully
- [ ] Health checks returning 200 OK
- [ ] Authentication working properly
- [ ] Error monitoring active
- [ ] Performance monitoring active
- [ ] Backup strategy implemented
- [ ] SSL certificate valid
- [ ] CDN configured (if applicable)
- [ ] Monitoring alerts configured

Your Astral Planner application is now production-ready! 🎉