'use client';

import { useState, useEffect } from 'react';

export default function CountdownTimer({ expiresAt }) {
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    // Initial calculation
    const calculate = () => {
      const expireTime = new Date(expiresAt).getTime();
      const now = Date.now();
      const diff = Math.max(0, Math.floor((expireTime - now) / 1000));
      setSecondsLeft(diff);
    };

    calculate();

    // Update every 1 second
    const interval = setInterval(() => {
      calculate();
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const progressPercent = Math.max(0, (secondsLeft / 1200) * 100); // 1200 seconds = 20 minutes

  let progressColor = 'bg-emerald-500';
  if (secondsLeft < 300) {
    progressColor = 'bg-red-500';
  } else if (secondsLeft < 600) {
    progressColor = 'bg-amber-500';
  }

  if (secondsLeft === 0) {
    return (
      <div className="text-center">
        <div className="text-xl font-bold text-red-400">Window expired</div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-center gap-2">
        <span className="text-3xl font-mono font-bold text-white">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </span>
      </div>
      <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ${progressColor}`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}
