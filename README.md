# HRADA — AI Workforce Intelligence

A clickable frontend prototype of HRADA: a workforce intelligence tool for growing Thai SMEs
that answers three questions most organisations cannot answer about the people they already
employ — what is each person actually good at, what work fits them, and what should they learn
next.

The product loop is **RECRUIT → MATCH → DEVELOP → TRACK**, with new data feeding back into
RECRUIT. Its core is the Employee Skill Graph: instead of storing someone as "Marketing
Executive", HRADA holds their skills and levels, the evidence behind each level, their
projects, performance, learning history, career goal and current workload.

**The rule the whole system is built around:** HRADA is a decision-support system, not an AI
that decides for people. Every path through it is *analyse → recommend → explain → a human
decides*. Nothing auto-rejects a candidate, auto-assigns a person, or approves a promotion.
Every number on screen can be opened to show what produced it.

## Running it

Requires Node 20 or newer.

```bash
npm install
npm run dev        # http://localhost:5173
```

There is no backend, no database, and no LLM call at runtime. All data is TypeScript in
`src/data/`, and every figure is computed in the browser. Running the app costs nothing.

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Type-check and build to `dist/` |
| `npm run preview` | Serve the production build |
| `npm test` | Run the test suite (120 tests) |
| `npm run typecheck` | Type-check app and tests separately |
| `npm run lint` | Oxlint |

Interactive state — candidate decisions, checked learning steps, the current role — persists to
`localStorage` so a demo survives a refresh. If storage is unavailable (a private window, or a
browser set to block site data) it falls back to memory rather than failing.

## Trying the prototype

Pick a role on the entry screen; the role switcher at the top right changes it at any time.
Switching role changes routing and menus, not just what is hidden — an Employee who navigates
straight to `/recruit` is redirected to an explanation.

A useful path through the demo:

1. **Sign in as HR** → the Workforce Dashboard. The Skill Constellation is the centrepiece: one
   node per person, a line wherever two people share a skill at 3.0 or above, thickness from how
   much they share, and a slow orange pulse on anyone over 85% committed. Clicking a node expands
   it into that person's profile.
2. **Employee Skill Profile → Jenjira** — click any skill to see the evidence behind its level,
   and open the Promotion Readiness panel to see the weighting that produced 83%.
3. **AI Recruit → Senior Data Analyst** — the highest-scoring candidate is also the one missing a
   critical skill, and the warning is shown separately from the score so an average cannot bury it.
4. **AI Team Matching → AI Marketing Campaign** — the team is assembled by covering the project's
   open requirements, not by taking the highest individual scores. Adjust the team size and the
   proposal recomputes. The AI Tools gap it cannot close links straight into Recruit.
5. **Personalized Learning → Nicha** — two completed Client Handling courses moved her level from
   3.2 to 3.3, which trips the low-outcome warning. That is the argument for learning in the flow
   of work, in one number.
6. **Switch to Employee** and try reaching a screen that role cannot open.

## How it is built

- **Vite 8 + React 19 + TypeScript**, real routes via React Router (not tab state, so permissions
  can be enforced at navigation time)
- **Tailwind 4** with the design tokens declared in an `@theme` block in `src/index.css`
- **Framer Motion** for all animation, **Recharts** for charts, **Zustand** for state,
  **lucide-react** for icons

```
src/
  data/          mock data — employees, skills, roles, jobs, candidates, projects, catalog
  lib/
    scoring.ts   every calculation in the product
    constellation.ts   the skill-graph layout
    permissions.ts     who can see what
    theme.ts     design tokens mirrored for TS consumers
  components/    ui primitives, charts, the constellation
  pages/         the eight screens plus the not-authorized page
  store/         Zustand stores, persisted to localStorage
  test/          render, permission and design-rule tests
```

### Every number comes from one file

`src/lib/scoring.ts` holds all the arithmetic as pure functions, each returning both a value and
the reasoning behind it. Screens render numbers; they never compute them. Change one skill level
in `src/data/employees.ts` and every dependent figure on every screen moves with it.

