"use client";

import { useState, useEffect } from "react";
import { SignupForm } from "@/components/ui/signup-form";
import { LoginForm } from "@/components/ui/login-form";
import { Button } from "@/components/ui/button";
import FaceID from "@/components/ui/face-id";
import { redirect } from "next/navigation";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [showSignup, setShowSignup] = useState(false); // <-- NEW

  useEffect(() => {
    const userId = localStorage.getItem("user_id");

    if (userId) {
      redirect("/nodes");
    }
  }, []);

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

        {/* Show either LoginForm or SignupForm */}
        {showSignup ? (
          <SignupForm onError={handleError} />
        ) : (
          <LoginForm onError={handleError} />
        )}
      </div>
    </div>
  );
}
