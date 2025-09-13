import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Download, Play, Pause, RotateCcw } from 'lucide-react';

interface VideoPreviewProps {
  videoUrl?: string;
  className?: string;
  onDownload?: () => void;
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({
  videoUrl,
  className,
  onDownload
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);

  const handlePlayPause = () => {
    if (videoRef) {
      if (isPlaying) {
        videoRef.pause();
      } else {
        videoRef.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleRestart = () => {
    if (videoRef) {
      videoRef.currentTime = 0;
      videoRef.play();
      setIsPlaying(true);
    }
  };

  if (!videoUrl) {
    return (
      <div className={cn("rounded-lg border-2 border-dashed border-border p-12 text-center", className)}>
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-accent rounded-full flex items-center justify-center">
            <Play className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              動画プレビュー
            </h3>
            <p className="text-muted-foreground">
              画像をアップロードして動画を生成すると、ここに表示されます
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="relative aspect-video rounded-lg overflow-hidden bg-black shadow-elegant">
        <video
          ref={setVideoRef}
          src={videoUrl}
          className="w-full h-full object-cover"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          controls
        />
        
        <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handlePlayPause}
            className="bg-white/20 backdrop-blur-sm hover:bg-white/30"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRestart}
            className="bg-white/20 backdrop-blur-sm hover:bg-white/30"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          
          <div className="flex-1" />
          
          {onDownload && (
            <Button
              variant="elegant"
              size="sm"
              onClick={onDownload}
              className="ml-auto"
            >
              <Download className="h-4 w-4 mr-2" />
              ダウンロード
            </Button>
          )}
        </div>
      </div>
      
      <div className="text-center">
        <h3 className="text-lg font-semibold text-foreground mb-1">
          生成された動画
        </h3>
        <p className="text-sm text-muted-foreground">
          再生ボタンで動画を確認できます
        </p>
      </div>
    </div>
  );
};