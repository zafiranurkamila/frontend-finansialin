
# Migrated to Next.js (App Router)

## Run locally
```bash
npm install
npm run dev
```

Open http://localhost:3000

## Routes created
- `/` (simple home)
- `/login` (migrated from src/pages/Login.jsx; uses app/style/Login.css)
- `/register` (migrated from src/pages/Register.jsx; uses app/style/Register.css)

## Notes
- `react-router-dom` has been removed; routing is file-based.
- Global styles from `src/index.css` and `src/App.css` merged into `app/globals.css`.
- Assets moved into `/public` and can be referenced as `/fileName.ext`.
- Components/hooks inside `login` or `register` are marked as Client Components via `'use client'` due to state usage.
