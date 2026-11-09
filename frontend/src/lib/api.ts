import { getSession } from "./auth";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const session = getSession();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (session?.token) {
    headers["Authorization"] = `Bearer ${session.token}`;
  }
  if (session?.organizationId) {
    headers["X-Organization-ID"] = session.organizationId;
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errMessage = `HTTP ${res.status}`;
    try {
      const errorJson = await res.json();
      errMessage = errorJson.detail || errorJson.message || errMessage;
    } catch {}
    throw new Error(errMessage);
  }

  return res.json();
}

export const api = {
  // Auth
  login: (data: any) => request<any>("/auth/login", { method: "POST", body: JSON.stringify(data) }),
  register: (data: any) => request<any>("/auth/register", { method: "POST", body: JSON.stringify(data) }),
  getMe: () => request<any>("/auth/me"),

  // Analytics
  getDashboardStats: () => request<any>("/analytics/dashboard"),

  // Jobs
  listJobs: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<any[]>(`/jobs/${qs ? `?${qs}` : ""}`);
  },
  getJob: (id: string) => request<any>(`/jobs/${id}`),
  createJob: (data: any) => request<any>("/jobs/", { method: "POST", body: JSON.stringify(data) }),
  updateJob: (id: string, data: any) => request<any>(`/jobs/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteJob: (id: string) => request<any>(`/jobs/${id}`, { method: "DELETE" }),

  // Applications
  listApplications: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<any[]>(`/applications/${qs ? `?${qs}` : ""}`);
  },
  getApplication: (id: string) => request<any>(`/applications/${id}`),
  updateApplicationStatus: (id: string, status: string) =>
    request<any>(`/applications/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  addRecruiterNote: (id: string, content: string) =>
    request<any>(`/applications/${id}/notes`, { method: "POST", body: JSON.stringify({ content }) }),
  assignRecruiter: (id: string, recruiter_id: string) =>
    request<any>(`/applications/${id}/assign`, { method: "PATCH", body: JSON.stringify({ recruiter_id }) }),

  // Candidates
  listCandidates: (search?: string) => request<any[]>(`/candidates/${search ? `?search=${encodeURIComponent(search)}` : ""}`),
  getCandidate: (id: string) => request<any>(`/candidates/${id}`),
  updateCandidate: (id: string, data: any) => request<any>(`/candidates/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  // AI & Assessments
  overrideAssessment: (assessmentId: string, overrides: Record<string, any>) =>
    request<any>(`/ai/assessment/${assessmentId}/override`, {
      method: "PUT",
      body: JSON.stringify({ recruiter_overrides: overrides, is_reviewed: true }),
    }),
  editRecruiterSummary: (summaryId: string, editedSummary: string) =>
    request<any>(`/ai/summary/${summaryId}/edit`, {
      method: "PUT",
      body: JSON.stringify({ recruiter_edited_summary: editedSummary }),
    }),

  // Documents
  reprocessDocument: (docId: string) => request<any>(`/documents/${docId}/reprocess`, { method: "POST" }),

  // Public Portal
  getPortalJobs: (orgSlug: string) => request<any[]>(`/jobs/portal/${orgSlug}/list`),
  getPortalJob: (orgSlug: string, jobId: string) => request<any>(`/jobs/portal/${orgSlug}/job/${jobId}`),
  submitPortalApplication: async (orgSlug: string, formData: FormData) => {
    const res = await fetch(`${BASE_URL}/applications/portal/${orgSlug}/submit`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to submit application");
    }
    return res.json();
  },

  // Admin
  listAdminOrganizations: () => request<any[]>("/admin/organizations"),

  // Organizations & Members
  getOrganization: () => request<any>("/organizations/current"),
  updateOrganization: (data: any) => request<any>("/organizations/current", { method: "PUT", body: JSON.stringify(data) }),
  listMembers: () => request<any[]>("/organizations/members"),
  inviteMember: (data: any) => request<any>("/organizations/members/invite", { method: "POST", body: JSON.stringify(data) }),
};

