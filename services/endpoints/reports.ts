import api from "../../services/api";
import { CreateReportRequest } from "../../src/types/request/report.request";
import { ReportResponse } from "../../src/types/response/report.response";

export type { CreateReportRequest, ReportResponse };

export async function createReport(
  userEmail: string,
  data: CreateReportRequest
): Promise<ReportResponse> {
  const response = await api.post<ReportResponse>("/api/reports/create", data, {
    params: { userEmail },
  });
  return response.data;
}
