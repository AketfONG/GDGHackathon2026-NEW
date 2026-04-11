## ImPromptu

Quiz-first app that passively detects micro-slips and triggers autonomous micro-interventions before students visibly fail.

### Stack
- Next.js (App Router) + TypeScript + Tailwind
- MongoDB + Mongoose
- Firebase Auth (Google sign-in + server token verification)
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
npm run dev
```

Copy `.env.example` to `.env.local`, fill MongoDB and Firebase values, then run.

Open [http://localhost:3000](http://localhost:3000), then click **Initialize Demo Data** on home.

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
