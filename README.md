# CSS 360 Group Planning Project

## Pull the project from the repository

1. Open a terminal or command prompt.
2. Clone the repository using your team repo URL:

```bash
git https://github.com/royahash/CSS-360-Group-Planning-Project-.git
```

3. Change into the project folder:

```bash
cd CSS-360-Group-Planning-Project-
```

4. Check out the branch containing the test setup:

```bash
git checkout onboarding-and-profile
```

## Install required software

This project is built with static HTML, CSS, and JavaScript.

### Required software

- Node.js (LTS version recommended)
- npm (included with Node.js)
- A modern web browser such as Google Chrome, Microsoft Edge, Firefox, or Safari.

To verify installation:

```bash
node --version
npm --version
```

## Install dependencies

From the project folder, install the Node dependencies for the test suite:

```bash
npm install
```

This will install `vitest`, `jsdom`, and any other development dependencies needed to run the tests.

## Run the app locally

Since this is a static front-end project, you can open `index.html` directly in your browser.

Alternatively, run a local server from the project folder:

```bash
npx http-server .
```

Then open the local server URL shown in the terminal.

## Run the test suite

This branch includes a Vitest-based test setup for onboarding and profile behavior.

From the project folder, run:

```bash
npm test
```

The command will execute the tests and report whether the onboarding and profile flows are passing.

