# CSS 360 Group Planning Project — Event Loop

Web application for finding and saving local events near you. Users browse real events pulled from the Ticketmaster API, save events to their personal calendar, view event details, and submit event requests with group polling. User accounts are backed by MongoDB with Google OAuth and email/password authentication.

The project is deployed to Vercel at: https://css-360-group-planning-project.vercel.app

> **Note:** Google sign-in is currently configured for UW Bothell (`@uw.edu`) accounts only.

**Team:** Sophia Garcia-Avella, Roya Hashimi, Subhasheni Venkatesh, Salsabila Abu, Iliya Hosseinisianaki

---

## Features

- Browse real events from the Ticketmaster API
- Search events by name, category, or US state
- Sort events by soonest or latest
- Save and unsave events to your personal calendar
- View detailed event information
- Select interest categories during onboarding (saved to your account)
- Profile page showing your saved preferences
- Submit event requests with group polling
- Google OAuth login or email/password registration
- Data persists across sessions — saved events and preferences tied to your account

---

## Step 1 — Pull the Project from GitHub

```bash
git clone https://github.com/royahash/CSS-360-Group-Planning-Project-.git
cd CSS-360-Group-Planning-Project-
git checkout main
```
---

## Step 2 — Install Dependencies

```bash
npm install
```
This installs all required packages including Express, Passport, Mongoose, Jest, ESLint, and Prettier.

---

## Step 3 — Set Up Environment Variables

Create a `.env` file in the project root with the following variables:

```
MONGODB_URI=your_mongodb_connection_string
TICKETMASTER_API_KEY=your_ticketmaster_api_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
SESSION_SECRET=any_long_random_string
```
> These values are shared among team members privately. It is listed in `.gitignore`.

---

## Step 4 — Run Static Analysis

### Check formatting (Prettier):
```bash
npm run format
```

### Check for code errors (ESLint):
```bash
npm run lint
```

### Run security audit:
```bash
npm audit
```

All three should pass with no errors before submitting a pull request.

---

## Step 5 — Run the Test Suite

```bash
npm test
```

This runs all unit, integration, and smoke tests across 6 test suites. You should see all tests passing:

```
PASS tests/index.test.js
PASS tests/calendar.test.js
PASS tests/poll.test.js
PASS tests/events.test.js
PASS tests/calendar.dom.test.js
PASS tests/server.test.js

Test Suites: 6 passed, 6 total
```

To run a specific test file:
```bash
npx jest tests/events.test.js
npx jest tests/server.test.js
```
---

## Step 6 — Run the Project Locally

```bash
npm run dev
```
Then open: http://localhost:3000

---

## Step 7 — Build the Docker Image

Make sure Docker is installed and running, then:

```bash
docker build -t css-360-group-planning-project .
```

To verify the image was built:
```bash
docker image inspect css-360-group-planning-project
```

To run the Docker container locally:
```bash
docker run -p 8080:3000 css-360-group-planning-project
```

Then open `http://localhost:8080` in your browser.

---

## CI/CD Pipeline

The project uses **GitHub Actions** for CI/CD, defined in `.github/workflows/ci.yml`. It runs automatically on every push and pull request.

| Step | Description |
|------|-------------|
| Pull code | Checks out the latest code |
| Install dependencies | Runs `npm install` |
| Check formatting | Runs Prettier |
| Lint code | Runs ESLint |
| Run tests | Runs the full Jest test suite |
| Security audit | Runs `npm audit --audit-level=high` |
| Build Docker image | Builds the Docker image |
| Verify Docker image | Confirms the image was built |
| Deploy to Vercel | Deploys to production |
| Verify deployment | Confirms the live site is accessible |

To trigger the pipeline manually: GitHub → Actions tab → CI workflow → Run workflow.

---

## Static Analysis Tools

| Tool | Purpose | Config File |
|------|---------|-------------|
| **Prettier** | Code formatter | `.prettierrc` |
| **ESLint** | Linter — catches errors | `eslint.config.mjs` |
| **npm audit** | Security scanner | Built into npm |

All pull requests must pass all three before merging.

---

## GitHub Repository Secrets

The following secrets are under **Settings → Secrets and variables → Actions** for the CI/CD pipeline to work:

| Secret | Description |
|--------|-------------|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `TICKETMASTER_API_KEY` | Ticketmaster API key |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GOOGLE_CALLBACK_URL` | Production callback URL |
| `SESSION_SECRET` | Session encryption secret |
| `VERCEL_TOKEN` | Vercel authentication token |
| `VERCEL_ORG_ID` | Vercel organization ID |
| `VERCEL_PROJECT_ID` | Vercel project ID |

---

## Production Environment

The project is deployed to **Vercel** at:
**https://css-360-group-planning-project.vercel.app**

Environment variables for production are configured in the Vercel dashboard under Settings → Environment Variables. `NODE_ENV` is set to `production` in Vercel directly.

---
