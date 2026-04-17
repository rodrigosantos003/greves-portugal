# API Layering Guide

Use this import direction to keep code organized and avoid cross-layer coupling:

`routes -> controllers -> services -> domain + infra -> models`

## Responsibilities

- `routes`: URL wiring and middleware.
- `controllers`: request/response handling only.
- `services`: orchestrates use-cases and workflow.
- `domain`: pure business rules and parsing logic (no DB, no Express).
- `infra`: external integrations (DB repositories, scrapers, logging adapters).
- `models`: Mongoose schema definitions.

## Rules

- Files ending in `*.controller.ts` should only live under `controllers`.
- `domain` must not import from `controllers`, `routes`, or `infra`.
- `infra` must not import from `controllers` or `routes`.
- Prefer repository functions over direct `Strike` model access outside `infra/repositories`.
