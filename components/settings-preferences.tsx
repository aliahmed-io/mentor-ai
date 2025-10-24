"use client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SettingsPreferences() {
  const [pm, setPm] = useState({ focusMin: 25, breakMin: 5, longBreakMin: 15, longEvery: 4, totalCycles: 4, label: "Focus" });
  const [qz, setQz] = useState({ length: 10, difficulty: "medium", types: { mcq: true, short: true, flashcard: false } });
  const [model, setModel] = useState<string>("gemini-2.5-flash");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const a = localStorage.getItem("pomodoro_settings");
      if (a) setPm({ ...pm, ...JSON.parse(a) });
    } catch {}
    try {
      const b = localStorage.getItem("quiz_settings");
      if (b) setQz({ ...qz, ...JSON.parse(b) });
    } catch {}
    try {
      const m = localStorage.getItem("ai_model");
      if (m) setModel(m);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = () => {
    try { localStorage.setItem("pomodoro_settings", JSON.stringify(pm)); } catch {}
    try { localStorage.setItem("quiz_settings", JSON.stringify(qz)); } catch {}
    try { localStorage.setItem("ai_model", model); } catch {}
    try { fetch("/api/settings/model", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model }) }); } catch {}
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-3 space-y-2">
          <h3 className="font-medium text-sm">Pomodoro Defaults</h3>
          <div className="grid md:grid-cols-3 gap-2">
            <div className="space-y-1">
              <div className="text-[11px] text-muted-foreground">Focus (min)</div>
              <Input type="number" min={1} max={120} value={pm.focusMin} onChange={(e) => setPm({ ...pm, focusMin: Math.max(1, Math.min(120, Number(e.target.value) || 0)) })} />
            </div>
            <div className="space-y-1">
              <div className="text-[11px] text-muted-foreground">Break (min)</div>
              <Input type="number" min={1} max={60} value={pm.breakMin} onChange={(e) => setPm({ ...pm, breakMin: Math.max(1, Math.min(60, Number(e.target.value) || 0)) })} />
            </div>
            <div className="space-y-1">
              <div className="text-[11px] text-muted-foreground">Cycles</div>
              <Input type="number" min={1} max={12} value={pm.totalCycles} onChange={(e) => setPm({ ...pm, totalCycles: Math.max(1, Math.min(12, Number(e.target.value) || 0)) })} />
            </div>
            <div className="space-y-1">
              <div className="text-[11px] text-muted-foreground">Long Break (min)</div>
              <Input type="number" min={1} max={60} value={pm.longBreakMin} onChange={(e) => setPm({ ...pm, longBreakMin: Math.max(1, Math.min(60, Number(e.target.value) || 0)) })} />
            </div>
            <div className="space-y-1">
              <div className="text-[11px] text-muted-foreground">Long Break every (cycles)</div>
              <Input type="number" min={2} max={12} value={pm.longEvery} onChange={(e) => setPm({ ...pm, longEvery: Math.max(2, Math.min(12, Number(e.target.value) || 0)) })} />
            </div>
            <div className="space-y-1">
              <div className="text-[11px] text-muted-foreground">Label</div>
              <Input value={pm.label} onChange={(e) => setPm({ ...pm, label: e.target.value })} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-3 space-y-2">
          <h3 className="font-medium text-sm">Quiz Defaults</h3>
          <div className="grid md:grid-cols-3 gap-2">
            <div className="space-y-1">
              <div className="text-[11px] text-muted-foreground">Length (questions)</div>
              <Input type="number" min={1} max={50} value={qz.length} onChange={(e) => setQz({ ...qz, length: Math.max(1, Math.min(50, Number(e.target.value) || 0)) })} />
            </div>
            <div className="space-y-1">
              <div className="text-[11px] text-muted-foreground">Difficulty</div>
              <select className="border rounded-md h-8 px-2 text-sm bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100" aria-label="Quiz difficulty" value={qz.difficulty} onChange={(e) => setQz({ ...qz, difficulty: e.target.value })}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div className="space-y-1">
              <div className="text-[11px] text-muted-foreground">Question types</div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                <label className="flex items-center gap-2"><input type="checkbox" checked={qz.types.mcq} onChange={(e) => setQz({ ...qz, types: { ...qz.types, mcq: e.target.checked } })} /> MCQ</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={qz.types.short} onChange={(e) => setQz({ ...qz, types: { ...qz.types, short: e.target.checked } })} /> Short</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={qz.types.flashcard} onChange={(e) => setQz({ ...qz, types: { ...qz.types, flashcard: e.target.checked } })} /> Flashcards</label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-3 space-y-2">
          <h3 className="font-medium text-sm">AI Model</h3>
          <div className="grid md:grid-cols-3 gap-2">
            <div className="space-y-1 md:col-span-1">
              <div className="text-[11px] text-muted-foreground">Preferred model</div>
              <select className="border rounded-md h-8 px-2 text-sm bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100" aria-label="AI model" value={model} onChange={(e) => setModel(e.target.value)}>
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (fast)</option>
                <option value="gemini-2.5-pro">Gemini 2.5 Pro (reasoning)</option>
                <option value="openai-gpt-4o-mini">OpenAI (fallback)</option>
              </select>
            </div>
            <div className="md:col-span-2 text-[11px] text-muted-foreground">
              Your choice is used by AI features across the app. You can change this anytime.
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2 justify-end">
        <Button onClick={save}>Save Preferences</Button>
        {saved && <span className="text-xs text-green-600">Saved</span>}
      </div>
    </div>
  );
}
