"use client";
import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PomodoroPage() {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [label, setLabel] = useState("Focus");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const tick = () => {
    setSeconds((s) => {
      if (minutes === 0 && s === 0) {
        setRunning(false);
        persistSession();
        return 0;
      }
      if (s === 0) {
        setMinutes((m) => m - 1);
        return 59;
      }
      return s - 1;
    });
  };

  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(tick, 1000);
      if (!startedAt) setStartedAt(Date.now());
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [running]);

  const start = () => setRunning(true);
  const pause = () => setRunning(false);
  const reset = () => { setRunning(false); setMinutes(25); setSeconds(0); setStartedAt(null); };

  const persistSession = async () => {
    try {
      const duration = 25; // planned
      const started = startedAt ? new Date(startedAt).toISOString() : new Date().toISOString();
      await fetch('/api/pomodoro', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ label, duration_min: duration, started_at: started }) });
    } catch {}
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl md:text-2xl font-semibold">Pomodoro</h2>
      <Card><CardContent className="p-6 flex flex-col items-center gap-4">
        <input className="border rounded p-2 text-sm" value={label} onChange={(e) => setLabel(e.target.value)} />
        <div className="text-6xl font-mono tabular-nums">{String(minutes).padStart(2,'0')}:{String(seconds).padStart(2,'0')}</div>
        <div className="flex gap-2">
          {!running ? <Button onClick={start}>Start</Button> : <Button onClick={pause}>Pause</Button>}
          <Button variant="outline" onClick={reset}>Reset</Button>
        </div>
      </CardContent></Card>
    </div>
  );
}


