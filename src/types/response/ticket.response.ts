export interface Ticket {
  ticketId?: number;
  title: string;
  description: string;
  userEmail?: string;
  category?: string;
  status?: "PENDING" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  createdAt?: string;
  updatedAt?: string;
}

export interface TicketResponse {
  result: Ticket;
}

export interface TicketListResponse {
  result: Ticket[];
}

