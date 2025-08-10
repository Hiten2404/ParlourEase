import { Scissors, Gem, Hand, Sparkles, Footprints } from 'lucide-react';

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
