"use client";

import { useState } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import WebcamCapture from "@/components/ui/camera";

interface CameraDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CameraDialog({ open, onOpenChange }: CameraDialogProps) {
  const [photoCaptured, setPhotoCaptured] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [relation, setRelation] = useState("");

  // after photo captured
  const handlePhotoCaptured = (image: string) => {
    setCapturedImage(image);
    setPhotoCaptured(true);
  };

  // retake photo
  const handleRetake = () => {
    setPhotoCaptured(false);
    setCapturedImage(null);
  };

  // handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!capturedImage) {
      console.error("No captured image!");
      return;
    }

    const payload = {
      first_name: firstName,
      last_name: lastName,
      image: capturedImage,
      color: "#ffffff",
    };

    console.log("Submitting payload:", payload);

    try {
      const res = await fetch("api/py/node", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "accept": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to upload data");

      const data = await res.json();
      console.log("Upload successful!", data);

      // reset everything
      onOpenChange(false);
      setPhotoCaptured(false);
      setCapturedImage(null);
      setFirstName("");
      setLastName("");
      setRelation("");
    } catch (error) {
      console.error("Upload error:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-black border border-gray-400 text-white rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-white">
            {!photoCaptured ? "Take a Photo" : "Enter Person Details"}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {!photoCaptured
              ? "Position yourself in the frame. We'll capture automatically."
              : "Fill out the person's information after capturing their photo."}
          </DialogDescription>
        </DialogHeader>

        {/* content */}
        {!photoCaptured ? (
          <div className="flex flex-col items-center">
            <WebcamCapture onPhotoCaptured={handlePhotoCaptured} />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            {/* first name */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="firstName" className="text-right text-white">First Name</Label>
              <Input
                id="firstName"
                className="col-span-3 bg-neutral-900 text-white"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>

            {/* last name */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="lastName" className="text-right text-white">Last Name</Label>
              <Input
                id="lastName"
                className="col-span-3 bg-neutral-900 text-white"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>

            {/* relation */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="relation" className="text-right text-white">Relation</Label>
              <div className="col-span-3">
                <Select
                  value={relation}
                  onValueChange={(value) => setRelation(value)}
                  required
                >
                  <SelectTrigger id="relation" className="bg-neutral-900 text-white rounded-md p-2 w-full">
                    <SelectValue placeholder="Select relation..." />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 text-white rounded-md">
                    <SelectItem value="Friend">Friend</SelectItem>
                    <SelectItem value="Family">Family</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* footer buttons */}
            <DialogFooter className="pt-4">
              <div className="flex justify-between w-full">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleRetake}
                  className="bg-gray-700 text-white hover:bg-gray-600"
                >
                  Retake Photo
                </Button>
                <Button
                  type="submit"
                  className="bg-white text-black hover:bg-gray-200"
                >
                  Save Details
                </Button>
              </div>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
