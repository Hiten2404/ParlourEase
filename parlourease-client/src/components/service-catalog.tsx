import * as React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Clock } from 'lucide-react';
import type { Service } from '@/lib/types';
import { getIconComponent } from '@/lib/data';

type ServiceCatalogProps = {
  services: Service[];
};

export function ServiceCatalog({ services }: ServiceCatalogProps) {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Our Services</CardTitle>
        <CardDescription>Browse our catalog of available services.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
          {services.map((service) => {
            const Icon = getIconComponent(service.icon);
            return (
                <Card key={service.id} className="bg-accent/40 hover:shadow-md transition-shadow">
                <CardHeader>
                    <div className="flex items-center gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                        <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg font-semibold">{service.name}</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="flex justify-around text-sm">
                    <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{service.duration} min</span>
                    </div>
                    <div className="flex items-center gap-2">
                    <span className="font-semibold">&#8377;</span>
                    <span>{service.price}</span>
                    </div>
                </CardContent>
                </Card>
            )
          })}
        </div>
      </CardContent>
    </Card>
  );
}
