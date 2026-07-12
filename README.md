# Coin System — PDP Frontend

Gamified coin/reward tracker for a coding instructor running 5 Frontend groups at PDP. Teachers score homework, classwork, and Q&A each lesson, students earn coins and redeem them for gifts, and everyone can check the leaderboard.

Fully client-side — no backend. All data lives in `localStorage`, seeded with realistic demo data on first load.

## Stack

React 19 (Vite) + JavaScript · Tailwind CSS v4 · Framer Motion · Recharts · React Router · Zustand · a hand-authored shadcn/ui-style component kit (Radix primitives + CVA), organized as Feature-Sliced Design (`app / pages / widgets / features / entities / shared`).

## Run it

```bash
yarn install
yarn dev
```

Open the printed local URL (defaults to `http://localhost:4000`).

## Demo credentials

Seeded automatically on first load.

- **O'qituvchi (teacher):** `ustoz` / `ustoz2024` — full access: groups CRM, lesson sessions, coin market management, settings.
- **O'quvchi (student):** shown on the login screen's demo hint, or open any group's roster as the teacher (**Guruhlar → [guruh] → login/parol** column) to see any seeded student's credentials — read-only access: own profile, leaderboard, coin market catalog.

To start over with fresh demo data, log in as the teacher and use **Sozlamalar → Ma'lumotlarni tozalash**.

## Scripts

- `yarn dev` — start the dev server
- `yarn build` — production build
- `yarn lint` — ESLint
# edu-erp
# lms-demo
