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

  const [matches, setMatches] = useState<any[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  // Reset everything when closed
  useEffect(() => {
    if (!open) {
      setIntroDone(false);
      setPhotoCaptured(false);
      setCapturedImage(null);
      setMatches([]);
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

  const handleSubmit = async () => {
    if (!capturedImage) {
      console.error("No photo captured!");
      return;
    }

    const userId = localStorage.getItem("user_id");
    if (!userId) {
      console.error("User ID missing from local storage!");
      return;
    }

    const payload = { image: capturedImage };

    try {
      const res = await fetch(`/api/py/match-face/${userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to upload photo for matching");

      const data = await res.json();
      console.log("Matching complete!", data);

      fetchMatchedUsers(data);
    } catch (error) {
      console.error("Upload error:", error);
    }
  };

  const fetchMatchedUsers = async (matches: any[]) => {
    setLoadingMatches(true);
    try {
      const detailedMatches = await Promise.all(
        matches.map(async (match: any) => {
          try {
            const res = await fetch(`/api/py/node/${match.id}`, {
              method: "GET",
              headers: { Accept: "application/json" },
            });

            if (!res.ok) throw new Error("Failed to fetch user");

            const user = await res.json();
            return {
              id: user.id,
              firstName: user.first_name,
              lastName: user.last_name,
              image: user.image ? `data:image/jpeg;base64,${user.image}` : null,
            };
          } catch (err) {
            console.error("Failed to fetch match", match.id, err);
            return null;
          }
        })
      );

      setMatches(detailedMatches.filter(Boolean));
    } catch (err) {
      console.error("Failed fetching matched users", err);
    } finally {
      setLoadingMatches(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-xl">
        <DialogHeader>
          <DialogTitle>
            {!introDone
              ? "Scan a New Star"
              : !photoCaptured
              ? "Capture the Star"
              : matches.length === 0
              ? "Searching the Constellation..."
              : "Star(s) Found!"}
          </DialogTitle>
          <DialogDescription>
            {!introDone
              ? "Welcome, Stargazer. Let's add a new star to your constellation."
              : !photoCaptured
              ? "Position the star (person) carefully. We'll capture it automatically."
              : matches.length === 0
              ? "Analyzing the cosmic web for matches..."
              : "We found these matching stars in your galaxy."}
          </DialogDescription>
        </DialogHeader>

        {/* Steps */}
        {!introDone ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <Button
              onClick={() => setIntroDone(true)}
              className="hover:bg-primary/80 text-primary-foreground px-4 py-2 rounded-md transition-colors glow"
            >
              Begin Scan
            </Button>
          </div>
        ) : !photoCaptured ? (
          <div className="flex flex-col items-center">
            <WebcamCapture onPhotoCaptured={handlePhotoCaptured} />
          </div>
        ) : matches.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <Button
              onClick={handleSubmit}
              disabled={loadingMatches}
              className="hover:bg-primary/80 text-primary-foreground px-4 py-2 rounded-md transition-colors glow"
            >
              {loadingMatches ? "Scanning Stars..." : "Submit Scan"}
            </Button>
            <Button
              onClick={handleRetake}
              variant="secondary"
              className="px-4 py-2 rounded-md"
            >
              Retake Photo
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 py-4">
            {matches.map((user) => (
              <div
                key={user.id}
                className="flex flex-col items-center gap-2"
              >
                {user.image ? (
                  <img
                    src={user.image}
                    alt={`${user.firstName} ${user.lastName}`}
                    className="w-20 h-20 rounded-full object-cover border"
                  />
                ) : (
                  <div className="w-20 h-20 bg-muted flex items-center justify-center rounded-full border">
                    <span className="text-xs text-muted-foreground">
                      No Image
                    </span>
                  </div>
                )}
                <div className="text-sm font-medium text-center">
                  {user.firstName} {user.lastName}
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
