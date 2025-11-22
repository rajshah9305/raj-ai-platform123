# RAJ AI PLATFORM

**Developed by RAJ SHAH**

A production-ready, full-stack AI platform powered by **Groq's fast inference API** and **CrewAI's multi-agent orchestration**. This platform is designed for advanced Natural Language Processing tasks with real-time streaming and a modern React-based interface.

## 🚀 Features

### Core Capabilities

- **Text Summarization**: Condense lengthy documents into clear, concise summaries
- **Data Analysis**: Extract insights and identify patterns from complex data
- **Research & Analysis**: Comprehensive research with multi-agent collaboration
- **Content Generation**: Create engaging, well-structured content
- **Code Generation**: Generate clean, production-ready code with best practices
- **Translation**: Accurate translations preserving context and tone

### Technical Highlights

- **Real-Time Streaming**: Live progress updates during task execution via Groq API
- **Multi-Agent Processing**: CrewAI-powered collaborative AI agents
- **Mixture of Agents (MOA)**: Multi-layer agent refinement for enhanced response quality
- **Type-Safe API**: Full-stack TypeScript with tRPC for end-to-end type safety
- **Modern UI**: Beautiful, responsive interface built with React 19 and Tailwind CSS
- **PostgreSQL Database**: Robust data persistence with Drizzle ORM

## 🛠 Tech Stack

### Backend

- **Node.js** with **Express** - Server runtime and framework
- **tRPC** - Type-safe API layer
- **Python 3.11+** - CrewAI agent orchestration
- **Groq SDK** - Fast LLM inference
- **Drizzle ORM** - Type-safe database queries
- **PostgreSQL/Neon** - Production database

### Frontend

- **React 19** with **TypeScript** - Modern UI framework
- **Tailwind CSS 4** - Utility-first styling
- **shadcn/ui** - High-quality component library
- **Wouter** - Lightweight routing
- **TanStack Query** - Powerful data synchronization
- **tRPC React** - Type-safe API client

### AI & NLP

