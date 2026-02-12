# PermitPro — AI-Powered Pre-Permit Plan Review

SaaS platform for architects, engineers, and developers to upload residential floor plans and receive automated approval-readiness feedback before submission to building departments.

## System Architecture

```
┌─────────────────┐     ┌──────────────────────────────────────────┐
│   React SPA     │────▶│  Express API (Node.js)                   │
│   (Vercel)      │     │  (Render.com)                            │
│                 │     │                                          │
│  - Landing      │     │  /api/auth     ─── JWT Auth              │
│  - Dashboard    │     │  /api/projects ─── Project CRUD          │
│  - Analysis     │     │  /api/uploads  ─── File Upload + Trigger │
│  - Billing      │     │  /api/analysis ─── Results + Reports     │
│  - Admin        │     │  /api/billing  ─── Stripe Checkout       │
└─────────────────┘     │  /api/admin    ─── Admin Dashboard       │
                        │  /api/webhooks ─── Stripe Webhooks       │
                        │                                          │
                        │  AI Pipeline:                            │
                        │  ┌────────┐ ┌──────────┐ ┌───────────┐  │
                        │  │  OCR   │▶│  Rules   │▶│   LLM     │  │
                        │  │ Engine │ │  Engine  │ │  Engine   │  │
                        │  └────────┘ └──────────┘ └───────────┘  │
                        └──────────────┬───────────────────────────┘
                                       │
                        ┌──────────────▼───────────┐
                        │   PostgreSQL (Render)    │
                        │   - users                │
                        │   - projects             │
                        │   - uploads              │
                        │   - analyses             │
                        │   - audit_log            │
                        │   - feature_flags        │
                        └──────────────────────────┘
```

## Folder Structure

```
permitpro/
├── backend/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql    # Full database schema
│   │   └── run.js                    # Migration runner
│   ├── scripts/
│   │   └── seed.js                   # Seed admin + demo user
│   ├── src/
│   │   ├── config/
│   │   │   ├── index.js              # App config + tier definitions
│   │   │   └── db.js                 # PostgreSQL pool
│   │   ├── middleware/
│   │   │   ├── auth.js               # JWT authentication + RBAC
│   │   │   ├── rateLimiter.js        # Rate limiting
│   │   │   ├── tierCheck.js          # Subscription tier enforcement
│   │   │   └── upload.js             # Multer file upload
│   │   ├── routes/
│   │   │   ├── auth.js               # Register, login, me
│   │   │   ├── projects.js           # Project CRUD
│   │   │   ├── uploads.js            # File upload + analysis trigger
│   │   │   ├── analysis.js           # Analysis results + PDF/JSON report
│   │   │   ├── billing.js            # Stripe checkout + portal
│   │   │   ├── webhooks.js           # Stripe webhook handler
│   │   │   └── admin.js              # Admin stats, users, flags
│   │   ├── services/
│   │   │   └── ai/
│   │   │       ├── analysisService.js    # Pipeline orchestrator
│   │   │       ├── pipeline/
│   │   │       │   └── ocrEngine.js      # OCR abstraction (mock/live)
│   │   │       ├── engines/
│   │   │       │   └── llmEngine.js      # LLM abstraction (mock/live)
│   │   │       └── rules/
│   │   │           └── residentialRules.js  # IRC rule engine
│   │   ├── utils/
│   │   │   ├── logger.js             # Winston logger
│   │   │   └── audit.js              # Audit log writer
│   │   └── index.js                  # Express app entry
│   ├── render.yaml                   # Render deployment config
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── public/
│   │   └── favicon.svg
│   ├── src/
│   │   ├── components/
│   │   │   └── layout/
│   │   │       ├── MarketingLayout.jsx
│   │   │       └── DashboardLayout.jsx
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx        # Marketing landing
│   │   │   ├── PricingPage.jsx        # Subscription tiers
│   │   │   ├── AboutPage.jsx          # Vision + government angle
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── DashboardHome.jsx      # Overview + stats
│   │   │   ├── ProjectsPage.jsx       # Project list + create
│   │   │   ├── ProjectDetailPage.jsx  # Upload + file list
│   │   │   ├── AnalysisPage.jsx       # Full analysis report
│   │   │   ├── BillingPage.jsx        # Subscription management
│   │   │   └── AdminPage.jsx          # Admin dashboard
│   │   ├── services/
│   │   │   └── api.js                 # API client
│   │   ├── store/
│   │   │   └── AuthContext.jsx        # Auth state management
│   │   ├── styles/
│   │   │   └── index.css              # Tailwind imports
│   │   ├── App.jsx                    # Router + protected routes
│   │   └── main.jsx                   # Entry point
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── vercel.json
│   ├── package.json
│   └── .env.example
│
└── README.md
```

