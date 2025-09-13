import React from 'react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Clock, CheckCircle, AlertCircle, Film } from 'lucide-react';

export type TaskStatus = 'pending' | 'processing' | 'completed' | 'error';

interface ProgressIndicatorProps {
  status: TaskStatus;
  progress: number;
  message?: string;
  className?: string;
}

const statusConfig = {
  pending: {
    icon: Clock,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
    message: '処理待ち...'
  },
  processing: {
    icon: Film,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    message: '動画を生成中...'
  },
  completed: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    message: '生成完了！'
  },
  error: {
    icon: AlertCircle,
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    message: 'エラーが発生しました'
  }
};

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  status,
  progress,
  message,
  className
}) => {
  const config = statusConfig[status];
  const Icon = config.icon;
  
  return (
    <div className={cn("space-y-4 p-6 rounded-lg border", config.bgColor, className)}>
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-full", config.bgColor)}>
          <Icon className={cn("h-5 w-5", config.color, status === 'processing' && "animate-spin")} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground">
            動画生成ステータス
          </h3>
          <p className={cn("text-sm", config.color)}>
            {message || config.message}
          </p>
        </div>
        <div className="text-right">
          <span className={cn("text-lg font-bold", config.color)}>
            {Math.round(progress)}%
          </span>
        </div>
      </div>
      
      <Progress 
        value={progress} 
        className="h-2"
      />
      
      {status === 'processing' && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
          </div>
          <span>AI が動画を生成しています</span>
        </div>
      )}
    </div>
  );
};