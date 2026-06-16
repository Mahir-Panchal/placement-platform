# Interview Prep — AI Placement Intelligence Platform

Common questions and answers for campus placement interviews.

---

## Project Overview (2-minute pitch)

"I built an AI-powered placement preparation platform for engineering
students. It has 5 core features:

1. Resume ATS scoring with AI improvement suggestions
2. AI-generated career roadmap for any target role
3. RAG-based knowledge base using FAISS vector search
4. Job application tracker with analytics dashboard
5. Smart email notifications via Celery Beat

Stack: Django REST Framework + Next.js 14 + PostgreSQL + Redis +
Celery + LangChain + Groq (Llama 3.1).

Deployed on Render and Vercel with GitHub Actions CI/CD.
82% test coverage across 38 tests."

---

## Technical Questions

### Q: How does the RAG pipeline work?

1. User uploads a PDF to the knowledge base
2. PyMuPDF extracts raw text from the PDF
3. LangChain RecursiveCharacterTextSplitter splits into 500-char chunks
   with 50-char overlap
4. fastembed generates vector embeddings for each chunk (BAAI/bge-small)
5. FAISS stores all vectors locally as an index file
6. At query time: query is embedded → top-4 nearest chunks retrieved
7. Chunks + query sent to Groq Llama 3.1 with a grounded prompt
8. Result: answer based only on document content, not hallucinated

---

### Q: How does ATS scoring work?

Weighted formula across 5 factors:

| Factor | Weight | How measured |
|--------|--------|--------------|
| Keyword match | 40% | Scans against 50+ tech skill keywords |
| Contact info | 20% | Checks for email, phone, LinkedIn |
| Word count | 20% | Optimal range 400-800 words |
| Section headers | 10% | Checks for Experience, Education, Projects |
| Skills count | 10% | More unique skills = higher score |

Score is 0-100 with letter grade feedback.

---

### Q: Why Groq instead of OpenAI?

- Free tier with generous rate limits — no credit card needed
- Llama 3.1 8B: sufficient quality for structured JSON output
- 128K context window handles long resumes
- Used temperature=0 for resume analysis (consistent JSON output)
- Used temperature=0.7 for roadmap generation (creative variety)
- Switched from OpenAI after quota was exhausted during development

---

### Q: How do you handle JWT security?

- Access tokens expire in 15 minutes
- Refresh tokens expire in 7 days
- On logout: refresh token blacklisted in DB via SimpleJWT
- After password change: old refresh token blacklisted immediately
- Login rate limited to 5 attempts per minute per IP using django-ratelimit
- Tokens stored in localStorage on frontend

---

### Q: What is Celery Beat used for?

Scheduled tasks that run automatically without cron:

- Every Monday 9AM: weekly placement summary email to all active users
- Every Monday 10AM: stale application reminder for apps with no
  update in 7+ days

Tasks are queued in Redis and executed by Celery workers.
Email templates are HTML with inline CSS for email client compatibility.

---

### Q: How does Redis caching work in the tracker stats?

- Stats endpoint generates an aggregate query across all applications
- Result cached in Redis with key `tracker_stats_{user_id}`
- TTL: 5 minutes
- Cache invalidated on every create, update, or delete operation
- In development: uses Django's local memory cache (no Redis needed)
- In production: uses Redis on Render

---

### Q: What was the hardest technical challenge?

Two main ones:

1. Redis HELLO command incompatibility on Windows — local Redis 3.x
   doesn't support the HELLO command used by redis-py 5.x. Fixed by
   using Django's local memory cache in development.

2. LangChain breaking changes — import paths changed between versions
   (langchain.prompts → langchain_core.prompts). Fixed by pinning
   versions in requirements.txt and never running pip freeze.

---

### Q: How would you scale this to 10,000 users?

- Database: add PostgreSQL read replicas for heavy read queries
- Celery: scale workers horizontally with more containers
- FAISS: replace with Pinecone for managed persistent vector search
- Redis: expand caching layer, add session store
- API: load balancer in front of multiple Django instances
- CDN: CloudFront for static assets and media files
- Async: move resume processing to async with proper job queuing

---

### Q: Explain your test strategy.

38 tests across 5 apps, 82% overall coverage:

- authentication (10 tests): register, login, JWT, password change,
  rate limiting, role assignment
- resume (10 tests): PDF upload, ATS scoring, skill extraction,
  access control, status polling
- roadmap (4 tests): generation, status, unauthenticated access
- rag (4 tests): upload, list, auth guard, query on non-ready doc
- tracker (10 tests): CRUD, filter, search, stats, weekly timeline

Test approach:
- pytest-django with fixtures for user creation and auth
- force_authenticate instead of real HTTP login (faster, reliable)
- Mocking for external services (fastembed, LLM calls)
- CELERY_TASK_ALWAYS_EAGER=True for synchronous task execution in tests

---

### Q: How does the CI/CD pipeline work?

GitHub Actions workflow on every push to main:

1. Spins up PostgreSQL 15 + Redis 7 as service containers
2. Installs Python 3.11 and all dependencies
3. Runs Black formatting check (fails if unformatted)
4. Runs Flake8 linting with max line length 120
5. Runs Django system check
6. Runs pytest with coverage report
7. Fails if coverage drops below 70%
8. Uploads coverage XML as artifact

On success: Render auto-deploys backend, Vercel auto-deploys frontend.

---

### Q: Why Django REST Framework over FastAPI?

- Mature ecosystem with battle-tested auth (SimpleJWT, allauth)
- Built-in admin panel for database management
- Class-based views provide clean separation of concerns
- django-ratelimit integrates seamlessly
- Better ORM with PostgreSQL-specific features
- The team (me) was more familiar with Django patterns

FastAPI would be better for pure performance, but DRF's productivity
advantages outweighed raw speed for this use case.

---

### Q: What would you do differently?

1. Use Pinecone from the start instead of FAISS for production RAG
2. Add TypeScript strict mode to the frontend from day one
3. Set up proper logging with structured JSON logs (used print/logger)
4. Add API versioning (/api/v1/) for future compatibility
5. Use django-storages with S3 for media files instead of local disk
6. Add rate limiting on more endpoints, not just auth

---

## Behavioural Questions

### Q: How long did this take?

35 days of structured development following a day-by-day plan.
Each day had specific deliverables — model, serializer, tests, commit.
Total: approximately 150-200 hours.

### Q: What did you learn?

- How RAG pipelines work end-to-end (chunking, embeddings, retrieval)
- Production deployment constraints vs local development
- The importance of pinning dependency versions early
- Writing tests first makes debugging much faster
- CI/CD catches formatting issues before they become arguments

### Q: How is this different from other placement tools?

Most placement tools are static. This one:
- Analyses YOUR specific resume (not generic advice)
- Generates a roadmap for YOUR target role
- Lets you ask questions about YOUR uploaded placement materials
- Tracks YOUR applications with personalised analytics

Everything is personalised and AI-powered, not templated.
