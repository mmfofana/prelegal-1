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
The database uses SQLite with SQLAlchemy. In Docker it is stored at `/app/data/prelegal.db` on a named volume (`prelegal-data`) so it persists across restarts. In local dev it creates `backend/prelegal.db`.  
The frontend is statically exported (`next build`) and served by FastAPI — single container, no nginx.  
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
- SQLite via SQLAlchemy: `backend/database.py` with `init_db()` on startup; Docker volume `prelegal-data` for persistence
- User auth: HTTP-only session cookies (`itsdangerous` + bcrypt); `SESSION_SECRET` loaded from `.env`
- Auth endpoints: `POST /api/auth/signup`, `POST /api/auth/signin`, `POST /api/auth/signout`, `GET /api/auth/me`
- Frontend `/login` and `/signup` pages; NDA page gated behind `useAuth()` hook (redirects to `/login`)
- Next.js `output: 'export'` static build served by FastAPI; dev proxy still works via conditional `rewrites`
- `main.py` loads `.env` from project root via `load_dotenv()` — required for `SESSION_SECRET` and `CORS_ORIGINS`
- Start/stop scripts for Mac, Linux, and Windows in `scripts/`
- 36 backend tests (100% pass rate); in-memory SQLite with `StaticPool` for test isolation

### Running with Docker
```bash
scripts/start-mac.sh   # or start-linux.sh
# Open http://localhost:8000
scripts/stop-mac.sh
```

### Completed (PL-5)
- Left panel now has a **Chat | Form** tab toggle; both tabs share `formData` state and the live preview remains on the right
- **Chat tab**: freeform AI conversation — AI (gpt-oss-120b via Cerebras/OpenRouter) extracts field values via structured outputs and updates the document incrementally
- `POST /api/chat` (auth-gated): receives `{document_type, messages, current_fields}`, returns `{reply, fields}`; stateless
- `backend/deps.py`: shared `get_current_user` FastAPI dependency used by both auth and chat routers
- `frontend/src/components/ChatPanel.tsx`: message list, auto-scroll, Enter to send, auto-focus after AI response

### Completed (PL-6)
- **All 12 document types supported** — every CommonPaper template now has a working chat, form, preview, and PDF download
- `backend/document_registry.py`: central `DocumentTypeDef` registry drives AI prompts, PDF templates, and field definitions for all document types
- `backend/schemas/document.py`: generic `GeneratePdfRequest`, `PartialDocumentFields`, `AiDocumentOutput`, `DocumentChatRequest` replace NDA-specific schemas
- `backend/services/pdf_service.py`: dispatches to per-document Jinja2 cover templates; standard terms rendered from markdown via `markdown` library; `_cover_base.html` macro library shared across all templates
- `backend/services/chat_service.py`: dynamic system prompts built from registry field definitions; AI asks follow-up questions when required fields are missing
- `frontend/src/lib/document-registry.ts`: TypeScript mirror of backend registry
- `frontend/src/types/document.ts`: generic `DocumentFormData` with `extra_fields: Record<string, string>`
- `frontend/src/app/document/[slug]/` dynamic route: `page.tsx` (server, exports `generateStaticParams`) + `DocumentEditor.tsx` (client); header dropdown to switch document types
- `frontend/src/app/page.tsx`: catalog home page with grid of all 12 document cards
- 53 backend tests (100% pass rate); Next.js static build generates all 12 document routes

### Completed (PL-8)
- **7 new features** added across backend and frontend
- **Clause Tooltips**: AI explains any document section in plain English; `POST /api/explain-clause` → `backend/services/explain_service.py`; `ClauseTooltip` component in `DocumentPreview.tsx`
- **AI Document Review**: completeness score, risk flags, suggestions; `POST /api/review-document` → `backend/services/review_service.py`; `ReviewPanel.tsx` + "Review" tab in `DocumentEditor.tsx`
- **Saved Party Profiles**: CRUD for reusable company/contact info; `GET/POST/PUT/DELETE /api/parties`; `PartyLoader.tsx` in `DocumentForm.tsx`
- **DOCX Export**: python-docx cover page + markdown standard terms; `POST /api/generate-docx`; `DownloadDocxButton.tsx` in header
- **Version History**: auto-saved on every PDF download; `GET /api/documents/{id}/versions`; `frontend/src/app/history/[doc_id]/versions/`; restore via sessionStorage
- **Share Links**: 30-day read-only public link; `POST /api/documents/{id}/share`; `frontend/src/app/share/[token]/`
- **E-Signature**: type-to-sign with email invites; `POST /api/documents/{id}/signing-sessions`; `frontend/src/app/sign/[token]/`; `SigningModal.tsx`
- `backend/models/`: 4 new models — `DocumentVersion`, `DocumentShare`, `SigningSession`, `SigningRequest`, `Party`
- SMTP email service with graceful no-SMTP fallback (`backend/services/email_service.py`)
- SQLite foreign-key enforcement via `PRAGMA foreign_keys=ON` event listener (`database.py`)
- 115 backend tests (100% pass rate); Next.js static export includes 3 new dynamic routes

### GitHub
- Remote is `mmfofana/prelegal-1` (origin). Do not push to `ed-donner/prelegal`.
