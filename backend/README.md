# Backend API - Installment Portal

Express.js backend with TypeScript, Prisma ORM, Winston logger, and Neon Postgres database.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

3. Update `.env` with your Neon Postgres connection string:

```
DATABASE_URL="postgresql://user:password@host.neon.tech/dbname?sslmode=require"
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
LOG_LEVEL=info
```

4. Generate Prisma Client:

```bash
npm run prisma:generate
```

5. Run database migrations:

```bash
npm run prisma:migrate
```

6. Start development server:

```bash
npm run dev
```

The server will start on `http://localhost:5000` (or the PORT specified in `.env`)

## Build for Production

```bash
npm run build
npm start
```

## Logging

The application uses Winston for logging. Logs are written to:

- `logs/error.log` - Error level logs
- `logs/combined.log` - All logs

In development, logs are also output to the console with colors.

Log levels can be configured via `LOG_LEVEL` environment variable:

- `error` - Only errors
- `warn` - Warnings and errors
- `info` - Info, warnings, and errors (default)
- `debug` - All logs including debug information

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get current user profile
- `PUT /api/auth/profile` - Update current user profile

### Properties

- `GET /api/properties` - Get all properties (public)
- `GET /api/properties/:id` - Get property by ID (public)
- `POST /api/properties` - Create property (Admin only)
- `PUT /api/properties/:id` - Update property (Admin only)
- `DELETE /api/properties/:id` - Delete property (Admin only)

### Installments

- `GET /api/installments` - Get all installments (Admin only)
- `GET /api/installments/my-installments` - Get user's installments
- `GET /api/installments/:id` - Get installment by ID
- `POST /api/installments` - Create installment
- `PUT /api/installments/:id` - Update installment
- `DELETE /api/installments/:id` - Delete installment (Admin only)

### Payments

- `GET /api/payments` - Get all payments (Admin only)
- `GET /api/payments/my-payments` - Get user's payments
- `GET /api/payments/:id` - Get payment by ID
- `POST /api/payments` - Create payment
- `PUT /api/payments/:id` - Update payment

### Users (Admin only)

- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## Database Models

- **User**: Buyers and Admins
- **Property**: Real Estate and Golf Cars
- **Installment**: Installment plans
- **Payment**: Payment records

## Authentication

All protected routes require a Bearer token in the Authorization header:

```
Authorization: Bearer <token>
```

## Tech Stack

- **Express.js** - Web framework
- **TypeScript** - Type-safe JavaScript
- **Prisma ORM** - Database ORM
- **Winston** - Logging library
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Neon Postgres** - Database

## Project Structure

```
backend/
├── src/
│   ├── config/          # Database configuration
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Auth middleware
│   ├── routes/          # API routes
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utilities (logger, etc.)
│   └── server.ts        # Main server file
├── prisma/
│   └── schema.prisma    # Database schema
├── logs/                # Log files (created at runtime)
└── dist/                # Compiled JavaScript (after build)
```
