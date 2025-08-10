"use client"

import * as React from 'react';
import { format, isSameDay } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { toDateSafe } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Play, CheckCircle } from 'lucide-react';
import type { Booking, Service } from '@/lib/types';
import { getIconComponent } from '@/lib/data';

type AppointmentQueueProps = {
  bookings: Booking[];
  services: Service[];
  onAction: (bookingId: string, action: Booking['status']) => void;
  onManagePayment: (booking: Booking) => void;
};

export function AppointmentQueue({ bookings, services, onAction, onManagePayment }: AppointmentQueueProps) {
  
  const getBookingServiceDetails = (booking: Booking) => {
    const serviceIds = Array.isArray(booking.serviceId) ? booking.serviceId : [booking.serviceId];
    const bookingServices = services.filter(s => serviceIds.includes(s.id));
    return {
        names: bookingServices.map(s => s.name).join(', ') || 'Unknown Service',
        price: bookingServices.reduce((total, s) => total + s.price, 0)
    };
  };

  const getStatusVariant = (status: Booking['status']): "default" | "secondary" | "outline" => {
    switch (status) {
      case 'Completed':
        return 'default';
      case 'In Progress':
        return 'secondary';
      case 'Pending':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const todayBookings = bookings.filter(b => {
    const apptDate = toDateSafe(b.appointmentDateTime);
    return isSameDay(apptDate, new Date());
  });

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calendar"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>
          Today's Appointments
        </CardTitle>
        <CardDescription>
          A real-time view of the appointment queue for today.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {todayBookings.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Appointment</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {todayBookings.map((booking) => {
                const serviceDetails = getBookingServiceDetails(booking);
                return (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <div className="font-medium">{booking.customerName}</div>
                      <div className="text-sm text-muted-foreground">{booking.contact}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{serviceDetails.names}</div>
                      <div className="text-sm text-muted-foreground">
                        {format(toDateSafe(booking.appointmentDateTime), 'p')}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={getStatusVariant(booking.status)}>{booking.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                       <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                           {booking.status === 'Pending' && (
                            <DropdownMenuItem onClick={() => onAction(booking.id, 'In Progress')}>
                              <Play className="mr-2 h-4 w-4" /> Start
                            </DropdownMenuItem>
                          )}
                          {booking.status === 'In Progress' && (
                            <DropdownMenuItem onClick={() => onAction(booking.id, 'Completed')}>
                              <CheckCircle className="mr-2 h-4 w-4" /> Complete
                            </DropdownMenuItem>
                          )}
                           {booking.status === 'Completed' && (
                            <DropdownMenuItem onClick={() => onManagePayment(booking)}>
                               <span className="font-semibold mr-2">&#8377;</span> Manage Payment
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg font-medium">No appointments for today.</p>
            <p>Ready to book the first one?</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
