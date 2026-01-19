
# Helping Hands Dashboard

A concise developer README for the Helping Hands Dashboard monorepo. This file focuses on the project structure, local development, and contributing guidelines.

Repository structure

- `server/HelpingHands.Server` — ASP.NET Core Web API. Implements authentication (Identity), data access (EF Core), and application services.
- `client` — React + TypeScript frontend (Vite).

Quickstart (local development)

1) Prerequisites

- .NET SDK
- Node.js and npm
- PostgreSQL for a local database

2) Run the API server

```bash
cd server/HelpingHands.Server
dotnet restore
dotnet run
```

Default local URL: `http://localhost:5185` (check `Properties/launchSettings.json`). In Development the API exposes Swagger at `/swagger`.

3) Run the frontend

```bash
cd client
npm ci
npm run dev
```

Default local URL: `http://localhost:5173`. The Vite dev server proxies API requests to the backend so client code can call `/api/*`.

Seeding and admin account

- The codebase includes a development seeder (`DevDataSeeder`) which runs in Development and seeds sample data including a dev admin account (`admin@example.com` / `#D3vpassword`).
- A production-style seeder (`ProductionAdminSeeder`) can create a default admin when `DefaultAdmin:Email` and `DefaultAdmin:Password` are provided via configuration (user-secrets or environment variables).

Project notes

- Frontend: check `client/src` for screens, components, hooks, and styles.
- Backend: main services live under `server/HelpingHands.Server/Services`. Data models and EF Core migrations are under `server/HelpingHands.Server/Data`.
- Phone inputs, reporting changes, and a markdown-based Site Info editor were recently added.

Development tips

- Use `dotnet user-secrets` to keep local secrets out of source control for the server.
- Create `client/.env.local` for local frontend environment variables (this file is ignored by the recommended `.gitignore`).
- Run the dev server and frontend concurrently during development.

Contributing

- Make changes in the appropriate folder (`client` or `server/HelpingHands.Server`).
- Run existing tests (if present) and lint/format before opening PRs.

Support

If you want me to add deployment instructions, CI workflows, or Docker files into the repo, tell me which target (DigitalOcean App Platform, Docker image, or CI provider) and I'll add them.

# Helping Hands Dashboard

This file is a focused, developer-oriented rundown of the application internals: backend services and endpoints, and the frontend architecture and data flows. It intentionally excludes deployment procedures.

Table of contents
- Project overview
- Backend (detailed)
	- Architecture & key components
	- Authentication and authorization
	- Services & controllers (endpoints)
	- Data model & migrations
	- Seeding and bootstrapping
- Frontend (detailed)
	- Architecture & key folders
	- Data fetching and hooks
	- Important components and flows
	- Build & local dev
- Development workflow
- Troubleshooting and tips

Project overview
----------------

Helping Hands Dashboard is a two-part application in a single repository:

- `server/HelpingHands.Server` — ASP.NET Core Web API that implements business services, database access (EF Core + PostgreSQL), and authentication (ASP.NET Identity).
- `client` — React + TypeScript SPA (Vite) that consumes the API and contains the administrative UI and public landing page.

The app manages clients, households, applications, assistance events (FoodPantry, HelpingHands), user accounts, and site information.

Backend — detailed
------------------

Architecture and key components
- Language/framework: C# / ASP.NET Core (minimal hosting model).
- Data access: EF Core with Npgsql provider for PostgreSQL.
- Auth: ASP.NET Identity (`UserManager`, `SignInManager`) with cookie-based auth.
- DI: Services are registered in `Program.cs` and used by controllers. Mapping handled by AutoMapper.
- Key folders:
	- `Controllers/` — HTTP endpoints.
	- `Services/` — business logic and orchestration.
	- `Data/` — `ApplicationDbContext`, EF migrations, dev seeders.
	- `Models/` — EF entities and Identity user type (`AppUser`).
	- `Dtos/` — request/response shapes.

Authentication & authorization
- Identity user type: `AppUser : IdentityUser<Guid>` with additional fields: `DisplayName`, `IsActive`, `CreatedAt`, `UpdatedAt`, `MustChangePassword`.
- Login is handled by the `AuthService` which wraps `SignInManager` and `UserManager`. Login yields cookie-based session.
- Important behaviors:
	- `MustChangePassword` flag forces a password change on next interactive login; cleared after successful change/reset.
	- Inactive users (`IsActive == false`) are prevented from performing authorized actions; controllers check this and may return 403.

