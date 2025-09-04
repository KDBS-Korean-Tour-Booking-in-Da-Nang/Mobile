import api from "./api";

// =================================
// INTERFACES
// =================================

export interface CreateReportRequest {
  targetType: "POST" | "COMMENT";
  targetId: number;
  reasons: string[]; // e.g., ["SPAM", "INAPPROPRIATE"]
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

// =================================
// SERVICE CLASS
// =================================

class ReportService {
  async createReport(
    userEmail: string,
    data: CreateReportRequest
  ): Promise<ReportResponse> {
    try {
      const response = await api.post<ReportResponse>(
        "/api/reports/create",
        data,
        {
          params: { userEmail },
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to create report"
      );
    }
  }
}

export default new ReportService();
