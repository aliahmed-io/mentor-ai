# Mentor AI Setup Guide

## Environment Variables Required

Create a `.env.local` file in the root directory with the following variables:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/mentor_ai"
PGSSL=disable

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key_here
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key_here
CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# OpenAI Configuration
OPENAI_API_KEY=sk-your_openai_api_key_here

# Uploadthing Configuration
UPLOADTHING_SECRET=your_uploadthing_secret
UPLOADTHING_APP_ID=your_uploadthing_app_id

# Upstash Vector Database
UPSTASH_VECTOR_REST_URL=https://your_upstash_vector_url
UPSTASH_VECTOR_REST_TOKEN=your_upstash_vector_token

```

## Setup Steps

### 1. Database Setup
- Install PostgreSQL or use a hosted Postgres
- Create a database named `mentor_ai`
- Apply schema with Prisma:
  - `npx prisma generate`
  - `npx prisma db push`

### 2. Clerk Authentication
- Sign up at https://clerk.com
- Create a new application
- Copy the publishable key and secret key
- Set up webhooks pointing to `/api/webhooks/clerk`

### 3. OpenAI API
- Sign up at https://platform.openai.com
- Create an API key
- Add it to your environment variables

### 4. Uploadthing
- Sign up at https://uploadthing.com
- Create a new app
- Copy the secret and app ID
- Add credentials to environment variables

### 5. Upstash Vector
- Sign up at https://upstash.com
- Create a Vector database
- Copy the REST URL and token

### 6. Install Dependencies
```bash
npm install
```

### 7. Run the Application
```bash
npm run dev
```

## Issues Fixed

1. ✅ Created environment variable template
2. ✅ Fixed chat API to handle missing documentId
3. ✅ Added proper error handling
4. ✅ Created setup documentation
