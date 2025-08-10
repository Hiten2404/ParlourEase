import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Plus, Sparkles, PlusCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast"

type PageHeaderProps = {
  onNewBooking: () => void;
  onAddService: () => void;
  festivalMode: boolean;
  onFestivalModeChange: (checked: boolean) => void;
};

export function PageHeader({ onNewBooking, onAddService, festivalMode, onFestivalModeChange }: PageHeaderProps) {
  const { toast } = useToast()

  const handleFestivalToggle = (checked: boolean) => {
    onFestivalModeChange(checked);
    toast({
      title: `Festival Mode ${checked ? 'Activated' : 'Deactivated'}`,
      description: checked 
        ? "Booking slots will be limited with buffer times."
        : "Normal booking schedule has been restored.",
    });
  }

  return (
    <header className="bg-card/80 backdrop-blur-sm sticky top-0 z-40 border-b">
      <div className="container mx-auto flex h-20 items-center justify-between p-4 md:p-8">
        <h1 className="text-3xl md:text-4xl font-headline text-primary font-bold">ParlourEase</h1>
        <div className="flex items-center gap-4 md:gap-6">
          <div className="flex items-center space-x-2">
            <Sparkles className="text-primary h-5 w-5" />
            <Label htmlFor="festival-mode" className="font-semibold text-sm">
              Festival Mode
            </Label>
            <Switch
              id="festival-mode"
              checked={festivalMode}
              onCheckedChange={handleFestivalToggle}
            />
          </div>
           <Button onClick={onAddService} variant="outline" className="hidden sm:flex">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Service
          </Button>
          <Button onClick={onNewBooking} className="shadow-md">
            <Plus className="mr-2 h-4 w-4" />
            New Booking
          </Button>
        </div>
      </div>
    </header>
  );
}
