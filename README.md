# Mentor AI — Smart Study Partner

A Next.js application that helps students study by uploading lecture notes and papers, getting AI-generated summaries, exam-style questions, and context-aware chat functionality.

## Features
- 📄 **Document Upload**: Support for PDF, DOCX, DOC, TXT, and image files (JPG, PNG, GIF, WEBP)
- 🤖 **AI Summaries**: Generate concise and detailed summaries
- ❓ **Question Generation**: Create multiple-choice and short-answer questions
- 💬 **Document Chat**: Ask questions about your documents using RAG
- 🔐 **Authentication**: Secure user management with Clerk
- ☁️ **Cloud Storage**: File storage with Cloudinary
- 🧠 **Vector Search**: Semantic search with Upstash Vector

## Tech Stack
- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Authentication**: Clerk
- **Database**: PostgreSQL
- **File Storage**: Uploadthing
- **Vector Database**: Upstash Vector
- **AI**: OpenAI GPT-4o-mini

## Quick Setup

### 1. Environment Variables
Create `.env.local` file with the following variables:

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

### 2. Database Setup
```bash
# Create PostgreSQL database
createdb mentor_ai

# Initialize database schema
npm run init-db
```

### 3. Install and Run
```bash
npm install
npm run dev
```

## Service Setup

### Clerk Authentication
1. Sign up at [clerk.com](https://clerk.com)
2. Create a new application
3. Copy the publishable key and secret key
4. Set up webhooks pointing to `/api/webhooks/clerk`

### OpenAI API
1. Sign up at [platform.openai.com](https://platform.openai.com)
2. Create an API key
3. Add it to your environment variables

### Uploadthing
1. Sign up at [uploadthing.com](https://uploadthing.com)
2. Create a new app
3. Copy the secret and app ID
4. Add credentials to environment variables

### Upstash Vector
1. Sign up at [upstash.com](https://upstash.com)
2. Create a Vector database
3. Copy the REST URL and token

## Scripts
- `npm run dev` - Development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run tests
- `npm run init-db` - Initialize database schema

## Deploy
Use Vercel. Configure all environment variables in the Vercel dashboard before first deploy.
