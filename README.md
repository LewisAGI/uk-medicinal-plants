# UK medicinal plants

A static field guide to UK medicinal plants. Evidence grades, explanations, sources, and safety notes come from the content pack in `data/`. Those files are the pack, unpacked byte-for-byte, and the app does not edit them.

Search and browse work by common name and Latin name. Photo identification is not offered: a hosted identifier would need an API key, and the pack does not include an on-device model.

Habitat and season filters are example data and are labelled **Example data**. Plants graded `no_known_benefit` stay out of the catalogue until an expert reviews them. Names of those plants can still resolve to “No match for medicinal benefits”, with toxicity and lookalike warnings where the pack has them.

The shell carries a not-medical-advice notice. Every plant page carries the pack’s consult-a-professional banner. Dosing and preparation quantities are not shown; matching sentences are stripped before render.

## Scripts

- `npm ci`
- `npm test` — vitest
- `npm run build` — typecheck and write `dist/`
- `npm run test:e2e` — Playwright against the production build

## Cloudflare Pages

Publish the `dist/` directory. `dist/_headers` sets Content-Security-Policy, `X-Content-Type-Options: nosniff`, and `Referrer-Policy`. This repo has no deploy workflow.
