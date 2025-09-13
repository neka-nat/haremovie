import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  onImageUpload: (file: File) => void;
  onImageRemove: () => void;
  image?: File | string | null;
  title: string;
  subtitle?: string;
  className?: string;
  acceptedFileTypes?: Record<string, string[]>;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageUpload,
  onImageRemove,
  image,
  title,
  subtitle,
  className,
  acceptedFileTypes = {
    'image/*': ['.jpeg', '.jpg', '.png', '.webp']
  }
}) => {
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      onImageUpload(file);
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  }, [onImageUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes,
    multiple: false,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const handleRemove = () => {
    setPreview(null);
    onImageRemove();
  };

  const displayImage = preview || (typeof image === 'string' ? image : null);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="text-center">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      
      <div
        {...getRootProps()}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 transition-all duration-300 cursor-pointer",
          "hover:border-primary hover:bg-accent/50",
          isDragActive ? "border-primary bg-accent/50 scale-105" : "border-border",
          displayImage ? "aspect-[4/3]" : "aspect-[4/3] min-h-[200px]"
        )}
      >
        <input {...getInputProps()} />
        
        {displayImage ? (
          <div className="relative w-full h-full">
            <img
              src={displayImage}
              alt={title}
              className="w-full h-full object-cover rounded-md"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove();
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="mb-4 p-4 rounded-full bg-accent">
              {isDragActive ? (
                <Upload className="h-8 w-8 text-primary animate-bounce" />
              ) : (
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <div className="space-y-2">
              <p className="text-lg font-medium text-foreground">
                {isDragActive ? 'ドロップして画像をアップロード' : 'クリックまたはドラッグして画像をアップロード'}
              </p>
              <p className="text-sm text-muted-foreground">
                JPEG、PNG、WEBP (最大10MB)
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};