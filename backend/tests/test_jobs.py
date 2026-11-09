from app.models.job import JobStatus, RequirementCategory

def test_create_job_with_essential_and_preferred_requirements(client, test_org_a):
    headers = {
        "Authorization": f"Bearer {test_org_a['token']}",
        "X-Organization-ID": test_org_a["org"].id
    }
    payload = {
        "title": "Backend Python Architect",
        "department": "Engineering",
        "location": "Remote",
        "employment_type": "Full-time",
        "description": "Architect scalable backend services.",
        "status": "Published",
        "requirements": [
            {
                "title": "5+ years with Python & FastAPI",
                "category": "Essential",
                "description": "Must have built high-concurrency microservices"
            },
            {
                "title": "Knowledge of Redis and message queues",
                "category": "Preferred",
                "description": "Bonus for production Celery setup"
            }
        ]
    }
    res = client.post("/api/v1/jobs/", json=payload, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["title"] == "Backend Python Architect"
    assert len(data["requirements"]) == 2
    assert data["requirements"][0]["category"] == "Essential"
    assert data["requirements"][1]["category"] == "Preferred"

def test_public_candidate_portal_jobs(client, test_org_a):
    # Retrieve public jobs for org_a slug
    res = client.get(f"/api/v1/jobs/portal/{test_org_a['org'].slug}/list")
    assert res.status_code == 200
    assert isinstance(res.json(), list)

