import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SampleItem {
  id: string;
  src: string;
  alt: string;
  title: string;
}

interface SampleGalleryProps {
  items: SampleItem[];
  onSelect: (item: SampleItem) => void;
  selectedId?: string;
  title: string;
  className?: string;
}

export const SampleGallery: React.FC<SampleGalleryProps> = ({
  items,
  onSelect,
  selectedId,
  title,
  className
}) => {
  return (
    <div className={cn("space-y-4", className)}>
      <h4 className="text-md font-medium text-foreground">{title}</h4>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item)}
            className={cn(
              "relative aspect-[4/3] rounded-lg overflow-hidden border-2 transition-all duration-300",
              "hover:scale-105 hover:shadow-soft",
              selectedId === item.id 
                ? "border-primary shadow-glow" 
                : "border-border hover:border-primary/50"
            )}
          >
            <img
              src={item.src}
              alt={item.alt}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300">
              <div className="absolute bottom-2 left-2 right-2">
                <p className="text-white text-xs font-medium truncate">
                  {item.title}
                </p>
              </div>
            </div>
            {selectedId === item.id && (
              <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium">
                  選択中
                </div>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};