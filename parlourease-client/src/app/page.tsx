"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { collection, onSnapshot, addDoc, query, orderBy, Timestamp, getDocs, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { ServiceCatalog } from "@/components/service-catalog";
import type { Service } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getIconComponent } from "@/lib/data";
import { Checkbox } from "@/components/ui/checkbox";

const bookingSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters."),
  contact: z.string().min(10, "Please enter a valid contact number."),
  serviceIds: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "You have to select at least one service.",
  }),
  appointmentDate: z.date({ required_error: "An appointment date is required." }),
  appointmentTime: z.string({ required_error: "An appointment time is required." }),
  notes: z.string().optional(),
});

export default function ClientBookingPage() {
  const [services, setServices] = React.useState<Service[]>([]);
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    // Ensure a demo service exists for live demo (no-op if already present)
    async function addDemoServiceOnce() {
      try {
        const servicesRef = collection(db, "services");
        const existing = await getDocs(query(servicesRef, where("name", "==", "Demo Service")));
        if (existing.empty) {
          await addDoc(servicesRef, {
            name: "Demo Service",
            price: 99,
            duration: 45,
            icon: "Scissors",
          });
        }
      } catch (_) {
        // ignore demo errors
      }
    }
    addDemoServiceOnce();

    const servicesQuery = query(collection(db, "services"), orderBy("name"));
    const unsubscribe = onSnapshot(servicesQuery, (snapshot) => {
      const fetchedServices: Service[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          price: data.price,
          duration: data.duration,
          icon: data.icon,
        };
      });
      setServices(fetchedServices);
    });

    return () => unsubscribe();
  }, []);

  const form = useForm<z.infer<typeof bookingSchema>>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      customerName: "",
      contact: "",
      notes: "",
      serviceIds: [],
    },
  });

  const timeSlots = React.useMemo(() => {
    const slots: { label: string; value: string; date: Date }[] = [];
    for (let hour = 9; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const time = new Date();
        time.setSeconds(0, 0);
        time.setHours(hour, minute, 0, 0);
        slots.push({ label: format(time, "p"), value: format(time, "p"), date: new Date(time) });
      }
    }
    return slots;
  }, []);

  const appointmentDate = form.watch('appointmentDate');
  const appointmentTime = form.watch('appointmentTime');

  // Filter out past slots if booking for today
  const availableTimeSlots = React.useMemo(() => {
    if (!appointmentDate) return timeSlots;
    const isToday = format(appointmentDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
    if (!isToday) return timeSlots;
    const now = new Date();
    return timeSlots.filter(s => s.date >= now);
  }, [appointmentDate, timeSlots]);

  // If a past time is selected and user switches to today, clear it
  React.useEffect(() => {
    if (!appointmentDate || !appointmentTime) return;
    const isToday = format(appointmentDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
    if (!isToday) return;
    const selected = timeSlots.find(s => s.value === appointmentTime);
    if (selected && selected.date < new Date()) {
      form.setValue('appointmentTime', '');
    }
  }, [appointmentDate, appointmentTime, form, timeSlots]);

  
  
  const handleBookingSubmit = async (values: z.infer<typeof bookingSchema>) => {
    const appointmentDateTime = new Date(values.appointmentDate);
    const [time, period] = values.appointmentTime.split(' ');
    let [hours, minutes] = time.split(':').map(Number);

    if (period === 'PM' && hours < 12) {
      hours += 12;
    }
    if (period === 'AM' && hours === 12) {
      hours = 0;
    }
    appointmentDateTime.setHours(hours, minutes);

    const selectedServices = services.filter(s => values.serviceIds.includes(s.id));
    const totalAmount = selectedServices.reduce((sum, s) => sum + s.price, 0);

    try {
      await addDoc(collection(db, "bookings"), {
        customerName: values.customerName,
        contact: values.contact,
        serviceId: values.serviceIds, // Save as an array
        appointmentDateTime: Timestamp.fromDate(appointmentDateTime),
        notes: values.notes || "",
        status: "Pending",
        payment: {
          amount: totalAmount,
          method: null,
          status: "Unpaid",
        },
      });
      setIsSubmitted(true);
      toast({
        title: "Booking Request Sent!",
        description: "Your request has been sent. You'll receive a notification once it's confirmed.",
      });
    } catch (error) {
      console.error("Error creating booking: ", error);
       toast({
        title: "Error!",
        description: "There was a problem sending your request. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isSubmitted) {
    return (
      <main className="min-h-screen bg-background text-foreground font-body">
         <header className="bg-card/80 backdrop-blur-sm sticky top-0 z-40 border-b">
          <div className="container mx-auto flex h-20 items-center justify-between p-4 md:p-8">
            <h1 className="text-3xl md:text-4xl font-headline text-primary font-bold">ParlourEase</h1>
          </div>
        </header>
        <div className="container mx-auto p-4 md:p-8 flex items-center justify-center" style={{minHeight: 'calc(100vh - 80px)'}}>
          <Card className="w-full max-w-lg text-center shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-3xl">Thank You!</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">Your booking request has been sent successfully. We will notify you via your contact number once your appointment is confirmed by the salon.</p>
              <Button onClick={() => {
                setIsSubmitted(false);
                form.reset();
              }}>
                Make Another Booking
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground font-body">
      <header className="bg-card/80 backdrop-blur-sm sticky top-0 z-40 border-b">
        <div className="container mx-auto flex h-20 items-center justify-between p-4 md:p-8">
          <h1 className="text-3xl md:text-4xl font-headline text-primary font-bold">ParlourEase</h1>
          <p className="text-sm text-muted-foreground">Book Your Appointment</p>
        </div>
      </header>
      <div className="container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-1">
            <ServiceCatalog services={services.map(s => ({...s, icon: getIconComponent(s.icon)}))} />
          </div>
          <div className="lg:col-span-2">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="font-headline text-2xl">Request an Appointment</CardTitle>
                <CardDescription>Fill out the form below to request a time that works for you.</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleBookingSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="customerName" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your Name</FormLabel>
                          <FormControl><Input placeholder="e.g. Jane Doe" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="contact" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Number</FormLabel>
                          <FormControl><Input placeholder="e.g. 123-456-7890" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField
                        control={form.control}
                        name="serviceIds"
                        render={() => (
                          <FormItem className="md:col-span-2">
                            <div className="mb-4">
                              <FormLabel className="text-base">Select Services</FormLabel>
                              <FormDescription>
                                Select one or more services you would like to book.
                              </FormDescription>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                            {services.map((service) => (
                              <FormField
                                key={service.id}
                                control={form.control}
                                name="serviceIds"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={service.id}
                                      className="flex flex-row items-start space-x-3 space-y-0"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(service.id)}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([...(field.value || []), service.id])
                                              : field.onChange(
                                                  field.value?.filter(
                                                    (value) => value !== service.id
                                                  )
                                                )
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal w-full flex justify-between">
                                        <span>{`${service.name} (${service.duration} min)`}</span>
                                        <span>&#8377;{service.price}</span>
                                      </FormLabel>
                                    </FormItem>
                                  )
                                }}
                              />
                            ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField control={form.control} name="appointmentDate" render={({ field }) => (
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
                      <FormField control={form.control} name="appointmentTime" render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Time</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger><SelectValue placeholder="Pick a time" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {availableTimeSlots.map(slot => (
                                <SelectItem key={slot.value} value={slot.value}>
                                  {slot.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                       <FormField control={form.control} name="notes" render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Notes (Optional)</FormLabel>
                          <FormControl><Textarea placeholder="Any special requests or notes for the stylist..." {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <Button type="submit" className="w-full">Send Booking Request</Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
