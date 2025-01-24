# Development Setup Guide

## Prerequisites

### Required Software
- Node.js (>= 18.17.0)
- npm (>= 9.0.0)
- Docker (>= 24.x)
- Git
- MongoDB (>= 6.x)
- Redis (>= 7.x)

### Development Tools
- VS Code (recommended)
- Postman/Insomnia
- MongoDB Compass
- Redis Commander

## Environment Setup

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/gaiathon25-hub.git
cd gaiathon25-hub
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env.development` file in the root directory:
```env
# App
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Database
MONGODB_URI=mongodb://localhost:27017/gaiathon25
MONGODB_DB=gaiathon25

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_redis_password

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
JWT_SECRET=your_jwt_secret

# OAuth Providers
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Email
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASSWORD=your_smtp_password
EMAIL_FROM=noreply@gaiathon25-hub.com

# Push Notifications
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_SUBJECT=mailto:admin@gaiathon25-hub.com

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
NEXT_PUBLIC_DATADOG_APP_ID=your_datadog_app_id
NEXT_PUBLIC_DATADOG_CLIENT_TOKEN=your_datadog_client_token
NEXT_PUBLIC_DATADOG_SITE=datadoghq.com
```

### 4. Start Development Services
Using Docker Compose:
```bash
docker-compose -f docker/docker-compose.override.yml up -d
```

This will start:
- MongoDB
- Redis
- MongoDB Express
- Redis Commander

### 5. Database Setup
```bash
# Initialize database
npm run db:init

# Run migrations
npm run db:migrate

# Seed test data (optional)
npm run db:seed
```

### 6. Start Development Server
```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- API: http://localhost:3000/api
- MongoDB Express: http://localhost:8081
- Redis Commander: http://localhost:8082

## Development Workflow

### Code Style
The project uses ESLint and Prettier for code formatting:
```bash
# Check code style
npm run lint

# Fix code style issues
npm run lint:fix

# Format code
npm run format
```

### Testing
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Type Checking
```bash
# Check types
npm run type-check

# Watch type changes
npm run type-check:watch
```

### Building
```bash
# Create production build
npm run build

# Start production server
npm start
```

## Development Tools

### VS Code Extensions
Recommended extensions:
- ESLint
- Prettier
- TypeScript + JavaScript
- Tailwind CSS IntelliSense
- MongoDB for VS Code
- Docker
- Jest Runner
- GitLens

### VS Code Settings
Create `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ]
}
```

## Git Workflow

### Branches
- `main`: Production branch
- `develop`: Development branch
- `feature/*`: Feature branches
- `bugfix/*`: Bug fix branches
- `release/*`: Release branches
- `hotfix/*`: Hotfix branches

### Commit Messages
Follow conventional commits:
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation
- style: Code style changes
- refactor: Code refactoring
- test: Test changes
- chore: Build/config changes

### Pull Requests
1. Create feature branch
2. Make changes
3. Run tests and linting
4. Create pull request
5. Wait for review
6. Merge after approval

## Troubleshooting

### Common Issues

#### MongoDB Connection
```bash
# Check MongoDB status
docker-compose ps
docker logs gaiathon25_mongodb_1

# Connect using MongoDB Compass
mongodb://localhost:27017/gaiathon25
```

#### Redis Connection
```bash
# Check Redis status
docker-compose ps
docker logs gaiathon25_redis_1

# Connect using Redis CLI
redis-cli -h localhost -p 6379
```

#### Next.js Issues
```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

### Getting Help
- Check documentation
- Search issues
- Ask in team chat
- Contact maintainers

## Additional Resources
- [Project Documentation](../README.md)
- [API Documentation](../api/README.md)
- [Testing Guide](../testing/README.md)
- [Contributing Guide](../contributing/guide.md) 