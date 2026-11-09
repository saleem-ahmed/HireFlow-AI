from app.models.job import Job, JobStatus
from app.models.candidate import Candidate
from app.models.application import Application, ApplicationStatus, ApplicationSource

def test_cross_tenant_jobs_isolation(client, test_org_a, test_org_b, db):
    # Org A creates a job
    job_a = Job(
        id="job-a-1",
        organization_id=test_org_a["org"].id,
        title="Alpha Senior Engineer",
        description="Engineering role for Alpha Corp",
        status=JobStatus.PUBLISHED
    )
    db.add(job_a)
    db.commit()

    # User B tries to view jobs list
    headers_b = {
        "Authorization": f"Bearer {test_org_b['token']}",
        "X-Organization-ID": test_org_b["org"].id
    }
    res = client.get("/api/v1/jobs/", headers=headers_b)
    assert res.status_code == 200
    jobs_b = res.json()
    # User B should NOT see Job A
    assert not any(j["id"] == job_a.id for j in jobs_b)

    # User B attempts to directly access Job A via ID
    res_direct = client.get(f"/api/v1/jobs/{job_a.id}", headers=headers_b)
    # Must be 404 Not Found (scoping ensures it is not found in B's organization)
    assert res_direct.status_code == 404

def test_cross_tenant_candidates_isolation(client, test_org_a, test_org_b, db):
    # Org A candidate
    cand_a = Candidate(
        id="cand-a-1",
        organization_id=test_org_a["org"].id,
        full_name="Secret Candidate A",
        email="candidate.a@example.com"
    )
    db.add(cand_a)
    db.commit()

    # User B queries candidate list
    headers_b = {
        "Authorization": f"Bearer {test_org_b['token']}",
        "X-Organization-ID": test_org_b["org"].id
    }
    res = client.get("/api/v1/candidates/", headers=headers_b)
    assert res.status_code == 200
    candidates_b = res.json()
    assert not any(c["id"] == cand_a.id for c in candidates_b)

    # User B attempts to directly query Candidate A
    res_direct = client.get(f"/api/v1/candidates/{cand_a.id}", headers=headers_b)
    assert res_direct.status_code == 404

def test_cross_tenant_applications_isolation(client, test_org_a, test_org_b, db):
    # Org A candidate and application
    cand_a = Candidate(
        id="cand-a-2",
        organization_id=test_org_a["org"].id,
        full_name="Candidate A2",
        email="a2@example.com"
    )
    db.add(cand_a)
    db.flush()

    app_a = Application(
        id="app-a-1",
        organization_id=test_org_a["org"].id,
        candidate_id=cand_a.id,
        status=ApplicationStatus.RECEIVED,
        source=ApplicationSource.WEBSITE
    )
    db.add(app_a)
    db.commit()

    # User B tries to view applications
    headers_b = {
        "Authorization": f"Bearer {test_org_b['token']}",
        "X-Organization-ID": test_org_b["org"].id
    }
    res = client.get("/api/v1/applications/", headers=headers_b)
    assert res.status_code == 200
    apps_b = res.json()
    assert not any(a["id"] == app_a.id for a in apps_b)

    # Direct access
    res_direct = client.get(f"/api/v1/applications/{app_a.id}", headers=headers_b)
    assert res_direct.status_code == 404