Services & Controllers (endpoints)
Below are the core controllers and the main endpoints they expose. Request/response DTOs live in `Dtos/` by area.

- `AuthController` (`/auth`)
	- POST `/auth/login` — body `LoginRequestDto`; signs in and returns `MeDto`.
	- POST `/auth/logout` — signs out; auth required.
	- GET `/auth/me` — returns authenticated user's `MeDto`; auth required.
	- POST `/auth/change-password` — authenticated change-password endpoint.
	- POST `/auth/forgot-password` and `/auth/reset-password` — password reset flows. In dev, reset tokens may be returned in the response for convenience.

- `UsersController` (`/users`) — admin user management (auth required)
	- GET `/users` — paged list (query DTO).
	- GET `/users/{id}` — user details.
	- POST `/users` — create user; returns created id and invite token. Creation sets initial password and `MustChangePassword` in `UsersService`.
	- PUT `/users/{id}` — update user profile.
	- POST `/users/{id}/deactivate` and `/activate` — toggle active state (self-deactivation is prevented).

- `SiteInfoController` (`/site-info`)
	- GET `/site-info` — public, returns site content (fields store markdown strings for the public site).
	- PUT `/site-info` — authenticated; update site content. Used by the admin UI and stores markdown.

- `ReportsController` (`/reports`) — reporting (auth required)
	- GET `/reports` — accepts `ReportQueryDto` and returns `ReportResponseDto` (summary + detail rows). The server computes served unique clients (including household members) and returns `ClientNames` per row.

- `HouseholdsController` (`/households`) — household management (auth required)
	- GET `/households` — paged list.
	- GET `/households/{id}` — details.
	- POST `/households` — create.
	- PUT `/households/{id}` — update address.
	- POST `/households/{id}/archive` and `/unarchive`.
	- POST `/households/{id}/add-member` and `/remove-member` — manage membership.
	- POST `/households/move-member` — move a client to another household.

- `ClientsController` (`/clients`)
	- GET `/clients` — paged list.
	- GET `/clients/{id}` — details.
	- POST `/clients` — create client.
	- PUT `/clients/{id}` — update client.
	- POST `/clients/{id}/archive` and `/unarchive`.

- `ClientNotesController` (`/clients/{clientId}/notes`)
	- GET list of notes for the client.
	- POST create note (records author user id).
	- PUT update note (author-only operation enforced in service).
	- POST `{noteId}/delete` and `/restore` to soft-delete and restore notes.

- `AssistanceEventsController` (`/assistance-events`)
	- GET `/assistance-events` — paged list and filters.
	- GET `/assistance-events/{id}` — details (includes ApplicationId when linked).
	- POST `/assistance-events` — create event (records `RecordedByUserId`).
	- PUT `/assistance-events/{id}` — update.
	- POST `/assistance-events/{id}/archive` and `/unarchive`.

- `ApplicationsController` (`/applications`)
	- GET `/applications` — paged.
	- GET `/applications/{id}` — details.
	- POST `/applications` — create application.
	- POST `/applications/both` — convenience endpoint to create both application types.
	- PUT `/applications/{id}` — update.
	- POST archive/unarchive endpoints.

Data model & migrations
- EF Core entities are in `Models/` and mapped in `ApplicationDbContext`.
- Migrations are in `server/HelpingHands.Server/Data/Migrations` and should be applied via `dotnet ef database update` during development or deployment.

Seeding and bootstrap
- `DevDataSeeder` — runs in Development (wired in `Program.cs`) and seeds:
	- A dev admin user (`admin@example.com` / `#D3vpassword`).
	- Sample households, clients, and assistance events for UI testing.
- `ProductionAdminSeeder` — checks configuration keys `DefaultAdmin:Email` and `DefaultAdmin:Password` and creates a single admin account if configured. This is intended for initial bootstrap only.

Server configuration keys (selected)
- `ConnectionStrings:DefaultConnection` — EF Core connection string.
- `Smtp:Host`, `Smtp:Username`, `Smtp:Password` — SMTP settings for `SmtpEmailSender` (Noop fallback when missing).
- `DefaultAdmin:Email`, `DefaultAdmin:Password`, `DefaultAdmin:MustChangePassword` — production seeder inputs.

