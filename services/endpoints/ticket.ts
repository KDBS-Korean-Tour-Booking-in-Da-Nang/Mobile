import api from "../../services/api";
import { TicketRequest } from "../../src/types/request/ticket.request";
import {
  Ticket,
  TicketResponse,
  TicketListResponse,
} from "../../src/types/response/ticket.response";

export type { TicketRequest, Ticket, TicketResponse, TicketListResponse };

export const ticketEndpoints = {
  getAllTickets: (): Promise<{ data: Ticket[] }> =>
    api.get("/api/ticket").then((res) => ({
      data: res.data?.result || res.data || [],
    })),

  getTicketById: (ticketId: number): Promise<{ data: Ticket }> =>
    api.get(`/api/ticket/${ticketId}`).then((res) => ({
      data: res.data?.result || res.data,
    })),

  createTicket: (request: TicketRequest): Promise<{ data: Ticket }> =>
    api.post("/api/ticket/create", request).then((res) => ({
      data: res.data?.result || res.data,
    })),
};