## Local Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ (or use Docker: `docker run -e POSTGRES_DB=permitpro -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:16`)

### 1. Clone & Install

```bash
cd permitpro

# Backend
cd backend
cp .env.example .env
# Edit .env — set DATABASE_URL to your local PostgreSQL
npm install

# Frontend
cd ../frontend
cp .env.example .env
npm install
```

### 2. Database Setup

```bash
cd backend
# Create the database (if not using Docker)
createdb permitpro

# Run migrations
npm run migrate

# Seed admin + demo users
npm run seed
```

### 3. Run

```bash
# Terminal 1 — Backend
cd backend
npm run dev
# API running on http://localhost:4000

# Terminal 2 — Frontend
cd frontend
npm run dev
# App running on http://localhost:5173
```

### 4. Login

- **Admin:** admin@permitpro.ai / admin123456
- **Demo:** demo@permitpro.ai / demo123456

## API Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/register | No | Register new user |
| POST | /api/auth/login | No | Login |
| GET | /api/auth/me | Yes | Get current user + tier |
| GET | /api/projects | Yes | List user projects |
| POST | /api/projects | Yes | Create project |
| GET | /api/projects/:id | Yes | Get project with uploads |
| PATCH | /api/projects/:id | Yes | Update project |
| DELETE | /api/projects/:id | Yes | Delete project |
| POST | /api/uploads/:projectId | Yes | Upload file + trigger analysis |
| GET | /api/uploads/:id | Yes | Get upload status |
| GET | /api/analysis/:id | Yes | Get analysis results |
| GET | /api/analysis/upload/:uploadId | Yes | Get analysis by upload |
| GET | /api/analysis/project/:projectId | Yes | List analyses for project |
| GET | /api/analysis/:id/report/json | Yes* | Download JSON report |
| GET | /api/analysis/:id/report/pdf | Yes* | Download PDF report |
| POST | /api/billing/create-checkout | Yes | Create Stripe checkout session |
| POST | /api/billing/portal | Yes | Open Stripe customer portal |
| GET | /api/billing/status | Yes | Get subscription status |
| POST | /api/webhooks/stripe | No | Stripe webhook handler |
| GET | /api/admin/stats | Admin | System metrics |
| GET | /api/admin/users | Admin | User list |
| PATCH | /api/admin/users/:id | Admin | Update user |
| GET | /api/admin/feature-flags | Admin | List feature flags |
| PATCH | /api/admin/feature-flags/:id | Admin | Toggle feature flag |
| GET | /api/admin/audit-log | Admin | Audit log |
| GET | /api/health | No | Health check |

*Paid tier required for report downloads

## Environment Variables

### Backend (.env)

| Variable | Required | Description |
|----------|----------|-------------|
| PORT | No | API port (default: 4000) |
| NODE_ENV | No | Environment (development/production) |
| DATABASE_URL | Yes | PostgreSQL connection string |
| JWT_SECRET | Yes | JWT signing secret (min 32 chars) |
| JWT_EXPIRES_IN | No | Token expiry (default: 7d) |
| STRIPE_SECRET_KEY | No | Stripe secret key (billing disabled if missing) |
| STRIPE_WEBHOOK_SECRET | No | Stripe webhook signing secret |
| STRIPE_PRICE_PRO_MONTHLY | No | Stripe Price ID for Pro monthly |
| STRIPE_PRICE_PRO_YEARLY | No | Stripe Price ID for Pro yearly |
| STRIPE_PRICE_ENTERPRISE_MONTHLY | No | Stripe Price ID for Enterprise monthly |
| STRIPE_PRICE_ENTERPRISE_YEARLY | No | Stripe Price ID for Enterprise yearly |
| MAX_FILE_SIZE_MB | No | Max upload size (default: 50) |
| UPLOAD_DIR | No | Upload directory (default: ./uploads) |
| AI_SERVICE_MODE | No | mock or live (default: mock) |
| FRONTEND_URL | No | Frontend URL for CORS |
| LOG_LEVEL | No | Logging level (default: info) |

