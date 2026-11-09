# HIREFLOW AI - SOFTWARE REQUIREMENTS SPECIFICATION
**AI-Powered Recruitment and CV Processing SaaS Platform**
*Version 1.0 — Initial Requirements Baseline*

## 1. Introduction
HireFlow AI is an AI-powered recruitment management platform designed to help organizations improve recruitment workflows through CV processing, candidate information extraction, job requirement analysis, application management, and recruiter assistance.

### Primary Application Experiences
- **Organization Dashboard**: Recruiters and administrators manage jobs, candidates, applications, CV processing, AI-assisted assessments, recruiter notes, integrations, and reports.
- **Candidate Application Portal**: Candidates view available job opportunities and submit applications with their CVs and relevant information.
- **Recruitment Email Intake**: Organizations receive candidate CVs through connected recruitment mailboxes and n8n automations.

---

## 2. Technology Stack
- **Frontend**: Next.js, TypeScript, Tailwind CSS, Lucide icons.
- **Backend**: Python, FastAPI, Pydantic v2.
- **Database**: PostgreSQL / SQLAlchemy / Alembic.
- **AI Processing**: Google Gemini API.
- **Task Queue**: Celery + Redis.
- **Workflow Automation**: n8n.
- **Document Storage**: Google Drive API / Pluggable Local Storage.
- **Infrastructure**: Docker Compose.

---

*(Refer to the full specification document for functional requirements FR-001 through FR-099, Non-Functional Requirements NFR-001 through NFR-039, and Acceptance Criteria AC-001 through AC-020).*

