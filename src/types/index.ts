export type UserRole = "CUSTOMER" | "STAFF" | "ADMIN";

export type MovieStatus = "COMING_SOON" | "NOW_SHOWING" | "ARCHIVED";

export type SeatType = "STANDARD" | "VIP" | "COUPLE" | "WHEELCHAIR";

export type SeatStatus = "ACTIVE" | "BROKEN" | "AISLE";

export type TicketType = "NORMAL" | "STUDENT" | "SENIOR";

export interface SeatWithStatus {
  id: string;
  rowLabel: string;
  seatNumber: number;
  gridRow: number;
  gridCol: number;
  type: SeatType;
  status: SeatStatus;
  priceModifier: number;
  isLocked?: boolean;
  isBooked?: boolean;
}

export interface SelectedSeat {
  seatId: string;
  label: string; // e.g. "C9"
  ticketType: TicketType;
  price: number;
}

