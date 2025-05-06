# NestJS Todo API

A modern, well-structured RESTful API for managing todos, built with NestJS, Prisma, Redis, and JWT authentication.

## Features

- **User Management**: Registration, authentication, and profile management.
- **Todo Management**: Create, read, update, delete todos.
- **Security**: JWT authentication, rate limiting, and security middleware.
- **Caching**: Redis-based response caching.
- **Database**: PostgreSQL with Prisma ORM.
- **API Documentation**: Auto-generated Swagger documentation.
- **Testing**: Comprehensive unit and e2e tests.

## Project Structure

The application follows a modular architecture aligned with NestJS best practices:

```
src/
├── auth/                 # Authentication and authorization
├── common/               # Shared utilities, filters, pipes, etc.
│   ├── exceptions/       # Custom exception classes
│   ├── filters/          # Exception filters
│   ├── guards/           # Guards for route protection
│   ├── interceptors/     # Interceptors for request/response handling
│   ├── middleware/       # HTTP middleware
│   ├── pipes/            # Request validation pipes
│   └── services/         # Shared services like logging
├── config/               # Configuration module
├── prisma/               # Prisma ORM integration
├── redis/                # Redis service for caching
├── todos/                # Todo module
├── users/                # User management module
├── app.module.ts         # Main application module
└── main.ts               # Application entrypoint
```

## Getting Started

### Prerequisites

- Node.js (v18+)
- PostgreSQL
- Redis (optional, for caching)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd todo-api
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. Run database migrations:
   ```bash
   npx prisma migrate dev
   ```

5. Start the application:
   ```bash
   # Development
   npm run start:dev
   
   # Production
   npm run build
   npm run start:prod
   ```

## API Documentation

Once the application is running, access the Swagger documentation at:

```
http://localhost:3000/api/docs
```

## Development Guidelines

### Code Style

The project uses ESLint and Prettier for code quality and style enforcement:

```bash
# Lint code
npm run lint

# Format code
npm run format
```

### Testing

```bash
# Unit tests
npm test

# Test coverage
npm run test:cov

# E2E tests
npm run test:e2e
```

### Dependency Injection

NestJS uses dependency injection throughout the application. Services should be defined as providers in their respective modules and injected through constructor injection.

### Error Handling

All exceptions should extend from the `BaseException` class in `common/exceptions/base.exception.ts` to ensure consistent error responses.

### Logging

Use the `AppLogger` service from `common/services/logger.service.ts` for all logging needs to ensure consistent log formatting.

## License

This project is licensed under the MIT License - see the LICENSE file for details.