"use client";

import * as React from "react";
import { format, isSameDay, isSameMonth } from "date-fns";
import { Timestamp } from "firebase/firestore";
import { toDateSafe } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { CreditCard, Smartphone, Wallet } from "lucide-react";
import type { Booking, Service } from "@/lib/types";

type IncomeDashboardProps = {
  bookings: Booking[];
  services: Service[];
};

export function IncomeDashboard({ bookings, services }: IncomeDashboardProps) {
  const getBookingPrice = (booking: Booking): number => {
     if (booking.payment.status !== 'Paid') return 0;
     return booking.payment.amount;
  };

  const now = new Date();

  const dailyIncome = bookings
    .filter(b => isSameDay(toDateSafe(b.appointmentDateTime), now) && b.payment.status === 'Paid')
    .reduce((sum, b) => sum + getBookingPrice(b), 0);

  const monthlyIncome = bookings
    .filter(b => isSameMonth(toDateSafe(b.appointmentDateTime), now) && b.payment.status === 'Paid')
    .reduce((sum, b) => sum + getBookingPrice(b), 0);

  const paymentMethods = bookings
    .filter(b => b.payment.status === 'Paid')
    .reduce((acc, b) => {
        if (b.payment.method) {
            acc[b.payment.method] = (acc[b.payment.method] || 0) + getBookingPrice(b);
        }
        return acc;
    }, {} as Record<"Cash" | "UPI" | "Card", number>);


  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl flex items-center gap-2">
          <span className="font-bold text-3xl">&#8377;</span>
          Income Overview
        </CardTitle>
        <CardDescription>
          A summary of your earnings for today and this month.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-accent/40">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">&#8377;{dailyIncome.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">
                        Total for {format(now, "PPP")}
                    </p>
                </CardContent>
            </Card>
            <Card className="bg-accent/40">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">This Month's Revenue</CardTitle>
                    <span className="font-bold text-muted-foreground text-lg">&#8377;</span>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">&#8377;{monthlyIncome.toFixed(2)}</div>
                     <p className="text-xs text-muted-foreground">
                        Total for {format(now, "MMMM yyyy")}
                    </p>
                </CardContent>
            </Card>
        </div>
        <div>
            <h4 className="text-md font-medium mb-2">Payment Methods (All Time)</h4>
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                        <Wallet className="h-4 w-4" />
                        <span>Cash</span>
                    </div>
                    <span className="font-medium">&#8377;{(paymentMethods.Cash || 0).toFixed(2)}</span>
                </div>
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                        <Smartphone className="h-4 w-4" />
                        <span>UPI</span>
                    </div>
                    <span className="font-medium">&#8377;{(paymentMethods.UPI || 0).toFixed(2)}</span>
                </div>
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                        <CreditCard className="h-4 w-4" />
                        <span>Card</span>
                    </div>
                    <span className="font-medium">&#8377;{(paymentMethods.Card || 0).toFixed(2)}</span>
                </div>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
