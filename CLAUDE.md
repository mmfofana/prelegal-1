# Prelegal Project

## Overview

This is a SaaS product to allow users to draft legal agreements based on templates in the templates directory.
The user can carry out AI chat in order to establish what document they want and how to fill in the fields.
The available documents are covered in the catalog.json file in the project root, included here:

@catalog.json

## Development process

When instructed to build a feature:
1. Use your Atlassian tools to read the feature instructions from Jira
2. Develop the feature - do not skip any step from the feature-dev 7 step process
3. Thoroughly test the feature with unit tests and integration tests and fix any issues
4. Submit a PR using your github tools

## AI design

When writing code to make calls to LLMs, use your Cerebras skill to use LiteLLM via OpenRouter to the `openrouter/openai/gpt-oss-120b` model with Cerebras as the inference provider. You should use Structured Outputs so that you can interpret the results and populate fields in the legal document.

There is an OPENROUTER_API_KEY in the .env file in the project root.

## Technical design

The entire project should be packaged into a Docker container.  
The backend should be in backend/ and be a uv project, using FastAPI.  
The frontend should be in frontend/  
The database should use SQLLite and be created from scratch each time the Docker container is brought up, allowing for a users table with sign up and sign in.  
Consider statically building the frontend and serving it via FastAPI, if that will work.  
There should be scripts in scripts/ for:  
```bash
# Mac
scripts/start-mac.sh    # Start
scripts/stop-mac.sh     # Stop

# Linux
scripts/start-linux.sh
scripts/stop-linux.sh

# Windows
scripts/start-windows.ps1
scripts/stop-windows.ps1
```
Backend available at http://localhost:8000

> **Local dev note:** Port 8000 may conflict with other services. Run backend on port 8001 (`uv run uvicorn main:app --reload --port 8001`) and frontend with `npm run dev` (port 3000). The Next.js dev server proxies `/api/*` to port 8001 via `next.config.ts`. Set `CORS_ORIGINS=http://localhost:3000` in `.env` for local dev.

## Color Scheme
- Accent Yellow: `#ecad0a`
- Blue Primary: `#209dd7`
- Purple Secondary: `#753991` (submit buttons)
- Dark Navy: `#032147` (headings)
- Gray Text: `#888888`

## Implementation Status

### Completed (PL-2)
- 12 CommonPaper markdown legal agreement templates in `templates/`
- `catalog.json` with name, description, and filename for each template
- `templates/LICENSE.txt` with CC BY 4.0 attribution

### Completed (PL-3)
- Next.js frontend (`frontend/`) with two-column layout: form left, live preview right
- FastAPI backend (`backend/`) with `POST /api/generate-pdf` and `GET /api/health`
- All Mutual NDA cover page fields: Purpose, Effective Date, MNDA Term, Term of Confidentiality, Governing Law, Jurisdiction, Modifications, Party 1 & 2
- PDF generated server-side via WeasyPrint + Jinja2 HTML template
- Live preview updates instantly as user types
- Download button saves `mutual-nda.pdf`
- 22 backend tests (100% pass rate)
- Dev: backend on port 8001, frontend on port 3000 with `/api/*` proxy

### Running locally (without Docker)
```bash
# Terminal 1 — backend
cd backend && uv run uvicorn main:app --reload --port 8001

# Terminal 2 — frontend
cd frontend && npm run dev
```
Open http://localhost:3000

### Post-PL-3 fixes (on main)
- Locked body/input/textarea to dark text — removed dark-mode CSS vars that caused near-white text on white background
- Placeholder text darkened to `gray-500` for legibility
- Added `suppressHydrationWarning` to `<body>` to suppress Grammarly extension hydration error

### Completed (PL-4)
- Docker: single-container build (`Dockerfile` + `docker-compose.yml`); FastAPI on port 8000 serves both API and static frontend
- SQLite database at `/app/data/prelegal.db` (Docker volume `prelegal-data` for persistence)
- User auth: HTTP-only session cookies via `itsdangerous`; bcrypt password hashing
- Endpoints: `POST /api/auth/signup`, `POST /api/auth/signin`, `POST /api/auth/signout`, `GET /api/auth/me`
- Frontend: `/login` and `/signup` pages; NDA page gated behind auth (client-side redirect)
- Next.js static export (`output: 'export'`) served by FastAPI; dev proxy still works via conditional `rewrites`
- Start/stop scripts for Mac, Linux, and Windows in `scripts/`
- 36 backend tests (100% pass rate); in-memory SQLite with `StaticPool` for test isolation

### Running with Docker
```bash
scripts/start-mac.sh   # or start-linux.sh
# Open http://localhost:8000
scripts/stop-mac.sh
```

### Not yet implemented
- AI chat interface (planned for PL-5+)
- Support for document types other than Mutual NDA (planned for PL-6+)

### GitHub
- Remote is `mmfofana/prelegal-1` (origin). Do not push to `ed-donner/prelegal`.
