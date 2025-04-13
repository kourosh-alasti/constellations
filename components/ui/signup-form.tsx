"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import WebcamCapture from "@/components/ui/camera";

const formSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface SignupFormProps {
  onError?: (error: string) => void;
}

export function SignupForm({ onError }: SignupFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [photoCaptured, setPhotoCaptured] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
    },
  });

  async function onSubmit(data: FormValues) {
    setIsLoading(true);

    try {
      const response = await fetch("/api/py/auth/new", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          first_name: data.firstName,
          last_name: data.lastName,
          image: capturedImage ?? "",
          color: "#ffffff",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Signup failed");
      }

      localStorage.setItem("user_id", String(result));

      console.log("User ID saved to storage:", result);

      router.push("/nodes");
    } catch (error) {
      console.error("Signup error:", error);
      if (onError) {
        onError(
          error instanceof Error ? error.message : "Signup failed"
        );
      }
    } finally {
      setIsLoading(false);
    }
  }

  const handlePhotoCaptured = (image: string) => {
    setCapturedImage(image);
    setPhotoCaptured(true);
    setShowCamera(false);
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setPhotoCaptured(false);
    setShowCamera(true);
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Sign Up</h1>
        <p className="text-muted-foreground mt-2">
          Create your account to start your journey to the stars
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

          {/* First Name */}
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your first name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Last Name */}
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your last name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 📸 Camera Section */}
          <div className="flex flex-col items-center gap-4">
            {!photoCaptured && !showCamera && (
              <Button
                type="button"
                className="w-32 p-0 flex items-center justify-center rounded-md border"
                onClick={() => setShowCamera(true)}
              >
                Take Your Photo
              </Button>
            )}

            {showCamera && (
              <div className="flex flex-col items-center gap-4">
                <WebcamCapture onPhotoCaptured={handlePhotoCaptured} />
              </div>
            )}

            {photoCaptured && capturedImage && (
              <div className="flex flex-col items-center gap-2">
                <img
                  src={capturedImage}
                  alt="Captured"
                  className="w-24 h-24 object-cover rounded-full border"
                />
                <Button
                  type="button"
                  className="w-full"
                  onClick={handleRetake}
                >
                  Retake Photo
                </Button>
              </div>
            )}
          </div>

          {/* Submit */}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Signing up..." : "Sign Up"}
          </Button>
        </form>
      </Form>
    </div>
  );
}