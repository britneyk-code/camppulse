# CampPulse 🏕️

> A lightweight engagement tracking tool for camp counselors to log camper participation, spot disengagement patterns, and improve session planning.

Live app: (https://camppulse-ebon.vercel.app/)
---

## The Problem

Counselors track camper engagement through gut feeling — nothing is logged, patterns aren't visible, and there's no data to improve future sessions.

The result:
- Disengaged campers go unnoticed 
- Ineffective activities get repeated
- Every counselor starts from scratch with no institutional knowledge

---

## What I Built

CampPulse gives counselors a fast, tap-based tool to log engagement after activities and surface patterns over time.

- **Session management** — organize campers by group (e.g. Week 1 DC1, Week 2 ON3)
- **Camper profiles** — linked to sessions, easy to read and fine
- **Quick log** — select camper → select activity → tap engagement (1–5) → tap mood → save. Under 15 seconds.
- **Activity library** — categorized as creative, competitive, physical, or social
- **Insights dashboard** — average engagement per activity, auto-generated pattern cards per camper

---

## Insight Cards (the PM-level feature)

After substantial logs, CampPulse automatically surfaces patterns like:

> *"Alex thrives in creative activities (4.2/5) but disengages during competitive ones (1.8/5)"*

This turns raw logs into actionable guidance for counselors — without requiring additional analysis on their part.

---

## What I Intentionally Left Out (v1)

- Counselor login/auth — unnecessary friction for an MVP
- Notifications or alerts — post-validation feature
- Export or reporting — not the core value
- Admin dashboard — out of scope for v1

---

## Tech Stack

| Layer | Tool |
|---|---|
| Frontend | Next.js + Tailwind CSS |
| Database | Supabase |
| Deployment | Vercel |

---

## Results

- Reduced Administrative Overhead: Core logging flow validated to take **under 15 seconds per entry**, significantly reducing administrative time for staff immediately following camp activities.
- High Intuitive Usability Rating: Received 100% positive qualitative validation from active camp counselors, who cited the visual display as "easy and highly intuitive" for high-frequency logging.
- Automated Analytics Execution: Achieved full coverage for insight pattern detection across active camper and activity combinations, successfully turning raw log data into actionable summaries.
- End-to-End Delivery:  Scoped, designed, developed, and launched the full-stack system autonomously within the target development cycle.
---

## Running Locally

```bash
git clone https://github.com/britneyk-code/camppulse.git
cd camppulse
npm install
```

Create a `.env.local` file:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

```bash
npm run dev
```