The four AI engines the product describes map onto it directly:

| Engine | Functions |
| --- | --- |
| Skill Intelligence | `sharedSkillEdges`, `evidenceStrength`, `avgMonthlyGrowth`, `totalSkillLevel` |
| Matching | `calcCandidateMatchScore`, `calcTeamFit`, `selectTeam` |
| Learning | `generateLearningPath`, `calcLearningOutcome`, `calcSkillCompletionRate`, `calcTimeToCompetency` |
| Workforce Intelligence | `calcWorkforceHealth`, `generateInsights`, `calcPromotionReadiness`, `classifyTalent` |

Two decisions in there are worth knowing about:

- **Talent classification uses criteria, never a ranking.** Someone is a Core Expert because they
  hold a skill at 4.3+ with at least two independent evidence sources and performance at 4.0+ —
  not because they land in some top percentile of their colleagues. Anyone meeting none of the
  three sets of criteria is marked unqualified and the UI says so, rather than inventing a
  category for them.
- **Team selection covers requirements rather than taking the top N.** The three highest
  individual fits are often the same profile, which leaves half a project unstaffed. The algorithm
  repeatedly picks whoever closes the most open requirements, then fills remaining slots by fit
  among people with real capacity, and guarantees a Developing Talent on any team of four or more.

### Critical vs. at-risk skills

The source brief defined a Critical Skill Gap as "fewer than 2 people meet the bar" and an
At-Risk Skill as "exactly 1 person meets the bar". Those overlap — every at-risk skill would also
be critical — so the two are separated here by asking different questions:

- **Critical** — the business has committed to work needing this skill and *nobody* can do it at
  the level committed. Derived from open jobs and active projects only, since a role someone hopes
  to grow into is not work owed to a client. On this dataset: AI Tools, alone.
- **At-Risk** — exactly one person in the company holds the skill at 4.0, whether or not there is
  open work for it. A key-person problem. Eleven skills qualify, which is the honest reading of a
  14-person company: it is one deep in almost everything. The Insights screen shows the five
  thinnest benches and expands to the rest.

The two sets cannot intersect: critical means zero owners, at-risk means one.

## Design

A closed palette of ten tokens, declared once in `src/index.css` and mirrored in
`src/lib/theme.ts`. `sky` is not decoration — it means "a scoring function produced this number",
and the association only holds if nothing else uses it. Departments are encoded as opacity steps
of `sky` rather than five invented hues, for the same reason.

Type is IBM Plex Sans Thai for text and IBM Plex Mono with tabular figures for every number in
the system, including the figures inside sentences the scoring engine writes.

Motion appears in exactly two situations: responding to something the user did, and one
orchestrated entrance on the Dashboard's first load. Under `prefers-reduced-motion` all of it
collapses to a short opacity fade, enforced both in the components and as a stylesheet backstop.

Interface copy is Thai; HR terminology stays in English (Skill Gap, Match Score, Learning Path,
Workforce Health, Core Expert, Bridge Member, Developing Talent, Promotion Readiness, Internal
Mobility, Workload, Skill Coverage).

## Tests

120 tests across five files:

- **`src/lib/scoring.test.ts`** — every scoring function, plus dataset integrity (evidence rules,
  level ranges, history completeness) and each of the seven cases the brief plants in the data.
- **`src/test/screens.dom.test.tsx`** — every screen under every role that can open it, failing on
  any console error or warning, plus the permission redirects.
- **`src/test/mono-numbers.dom.test.tsx`** — walks the rendered DOM of all eleven routes and fails
  on any digit not in the mono face.
- **`src/test/reduced-motion.dom.test.tsx`** — re-renders every screen with the media query
  reporting true, so the reduced branches actually execute.
- **`src/components/ui/NumericText.test.tsx`** — the splitter that puts figures inside prose into
  the mono face.

## Out of scope

No backend or database, no real authentication, no LLM calls, no payroll, attendance, LMS, ERP or
CRM. This is a prototype of the decision layer, not an HR system.

The original specification is kept in `spec/` for reference.
