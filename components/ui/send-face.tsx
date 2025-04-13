"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import WebcamCapture from "@/components/ui/camera";

interface SendFaceProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SendFace({ open, onOpenChange }: SendFaceProps) {
  const [introDone, setIntroDone] = useState(false);
  const [photoCaptured, setPhotoCaptured] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [userId, setUserId] = useState("");

  // Reset fields when dialog closes
  useEffect(() => {
    if (!open) {
      setIntroDone(false);
      setPhotoCaptured(false);
      setCapturedImage(null);
      setUserId("");
    }
  }, [open]);

  const handlePhotoCaptured = (image: string) => {
    setCapturedImage(image);
    setPhotoCaptured(true);
  };

  const handleRetake = () => {
    setPhotoCaptured(false);
    setCapturedImage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!capturedImage || !userId) {
      console.error("Photo or User ID missing!");
      return;
    }

    const payload = {
      image: capturedImage
    };

    console.log("Submitting payload:", payload);

    try {
      const res = await fetch(`/api/py/match-face/${userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to upload data");

      const data = await res.json();
      console.log("Upload successful!", data);

      onOpenChange(false);
    } catch (error) {
      console.error("Upload error:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-xl">
        <DialogHeader>
          <DialogTitle>
            {!introDone
              ? "Add a Star to Your Galaxy"
              : !photoCaptured
              ? "Take a Photo"
              : "Enter Your User ID"}
          </DialogTitle>
          <DialogDescription>
            {!introDone
              ? "Ready to shine? Make sure your star is centered and alone!"
              : !photoCaptured
              ? "Position yourself carefully in the frame. We'll capture automatically."
              : "Enter your user ID to upload your photo."}
          </DialogDescription>
        </DialogHeader>

        {!introDone ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <Button
              onClick={() => setIntroDone(true)}
              className="hover:bg-primary/80 text-primary-foreground px-4 py-2 rounded-md transition-colors glow"
            >
              Start Camera
            </Button>
          </div>
        ) : !photoCaptured ? (
          <div className="flex flex-col items-center">
            <WebcamCapture onPhotoCaptured={handlePhotoCaptured} />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            {/* User ID field */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="userId" className="text-right">
                User ID
              </Label>
              <Input
                id="userId"
                className="col-span-3"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                required
              />
            </div>

            {/* Footer buttons */}
            <DialogFooter className="pt-4">
              <div className="flex justify-between w-full">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleRetake}
                >
                  Retake Photo
                </Button>
                <Button
                  type="submit"
                  className="hover:bg-primary/80 text-primary-foreground px-4 py-2 rounded-md transition-colors glow"
                >
                  Submit
                </Button>
              </div>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
