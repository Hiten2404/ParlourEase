"use client";

import * as React from "react";
import { collection, onSnapshot, doc, updateDoc, addDoc, Timestamp, query, orderBy, getDocs, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { seedInitialData, getIconComponent } from "@/lib/data";
import type { Booking, Service } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { AppointmentQueue } from "@/components/appointment-queue";
import { ServiceCatalog } from "@/components/service-catalog";
import { BookingDialog } from "@/components/booking-dialog";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { AddServiceDialog } from "@/components/add-service-dialog";
import { IncomeDashboard } from "@/components/income-dashboard";

export default function AdminDashboard() {
  const [isMounted, setIsMounted] = React.useState(false);
  const [bookings, setBookings] = React.useState<Booking[]>([]);
  const [services, setServices] = React.useState<Service[]>([]);
  const [festivalMode, setFestivalMode] = React.useState(false);
  const [isBookingDialogOpen, setBookingDialogOpen] = React.useState(false);
  const [isServiceDialogOpen, setServiceDialogOpen] = React.useState(false);
  const [dialogMode, setDialogMode] = React.useState<"booking" | "payment">("booking");
  const [activeBooking, setActiveBooking] = React.useState<Booking | null>(null);

  const { toast } = useToast();

  React.useEffect(() => {
    // Seed initial data if db is empty
    seedInitialData();

    // Add a demo service once (for live demo)
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
      } catch (e) {
        // no-op for demo
      }
    }
    addDemoServiceOnce();

    // Add a demo booking once (for live demo)
    async function addDemoBookingOnce() {
      try {
        const bookingsRef = collection(db, "bookings");
        const existingBooking = await getDocs(
          query(bookingsRef, where("customerName", "==", "Demo Customer"))
        );
        if (!existingBooking.empty) return;

        // Find demo service id or fallback to any service
        let serviceId: string | null = null;
        const demoServiceSnap = await getDocs(
          query(collection(db, "services"), where("name", "==", "Demo Service"))
        );
        if (!demoServiceSnap.empty) {
          serviceId = demoServiceSnap.docs[0].id;
        } else {
          const anyServiceSnap = await getDocs(collection(db, "services"));
          if (!anyServiceSnap.empty) {
            serviceId = anyServiceSnap.docs[0].id;
          }
        }

        if (serviceId) {
          await addDoc(bookingsRef, {
            customerName: "Demo Customer",
            contact: "123-456-7890",
            serviceId,
            appointmentDateTime: Timestamp.fromDate(new Date(new Date().setHours(15, 0, 0, 0))),
            status: "Pending",
            payment: { amount: 99, method: null, status: "Unpaid" },
            notes: "Created by live demo.",
          });
        }
      } catch (e) {
        // no-op for demo
      }
    }
    addDemoBookingOnce();

    const servicesQuery = query(collection(db, "services"), orderBy("name"));
    const servicesUnsubscribe = onSnapshot(servicesQuery, (snapshot) => {
      const fetchedServices: Service[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          price: data.price,
          duration: data.duration,
          icon: getIconComponent(data.icon),
        };
      });
      setServices(fetchedServices);
    });

    const bookingsQuery = query(collection(db, "bookings"), orderBy("appointmentDateTime"));
    const bookingsUnsubscribe = onSnapshot(bookingsQuery, (snapshot) => {
      const fetchedBookings: Booking[] = snapshot.docs.map(doc => {
        const data: any = doc.data();
        const raw = data.appointmentDateTime;
        const normalizedDate = raw instanceof Timestamp
          ? raw.toDate()
          : raw instanceof Date
            ? raw
            : new Date(raw);
        return {
          id: doc.id,
          ...data,
          appointmentDateTime: normalizedDate,
        } as Booking;
      });
      setBookings(fetchedBookings);
    });

    setIsMounted(true);

    return () => {
      servicesUnsubscribe();
      bookingsUnsubscribe();
    };
  }, []);

  const handleBookingAction = async (bookingId: string, action: Booking['status']) => {
    const bookingRef = doc(db, 'bookings', bookingId);
    try {
      await updateDoc(bookingRef, { status: action });
      toast({
        title: "Status Updated",
        description: `Booking status changed to "${action}".`,
      });
      if (action === 'Completed') {
        const bookingToPay = bookings.find(b => b.id === bookingId);
        if (bookingToPay) {
          handleManagePayment(bookingToPay);
        }
      }
    } catch (error) {
      console.error("Error updating booking status: ", error);
      toast({
        title: "Error",
        description: "Failed to update booking status.",
        variant: "destructive",
      });
    }
  };

  const handleOpenNewBooking = () => {
    setActiveBooking(null);
    setDialogMode("booking");
    setBookingDialogOpen(true);
  };
  
  const handleOpenAddService = () => {
    setServiceDialogOpen(true);
  };

  const handleManagePayment = (booking: Booking) => {
    setActiveBooking(booking);
    setDialogMode("payment");
    setBookingDialogOpen(true);
  };

  const handleSaveBooking = async (bookingData: Omit<Booking, 'id'>) => {
    try {
      if (activeBooking) {
        const bookingRef = doc(db, 'bookings', activeBooking.id);
        await updateDoc(bookingRef, bookingData as any);
        toast({ title: "Booking Updated", description: "The appointment has been successfully updated." });
      } else {
        await addDoc(collection(db, 'bookings'), bookingData);
        toast({ title: "Booking Created", description: "The new appointment has been successfully added." });
      }
      setBookingDialogOpen(false);
      setActiveBooking(null);
    } catch (error) {
       console.error("Error saving booking: ", error);
       toast({ title: "Error", description: "Failed to save booking.", variant: "destructive" });
    }
  };

  const handleSavePayment = async (paymentData: Booking['payment']) => {
    if (activeBooking) {
       const bookingRef = doc(db, 'bookings', activeBooking.id);
       try {
         await updateDoc(bookingRef, { payment: paymentData, status: 'Completed' });
         toast({ title: "Payment Updated", description: "Payment details have been saved." });
       } catch (error) {
          console.error("Error updating payment: ", error);
          toast({ title: "Error", description: "Failed to update payment details.", variant: "destructive" });
       }
    }
    setBookingDialogOpen(false);
    setActiveBooking(null);
  };
  
  const handleSaveService = async (serviceData: Omit<Service, 'id' | 'icon'> & {icon: string}) => {
    try {
        await addDoc(collection(db, 'services'), {
            name: serviceData.name,
            price: serviceData.price,
            duration: serviceData.duration,
            icon: serviceData.icon,
        });
        toast({ title: "Service Added", description: `${serviceData.name} has been added to the catalog.` });
        setServiceDialogOpen(false);
    } catch (error) {
        console.error("Error adding service: ", error);
        toast({ title: "Error", description: "Failed to add new service.", variant: "destructive" });
    }
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="container mx-auto">
          <Skeleton className="h-12 w-1/4 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground font-body">
      <PageHeader
        onNewBooking={handleOpenNewBooking}
        onAddService={handleOpenAddService}
        festivalMode={festivalMode}
        onFestivalModeChange={setFestivalMode}
      />
      <div className="container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-8">
            <AppointmentQueue
              bookings={bookings}
              services={services}
              onAction={handleBookingAction}
              onManagePayment={handleManagePayment}
            />
            <IncomeDashboard bookings={bookings} services={services} />
          </div>
          <div className="lg:col-span-1">
            <ServiceCatalog services={services} />
          </div>
        </div>
      </div>
      <BookingDialog
        isOpen={isBookingDialogOpen}
        onOpenChange={setBookingDialogOpen}
        mode={dialogMode}
        services={services}
        booking={activeBooking}
        onSaveBooking={handleSaveBooking}
        onSavePayment={handleSavePayment}
        festivalMode={festivalMode}
      />
      <AddServiceDialog
        isOpen={isServiceDialogOpen}
        onOpenChange={setServiceDialogOpen}
        onSave={handleSaveService}
      />
    </main>
  );
}
