import { CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";

interface SuccessAnimationProps {
  message: string;
  onComplete?: () => void;
  duration?: number;
}

export const SuccessAnimation = ({ 
  message, 
  onComplete, 
  duration = 2000 
}: SuccessAnimationProps) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      onComplete?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-card border border-border rounded-lg p-8 shadow-2xl max-w-md animate-scale-in">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" />
            <CheckCircle className="w-16 h-16 text-green-500 relative animate-scale-in" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Success!</h3>
            <p className="text-muted-foreground">{message}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
