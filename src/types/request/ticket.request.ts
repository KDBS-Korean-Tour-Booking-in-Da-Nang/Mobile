export type TicketReasonType = "REASON_A" | "REASON_B" | "REASON_C";

export interface TicketRequest {
  userId: number;
  message: string;
  reasons: TicketReasonType[];
}
