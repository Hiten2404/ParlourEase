import type { LucideIcon } from "lucide-react";
import type { Timestamp } from "firebase/firestore";

export type Service = {
  id: string;
  name: string;
  price: number;
  duration: number; // in minutes
  icon: LucideIcon | string | React.ElementType; // Store icon name as string in DB
};

export type Payment = {
  amount: number;
  method: "Cash" | "UPI" | "Card" | null;
  status: "Paid" | "Unpaid";
};

export type Booking = {
  id: string;
  customerName: string;
  contact: string;
  serviceId: string | string[]; // Can be single or multiple
  appointmentDateTime: Date | Timestamp;
  notes?: string;
  status: "Pending" | "In Progress" | "Completed";
  payment: Payment;
};
