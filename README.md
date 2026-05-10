# Leaf & Lore — White-Label E-Commerce Platform

> **"Stories rooted in every page"**

A fully-specced, white-label e-commerce platform currently deployed as a physical bookstore demo. Built spec-first — every domain has a specification file. No code is written without reading the relevant spec.

The database, API, and architecture are **generic by design**. The "Leaf & Lore" bookstore is a configuration of the platform, not a separate codebase. In Phase 4, clients can configure the platform to sell any physical product type.

---

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| **Backend API** | FastAPI (Python 3.11+) | Async, auto-generates OpenAPI/Swagger at `/docs` |
| **ORM** | SQLAlchemy 2.0 (async) + asyncpg | Alembic migrations — no manual `ALTER TABLE` ever |
| **Database** | PostgreSQL 15+ | ACID, relational integrity, pgvector (P3) |
| **Frontend** | Next.js 14+ App Router — TypeScript | SSR for SEO on product/catalog pages |
| **UI** | Tailwind CSS | All colours via CSS variables from `store_config` — no hardcoded hex |
| **Server state** | TanStack Query (React Query) | API data fetching, caching, background refresh |
| **Client UI state** | Zustand | Cart drawer, toasts, modals — UI only |
| **Auth** | JWT (15-min access) + refresh token (7-day, rotated) | httpOnly cookie, SHA-256 hashed in DB |
| **File storage** | Local filesystem (dev), Cloudflare R2 (prod) | Abstracted behind `StorageService` interface |
| **Background tasks** | FastAPI `BackgroundTasks` (P1/P2) → Celery + Redis (P3) | Upgrade path built in |
| **Search** | PostgreSQL FTS with GIN index (P1) → Elasticsearch/Typesense (P2) | — |
| **Payments** | Dummy checkout (P1/P2) → Stripe (P3) | After client demo sign-off |
| **Email** | Stub/log only (P1/P2) → SES or SendGrid (P3) | — |
| **Cache** | None (P1) → Redis (P2) | Add when needed |

---

## Build Phases

| Phase | Label | Key Deliverables |
|---|---|---|
| **P1** | MVP | Guest browsing · Guest + auth cart · Force-login at checkout · Register/Login (email stubs) · Product catalog API with filters/search · 4-strategy cart merge · Dummy checkout → order creation · Order history · Basic admin CRUD (products, categories, linked entities, inventory) · Store config API · "Leaf & Lore" theme seeded · 30-book demo dataset |
| **P2** | Store Management | Full admin dashboard · Theme editor (all 3 themes) · Media upload · Inventory management · Full-text search upgrade · Redis caching · Rate limiting · Homepage section configurator · User management · Email templates · Discount codes · Saved for later |
| **P3** | Intelligence + Comms | Real Stripe payments · Transactional email (SES/SendGrid) · Email verification flow · Recommendation engine · AI chatbot (LLM + pgvector) · Support tickets · Analytics event tracking · Celery task queue |
| **P4** | Platform Generalisation | Multi-product-type support (`product_attributes` table) · Multi-tenant architecture · Tenant provisioning API · Client onboarding |

**Current status:** P1 specification complete (12 spec files, ~4,600 lines). Code not yet written.

---

## Architecture Overview

### White-label from day one

The API is entirely generic — `products`, `categories`, `linked_entities`. Nothing is named after books. The bookstore labels ("Books", "Genres", "Authors") are stored in `store_config` and injected at runtime. Switching from a bookstore to a vinyl record store = changing the config row.

### Separation of concerns — strictly enforced

```
HTTP Request
  → Route Handler (validate shape, call ONE service function)
    → Service Function (all business logic, DB operations)
      → SQLAlchemy Model (ORM only)
    ← Service returns data or raises domain exception
  ← Route Handler maps to HTTP response
HTTP Response
```

Route handlers never contain `if/else` business logic. Services never import from FastAPI. Models never call services.

### API response envelope — every endpoint, no exceptions

```json
{ "data": { "..." }, "meta": null }
{ "data": [...], "meta": { "total": 120, "page": 1, "page_size": 20, "total_pages": 6 } }
{ "error": { "code": "UPPER_SNAKE_CASE", "message": "Human readable", "details": {} } }
```

### Authentication

- **Access token:** Signed JWT (HS256), 15-min TTL, sent in `Authorization: Bearer` header
- **Refresh token:** 32-byte random hex, SHA-256 hashed in DB, raw in httpOnly cookie, 7-day TTL
- **Token rotation:** Every `/auth/refresh` call revokes the old token and issues a new one
- **Guest cart:** Identified by `guest_session_token` cookie, stored in DB (not localStorage), 30-day TTL
- **Force login at checkout:** `POST /api/orders` requires JWT — cart survives login via merge

### Three storefront themes (all stored in DB — zero code deployment to switch)

