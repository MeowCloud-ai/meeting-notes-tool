import { useState, useEffect, useRef, useCallback } from 'react';

interface TimerProps {
  isRunning: boolean;
  startTime: number | null;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function Timer({ isRunning, startTime }: TimerProps) {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    clearTimer();

    if (isRunning && startTime) {
      const st = startTime;
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((performance.now() + performance.timeOrigin - st) / 1000));
      }, 1000);

      return clearTimer;
    }
  }, [isRunning, startTime, clearTimer]);

  return (
    <div className="text-3xl font-mono text-center tabular-nums text-gray-900 tracking-wider" data-testid="timer">
      {formatTime(isRunning ? elapsed : 0)}
    </div>
  );
}
