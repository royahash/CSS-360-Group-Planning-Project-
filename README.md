# Event Explorer
### CSS 360 Group Planning Project

A web application for discovering local events near you. Users can browse real events pulled from the Ticketmaster API, save events they're interested in, and view event details.

---

## Team Members
- Sophia Garcia-Avella
- Roya Hashimi
- Subhasheni Venkatesh
- Salsabila Abu
- Iliya Hosseinisianaki

---

## Project Structure

```
CSS-360-Group-Planning-Project/
├── src/
│   ├── html/          # All HTML pages
│   ├── css/           # All CSS stylesheets
│   └── js/            # All JavaScript files
├── tests/             # All test files
├── .github/
│   └── workflows/
│       └── ci.yml     # CI/CD pipeline
├── Dockerfile         # Docker image configuration
├── vercel.json        # Vercel deployment routing
└── package.json       # Project dependencies
```

---

## Prerequisites

Before setting up the project make sure you have the following installed:

- **Git** — https://git-scm.com
- **Node.js** (v20 or higher) — https://nodejs.org
- **Docker** — https://www.docker.com/get-started
- A **Ticketmaster API key** — https://developer.ticketmaster.com

---

## Step 1 — Pull the Project from GitHub

Open a terminal and run:

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

This installs all required packages including Jest, ESLint, and Prettier.

---

## Step 3 — Set Up API Key

The homepage loads real events from the Ticketmaster API. To run the project locally you need an API key.

1. Get a free API key at https://developer.ticketmaster.com
2. Create a file called `config.js` and put in under the js folder of the project:

```javascript
// config.js - DO NOT COMMIT THIS FILE
const CONFIG = {
  TICKETMASTER_API_KEY: "your_actual_key_here"
};
```

This file is listed in `.gitignore` and will never be pushed to GitHub.

---

## Step 4 — Run Static Analysis

### Check formatting (Prettier):
```bash
npx prettier --check src/js/events.js src/js/index.js tests/events.test.js tests/index.test.js
```

### Check for code errors (ESLint):
```bash
npx eslint src/js/events.js src/js/index.js tests/events.test.js tests/index.test.js
```

### Run security audit:
```bash
npm audit
```

All three should pass with no errors before submitting a pull request.

---

## Step 5 — Run the Test Suite

```bash
npx jest
```

This runs all unit, integration, and smoke tests. You should see:

```
PASS tests/index.test.js
PASS tests/calendar.test.js
PASS tests/poll.test.js
PASS tests/events.test.js
PASS tests/calendar.dom.test.js

Test Suites: 5 passed, 5 total
Tests:       65 passed,  65 total
```

To run a specific test file:
```bash
npx jest tests/events.test.js
npx jest tests/index.test.js
```

---

## Step 6 — Run the Project Locally

Open `src/html/index.html` in your browser. If you have VS Code with the Live Server extension, right click on `index.html` and select **Open with Live Server**.

---

## Step 7 — Build the Docker Image

Make sure Docker is installed and running, then:

```bash
docker build -t css-360-group-project .
```

To verify the image was built:
```bash
docker image inspect css-360-group-project
```

To run the Docker container locally:
```bash
docker run -p 8080:80 css-360-group-project
```

Then open `http://localhost:8080/html/index.html` in your browser.

---

## CI/CD Pipeline

The project uses **GitHub Actions** as its CI/CD pipeline. The pipeline is defined in `.github/workflows/ci.yml` and runs automatically on every push and pull request.

### What the pipeline does:

| Step | Description |
|------|-------------|
| Pull code | GitHub Actions checks out the latest code from the repository |
| Install dependencies | Runs `npm install` |
| Check formatting | Runs Prettier to verify code style |
| Lint code | Runs ESLint to catch code errors |
| Run tests | Runs the full Jest test suite (unit, integration, smoke) |
| Security audit | Runs `npm audit` to check for vulnerabilities |
| Build Docker image | Builds the Docker image using the Dockerfile |
| Verify Docker image | Confirms the image was built successfully |
| Deploy to Vercel | Deploys to the production environment (in progress) |
| Verify deployment | Confirms the live site is accessible (in progress) |

### To trigger the pipeline manually:

1. Go to the repository on GitHub
2. Click the **Actions** tab
3. Select the **CI** workflow
4. Click **Run workflow**

### To view pipeline results:

Go to the **Actions** tab on GitHub. Each run shows which steps passed or failed with detailed logs.

---

## Static Analysis Tools

| Tool | Purpose | Config File |
|------|---------|-------------|
| **Prettier** | Code formatter — ensures consistent style | `.prettierrc` |
| **ESLint** | Linter — catches errors and bad practices | `eslint.config.mjs` |
| **npm audit** | Security scanner — checks for vulnerabilities | Built into npm |

All pull requests must pass all three tools before being merged.

---

## Production Environment

The project is deployed to **Vercel** for frontend hosting.

The project is live at: https://css-360-group-planning-project.vercel.app/src/html/index.html
---

## API Keys and Secrets

API keys are never stored in the repository. For local development use `config.js` (gitignored). For the CI pipeline, secrets are stored in GitHub repository secrets under **Settings → Secrets and variables → Actions**.

Required secrets for full pipeline operation:
- `VERCEL_TOKEN` — Vercel authentication token
- `VERCEL_ORG_ID` — Vercel organization ID
- `VERCEL_PROJECT_ID` — Vercel project ID

---

## Pull Request Process

1. Create a new branch from main
2. Make your changes
3. Run static analysis and tests locally to confirm everything passes
4. Push your branch and open a pull request on GitHub
5. Wait for the CI pipeline to pass
6. Get at least one teammate to review your PR
7. Merge after approval
