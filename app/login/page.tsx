"use client";

import { LoginForm } from "@/components/ui/login-form";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleSuccess = () => {
    // Navigate to the dashboard or home page after successful login
    router.push("/");
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

        <LoginForm onSuccess={handleSuccess} onError={handleError} />
      </div>
    </div>
  );
}
