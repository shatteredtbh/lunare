# Lunare — Handmade Soap Website

Full-stack Node.js + PostgreSQL website with auth, admin panel, and live product editing.

---

## What's included

- Express backend with JWT auth (HTTP-only cookies)
- bcrypt password hashing (no plain-text passwords anywhere)
- PostgreSQL database for users, products, settings, newsletter
- Protected admin routes — server rejects requests without a valid admin token
- Admin panel: edit products, manage users, change site settings live
- Admin credentials stored only in Railway environment variables

---

## Deploy to Railway (step by step)

### 1. Push to GitHub

```bash
# In this folder:
git init
git add .
git commit -m "Initial Lunare commit"
# Create a repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/lunare.git
git push -u origin main
```

### 2. Create Railway project

1. Go to [railway.app](https://railway.app) and sign up / log in
2. Click **New Project → Deploy from GitHub repo**
3. Select your `lunare` repo
4. Railway will detect Node.js and deploy automatically

### 3. Add a PostgreSQL database

1. In your Railway project, click **New** → **Database** → **PostgreSQL**
2. Railway will automatically set the `DATABASE_URL` environment variable for you

### 4. Set environment variables

In Railway → your service → **Variables**, add:

| Variable | Value |
|---|---|
| `JWT_SECRET` | A long random string — run `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` to generate one |
| `ADMIN_USERNAME` | `nilasumi` |
| `ADMIN_PASSWORD` | `123suminila123` |
| `NODE_ENV` | `production` |

`DATABASE_URL` and `PORT` are set automatically by Railway — don't add those.

### 5. Run the database schema

1. In Railway, click your **PostgreSQL** service
2. Go to the **Query** tab
3. Open `schema.sql` from this project, paste the entire contents, and click **Run**

This creates all tables and seeds the default products.

### 6. Done!

Railway will give you a URL like `https://lunare-production.up.railway.app`. Your site is live.

---

## Local development

```bash
# Install dependencies
npm install

# Create your local .env file
cp .env.example .env
# Edit .env and fill in your local PostgreSQL DATABASE_URL and a JWT_SECRET

# Run the database schema against your local Postgres
psql $DATABASE_URL -f schema.sql

# Start with auto-reload
npm run dev

# Or just:
npm start
```

---

## Security notes

- Admin credentials (`ADMIN_USERNAME`, `ADMIN_PASSWORD`) only exist in Railway's secret environment variables — not in any file
- Passwords are hashed with bcrypt (cost factor 12) — not reversible
- Sessions use JWT tokens stored in HTTP-only cookies — JavaScript on the page cannot read them
- Admin API routes (`/api/users`, `PUT /api/products`, etc.) reject requests without a valid admin JWT
- Never commit your `.env` file — it's in `.gitignore`

---

## Adding email (optional)

The "forgot password" flow is currently a placeholder. To make it actually send emails:

1. Sign up for [Resend](https://resend.com) (free tier: 3,000 emails/month)
2. Get your API key
3. `npm install resend`
4. Add `RESEND_API_KEY=your_key` to Railway variables
5. In `server.js`, replace the `/api/reset` stub with actual Resend code

---

## Project structure

```
lunare-app/
├── server.js          ← Express backend, all API routes
├── public/
│   └── index.html     ← Full frontend (talks to API)
├── schema.sql         ← Run once to set up the database
├── package.json
├── railway.toml       ← Railway deploy config
├── .env.example       ← Copy to .env for local dev
├── .gitignore
└── README.md
```
