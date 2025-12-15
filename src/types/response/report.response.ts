export interface ReportResponse {
  reportId: number;
  reporterUsername: string;
  reporterEmail: string;
  targetType: "POST" | "COMMENT";
  targetId: number;
  targetTitle: string;
  targetAuthor: string;
  reasons: string[];
  description?: string | null;
  status: "PENDING" | "INVESTIGATING" | "RESOLVED" | "DISMISSED" | "CLOSED";
  adminNote: string | null;
  reportedAt: string;
  resolvedAt: string | null;
  resolvedByUsername: string | null;
}