| Theme | Character | Font | Accent |
|---|---|---|---|
| **Leaf & Lore** (default) | Botanical minimalism, Apple-inspired whitespace | Plus Jakarta Sans | `#52b788` mid-green |
| **Midnight** | Premium dark mode, product-photography-forward | Inter | `#0071e3` Apple blue |
| **Neon Manga** | High contrast, anime/manga aesthetic, loud | Syne + Inter | `#ff2d78` hot pink |

Admin dashboard has its own **fixed neutral theme** (Slate 900 sidebar) — never follows the storefront theme.

---

## Database Schema

All tables have `id` (UUID, `gen_random_uuid()`), `created_at` (TIMESTAMPTZ), `updated_at` (TIMESTAMPTZ). No serial integers, no float money, no TIMESTAMP, no hard deletes.

| Table | Purpose |
|---|---|
| `users` | Accounts with RBAC roles: `CUSTOMER`, `ADMIN`, `SUPER_ADMIN` |
| `refresh_tokens` | Session management — SHA-256 hashed, rotated on use |
| `password_reset_tokens` | Single-use, 1-hour TTL reset tokens |
| `products` | Core product table (books in P1) — UUID PK, NUMERIC(10,2) price, soft delete |
| `categories` | Genre/style groupings — slugged, display-ordered, with own pages |
| `linked_entities` | Authors/artists/makers — rich entity with bio, photo, own page |
| `product_entity_links` | Many-to-many: products ↔ linked_entities |
| `product_category_links` | Many-to-many: products ↔ categories |
| `carts` | One per user (UUID FK) or per guest (session token) — server-side always |
| `cart_items` | Line items — quantity capped at stock_count |
| `orders` | Placed orders — totals immutable after creation, soft-delete-safe |
| `order_items` | Immutable price snapshot (`unit_price`, `line_total`) for refund accuracy |
| `inventory_log` | Append-only audit trail of every stock change |
| `store_configs` | One row per version, one `is_active=TRUE` at a time — theme, labels, homepage, policies |
| `addresses` | Shipping addresses — one default per user |

---

## API Surface

Full Swagger docs at `GET /docs` (FastAPI auto-generated).

### Public (no auth)
```
GET  /api/config/store          Active theme, homepage sections, labels, policies
GET  /api/products              Paginated catalog — filter by category, entity, price, format, flags, search
GET  /api/products/{id}         Product detail with categories and linked entities
GET  /api/products/section/{id} Resolve homepage section to product list
GET  /api/linked-entities       Paginated entity (author) list
GET  /api/linked-entities/{id}  Entity detail + their products
GET  /api/categories            All active categories with product counts
```

### Cart (guest + authenticated)
```
GET    /api/cart
POST   /api/cart/items           { product_id, quantity }
PUT    /api/cart/items/{id}      { quantity }
DELETE /api/cart/items/{id}
DELETE /api/cart
```

### Auth
```
POST /api/auth/register          → sets refresh_token cookie, returns cart_conflict if applicable
POST /api/auth/login             → same
POST /api/auth/refresh           → rotates refresh token, returns new access token
POST /api/auth/logout            → revokes token(s), ?logout_all=true for all devices
POST /api/auth/forgot-password   → always 200 (no user enumeration)
POST /api/auth/reset-password    → single-use token
```

### Customer (JWT required)
```
POST   /api/cart/merge           { strategy: keep_user | keep_guest | combine | save_later }
GET    /api/users/me
PUT    /api/users/me
GET    /api/users/me/addresses
POST   /api/users/me/addresses
PUT    /api/users/me/addresses/{id}
DELETE /api/users/me/addresses/{id}
POST   /api/orders               { address_id } — dummy checkout in P1/P2
GET    /api/orders
GET    /api/orders/{id}
```

### Admin (`/api/admin/*` — ADMIN role required at middleware level)
```
Products CRUD · Categories CRUD · Linked entities CRUD
Inventory view + inline stock edit + log
Orders view (all users) + status transitions
Store config update (new version created, rollback available)
User management [P2] · Media upload [P2]
```

---

## Frontend Architecture

**Next.js 14+ App Router — TypeScript throughout.**

### Route groups
```
app/
├── (store)/          Customer-facing storefront — inherits active store theme via CSS variables
│   ├── page.tsx      Homepage (Server Component)
│   ├── products/     Catalog + detail (Server Components for SEO)
│   ├── cart/
│   ├── checkout/
│   ├── orders/
│   └── account/
├── (auth)/           Login, register, reset — uses store theme
└── admin/            Admin dashboard — fixed neutral theme, ADMIN role required
    ├── products/
    ├── orders/
    ├── inventory/
    ├── categories/
    ├── linked-entities/
    └── config/       Theme editor · Homepage section configurator · Policies · Labels
```

### State management
- **TanStack Query** — all API data (products, cart, orders, store config). Cached, background-refresh, loading/error states.
- **Zustand** — UI-only state (cart drawer open/close, toast queue, active modal). Nothing from the server.

