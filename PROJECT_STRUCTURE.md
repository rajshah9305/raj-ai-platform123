# RAJ AI PLATFORM - Project Structure

**Developed by RAJ SHAH**

## Essential Files Only

```
groqqcrewwss/
├── api/                    # Vercel serverless functions
│   ├── trpc/[...path].ts  # tRPC API endpoint
│   └── health.ts          # Health check endpoint
├── client/                # Frontend React application
│   ├── src/
│   │   ├── components/    # UI components (shadcn/ui)
│   │   ├── hooks/         # React hooks (useMobile)
│   │   ├── lib/           # Utilities and tRPC client
│   │   ├── pages/         # Page components
│   │   ├── App.tsx        # Main application
│   │   ├── const.ts       # Constants
│   │   ├── index.css      # Global styles
│   │   └── main.tsx       # React entry point
│   └── index.html         # HTML template
├── drizzle/               # Database schema
│   ├── meta/              # Migration metadata
│   └── schema.ts          # Database table definitions
├── scripts/               # Utility scripts
│   ├── dev-start.sh       # Development startup
│   ├── init-db.ts         # Database initialization
│   └── setup-python.sh   # Python environment setup
├── server/                # Backend Node.js application
│   ├── _core/             # Core server infrastructure
│   │   ├── context.ts     # tRPC context
│   │   ├── env.ts         # Environment variables
│   │   ├── index.ts       # Server entry point
│   │   ├── systemRouter.ts # System routes
│   │   ├── trpc.ts        # tRPC setup
│   │   └── vite.ts        # Vite integration
│   ├── crewai_service.py  # Python CrewAI service
│   ├── crewai.ts          # CrewAI Node.js wrapper
│   ├── db.ts              # Database operations
│   ├── groq.ts            # Groq API integration
│   ├── moa.ts             # Mixture of Agents
│   └── routers.ts         # tRPC routers
├── shared/                # Shared types and constants
│   ├── const.ts           # Shared constants
│   └── types.ts           # TypeScript types
├── .env                   # Environment variables
├── .env.example           # Environment template
├── .gitignore             # Git ignore rules
├── .vercelignore          # Vercel ignore rules
├── drizzle.config.ts      # Database configuration
├── package.json           # Node.js dependencies
├── pnpm-lock.yaml         # Package lock file
├── README.md              # Main documentation
├── requirements.txt       # Python dependencies
├── SETUP.md               # Quick setup guide
├── tsconfig.json          # TypeScript configuration
├── vercel.json            # Vercel deployment config
└── vite.config.ts         # Vite configuration
```

## Removed Files

- `.vercel/` - Build output directory
- `drizzle/relations.ts` - Empty relations file
- `drizzle/*.sql` - Old migration files
- `server/_core/types/` - Unused auth types
- `server/_core/notification.ts` - Unused notification service
- `shared/_core/` - Unused error handling
- `client/src/contexts/` - Unused theme context
- `client/src/hooks/useComposition.ts` - Unused composition hook
- `client/src/hooks/usePersistFn.ts` - Unused persist hook
- `client/public/` - Empty public directory
- `scripts/verify-db-schema.ts` - Non-essential verification script
- `components.json` - shadcn config (not needed after setup)
- `.gitkeep`, `.python-version`, `.prettierignore`, `.prettierrc`, `.npmrc`, `vitest.config.ts` - Unnecessary config files

## Core Features Preserved

✅ **Frontend**: React 19 + TypeScript + Tailwind CSS + shadcn/ui
✅ **Backend**: Node.js + Express + tRPC
✅ **AI Services**: Groq API + CrewAI + MOA (Mixture of Agents)
✅ **Database**: PostgreSQL with Drizzle ORM + in-memory fallback
✅ **Deployment**: Vercel-ready configuration
✅ **Development**: Setup scripts and documentation