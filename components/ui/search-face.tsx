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
import WebcamCapture from "@/components/ui/camera";

interface SearchFaceProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface MatchUser {
  id: number;
  firstName: string;
  lastName: string;
  image: string | null;
}

export default function SearchFace({ open, onOpenChange }: SearchFaceProps) {
  const [introDone, setIntroDone] = useState(false);
  const [photoCaptured, setPhotoCaptured] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const [matchedUser, setMatchedUser] = useState<MatchUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [noMatch, setNoMatch] = useState(false);

  useEffect(() => {
    if (!open) {
      setIntroDone(false);
      setPhotoCaptured(false);
      setCapturedImage(null);
      setMatchedUser(null);
      setNoMatch(false);
    }
  }, [open]);

  const handlePhotoCaptured = async (image: string) => {
    setCapturedImage(image);
    setPhotoCaptured(true);
    await handleSubmit(image); // Auto-submit immediately after photo capture
  };

  const handleSubmit = async (image: string) => {
    if (!image) {
      console.error("No photo captured!");
      return;
    }

    const userId = localStorage.getItem("user_id");
    if (!userId) {
      console.error("User ID missing from local storage!");
      return;
    }

    setLoading(true);

    try {
      // Step 1: POST the photo
      const res = await fetch(`/api/py/match-face/${userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({ image }),
      });

      if (!res.ok) throw new Error("Failed to upload photo for matching");

      const data = await res.json();
      console.log("POST match response:", data);

      if (data.match_id === -1) {
        setNoMatch(true);
        setMatchedUser(null);
      } else {
        // Step 2: GET user info with match_id
        const userRes = await fetch(`/api/py/node/${data.match_id}`, {
          method: "GET",
          headers: { Accept: "application/json" },
        });

        if (!userRes.ok) throw new Error("Failed to fetch matched user");

        const user = await userRes.json();
        console.log("Matched user:", user);

        setMatchedUser({
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          image: user.image ? `data:image/jpeg;base64,${user.image}` : null,
        });
        setNoMatch(false);
      }
    } catch (error) {
      console.error("Matching error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = () => {
    setIntroDone(false);
    setPhotoCaptured(false);
    setCapturedImage(null);
    setMatchedUser(null);
    setNoMatch(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-xl">
        <DialogHeader>
          <DialogTitle>
            {!introDone
              ? "Scan for a Star"
              : loading
              ? "Searching the Constellation..."
              : matchedUser || noMatch
              ? "Result"
              : "Ready to Capture"}
          </DialogTitle>
          <DialogDescription>
            {!introDone
              ? "Welcome, Stargazer. Let's scan for a known star."
              : loading
              ? "Scanning the cosmic web for a match..."
              : matchedUser || noMatch
              ? "Here’s what we found."
              : "Position the star carefully. We'll capture automatically."}
          </DialogDescription>
        </DialogHeader>

        {/* Different states */}
        {!introDone ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <Button
              onClick={() => setIntroDone(true)}
              className="hover:bg-primary/80 text-primary-foreground px-4 py-2 rounded-md transition-colors glow"
            >
              Begin Scan
            </Button>
          </div>
        ) : loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : matchedUser ? (
          <div className="flex flex-col items-center gap-4 py-6">
            {matchedUser.image ? (
              <img
                src={matchedUser.image}
                alt={`${matchedUser.firstName} ${matchedUser.lastName}`}
                className="w-40 h-40 rounded-full object-cover border"
              />
            ) : (
              <div className="w-20 h-20 bg-muted flex items-center justify-center rounded-full border">
                <span className="text-xs text-muted-foreground">No Image</span>
              </div>
            )}
            <div className="text-center">
              <div className="text-lg font-bold">
                {matchedUser.firstName} {matchedUser.lastName}
              </div>
            </div>

            <Button
              onClick={handleRestart}
              variant="secondary"
              className="px-4 py-2 rounded-md"
            >
              Scan Again
            </Button>
          </div>
        ) : noMatch ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="text-center text-muted-foreground">
              No matching stars found.
            </div>
            <Button
              onClick={handleRestart}
              variant="secondary"
              className="px-4 py-2 rounded-md"
            >
              Try Again
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <WebcamCapture onPhotoCaptured={handlePhotoCaptured} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
