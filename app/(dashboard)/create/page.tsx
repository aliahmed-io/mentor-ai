"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function CreatePage() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl md:text-2xl font-semibold">Create</h2>
      <Card>
        <CardContent className="p-6 space-y-3">
          <p className="text-sm text-muted-foreground">Slides and study docs are created from your uploaded materials on Home.</p>
          <Link href="/dashboard">
            <Button>Go to Home to generate</Button>
          </Link>
          <p className="text-xs text-muted-foreground">Upload your material and toggle "Create PPT Slides" or "Create Study Doc", then run.</p>
        </CardContent>
      </Card>
    </div>
  );
}