- **Groq API** - Ultra-fast LLM inference
- **CrewAI** - Multi-agent orchestration framework
- **Mixture of Agents (MOA)** - Multi-layer agent refinement architecture
- **Multiple Agent Types**: Researcher, Writer, Analyst, Summarizer, Coder, Translator

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 22.x or higher
- **Python** 3.11 or higher
- **pnpm** package manager
- **PostgreSQL** database (or use [Neon](https://neon.tech/) for serverless PostgreSQL)
- **Groq API Key** ([Get from Groq Console](https://console.groq.com/keys))

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd groqqcrewwss
```

### 2. Install Dependencies

```bash
# Install Node.js dependencies
pnpm install

# Set up Python virtual environment
python3.11 -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
# Groq API Configuration
GROQ_API_KEY=your_groq_api_key_here

# Database Configuration (PostgreSQL/Neon)
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require

# Server Configuration
NODE_ENV=development
PORT=3000
```

**Note:** Get your Groq API key from the [Groq Console](https://console.groq.com/keys) and your PostgreSQL connection string from your database provider (e.g., [Neon](https://neon.tech/))

### 4. Set Up Database

```bash
# Push database schema to your PostgreSQL database
pnpm db:push
```

This will create all necessary tables in your database.

### 5. Start the Development Server

```bash
# Make sure your Python virtual environment is activated
source venv/bin/activate  # On macOS/Linux
# or
venv\Scripts\activate  # On Windows

# Start the development server
pnpm dev
```

The application will be available at `http://localhost:3000`

## 🏗 Project Structure

```
groqqcrewwss/
├── api/                    # Vercel serverless functions
│   └── trpc/              # tRPC API endpoint
├── client/                # Frontend React application
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable UI components
│   │   ├── lib/           # Utilities and tRPC client
│   │   └── App.tsx        # Main application component
│   └── public/            # Static assets
├── server/                # Backend Node.js application
│   ├── _core/             # Core server infrastructure
│   ├── db.ts              # Database operations
│   ├── routers.ts         # tRPC routers
│   ├── groq.ts            # Groq API integration
│   ├── moa.ts             # Mixture of Agents implementation
│   ├── crewai.ts          # CrewAI Node.js wrapper
│   └── crewai_service.py  # Python CrewAI service
├── drizzle/               # Database schema and migrations
│   └── schema.ts          # Database table definitions
└── shared/                # Shared types and constants
```

## 🔧 Available Scripts

- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm check` - Type check without emitting files
- `pnpm format` - Format code with Prettier
- `pnpm test` - Run test suite (requires environment variables)
- `pnpm db:push` - Push database schema changes
- `pnpm db:generate` - Generate migration files
- `pnpm db:migrate` - Run database migrations

## 🌐 API Reference

### tRPC Endpoints

#### NLP Operations

- `nlp.createTask` - Create a new NLP task
- `nlp.executeTask` - Execute task with CrewAI
- `nlp.streamTask` - Stream task execution with Groq (supports MOA mode)
- `nlp.executeMOA` - Execute task using Mixture of Agents architecture
- `nlp.getTasks` - Retrieve user's tasks
- `nlp.getTask` - Get specific task details
- `nlp.deleteTask` - Delete a task
- `nlp.getTaskLogs` - View task execution logs

#### Agent Management

- `agents.createConfig` - Create agent configuration
- `agents.getUserConfigs` - Get user's configurations
- `agents.getPublicConfigs` - Browse public configurations
- `agents.incrementUsage` - Track configuration usage

#### User Preferences

- `preferences.get` - Retrieve user preferences
- `preferences.update` - Update preferences

#### Results Management

- `results.save` - Save task result
- `results.getUserResults` - Get saved results

## 🚢 Deployment

### Production Build

```bash
# Build the application
pnpm build

# Start production server
pnpm start
```

### Environment Configuration

Ensure all production environment variables are set:

- `DATABASE_URL` - PostgreSQL connection string
- `GROQ_API_KEY` - Your Groq API key
- `NODE_ENV=production` - Production mode
- `PORT` - Server port (optional, defaults to 3000)

### Database Migration

```bash
# Push schema changes
pnpm db:push
```

### Deploy to Vercel

This project is configured for Vercel deployment:

1. **Push your code to GitHub**
2. **Import the repository in Vercel**
3. **Add environment variables in Vercel dashboard**:
   - `DATABASE_URL` - Your PostgreSQL connection string (required)
   - `GROQ_API_KEY` - Your Groq API key (required)
   - `OPENAI_API_KEY` - Set to `dummy-key-to-disable-openai` (required for CrewAI)
   - `NODE_ENV` - Set to `production`
4. **Set up the database schema** (run once after adding DATABASE_URL):
   ```bash
   # Using Vercel CLI:
   vercel env pull .env.local
   pnpm db:push
   pnpm db:init
   ```
   Or manually connect to your database and run the migrations from `drizzle/` folder
5. **Deploy** - Vercel will automatically build and deploy

**Important Notes:**

- The database schema must be set up after adding DATABASE_URL environment variable
- After deployment, verify the database connection at: `https://your-app.vercel.app/api/health`
- The default user is automatically created on first request
- Database migrations should be run manually using `pnpm db:push` when schema changes

The `vercel.json` file is already configured for optimal deployment.

## 🧪 Testing

Run the complete test suite:

```bash
pnpm test
```

## 🔒 Security

- **No Authentication Required**: This is a demo platform without auth
- **API Key Protection**: All API keys are server-side only
- **Input Validation**: Comprehensive input sanitization with Zod
- **SQL Injection Prevention**: Parameterized queries with Drizzle ORM

## 🐛 Troubleshooting

### Database Connection Issues

If you encounter database connection errors:

1. Verify your `DATABASE_URL` is correct
2. Ensure your database is accessible
3. Check SSL mode requirements (Neon requires `sslmode=require`)

### Python/CrewAI Issues

If CrewAI tasks fail:

1. Ensure Python virtual environment is activated
2. Verify all Python dependencies are installed: `pip install -r requirements.txt`
3. Check that `GROQ_API_KEY` is set in the environment
4. Verify the Python path in `server/crewai.ts` matches your setup

### Groq API Issues

If Groq API calls fail:

1. Verify your `GROQ_API_KEY` is valid
2. Check your Groq API quota/limits
3. Ensure you're using a supported model (`openai/gpt-oss-120b`)

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **Groq** for ultra-fast LLM inference
- **CrewAI** for multi-agent orchestration
- **shadcn/ui** for beautiful components
- **tRPC** for type-safe APIs

## 🎨 Design

**RAJAI PLATFORM** uses a clean, modern design with:

- **Orange** for MVPs, highlights, and primary actions
- **Black** text for optimal readability
- **White** background for a clean, professional look

---

**RAJ AI PLATFORM** - Built with ❤️ by RAJ SHAH using modern web technologies.