Frontend — detailed
-------------------

Architecture & key folders
- Framework: React (v18+/19) with TypeScript, built with Vite.
- Styling: Bootstrap + React-Bootstrap components; additional Sass in `client/src/styles`.
- Primary folders:
	- `client/src/api/` — HTTP client wrapper (`http.ts`) and API helpers.
	- `client/src/auth/` — `AuthContext.tsx` and `AuthProvider.tsx` provide authentication state and helpers.
	- `client/src/hooks/` — custom hooks for data fetching and mutations, implemented with TanStack Query (React Query).
	- `client/src/screens/` — top-level screen components (pages) such as `DashboardHome`, `ApplicationsList`, `SiteInfoEditor`, and `PublicHome`.
	- `client/src/components/` — shared UI components, e.g. `DataTable`, `PhoneInput`, `MarkdownViewer`, `RichTextMarkdownEditor`.
	- `client/src/layout/` — layout components (`Topbar`, `Sidebar`).
	- `client/src/routes/` — router config and protected-route handling.

Data fetching and state management
- React Query (TanStack) centralizes server state: each resource has hooks like `useClientsList`, `useClientDetails`, `useApplicationsList`, `useSiteInfo`, etc.
- Mutations use React Query's mutation patterns (`useMutation`) and invalidate queries on success.
- Local UI state is managed with React state/hooks. Auth session is stored in context; API calls rely on cookie-based auth in dev and production.

Important components and flows
- `DataTable` — reusable table with sorting, pagination, and default descending date sort for date columns.
- `PhoneInput` — formats phone numbers as `(###) ###-####` and returns formatted values.
- `RichTextMarkdownEditor` — admin WYSIWYG that produces markdown (wraps `@mdxeditor/editor`) used in `SiteInfoEditor`.
- `MarkdownViewer` — renders markdown using `react-markdown` + `remark-gfm` on public pages.
- `SiteInfoEditor` — admin screen that edits site text fields as markdown and saves via PUT `/site-info`.
- Authentication UX: `Topbar` shows user info and allows self-edit; `ProtectedRoute` guards admin routes and redirects unauthorized users.

Build & local dev
- Frontend dev server:
	- `cd client`
	- `npm ci`
	- `npm run dev`
	- default: `http://localhost:5173`.
- Backend dev server:
	- `cd server/HelpingHands.Server`
	- `dotnet restore`
	- `dotnet run`
	- default: `http://localhost:5185` (verify via `launchSettings.json`).
- The Vite dev server proxies `/api/*` (client config) to the backend so cross-origin cookie auth works in dev.

Environment & local secrets
- Use `dotnet user-secrets` for server-side sensitive values during local development (connection strings, SMTP, admin credentials).
- Create `client/.env.local` for frontend-only variables (this file is ignored by the repo's gitignore). Example: `VITE_API_BASE_URL=http://localhost:5185` if you need to override fetch base URL.

Development workflow
- Use the dev seeder for sample data: the dev environment runs `DevDataSeeder` automatically at startup.
- Add feature branches, run linting and type checks before PRs. The repo contains `npm run lint` and `npm run typecheck` scripts for frontend checks.
- When adding new backend endpoints:
	1. Add DTOs under `Dtos/`.
	2. Add service logic in `Services/` and test locally.
 3. Add controller methods under `Controllers/` and annotate with route and authorization attributes.
 4. Add/adjust EF migrations if models change.

Troubleshooting & tips
- If Vite dev server reports a port in use, kill the running process or choose an alternate port.
- If frontend builds fail due to third-party package deep imports (e.g., `@mdxeditor/editor`), avoid deep plugin imports at build-time and rely on the package top-level API or pin a compatible package version.
- To inspect the API contract interactively, run the server in Development and open `/swagger`.
- Keep secrets out of source control: do not commit `appsettings.Development.json` with real credentials; use `user-secrets` and `client/.env.local`.

Further notes
- Tests: add unit and integration tests for services and critical UI flows as needed.
- Observability: add structured logging and metrics for production readiness.

If you'd like, I can also generate a separate `API.md` listing every endpoint and DTO shape, or add a `DEVELOPER_NOTES.md` with branch/PR guidance — tell me which and I'll create it.
# helping-hands-dashboard
