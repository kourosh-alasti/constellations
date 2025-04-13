"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import TestFace from "@/components/ui/test-face";

export default function Page() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-background gap-4">
      <h1 className="text-2xl font-bold">for ahmad</h1>

      <Button variant="default" onClick={() => setOpen(true)}>
        Open Camera
      </Button>

      <TestFace open={open} onOpenChange={setOpen} />
    </div>
  );
}
