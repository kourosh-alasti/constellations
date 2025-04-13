"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import WebcamCapture from "@/components/ui/camera";

interface FaceIDProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function FaceID({ open, onOpenChange }: FaceIDProps) {
  const [introDone, setIntroDone] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // reset everything when dialog closes
  useEffect(() => {
    if (!open) {
      setIntroDone(false);
      setCapturedImage(null);
    }
  }, [open]);

  // after photo captured
  const handlePhotoCaptured = async (image: string) => {
    setCapturedImage(image);

    try {
      const payload = { image: capturedImage };

      console.log("Submitting payload:", payload);

      const res = await fetch("/api/py/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "accept": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to upload face image");

      const data = await res.json();
      console.log("Face login success!", data);

      // close dialog after successful upload
      setTimeout(() => {
        onOpenChange(false);
      }, 1200);
    } catch (error) {
      console.error("Face login error:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-xl">
        <DialogHeader>
          <DialogTitle>
            {!introDone ? "Sign in with Face ID" : "Capturing Your Face"}
          </DialogTitle>
          <DialogDescription>
            {!introDone
              ? "Ready to shine? Make sure your star is centered and alone!"
              : "Position yourself carefully. We'll detect your face automatically."}
          </DialogDescription>
        </DialogHeader>

        {!introDone ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <Button
              onClick={() => setIntroDone(true)}
              className="hover:bg-primary/80 text-primary-foreground px-4 py-2 rounded-md transition-colors glow"
            >
              Start Face ID
            </Button>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center">
            <WebcamCapture onPhotoCaptured={handlePhotoCaptured} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
