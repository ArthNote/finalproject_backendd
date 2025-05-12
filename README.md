# Backend Service

This is the backend service for TaskFlow, a task management application.

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database
- Google OAuth credentials
- GitHub OAuth credentials
- Stripe account (for payments)

## Setup

1. Clone the repository
2. Install dependencies:

```bash
pnpm install
```

3. Copy `.env.example` to `.env` and fill in your environment variables:

```bash
cp .env.example .env
```

4. Set up your database:

```bash
pnpm run db:migrate
```

5. Start the development server:

```bash
pnpm run dev
```

The server will start on http://localhost:8080 by default.

## Environment Variables

See `.env.example` for all required environment variables and their descriptions.

## Authentication

The project uses OAuth for authentication with:

- Google
- GitHub
- Discord

Make sure to set up your OAuth credentials in the respective platforms and add them to your environment variables.

## Database

The project uses PostgreSQL with Prisma as the ORM. Make sure to:

1. Have a PostgreSQL database instance ready
2. Update the DATABASE_URL in your .env file
3. Run migrations before starting the server

## API Documentation

API endpoints will be available at:

- Authentication: `/auth/*`
- User management: `/users/*`
- Task management: `/tasks/*`
- Subscription handling: `/subscription/*`

## Stripe Webhook Testing

For local development and testing Stripe webhooks:

1. Install the Stripe CLI from https://stripe.com/docs/stripe-cli

2. Login to your Stripe account via CLI:

```bash
stripe login
```

3. Forward webhooks to your local environment:

```bash
stripe listen --forward-to localhost:8080/api/webhook/stripe
```

4. Copy the webhook signing secret provided by the CLI and add it to your `.env` file:

```
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

## Support

For any issues or questions, please open an issue in the repository.
