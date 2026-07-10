# Enterprise Learning Management System (LMS) Platform

A scalable, secure Learning Management System backend built with NestJS, TypeScript, MongoDB, and Redis. Optimized for single VPS deployment with enterprise-grade features including role-based access control, device session management, and manual payment processing.

## 🚀 Features

- **Role-Based Access Control (RBAC)**: Super Admin, Admin, Teacher, and Student roles
- **Device Session Management**: Anti-piracy protection with device fingerprinting (1 mobile + 1 desktop concurrent sessions)
- **Manual Payment Processing**: Support for bKash, Nagad, and Rocket mobile financial services
- **Course & Module Management**: Hierarchical content structure with video streaming and document uploads
- **Quiz Engine**: MCQ-based assessments with negative marking support
- **HLS Video Streaming**: Decoupled video delivery via CDN (external storage)
- **Redis Caching**: Performance optimization for frequently accessed data
- **JWT Authentication**: Secure token-based authentication with device tracking
- **Global Response Envelope**: Standardized API response format

## 📋 Prerequisites

- **Node.js**: v18+ (using Bun runtime)
- **Bun**: v1.3.8+
- **MongoDB**: v6.0+
- **Redis**: v7.0+
- **Git**: Latest version

## 🛠️ Installation

### Option 1: Docker (Recommended for Production)

**For VPS deployment with 6 cores, 8GB RAM:**

```bash
# Quick start
git clone <repository-url> lms-platform && cd lms-platform
make install  # Interactive setup with prompts

# Or manual
cp .env.docker .env
nano .env  # Edit credentials
make build && make up
```

**Includes:**

- 3x NestJS instances (load balanced)
- MongoDB + Redis
- Nginx reverse proxy
- Automatic health checks

See [DOCKER_README.md](DOCKER_README.md) for complete guide.

### Option 2: Local Development

1. **Clone the repository**

```bash
git clone <repository-url>
cd sonnet-guru-backend
```

2. **Install dependencies**

```bash
bun install
```

3. **Environment Setup**

```bash
cp .env.example .env
```

Edit `.env` file with your configuration:

```env
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1

MONGODB_URI=mongodb://localhost:27017/lms_platform
REDIS_HOST=localhost
REDIS_PORT=6379

JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRATION=7d
```

## 🏃 Running the Application

```bash
# Development mode
bun run start:dev

# Production mode
bun run start:prod

# Build
bun run build
```

The API will be available at: `http://localhost:3000/api/v1`

## 📁 Project Structure

```
src/
├── auth/               # Authentication module (JWT, device sessions)
│   ├── dto/
│   ├── guards/
│   └── strategies/
├── users/              # User management
│   └── schemas/
├── courses/            # Course management
│   ├── dto/
│   └── schemas/
├── modules/            # Course modules (lessons)
│   ├── dto/
│   └── schemas/
├── quizzes/            # Quiz engine
│   ├── dto/
│   └── schemas/
├── payments/           # Payment claims & enrollments
│   ├── dto/
│   └── schemas/
└── common/             # Shared utilities
    ├── decorators/
    ├── dto/
    ├── enums/
    ├── filters/
    ├── guards/
    └── interceptors/
```

## 🔐 API Endpoints

### Authentication

- `POST /auth/register` - Register new user
- `POST /auth/login` - Login with device fingerprint

### Users

- `GET /users` - List all users (Super Admin, Admin only)

### Courses

- `POST /courses` - Create course (Teacher, Admin, Super Admin)
- `GET /courses` - List all courses
- `GET /courses/:id` - Get course details

### Modules

- `POST /courses/:courseId/modules` - Create module
- `GET /courses/:courseId/modules` - List course modules
- `POST /modules/:moduleId/sheets` - Upload lecture document

### Quizzes

- `POST /quizzes` - Create quiz
- `POST /quizzes/:quizId/questions` - Add quiz question

### Payments

- `POST /payments/manual-claim` - Submit manual payment claim
- `PATCH /payments/claims/:claimId/verify` - Verify payment (Admin only)

## 🔒 Security Features

- JWT-based authentication
- Device fingerprinting for session management
- Role-based access control (RBAC)
- Request rate limiting with Throttler
- Password hashing with bcrypt
- Global exception handling
- Input validation with class-validator

## 🎯 Technology Stack

- **Runtime**: Bun
- **Framework**: NestJS 11
- **Language**: TypeScript 5
- **Database**: MongoDB with Mongoose ODM
- **Caching**: Redis (ioredis)
- **Authentication**: JWT (Passport)
- **Validation**: class-validator, class-transformer
- **Rate Limiting**: @nestjs/throttler

## 📊 Performance Optimization

- **Memory Allocation**:
  - NestJS: ~2.5GB (2-3 PM2 clusters)
  - MongoDB: ~3.5GB with index optimization
  - Redis: ~1GB with LRU eviction
- **Caching Strategy**: Redis for static content and course directories
- **Video Delivery**: Decoupled to CDN/external storage
- **Database Indexing**: Optimized queries on frequently accessed collections

## 🧪 Testing

```bash
# Unit tests
bun run test

# E2E tests
bun run test:e2e

# Test coverage
bun run test:cov
```

## 📝 API Response Format

### Success Response

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Action executed successfully",
  "data": {}
}
```

### Error Response

```json
{
  "success": false,
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Specific error explanation"
}
```

## 🚢 Deployment

Optimized for single VPS deployment (4 Cores, 8GB RAM, 100GB NVMe):

1. Install dependencies on VPS
2. Configure MongoDB and Redis
3. Set production environment variables
4. Use PM2 for process management (2-3 clusters)
5. Configure Nginx as reverse proxy
6. Set up SSL/TLS certificates
7. Configure CDN for video delivery

## 📄 License

This project is [MIT licensed](LICENSE).

## 👥 Contributing

Contributions are welcome! Please read the contributing guidelines before submitting PRs.

## 📧 Support

For support and queries, contact the development team.
