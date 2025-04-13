"use client";

import { LoginForm } from "@/components/ui/login-form";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import FaceID from "@/components/ui/face-id";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const handleClose = (open: boolean) => {
    setOpen(open);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {error && (
          <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
            {error}
          </div>
        )}

        <LoginForm onError={handleError} />

        <div className="flex items-center justify-center gap-4 my-6">
          <div className="h-px flex-1 bg-muted" />
          <span className="text-muted-foreground text-sm">or log in with face id</span>
          <div className="h-px flex-1 bg-muted" />
        </div>

        <Button type="submit" className="w-full" onClick={() => setOpen(true)}>
          Use your Face
        </Button>
        <FaceID open={open} onOpenChange={handleClose} />

      </div>
    </div>
  );
}
