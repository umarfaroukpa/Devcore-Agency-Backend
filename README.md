# Devcore-Agency-Backend

A backend API for Devcore — a project & task management platform for agencies and development teams. This repository provides an Express + TypeScript server, Prisma ORM with a PostgreSQL schema, authentication, email utilities, and common features for managing users, projects, tasks, and activity logs.

**Tech stack:** Node.js, TypeScript, Express, Prisma, PostgreSQL, Nodemailer

**Key features:**
- **User management:** registration, login, roles, permissions
- **Project & task management:** projects, tasks, comments, time logs
- **Notifications & activity logs**
- **Invite codes & admin controls**
- **Email utilities** for notifications and password resets

**Repository Layout (high level)**
- `src/` — application source code (controllers, middleware, routes, register helpers)
- `src/config` — DB and Prisma client initializers
- `prisma/` — Prisma schema, migrations, and seed scripts
- `scripts/` — deployment and helper scripts
- `testEmail.ts` — small script to preview email behaviour

**Quick links:** see the code in [README.md](README.md) and the schema at [prisma/schema.prisma](prisma/schema.prisma#L1-L10)

**Prerequisites**
- Node.js (>=18 recommended)
- npm (or yarn/pnpm)
- PostgreSQL database
- `npx` available (comes with npm)

**Install**
1. Clone the repo and install dependencies:

```bash
git clone <repo-url>
cd devcore-backend
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env
# edit .env to match your local settings
```

If no `.env.example` exists, create a `.env` file in the project root with the keys listed in the Environment Variables section below.

**Environment variables**
Create a `.env` file in the project root with at least the following keys (examples shown):

- `DATABASE_URL` — PostgreSQL connection string
	- example: `postgresql://user:password@localhost:5432/devcore_db?schema=public`
- `DIRECT_DATABASE_URL` — optional direct DB URL (used by Prisma tools)
- `JWT_SECRET` — secret used to sign JWT tokens (required)
- `NODE_ENV` — `development` or `production` (defaults to `development`)
- `PORT` — port to run the server (defaults to `5000`)
- `SMTP_HOST` — SMTP host for email (e.g. `smtp.gmail.com`)
- `SMTP_PORT` — SMTP port (e.g. `587`)
- `SMTP_USER` — SMTP username/email
- `SMTP_PASSWORD` — SMTP password or app-specific password
- `SMTP_FROM` — sender default (e.g. `noreply@devcore.com`)
- `FRONTEND_URL` — frontend base URL used in email links

Note: The repository currently contains an example `.env` in the root (do not commit secrets to version control).

**Database (Prisma)**
This project uses Prisma with the schema in `prisma/schema.prisma`.

Common Prisma commands:

```bash
# generate Prisma client
npx prisma generate

# run migrations in development (creates migration & updates DB)
npx prisma migrate dev --name init

# run seed (if configured in prisma.schema or package.json)
npx prisma db seed

# open Prisma Studio (DB browser)
npx prisma studio
```

If you prefer, run `npm run build` and then use `node` for production execution.

**Available NPM scripts**
- `npm run dev` — start development server with `ts-node` + `nodemon` (`src/server.ts`)
- `npm run start` — start compiled production server (`node dist/server.ts`)
- `npm run build` — TypeScript compile (`tsc`)
- `npm run deploy:prod` — project-specific deploy script for production (see `scripts/deploy.ts`)
- `npm run deploy:staging` — deploy to staging

You can view/modify scripts in `package.json`.

**Run locally (development)**
1. Ensure `.env` is set and PostgreSQL is accessible
2. Generate Prisma client and migrate if needed:

```bash
npx prisma generate
npx prisma migrate dev
npx prisma db seed
```

3. Start the dev server:

```bash
npm run dev
```

Visit `http://localhost:5000` (or the port configured in `PORT`). Logs will show the environment and whether `JWT_SECRET` is configured.

**Production build & run**

```bash
npm run build
NODE_ENV=production PORT=5000 node dist/server.js
```

Adjust the production startup to your hosting environment (systemd, Docker, PM2, etc.).

**Testing & Email previews**
- There are no unit tests included by default. The `testEmail.ts` file can be used to exercise email utilities.
- To test email delivery locally, ensure SMTP credentials in `.env` are correct — or configure a service like Mailtrap for development.

**Common troubleshooting**
- Server exits with DB connection error: verify `DATABASE_URL` and that Postgres is running.
- `JWT_SECRET` not set: authentication endpoints will fail; set `JWT_SECRET` in `.env`.
- Email fails: verify `SMTP_*` values and provider settings (e.g. Gmail requires app password or OAuth).

**Contributing**
- Open an issue for bugs or feature requests.
- Create a branch per feature/fix and open a PR with a description of changes.

**License & Contact**
This repository does not include an explicit license file (add one if you intend to publish). For questions, contact the maintainer in the repo.

---
If you'd like, I can also:
- Add a `.env.example` file with placeholder values
- Add a Dockerfile and `docker-compose.yml` for local development
- Add CI steps to run `prisma generate` and `npm run build` on push

