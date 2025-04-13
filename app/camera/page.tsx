"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import CameraDialog from "@/components/ui/camera-dialog"; // <-- import the new component

export default function Page() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-background gap-4">
      <h1 className="text-2xl font-bold">Welcome to the Photo Capture</h1>

      {/* ANY button can now control the dialog */}
      <Button variant="default" onClick={() => setOpen(true)}>
        Open Camera
      </Button>

      {/* CameraDialog controlled by parent */}
      <CameraDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
