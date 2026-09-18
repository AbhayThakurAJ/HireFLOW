# HireFlow CRM

## Overview
HireFlow CRM is a modern, full-stack Customer Relationship Management (CRM) platform tailored for sales teams. It streamlines lead tracking, company and contact organization, deal pipeline management, and daily task workflows. Built with a focus on performance, security, and intuitive user experience, HireFlow provides real-time dashboard analytics, robust role-based access control (RBAC), and global search capabilities.

## Key Features
- **JWT Authentication:** Secure user authentication with HTTP-only cookies.
- **RBAC (Role-Based Access Control):** Strict isolation between `ADMIN` and `SALES_REP` roles.
- **Lead Management:** Track, score, and convert leads with automated activity logging.
- **Companies & Contacts:** Organize B2B relationships and relational schemas efficiently.
- **Deal Management (Kanban):** Visual drag-and-drop-style pipeline for moving deals through stages (New, Discovery, Proposal, Negotiation, Won, Lost).
- **Tasks & Activities:** Manage daily to-dos tied to deals or leads.
- **Dashboard Analytics:** Real-time KPI aggregation, pipeline value tracking, and conversion rates.
- **Global Search:** Find leads, companies, and contacts instantly across the platform.
- **CSV Import/Export:** Ingest large lists of leads and export them for reporting.
- **Notifications:** Receive alerts when assigned new items.
- **Audit Logs:** Comprehensive tracking of all create, update, and delete actions for accountability.
- **Security Hardening:** IDOR prevention, rate limiting, helmet headers, CORS restrictions, and formula-injection mitigation.

## Technology Stack

**Frontend:**
- React (v18+)
- JavaScript
- Vite
- Tailwind CSS
- TanStack Query (React Query)
- Recharts
- React Router DOM
- React Hook Form & Zod

**Backend:**
- Node.js
- Express
- Prisma ORM
- JWT & bcryptjs
- Express Rate Limit & Helmet
- Multer & csv-parse (for CSV processing)

**Database:**
- PostgreSQL / Neon

**Deployment:**
- Netlify (Frontend)
- Production Node hosting (Backend)

## Architecture

```text
       React (Vite SPA)
              │ (HTTP REST / JSON)
              ▼
      Express REST API
              │ (Prisma Client)
              ▼
           Prisma
              │ (Connection Pooling)
              ▼
      PostgreSQL (Neon)
```

## Security
- **Authentication:** Uses bcrypt for password hashing and secure HTTP-only cookies for JWT storage to mitigate XSS attacks.
- **RBAC:** Enforced at the middleware level, blocking `SALES_REP` users from viewing or mutating entities owned by other users.
- **IDOR Protection:** All data access strictly verifies entity ownership against the authenticated user's ID and Role.
- **Input Validation:** Zod schemas validate all API inputs to prevent malformed or malicious payloads.
- **Rate Limiting:** Protects against brute-force login attempts and general API spam.
- **CORS & Helmet:** Strict CORS policies limit access to the designated frontend URL. Helmet automatically sets security headers (e.g., DNS Prefetch Control, XSS Protection).
- **CSV Formula Injection:** Mitigated during CSV export by formatting potential formulas as raw strings.

## Testing
Phase 11 involved a comprehensive End-to-End Regression Test Suite.
- **Passed:** 30 workflows
- **Failed:** 0
- Tests cover full authentication lifecycles, cross-user RBAC checks, Zod validation rejections, entity relationship persistence, and full workflow simulations (Lead -> Deal -> Task).

## Local Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/hireflow-crm.git
   cd hireflow-crm
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Create a `.env` file in the root directory (refer to `.env.example`).
   ```env
   DATABASE_URL="postgresql://user:password@host:port/database?schema=public"
   JWT_SECRET="your-super-secret-jwt-key"
   PORT=3000
   ```

4. **Database Migration & Seeding:**
   ```bash
   npx prisma generate
   npx prisma db push
   node prisma/seed.js
   ```

5. **Start Development Servers:**
   ```bash
   npm run dev
   ```
   The backend runs on `http://localhost:3000` and serves the Vite React frontend.

## Demo Accounts
To explore the application locally, use the seeded demo accounts:
- **Admin Role:** `admin@hireflow.com` / `Password123!`
- **Sales Rep Role:** `sales1@hireflow.com` / `Password123!`

## Deployment

**Frontend (Netlify):**
1. Connect your GitHub repository to Netlify.
2. Build Command: `npm run build`
3. Publish directory: `dist`
4. Set Environment Variables:
   - `VITE_API_URL` = `https://your-backend-url.com/api`
5. The `netlify.toml` file in the root directory ensures proper SPA routing.

**Backend (Node Hosting e.g., Render, Railway, Fly):**
1. Set the Node startup command: `node server.js`
2. Configure Environment Variables:
   - `DATABASE_URL` = Your production PostgreSQL URL
   - `JWT_SECRET` = A strong secret key
   - `CLIENT_URL` = `https://your-frontend.netlify.app`
   - `NODE_ENV` = `production`
   - `PORT` = (Render/Railway dynamically assigns this)
3. Ensure CORS accepts the `CLIENT_URL`.

**Database Migrations in Production:**
Do NOT run `node prisma/seed.js` in production automatically. Ensure migrations are applied using:
```bash
npx prisma migrate deploy
```

## Environment Variables
See `.env.example` for the required structure. Never commit `.env` containing real credentials.

## API Documentation

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Authenticate user and issue cookie
- `POST /api/auth/logout` - Clear authentication cookie
- `GET /api/auth/me` - Retrieve authenticated user profile

### Dashboard & Analytics
- `GET /api/dashboard/stats` - Retrieve KPI aggregates (Revenue, Deals, Leads)
- `GET /api/dashboard/pipeline` - Retrieve pipeline conversion funnel
- `GET /api/dashboard/revenue` - Retrieve revenue over time chart data

### Entities (Leads, Companies, Contacts, Deals, Tasks, Notes)
All core entities expose standard RESTful endpoints:
- `GET /api/{entity}` - List entities (supports filtering, sorting, pagination)
- `GET /api/{entity}/:id` - Get single entity details
- `POST /api/{entity}` - Create a new entity
- `PATCH /api/{entity}/:id` - Update an entity
- `DELETE /api/{entity}/:id` - Delete an entity

*Special Routes:*
- `PATCH /api/deals/:id/stage` - Update a deal's Kanban stage
- `GET /api/activities` - Fetch activity timelines

### Global Search
- `GET /api/search?q={query}` - Retrieve aggregated search results across all major models.

### Import / Export
- `POST /api/import/leads` - Ingest multipart/form-data CSV files for bulk lead creation
- `GET /api/export/{entity}` - Stream CSV exports for reporting

### Audit & Notifications
- `GET /api/audit-logs` - Retrieve unalterable system audit logs (ADMIN only)
- `GET /api/notifications` - Retrieve alerts for the authenticated user

## Future Improvements
- Background job processing (e.g., automated email sequences via Redis/BullMQ).
- Scalable analytics aggregation (data warehouse integration for advanced reporting).
- Mobile drag-and-drop support for the Pipeline Kanban board.
- Optional third-party integrations (Google Calendar, Slack, external email clients).
