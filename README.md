# Bomb Mopper

https://seanwevans.github.io/bomb-mopper/


## Game Overview

Bomb Mopper recreates classic Minesweeper gameplay. Choose a difficulty, reveal cells, and flag mines. Clearing all non-mine squares wins the game. A cheat mode is also available for practice.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
   Vite will start a local server, usually at `http://localhost:5173/bomb-mopper`.

## Build and Deployment

The project uses Vite for building and the `gh-pages` package for deployment.

- **Build**: Generate the optimized production files in `dist`.
  ```bash
  npm run build
  ```
- **Deploy**: The `deploy` script pushes the contents of `dist` to the `gh-pages` branch, making the game available at the GitHub Pages URL.
  ```bash
  npm run deploy
  ```

## Testing

Before running tests ensure all dependencies are installed. You can use either `npm ci` or `npm install`:

```bash
npm ci
# or
npm install
```

Execute the test suite with:

```bash
npm test
```

