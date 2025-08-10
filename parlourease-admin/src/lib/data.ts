import { collection, getDocs, doc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { Scissors, Gem, Hand, Sparkles, Footprints } from 'lucide-react';
import type { Service, Booking } from './types';
import { Timestamp } from 'firebase/firestore';

// This file is now primarily for seeding data into Firestore
// and providing icon mapping.

const initialServices: Omit<Service, 'id'>[] = [
  { name: 'Haircut & Style', price: 50, duration: 60, icon: 'Scissors' },
  { name: 'Manicure', price: 35, duration: 45, icon: 'Hand' },
  { name: 'Pedicure', price: 45, duration: 50, icon: 'Footprints' },
  { name: 'Facial', price: 75, duration: 75, icon: 'Sparkles' },
  { name: 'Bridal Makeup', price: 200, duration: 120, icon: 'Gem' },
];

const initialBookings: (Omit<Booking, 'id' | 'appointmentDateTime'> & { appointmentDateTime: Date })[] = [
  {
    customerName: 'Alice Johnson',
    contact: '123-456-7890',
    serviceId: '1', // This will be replaced by Firestore doc ID
    appointmentDateTime: new Date(new Date().setHours(10, 0, 0, 0)),
    status: 'Pending',
    payment: { amount: 50, method: null, status: 'Unpaid' },
    notes: 'Prefers gentle shampoo.',
  },
  {
    customerName: 'Brenda Smith',
    contact: '234-567-8901',
    serviceId: '2', // This will be replaced by Firestore doc ID
    appointmentDateTime: new Date(new Date().setHours(11, 30, 0, 0)),
    status: 'In Progress',
    payment: { amount: 35, method: null, status: 'Unpaid' },
  },
];

export const ICONS: { [key: string]: React.ElementType } = {
    Scissors,
    Gem,
    Hand,
    Sparkles,
    Footprints,
};

export const getIconComponent = (iconName: string | React.ElementType) => {
    if (typeof iconName === 'string' && ICONS[iconName]) {
        return ICONS[iconName];
    }
    return typeof iconName !== 'string' ? iconName : Hand; // Default icon
};

// Function to seed initial data into Firestore
export async function seedInitialData() {
  try {
    const servicesCollection = collection(db, 'services');
    const servicesSnapshot = await getDocs(servicesCollection);
    
    if (servicesSnapshot.empty) {
      console.log('Seeding initial services...');
      const serviceBatch = writeBatch(db);
      const serviceDocs: {id: string, data: any}[] = [];
      
      initialServices.forEach((service) => {
        const docRef = doc(collection(db, "services"));
        serviceBatch.set(docRef, service);
        serviceDocs.push({ id: docRef.id, data: service });
      });
      await serviceBatch.commit();
      console.log('Services seeded.');

      // Now seed bookings with correct service IDs
      const bookingsCollection = collection(db, 'bookings');
      const bookingsSnapshot = await getDocs(bookingsCollection);
      if (bookingsSnapshot.empty) {
          console.log('Seeding initial bookings...');
          const bookingBatch = writeBatch(db);
          const haircutService = serviceDocs.find(s => s.data.name === 'Haircut & Style');
          const manicureService = serviceDocs.find(s => s.data.name === 'Manicure');

          if(haircutService) {
            const booking1Ref = doc(bookingsCollection);
            const booking1Data = initialBookings[0];
            bookingBatch.set(booking1Ref, { ...booking1Data, serviceId: haircutService.id, appointmentDateTime: Timestamp.fromDate(booking1Data.appointmentDateTime) });
          }
          if(manicureService) {
             const booking2Ref = doc(bookingsCollection);
             const booking2Data = initialBookings[1];
             bookingBatch.set(booking2Ref, { ...booking2Data, serviceId: manicureService.id, appointmentDateTime: Timestamp.fromDate(booking2Data.appointmentDateTime) });
          }
          await bookingBatch.commit();
          console.log('Bookings seeded.');
      }
    } else {
      // console.log('Services collection is not empty. Skipping seed.');
    }
  } catch (error) {
    console.error("Error seeding data:", error);
  }
}
