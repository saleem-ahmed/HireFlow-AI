import logging
from typing import Optional
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.document import ApplicationDocument, DocumentProcessingStatus
from app.models.application import Application, ApplicationStatus, ApplicationEvent
from app.models.candidate import Candidate, CandidateExperience, CandidateEducation, CandidateSkill
from app.models.job import Job
from app.models.ai import ExtractionRun, MatchAssessment, RecruiterSummary
from app.services.document_parser import parser_service
from app.services.storage_service import get_storage_service
from app.services.gemini_service import gemini_service
from app.services.n8n_service import n8n_service
from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)

def process_document_pipeline_sync(document_id: str):
    """
    Core CV processing pipeline. Executable either via Celery task or directly synchronously.
    """
    db: Session = SessionLocal()
    try:
        doc = db.query(ApplicationDocument).filter(ApplicationDocument.id == document_id).first()
        if not doc:
            logger.error(f"Document {document_id} not found")
            return {"status": "error", "message": "Document not found"}

        doc.status = DocumentProcessingStatus.PROCESSING
        db.commit()

        app = db.query(Application).filter(Application.id == doc.application_id).first()
        if not app:
            doc.status = DocumentProcessingStatus.FAILED
            doc.error_message = "Associated application not found"
            db.commit()
            return {"status": "error", "message": doc.error_message}

        app.status = ApplicationStatus.PROCESSING
        db.commit()

        # 1. Retrieve file bytes from storage
        storage = get_storage_service()
        try:
            file_bytes = storage.get_file_bytes(doc.storage_path)
        except Exception as e:
            doc.status = DocumentProcessingStatus.FAILED
            doc.error_message = f"Storage retrieval error: {str(e)}"
            db.commit()
            return {"status": "error", "message": doc.error_message}

        # 2. Parse text
        text, pages = parser_service.extract_text(file_bytes, doc.file_type)
        doc.parsed_text = text

        # 3. Check for adversarial injection
        injections = parser_service.check_for_injections(text)
        if injections:
            logger.warning(f"Adversarial patterns detected in document {doc.id}: {injections}")
            # Mark for manual review or quarantine if severe
            doc.error_message = f"Suspicious instruction patterns detected: {', '.join(injections)}"

        # 4. Extract structured candidate profile via Gemini
        candidate_data = gemini_service.extract_candidate_profile(text, candidate_hint=app.candidate.full_name if app.candidate else None)
        
        # Save ExtractionRun audit
        extraction_run = ExtractionRun(
            application_id=app.id,
            document_id=doc.id,
            ai_provider="Google Gemini",
            model_name=gemini_service.model_name,
            raw_response=None,
            structured_data=candidate_data,
            status="Completed"
        )
        db.add(extraction_run)

        # 5. Update Candidate Record
        candidate = app.candidate
        if candidate:
            if candidate_data.get("full_name") and candidate.full_name == "Candidate":
                candidate.full_name = candidate_data["full_name"]
            if candidate_data.get("phone") and not candidate.phone:
                candidate.phone = candidate_data["phone"]
            if candidate_data.get("location") and not candidate.location:
                candidate.location = candidate_data["location"]
            if candidate_data.get("linkedin_url") and not candidate.linkedin_url:
                candidate.linkedin_url = candidate_data["linkedin_url"]
            if candidate_data.get("portfolio_url") and not candidate.portfolio_url:
                candidate.portfolio_url = candidate_data["portfolio_url"]
            if candidate_data.get("professional_summary") and not candidate.professional_summary:
                candidate.professional_summary = candidate_data["professional_summary"]

            # Save extracted experiences
            for exp in candidate_data.get("experiences", []):
                new_exp = CandidateExperience(
                    candidate_id=candidate.id,
                    company=exp.get("company", "Company"),
                    role=exp.get("role", "Role"),
                    location=exp.get("location"),
                    start_date=exp.get("start_date"),
                    end_date=exp.get("end_date"),
                    is_current=str(exp.get("is_current", "false")),
                    description=exp.get("description")
                )
                db.add(new_exp)

            # Save extracted education
            for edu in candidate_data.get("education", []):
                new_edu = CandidateEducation(
                    candidate_id=candidate.id,
                    institution=edu.get("institution", "Institution"),
                    degree=edu.get("degree", "Degree"),
                    field_of_study=edu.get("field_of_study"),
                    start_year=edu.get("start_year"),
                    end_year=edu.get("end_year")
                )
                db.add(new_edu)

            # Save extracted skills
            for sk in candidate_data.get("skills", []):
                new_sk = CandidateSkill(
                    candidate_id=candidate.id,
                    skill_name=sk,
                    source_evidence="Extracted from CV"
                )
                db.add(new_sk)

        # 6. Job Requirement Assessment if linked to a job
        assessment_data = {}
        if app.job_id:
            job = db.query(Job).filter(Job.id == app.job_id).first()
            if job and job.requirements:
                reqs = [
                    {"id": r.id, "title": r.title, "category": r.category.value if hasattr(r.category, "value") else str(r.category)}
                    for r in job.requirements
                ]
                assessment_data = gemini_service.assess_job_requirements(text, reqs, job.title)
                
                # Count met
                crit = assessment_data.get("criteria_assessments", [])
                essential_count = sum(1 for c in crit if c.get("category") == "Essential" and c.get("status") == "Evidenced")
                preferred_count = sum(1 for c in crit if c.get("category") == "Preferred" and c.get("status") == "Evidenced")
                
                match_assessment = MatchAssessment(
                    application_id=app.id,
                    job_id=job.id,
                    model_name=gemini_service.model_name,
                    overall_fit_summary=assessment_data.get("overall_fit_summary"),
                    essential_requirements_met=f"{essential_count}/{sum(1 for c in crit if c.get('category') == 'Essential')}",
                    preferred_requirements_met=f"{preferred_count}/{sum(1 for c in crit if c.get('category') == 'Preferred')}",
                    criteria_assessments=crit
                )
                db.add(match_assessment)

        # 7. AI Recruiter Summary
        job_title = app.job.title if app.job else "General Application"
        summary_data = gemini_service.generate_recruiter_summary(candidate_data, assessment_data, job_title)
        
        recruiter_summary = RecruiterSummary(
            application_id=app.id,
            candidate_overview=summary_data.get("candidate_overview", "Profile processed."),
            key_strengths=summary_data.get("key_strengths", []),
            potential_gaps=summary_data.get("potential_gaps", []),
            suggested_interview_questions=summary_data.get("suggested_interview_questions", []),
            model_name=gemini_service.model_name
        )
        db.add(recruiter_summary)

        # 8. Mark document completed & application under review
        doc.status = DocumentProcessingStatus.COMPLETED
        app.status = ApplicationStatus.UNDER_REVIEW

        # Add event log
        event = ApplicationEvent(
            application_id=app.id,
            event_type="ai_processed",
            details="CV parsed and AI requirement assessment completed successfully."
        )
        db.add(event)
        db.commit()

        # 9. Asynchronously emit webhook to n8n
        import asyncio
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                asyncio.create_task(n8n_service.dispatch_event(
                    organization_id=app.organization_id,
                    event_name="cv.processed",
                    payload={"application_id": app.id, "candidate_name": candidate.full_name if candidate else "", "job_title": job_title}
                ))
            else:
                loop.run_until_complete(n8n_service.dispatch_event(
                    organization_id=app.organization_id,
                    event_name="cv.processed",
                    payload={"application_id": app.id, "candidate_name": candidate.full_name if candidate else "", "job_title": job_title}
                ))
        except Exception:
            pass

        return {"status": "success", "application_id": app.id}

    except Exception as e:
        logger.exception(f"Unhandled error processing document {document_id}: {e}")
        db.rollback()
        try:
            doc = db.query(ApplicationDocument).filter(ApplicationDocument.id == document_id).first()
            if doc:
                doc.status = DocumentProcessingStatus.FAILED
                doc.error_message = str(e)
                db.commit()
        except Exception:
            pass
        return {"status": "error", "message": str(e)}
    finally:
        db.close()

@celery_app.task(name="app.tasks.cv_tasks.process_cv_document_task")
def process_cv_document_task(document_id: str):
    logger.info(f"Celery executing process_cv_document_task for document {document_id}")
    return process_document_pipeline_sync(document_id)

