"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { Timestamp } from "firebase/firestore";
import { toDateSafe } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon } from "lucide-react";
import type { Booking, Service, Payment } from "@/lib/types";

const bookingSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters."),
  contact: z.string().min(10, "Please enter a valid contact number."),
  serviceId: z.string({ required_error: "Please select a service." }), // Only single service for admin booking
  appointmentDate: z.date({ required_error: "An appointment date is required." }),
  appointmentTime: z.string({ required_error: "An appointment time is required." }),
  notes: z.string().optional(),
});

const paymentSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive."),
  method: z.enum(["Cash", "UPI", "Card"], { required_error: "Please select a payment method." }),
  status: z.enum(["Paid", "Unpaid"]),
});


type BookingDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "booking" | "payment";
  services: Service[];
  booking: Booking | null;
  onSaveBooking: (data: Omit<Booking, 'id'>) => void;
  onSavePayment: (data: Payment) => void;
  festivalMode: boolean;
};

export function BookingDialog({ isOpen, onOpenChange, mode, services, booking, onSaveBooking, onSavePayment, festivalMode }: BookingDialogProps) {
  const timeSlots = React.useMemo(() => {
    const slots = [];
    const buffer = festivalMode ? 30 : 15;
    for (let hour = 9; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += buffer) {
        const time = new Date();
        time.setHours(hour, minute, 0, 0);
        slots.push(format(time, "HH:mm"));
      }
    }
    return slots;
  }, [festivalMode]);

  const bookingForm = useForm<z.infer<typeof bookingSchema>>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      customerName: "",
      contact: "",
      notes: "",
    },
  });

  const paymentForm = useForm<z.infer<typeof paymentSchema>>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      status: "Unpaid",
    },
  });

  React.useEffect(() => {
    if (booking && isOpen) {
        if (mode === 'booking') {
            const appointmentDateTime = toDateSafe(booking.appointmentDateTime);
            const serviceId = Array.isArray(booking.serviceId) ? booking.serviceId[0] : booking.serviceId;
            bookingForm.reset({
                customerName: booking.customerName,
                contact: booking.contact,
                serviceId: serviceId,
                appointmentDate: appointmentDateTime,
                appointmentTime: format(appointmentDateTime, "HH:mm"),
                notes: booking.notes || "",
            });
        } else if (mode === 'payment') {
            const serviceIds = Array.isArray(booking.serviceId) ? booking.serviceId : [booking.serviceId];
            const totalAmount = services
                .filter(s => serviceIds.includes(s.id))
                .reduce((sum, s) => sum + s.price, 0);

            paymentForm.reset({
                amount: booking.payment.amount > 0 ? booking.payment.amount : totalAmount,
                method: booking.payment.method || undefined,
                status: booking.payment.status,
            });
        }
    } else if (!booking) {
        bookingForm.reset({ customerName: "", contact: "", serviceId: undefined, appointmentDate: undefined, appointmentTime: undefined, notes: "" });
        paymentForm.reset({ status: "Unpaid", amount: 0, method: undefined });
    }
  }, [booking, mode, isOpen, bookingForm, paymentForm, services]);


  const handleBookingSubmit = (values: z.infer<typeof bookingSchema>) => {
    const [hours, minutes] = values.appointmentTime.split(':').map(Number);
    const appointmentDateTime = new Date(values.appointmentDate);
    appointmentDateTime.setHours(hours, minutes);

    const service = services.find(s => s.id === values.serviceId);

    const newBookingData: Omit<Booking, 'id'> = {
      customerName: values.customerName,
      contact: values.contact,
      serviceId: values.serviceId,
      appointmentDateTime: Timestamp.fromDate(appointmentDateTime),
      notes: values.notes,
      status: booking?.status || 'Pending',
      payment: booking?.payment || {
        amount: service?.price || 0,
        method: null,
        status: 'Unpaid',
      },
    };
    onSaveBooking(newBookingData);
  };

  const handlePaymentSubmit = (values: z.infer<typeof paymentSchema>) => {
    onSavePayment(values);
  };
  
  const selectedServiceId = bookingForm.watch("serviceId");
  const selectedService = services.find(s => s.id === selectedServiceId);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        {mode === 'booking' ? (
          <Form {...bookingForm}>
            <form onSubmit={bookingForm.handleSubmit(handleBookingSubmit)} className="space-y-6">
              <DialogHeader>
                <DialogTitle className="font-headline text-2xl">{booking ? 'Edit Booking' : 'New Booking'}</DialogTitle>
                <DialogDescription>Fill in the details to schedule an appointment.</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={bookingForm.control} name="customerName" render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Customer Name</FormLabel>
                    <FormControl><Input placeholder="e.g. Jane Doe" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={bookingForm.control} name="contact" render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Contact Number</FormLabel>
                    <FormControl><Input placeholder="e.g. 123-456-7890" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={bookingForm.control} name="serviceId" render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Service</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select a service" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {services.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {selectedService && <p className="text-sm text-muted-foreground pt-1">Duration: {selectedService.duration} min, Price: &#8377;{selectedService.price}</p>}
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={bookingForm.control} name="appointmentDate" render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button variant="outline" className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                              {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() - 1))} initialFocus />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                )} />
                <FormField control={bookingForm.control} name="appointmentTime" render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Time</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Pick a time" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {timeSlots.map(slot => <SelectItem key={slot} value={slot}>{slot}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                 <FormField control={bookingForm.control} name="notes" render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl><Textarea placeholder="Any special requests or notes..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <DialogFooter>
                <Button type="submit">Save Booking</Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <Form {...paymentForm}>
            <form onSubmit={paymentForm.handleSubmit(handlePaymentSubmit)} className="space-y-6">
              <DialogHeader>
                <DialogTitle className="font-headline text-2xl">Manage Payment</DialogTitle>
                <DialogDescription>Update payment details for {booking?.customerName}'s appointment.</DialogDescription>
              </DialogHeader>
               <FormField control={paymentForm.control} name="amount" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount Charged</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={paymentForm.control} name="method" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method</FormLabel>
                    <FormControl>
                      <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4 pt-2">
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl><RadioGroupItem value="Cash" /></FormControl>
                          <FormLabel className="font-normal">Cash</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl><RadioGroupItem value="UPI" /></FormControl>
                          <FormLabel className="font-normal">UPI</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl><RadioGroupItem value="Card" /></FormControl>
                          <FormLabel className="font-normal">Card</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                     <FormMessage />
                  </FormItem>
                )} />
                <FormField control={paymentForm.control} name="status" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Paid">Paid</SelectItem>
                        <SelectItem value="Unpaid">Unpaid</SelectItem>
                      </SelectContent>
                    </Select>
                     <FormMessage />
                  </FormItem>
                )} />
              <DialogFooter>
                <Button type="submit">Save Payment</Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
