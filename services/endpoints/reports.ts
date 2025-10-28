import api from "../../services/api";

export interface CreateReportRequest {
  targetType: "POST" | "COMMENT";
  targetId: number;
  reasons: string[];
  description: string;
}

export interface ReportResponse {
  reportId: number;
  reporterUsername: string;
  reporterEmail: string;
  targetType: "POST" | "COMMENT";
  targetId: number;
  targetTitle: string;
  targetAuthor: string;
  reasons: string[];
  description: string;
  status: "PENDING" | "RESOLVED" | "DISMISSED";
  adminNote: string | null;
  reportedAt: string;
  resolvedAt: string | null;
  resolvedByUsername: string | null;
}

export async function createReport(
  userEmail: string,
  data: CreateReportRequest
): Promise<ReportResponse> {
  const response = await api.post<ReportResponse>("/api/reports/create", data, {
    params: { userEmail },
  });
  return response.data;
}
