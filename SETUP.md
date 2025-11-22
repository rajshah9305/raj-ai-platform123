# RAJ AI PLATFORM - Quick Setup Guide

**Developed by RAJ SHAH**

This guide will help you get the RAJ AI PLATFORM running quickly.

## Prerequisites

- **Node.js** 20.x or higher
- **Python** 3.11 or higher
- **pnpm** package manager
- **Groq API Key** ([Get from Groq Console](https://console.groq.com/keys))

## Quick Start (5 minutes)

### 1. Install Dependencies

```bash
# Install Node.js dependencies
pnpm install

# Set up Python environment and dependencies
pnpm setup
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env and add your Groq API key
# GROQ_API_KEY=your_actual_groq_api_key_here
```

### 3. Start the Application

```bash
# Start development server
pnpm dev
```

The application will be available at `http://localhost:3000`

## Environment Variables

### Required
- `GROQ_API_KEY` - Your Groq API key from https://console.groq.com/keys

### Optional
- `DATABASE_URL` - PostgreSQL connection string (leave empty for in-memory database)
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment mode (development/production)

## Database Setup

### Option 1: In-Memory Database (Default)
No setup required. Data is stored in memory and will be lost when the server restarts.

### Option 2: PostgreSQL Database
1. Set up a PostgreSQL database (local or cloud like Neon)
2. Add `DATABASE_URL` to your `.env` file
3. Run database migrations:
   ```bash
   pnpm db:push
   ```

## Troubleshooting

### Python Issues
If you get Python-related errors:
```bash
# Manually set up Python environment
python3.11 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Database Issues
- Check if `DATABASE_URL` is correctly formatted
- For development, you can use in-memory database by leaving `DATABASE_URL` empty
- Test database connection at: `http://localhost:3000/api/health`

### API Key Issues
- Ensure your Groq API key is valid and has sufficient credits
- Check the key at: https://console.groq.com/keys

## Features

- **Text Summarization** - Condense lengthy documents
- **Data Analysis** - Extract insights from data
- **Research & Analysis** - Multi-agent research collaboration
- **Content Generation** - Create engaging content
- **Code Generation** - Generate clean, production-ready code
- **Translation** - Accurate translations with context

## Architecture

- **Frontend**: React 19 + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + tRPC
- **AI**: Groq API + CrewAI multi-agent system
- **Database**: PostgreSQL (optional) or in-memory storage

## Support

If you encounter issues:
1. Check the console for error messages
2. Verify all environment variables are set
3. Ensure Python dependencies are installed
4. Test the health endpoint: `/api/health`