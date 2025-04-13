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

interface EditProfileProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditProfileDialog({ open, onOpenChange }: EditProfileProps) {
  const [userId, setUserId] = useState<number | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [photoCaptured, setPhotoCaptured] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  // Get user info when dialog opens
  useEffect(() => {
    if (open) {
      const id = localStorage.getItem("user_id");
      if (id) {
        setUserId(Number(id));
        fetchUserData(Number(id));
      }
    }
  }, [open]);

  async function fetchUserData(id: number) {
    try {
      const res = await fetch(`/api/py/node/${id}`, {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
      });

      if (!res.ok) throw new Error("Failed to fetch user data");

      const user = await res.json();
      console.log(user)

      setFirstName(user.first_name || "");
      setLastName(user.last_name || "");
      setCapturedImage(user.image ? `data:image/jpeg;base64,${user.image}` : null);
      setPhotoCaptured(false);
      setShowCamera(false);
    } catch (error) {
      console.error("Fetch user error:", error);
    }
  }

  const handlePhotoCaptured = (image: string) => {
    setCapturedImage(image);
    setPhotoCaptured(true);
    setShowCamera(false);
  };

  const handleRetake = () => {
    setShowCamera(true);
  };

  const handleSubmit = async () => {
    if (!userId) return;

    const payload: any = {
      first_name: firstName,
      last_name: lastName,
    };

    if (capturedImage) {
      payload.image = capturedImage;
    }

    try {
      const res = await fetch(`/api/py/node/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "accept": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to update profile");

      const data = await res.json();
      console.log("Profile updated!", data);

      onOpenChange(false);
    } catch (error) {
      console.error("Update error:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-xl">
        <DialogHeader>
          <DialogTitle>Edit Your Star Profile</DialogTitle>
          <DialogDescription>Update your name or take a new photo if you'd like.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* first name */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="firstName" className="text-right">First Name</Label>
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
            <Label htmlFor="lastName" className="text-right">Last Name</Label>
            <Input
              id="lastName"
              className="col-span-3"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>

          {/* photo */}
          <div className="flex flex-col items-center mt-4 gap-2">
            {showCamera ? (
              <WebcamCapture onPhotoCaptured={handlePhotoCaptured} />
            ) : (
              <>
                {capturedImage ? (
                  <img
                    src={capturedImage}
                    alt="Captured"
                    className="w-32 h-32 object-cover rounded-full border"
                  />
                ) : (
                  <div className="w-32 h-32 bg-muted flex items-center justify-center rounded-full border">
                    <span className="text-muted-foreground text-sm">No Photo</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* footer buttons */}
          <DialogFooter className="pt-4">
            <div className="flex justify-between w-full">
              <Button
                type="button"
                variant="secondary"
                onClick={handleRetake}
                className="px-4 py-2 rounded-md"
              >
                Retake Photo
              </Button>

              <Button
                type="button"
                onClick={handleSubmit}
                className="hover:bg-primary/80 text-primary-foreground px-4 py-2 rounded-md transition-colors glow"
              >
                Save Changes
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
