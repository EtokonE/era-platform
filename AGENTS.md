# Repository Guidelines

This document summarizes expectations for Codex-style agents contributing to this repository. Instructions apply recursively to
all subdirectories unless a nested `AGENTS.md` overrides them.

## Core Design Principles
- **KISS (Keep It Simple, Stupid):** Prefer straightforward, easy-to-read solutions. Choose clarity over cleverness and avoid unnecessary abstractions.
- **Open/Closed Principle:** Design components so that new behavior can be added through extension rather than modifying existing, stable code paths.
- **Avoid Over-Engineering:** Implement only the functionality required by the task at hand. Defer speculative features or premature optimization until they are justified.
- **Bias Toward Maintainability:** Favor patterns that are already established in this codebase. When extending functionality, explain how the change fits alongside the existing architecture.

## Development Practices
- **Understand the Scope:** Review task requirements, existing documentation, and relevant modules before coding. Ask for clarification if requirements are ambiguous.
- **Small, Focused Changes:** Keep diffs cohesive. Separate unrelated fixes into independent commits when possible.
- **Tests and Verification:** Every code change must be accompanied by thorough automated coverage—write and update unit, integration, and end-to-end tests as applicable, and run the full relevant suites after each change. Document any skipped checks and provide reasoning.
- **Documentation:** Update README files, inline comments, or API docs when behavior changes or new functionality is introduced.
- **Error Handling:** Prefer explicit error handling and informative messages. Avoid catching exceptions solely to silence them.
- **Dependencies:** Reuse existing tooling (for example, `uv` for backend Python packages and npm for the frontend) instead of introducing new dependencies unless there is a clear, documented benefit.

## Code Quality Expectations
- Follow existing project conventions for naming, formatting, and file structure.
- Reuse existing utilities and helpers instead of duplicating logic.
- Add meaningful logging only when it aids debugging or monitoring; avoid noisy logs.
- Keep configuration changes minimal and scoped; document why any defaults are being overridden.

## Dev Environment Tips
- Use `docker compose watch` from the repository root to boot the local stack described in `development.md`. This starts the backend FastAPI service, database, and supporting infrastructure.
- Manage backend dependencies with `uv`. From `backend/`, run `uv sync` to install packages and `uv run <command>` (for example `uv run fastapi dev` or `uv run alembic upgrade head`) to execute tooling inside the virtual environment.
- For isolated backend work, activate the virtual environment with `source backend/.venv/bin/activate` and point your editor to `backend/.venv/bin/python`.
- Frontend dependencies are tracked with npm. From `frontend/`, run `npm install` once, then `npm run dev` for local Vite development or `npm run build` to verify production builds.
- When generating or updating the TypeScript client, use the helper script `./scripts/generate-client.sh`. Ensure the backend OpenAPI schema is current before regenerating.

## Testing Instructions
- Review the CI configuration in `.github/workflows/` (notably `lint-backend.yml`, `test-backend.yml`, `playwright.yml`, and `test-docker-compose.yml`) to confirm which checks are expected to pass.
- Backend unit and integration tests run with Pytest. From `backend/`, execute `uv run pytest`—optionally with a path such as `uv run pytest tests/api`—to reproduce the CI suite locally. Add or update tests to cover all new backend behavior before running the suite.
- For end-to-end checks, bring the stack up (`docker compose up -d`) and run `npx playwright test` from `frontend/` to execute the Playwright suite. Add or update end-to-end coverage for new user flows and run the entire suite unless a narrower scope is justified.
- Lint the frontend with `npm run lint`. If you modify TypeScript types or build outputs, also run `npm run build`.
- Use `./scripts/test.sh` for a containerized integration test cycle that mirrors the `test-docker-compose` workflow when a change affects multiple services.
- Fix any test or type errors before opening a PR. If a check must be skipped, explain why and how it will be addressed.

## PR Instructions
- Title format: `[era-platform] <Concise summary>`.
- Summaries should state the problem being solved, the core approach, and any notable limitations or follow-up work.
- Always run `uv run pytest` for backend changes and `npm run lint` plus `npm run build` for frontend changes before committing. Mention the commands executed in the PR description.
- Reference related issues or tickets when applicable.
- Highlight any follow-up work or known limitations in the PR description.
