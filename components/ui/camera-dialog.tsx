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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import WebcamCapture from "@/components/ui/camera";
import { redirect } from "next/navigation";

interface CameraDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CameraDialog({
  open,
  onOpenChange,
}: CameraDialogProps) {
  const [introDone, setIntroDone] = useState(false);
  const [photoCaptured, setPhotoCaptured] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [relation, setRelation] = useState("");

  // clear fields when dialog closed
  useEffect(() => {
    if (!open) {
      setIntroDone(false);
      setPhotoCaptured(false);
      setCapturedImage(null);
      setFirstName("");
      setLastName("");
      setRelation("");
    }
  }, [open]);

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
      // color: "#ffffff",
      relation: relation,
    };

    console.log("Submitting payload:", payload);

    const userId = localStorage.getItem("user_id");
    if (!userId) {
      redirect("/login");
    }

    try {
      const res = await fetch(`/api/py/node/${String(userId)}`, {
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
      location.reload();

      // reset everything
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
              : "Enter Details"}
          </DialogTitle>
          <DialogDescription>
            {!introDone
              ? "Ready to shine? Make sure your star is centered and alone!"
              : !photoCaptured
              ? "Position yourself carefully in the frame. We'll capture automatically."
              : "Fill out the person's information after capturing their photo."}
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
            {/* first name */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="firstName" className="text-right">
                First Name
              </Label>
              <Input
                id="firstName"
                className="col-span-3"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>

            {/* last name */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="lastName" className="text-right">
                Last Name
              </Label>
              <Input
                id="lastName"
                className="col-span-3"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>

            {/* relation */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="relation" className="text-right">
                Relation
              </Label>
              <div className="col-span-3">
                <Select
                  value={relation}
                  onValueChange={(value) => setRelation(value)}
                  required
                >
                  <SelectTrigger
                    id="relation"
                    className="rounded-md p-2 w-full pl-3"
                  >
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent className="rounded-md">
                    <SelectItem value="Family">Family</SelectItem>
                    <SelectItem value="Friend">Friend</SelectItem>
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
                >
                  Retake Photo
                </Button>
                <Button
                  type="submit"
                  className="hover:bg-primary/80 text-primary-foreground px-4 py-2 rounded-md transition-colors glow"
                >
                  Add Star
                </Button>
              </div>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
