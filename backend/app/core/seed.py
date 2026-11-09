import uuid
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.user import User
from app.models.organization import Organization, OrganizationMember, OrganizationRole, OrganizationStatus
from app.models.job import Job, JobRequirement, JobStatus, RequirementCategory
from app.models.candidate import Candidate, CandidateExperience, CandidateEducation, CandidateSkill
from app.models.application import Application, ApplicationStatus, ApplicationSource, ApplicationEvent, RecruiterNote
from app.models.document import ApplicationDocument, DocumentProcessingStatus
from app.models.ai import MatchAssessment, RecruiterSummary, RequirementEvidenceStatus

def seed_initial_data():
    db: Session = SessionLocal()
    try:
        # Check if already seeded
        if db.query(Organization).first():
            return

        # 1. Platform Superadmin
        admin_user = User(
            email="admin@hireflow.ai",
            full_name="Platform Administrator",
            hashed_password=get_password_hash("AdminPass123!"),
            is_active=True,
            is_superadmin=True
        )
        db.add(admin_user)

        # 2. TechNova Organization
        org = Organization(
            name="TechNova Solutions",
            slug="technova",
            status=OrganizationStatus.ACTIVE,
            subscription_plan="Enterprise"
        )
        db.add(org)
        db.flush()

        # Superadmin membership as Owner
        admin_membership = OrganizationMember(
            organization_id=org.id,
            user_id=admin_user.id,
            role=OrganizationRole.OWNER,
            is_active=True
        )
        db.add(admin_membership)

        # 3. Recruiter User
        recruiter_user = User(
            email="recruiter@technova.io",
            full_name="Sarah Jenkins",
            hashed_password=get_password_hash("Password123!"),
            is_active=True,
            is_superadmin=False
        )
        db.add(recruiter_user)
        db.flush()

        # Recruiter Membership as Owner
        membership = OrganizationMember(
            organization_id=org.id,
            user_id=recruiter_user.id,
            role=OrganizationRole.OWNER,
            is_active=True
        )
        db.add(membership)

        # 4. Create Job 1: Senior Full-Stack Engineer
        job1 = Job(
            organization_id=org.id,
            title="Senior Full-Stack Engineer",
            department="Engineering",
            location="Remote / San Francisco",
            employment_type="Full-time",
            description="We are seeking an experienced Senior Full-Stack Engineer to lead the architecture of our cloud-native platforms, AI pipelines, and responsive recruiter workflows.",
            responsibilities="Architect high-throughput REST APIs with FastAPI; build responsive UI with Next.js and Tailwind CSS; optimize relational databases; collaborate with AI research teams.",
            qualifications="B.S. or equivalent in Computer Science; 5+ years of software engineering experience.",
            experience_level="Senior",
            status=JobStatus.PUBLISHED
        )
        db.add(job1)
        db.flush()

        # Requirements
        reqs1 = [
            ("5+ years building scalable web systems with Python and FastAPI", RequirementCategory.ESSENTIAL),
            ("Proven expertise with React, TypeScript, and modern frontend patterns", RequirementCategory.ESSENTIAL),
            ("PostgreSQL schema architecture and query optimization", RequirementCategory.ESSENTIAL),
            ("Experience with Celery asynchronous task queues and Redis", RequirementCategory.PREFERRED),
            ("Familiarity with Google Gemini API or LLM structured extraction", RequirementCategory.PREFERRED),
        ]
        job1_req_objs = []
        for title, cat in reqs1:
            jr = JobRequirement(job_id=job1.id, title=title, category=cat)
            db.add(jr)
            job1_req_objs.append(jr)
        db.flush()

        # 5. Create Candidate 1
        cand1 = Candidate(
            organization_id=org.id,
            full_name="Alex Rivera",
            email="alex.rivera@example.com",
            phone="+1 (555) 234-5678",
            location="San Jose, CA",
            linkedin_url="https://linkedin.com/in/alex-rivera-dev",
            portfolio_url="https://github.com/alexrivera-eng",
            professional_summary="Senior Full-Stack Engineer with 6 years experience building high-traffic SaaS applications, microservices with Python and FastAPI, and interactive dashboards with React and TypeScript."
        )
        db.add(cand1)
        db.flush()

        # Experiences
        exp1 = CandidateExperience(
            candidate_id=cand1.id,
            company="CloudScale Systems",
            role="Lead Backend Engineer",
            location="San Francisco, CA",
            start_date="2021",
            end_date="Present",
            is_current="true",
            description="Built distributed microservices in FastAPI and Celery handling 45M requests/day; reduced Postgres latency by 40%."
        )
        exp2 = CandidateExperience(
            candidate_id=cand1.id,
            company="DevPulse Labs",
            role="Full Stack Developer",
            location="Austin, TX",
            start_date="2018",
            end_date="2021",
            is_current="false",
            description="Implemented customer-facing portal using Next.js and TypeScript; integrated LLM-powered search tools."
        )
        db.add_all([exp1, exp2])

        # Education
        edu1 = CandidateEducation(
            candidate_id=cand1.id,
            institution="University of California, Berkeley",
            degree="B.S. in Computer Science",
            field_of_study="Computer Science",
            start_year="2014",
            end_year="2018"
        )
        db.add(edu1)

        # Skills
        for sk_name in ["Python", "FastAPI", "React", "TypeScript", "PostgreSQL", "Celery", "Redis", "Docker"]:
            db.add(CandidateSkill(candidate_id=cand1.id, skill_name=sk_name, source_evidence="Extracted from CV"))

        # 6. Create Application
        app1 = Application(
            organization_id=org.id,
            job_id=job1.id,
            candidate_id=cand1.id,
            status=ApplicationStatus.UNDER_REVIEW,
            source=ApplicationSource.WEBSITE,
            assigned_recruiter_id=recruiter_user.id,
            cover_letter="I am excited to apply for the Senior Full-Stack role at TechNova. With my 6 years architecting high-scale Python backends and modern Next.js interfaces, I am confident I can make an immediate impact."
        )
        db.add(app1)
        db.flush()

        # Document
        doc1 = ApplicationDocument(
            id=str(uuid.uuid4()),
            application_id=app1.id,
            file_name="Alex_Rivera_Senior_FullStack_CV.pdf",
            file_type="pdf",
            mime_type="application/pdf",
            file_size_bytes=425120,
            storage_provider="LocalStorageService",
            storage_path="./storage/cvs/sample_alex_rivera.pdf",
            status=DocumentProcessingStatus.COMPLETED,
            parsed_text="Alex Rivera - Senior Full Stack Engineer. 6 years experience in Python, FastAPI, React, PostgreSQL, Celery, Redis."
        )
        db.add(doc1)

        # Match Assessment
        criteria = [
            {
                "requirement_id": job1_req_objs[0].id,
                "title": job1_req_objs[0].title,
                "category": "Essential",
                "status": "Evidenced",
                "explanation": "Candidate has 6 years total experience including Lead Backend Engineer at CloudScale Systems using FastAPI.",
                "cv_excerpt": "Built distributed microservices in FastAPI handling 45M requests/day",
                "page_number": 1
            },
            {
                "requirement_id": job1_req_objs[1].id,
                "title": job1_req_objs[1].title,
                "category": "Essential",
                "status": "Evidenced",
                "explanation": "Demonstrated Next.js and TypeScript production development at DevPulse Labs.",
                "cv_excerpt": "Implemented customer-facing portal using Next.js and TypeScript",
                "page_number": 1
            },
            {
                "requirement_id": job1_req_objs[2].id,
                "title": job1_req_objs[2].title,
                "category": "Essential",
                "status": "Evidenced",
                "explanation": "Direct Postgres query tuning and latency reduction cited in work history.",
                "cv_excerpt": "Reduced Postgres latency by 40% through indexing and schema optimization",
                "page_number": 1
            },
            {
                "requirement_id": job1_req_objs[3].id,
                "title": job1_req_objs[3].title,
                "category": "Preferred",
                "status": "Evidenced",
                "explanation": "Active production experience with Celery and Redis queuing.",
                "cv_excerpt": "Built distributed microservices in FastAPI and Celery with Redis",
                "page_number": 1
            },
            {
                "requirement_id": job1_req_objs[4].id,
                "title": job1_req_objs[4].title,
                "category": "Preferred",
                "status": "Partially Evidenced",
                "explanation": "Integrated LLM search tools at DevPulse Labs, but specific Gemini API experience not detailed.",
                "cv_excerpt": "Integrated LLM-powered search tools",
                "page_number": 1
            }
        ]

        assessment1 = MatchAssessment(
            application_id=app1.id,
            job_id=job1.id,
            model_name="gemini-1.5-flash",
            overall_fit_summary="Strong candidate matching 3/3 Essential requirements and 1.5/2 Preferred requirements with solid verifiable architectural background.",
            essential_requirements_met="3/3",
            preferred_requirements_met="1/2",
            criteria_assessments=criteria,
            is_reviewed_by_recruiter="false"
        )
        db.add(assessment1)

        # Recruiter Summary
        summary1 = RecruiterSummary(
            application_id=app1.id,
            candidate_overview="Alex Rivera is a seasoned Senior Full-Stack Engineer with 6 years of hands-on experience designing cloud services and responsive modern web applications.",
            key_strengths=[
                "6 years building high-scale Python/FastAPI microservices",
                "Strong database optimization background (40% Postgres latency improvement)",
                "Solid modern Next.js/React frontend experience"
            ],
            potential_gaps=[
                "Probe deeper on Gemini API or multi-agent LLM tool execution",
                "Confirm salary expectations and remote collaboration preferences"
            ],
            suggested_interview_questions=[
                "Walk us through how you scaled FastAPI microservices to handle 45M requests per day at CloudScale Systems.",
                "How do you organize state management between React server components and client components in Next.js?",
                "Describe a situation where a PostgreSQL query underperformed under heavy concurrency and how you resolved it.",
                "How did you evaluate prompt latency and response reliability when integrating LLMs at DevPulse Labs?"
            ],
            model_name="gemini-1.5-flash"
        )
        db.add(summary1)

        # Note
        note1 = RecruiterNote(
            application_id=app1.id,
            author_id=recruiter_user.id,
            content="Alex looks like an exceptional match for the Senior Full-Stack position. CV evidence is clear and backed by metrics. Recommended for initial technical screening."
        )
        db.add(note1)

        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error seeding data: {e}")
    finally:
        db.close()

