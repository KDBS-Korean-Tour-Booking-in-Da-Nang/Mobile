export interface CreateReportRequest {
  targetType: "POST" | "COMMENT";
  targetId: number;
  reasons: string[];
  description?: string;
}
