## GDG Study Agent

Quiz-first study agent that passively detects micro-slips and triggers autonomous micro-interventions before students visibly fail.

### Stack
- Next.js (App Router) + TypeScript + Tailwind
- Prisma + PostgreSQL
- Rule-based drift scoring + intervention orchestration

### Core Features
- Passive signal tracking (`IDLE_SPIKE`, `RAPID_GUESS`, `HINT_OVERUSE`)
- Timetable + non-skippable obligations
- Schedule adherence-based off-track detection
- Drift scoring (`LOW`/`MEDIUM`/`HIGH`) with reason tags
- Autonomous intervention timeline (cooldown-aware)

### Run Locally
```bash
npm install
npm run db:setup
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), then click **Initialize Demo Data** on home.

If Docker is not available, start your own PostgreSQL and set `DATABASE_URL` in `.env`, then run:

```bash
npm run db:push
npm run db:generate
```

### Main Routes
- `/dashboard`
- `/quizzes`
- `/schedule`
- `/checkin`
- `/interventions`
- `/admin/at-risk`

### API Endpoints
- `POST /api/bootstrap`
- `GET/POST /api/quizzes`
- `POST /api/quizzes/:id/attempt`
- `POST /api/events/passive`
- `POST /api/checkins`
- `GET/POST /api/schedule/blocks`
- `POST /api/schedule/adherence`
- `GET/POST /api/obligations`
- `POST /api/interventions/evaluate`
- `GET /api/dashboard/me`
- `GET /api/admin/at-risk-students`

### UI Note
The UI intentionally uses a flat visual style with solid colors only (no gradients).

### Build Check
Production build passes with:

```bash
npm run build
```