### Theme injection
Store config colours injected as CSS custom properties on every page load from `GET /api/config/store`. All Tailwind utilities reference `--color-*` variables — no hardcoded hex anywhere in the frontend.

---

## Non-Negotiable Rules

These rules apply to every file, every domain, every phase. No exceptions.

1. **Read the spec before writing code** — `docs/spec/` has a file for every domain
2. **UUID primary keys** on every table — never serial integers
3. **TIMESTAMPTZ** for all timestamps — always UTC, never bare TIMESTAMP
4. **NUMERIC(10,2)** for all monetary values — never float or double
5. **Soft deletes only** — `is_deleted=TRUE`, `deleted_at=now()`. Exception: join table rows
6. **No business logic in route handlers** — one service call, then return
7. **StorageService interface only** — never import filesystem or cloud SDK outside `storage_service.py`
8. **Dummy checkout** — `payment_reference="DUMMY-{uuid}"`, `payment_status="DUMMY"`, no Stripe calls
9. **Email stubs** — log intent only, never send. Mark `# [P3-EMAIL]`
10. **Generic naming** — `products` not books, `categories` not genres, `linked_entities` not authors
11. **Every API route** needs a Swagger docstring (summary, description, tags)
12. **Phase markers** in all deferred code: `# [P2]`, `# [P3-EMAIL]`, `# [P3-PAYMENT]`, `# [P4]`
13. **All money in USD** — `currency_code="USD"` from store config
14. **bcrypt cost ≥ 12** for all password hashing
15. **No secrets in source** — all from environment variables via `core/config.py`

---

## Project Structure

```
leafandlore/
├── docs/
│   ├── spec/
│   │   ├── 01-vision-and-stack.md       Product vision, tech stack, build phases
│   │   ├── 02-coding-standards.md       Naming, structure, separation of concerns, enums
│   │   ├── 03-roles-and-auth.md         RBAC, JWT mechanics, guest cart, cart merge
│   │   ├── 04-ux-and-themes.md          3 themes with hex values, admin theme, UX principles
│   │   ├── 05-service-pseudocode.md     All backend service logic in pseudocode
│   │   ├── 06-database-schema.md        Every table, column, type, constraint, rationale
│   │   ├── 07-api-routes.md             Full API route map with auth requirements
│   │   ├── 08-storage.md                StorageService interface, local dev, P3 cloud swap
│   │   ├── 09-frontend-architecture.md  Next.js structure, state management, theme injection
│   │   ├── 10-homepage-sections.md      7 configurable section types and resolver logic
│   │   ├── 11-seed-data.md              30-book dataset, 20 authors, 15 genres, store config
│   │   └── 12-decisions-log.md          55+ finalized architectural decisions
│   └── adr/                             Architecture decision records (future)
├── backend/
│   ├── api/                             Route handlers — one file per domain
│   ├── services/                        Business logic — one file per domain
│   ├── models/                          SQLAlchemy ORM models
│   ├── schemas/                         Pydantic request/response schemas
│   ├── middleware/                      Auth, RBAC, logging
│   ├── core/                            Config, DB session, security, constants/enums
│   ├── background/                      Background task functions (email stubs, cleanup)
│   ├── migrations/                      Alembic migration files
│   └── seed/                            Seed scripts: store config, 30 books, admin user
└── frontend/
    ├── app/                             Next.js App Router pages
    ├── components/                      React components (store/, admin/, ui/)
    ├── lib/                             TanStack Query hooks, Zustand stores, API client
    └── styles/
```

---

## Getting Started

> Code is not yet written. This section will be completed as P1 implementation progresses.

**Prerequisites (planned):**
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+

**Development setup (planned):**
```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
python seed/seed_config.py
python seed/seed_products.py
python seed/seed_admin.py
uvicorn main:app --reload

# Frontend
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

API docs: `http://localhost:8000/docs`
Frontend: `http://localhost:3000`

---

## Key Architectural Decisions

Full decisions log in `docs/spec/12-decisions-log.md` (55+ finalized decisions). Highlights:

- **White-label generic platform** — not a bookstore with bolted-on config, a platform from day one
- **Server-side cart** — DB, not localStorage. Survives browser restart, enables merge
- **JWT + refresh token rotation** — stateless access, revocable sessions, breach-safe (hash in DB)
- **Soft deletes everywhere** — preserve financial records and audit trail permanently
- **UUID primary keys** — prevents ID enumeration, distributed-friendly
- **PostgreSQL over MongoDB** — ACID guarantees and relational integrity for e-commerce
- **3 themes in DB** — switching themes is a config change, not a deployment
- **Admin theme is fixed** — professional tool never follows storefront aesthetics
- **Dummy checkout P1/P2** — validate the platform with real users before Stripe integration
- **Open Library API** for demo book cover images (free, real covers, by ISBN)