### Frontend (.env)

| Variable | Required | Description |
|----------|----------|-------------|
| VITE_API_URL | No | API base URL (default: /api, uses Vite proxy) |

## Deployment

### Backend — Render.com

1. Push the `backend/` folder to a GitHub repo
2. Create a new **Web Service** on Render
3. Connect the repo, set root directory to `backend`
4. Build command: `npm install`
5. Start command: `npm start`
6. Create a PostgreSQL database on Render
7. Set environment variables (see table above)
8. After deploy, run migrations:
   - Use Render's shell or set build command to: `npm install && npm run migrate`
9. Seed data: run `npm run seed` from Render shell

Alternatively, use the included `render.yaml` for infrastructure-as-code deployment.

### Frontend — Vercel

1. Push the `frontend/` folder to a GitHub repo (can be same repo)
2. Import to Vercel
3. Set root directory to `frontend`
4. Set environment variable: `VITE_API_URL=https://your-render-backend.onrender.com/api`
5. Deploy

### Frontend — GitHub Pages (alternative)

1. Update `vite.config.js` with `base: '/your-repo-name/'`
2. Build: `npm run build`
3. Deploy `dist/` folder to GitHub Pages
4. Set `VITE_API_URL` to your Render backend URL

## Subscription Tiers

| Feature | Free | Professional ($79/mo) | Enterprise ($249/mo) |
|---------|------|----------------------|---------------------|
| Projects | 2 | 25 | Unlimited |
| Uploads/month | 3 | 50 | Unlimited |
| Max file size | 10 MB | 50 MB | 100 MB |
| Compliance flags | Basic | Detailed | Detailed |
| Report download | No | PDF + JSON | PDF + JSON |
| AI interpretation | No | Yes | Yes |
| Priority support | No | No | Yes |
| Custom rules | No | No | Yes |

## AI Pipeline Architecture

The analysis pipeline is modular and designed for production replacement:

1. **File Ingestion** — Handled by multer upload middleware
2. **OCR Engine** (`services/ai/pipeline/ocrEngine.js`) — Abstraction layer. Mock returns structured extraction data. Swap for Google Vision, AWS Textract, or custom OCR.
3. **Rule Engine** (`services/ai/rules/residentialRules.js`) — Deterministic code checks against IRC standards. Each rule is independently testable. Add jurisdiction-specific rule files.
4. **LLM Engine** (`services/ai/engines/llmEngine.js`) — Abstraction layer. Mock generates scoring from rule results. Swap for GPT-4, Claude, or fine-tuned model.
5. **Analysis Service** (`services/ai/analysisService.js`) — Orchestrates the pipeline, persists results.

To switch from mock to live AI:
1. Set `AI_SERVICE_MODE=live` in `.env`
2. Set `AI_OCR_ENDPOINT` and `AI_LLM_ENDPOINT`
3. Implement the `_liveExtract` and `_liveInterpret` methods

## Database Schema

See `backend/migrations/001_initial_schema.sql` for the full schema. Key tables:

- **users** — Auth, tier, Stripe integration, upload counters
- **projects** — User workspaces with type, address, jurisdiction
- **uploads** — File records with processing status
- **analyses** — Full structured results (JSON columns for compliance_flags, missing_information, rejection_risks, recommendations, extracted_data, rule_results)
- **audit_log** — Government-compliance audit trail
- **feature_flags** — Runtime feature toggles for future government clients
