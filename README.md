# Cheerio Growth Missions

A responsive, demo-first React prototype for a guided growth workspace that recommends one relevant business outcome at a time.

## Features

- Outcome-driven mission discovery
- Guided abandoned-cart setup journey
- Deterministic readiness checks and validation states
- Local persistence via browser storage
- Activity history and simulated analytics dashboard
- Settings and reset flow for demo state
- Responsive shell for desktop and mobile layouts

## Local development

```bash
npm install
npm run dev -- --host 0.0.0.0
```

Then open the local URL reported by Vite (typically http://localhost:5173/).

## Production build

```bash
npm run build
```

## Tests

```bash
npm test
```

## Deployment notes

This project is structured for static deployment on Vercel or a similar host. To deploy on Vercel:

1. Import the repository into Vercel.
2. Set the framework preset to Vite.
3. Use the default build command: `npm run build`
4. Use the default output directory: `dist`
5. Keep the app client-side only; no backend is required.

## Product decision log

- Chosen strategy: recommend a single mission, not a dashboard of tools.
- Core persona: GlowCart, a small skincare DTC business using WhatsApp.
- Core outcome: recover lost sales via a realistic abandoned-cart workflow.
- Why this works: users understand the opportunity, the business reason, the exact setup steps, and the validation gate before activation.
- Demo safety: no real messaging is sent; every activation is explicitly labelled as a demo workflow.

## QA checklist

- Home recommendation renders with a clear CTA.
- Mission discovery search and filters work.
- Abandoned-cart setup can be completed through the seven-step flow.
- Readiness checks block when the integration is disconnected, the audience is empty, or the template is pending approval.
- A valid configuration passes readiness and can be activated.
- Progress and configuration persist after refresh.
- Reset restores the original state.
- App routes load correctly on direct navigation.

## AI-assisted development log

- Task requested: build a product prototype for Cheerio Growth Missions with a guided abandoned-cart recovery journey and demo state persistence.
- Prompt used: the project prompt in the attached assignment brief.
- Output accepted: a Vite + React prototype with route-based workspace, recommendation engine, setup flow, validation checks, and analytics.
- Important correction: the initial toolchain was updated to Node-20-compatible versions because the default Vite/Vitest stack required a newer runtime than the environment provided.
- Evidence of actual testing: `npm test` and `npm run build` were run successfully after implementation.

## Limitations

- All analytics and activity are simulated demo data.
- No external LLM or real messaging services are used.
- This is a frontend prototype and should not be treated as production customer data or production feature telemetry.

