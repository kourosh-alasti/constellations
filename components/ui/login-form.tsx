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
import FaceID from "@/components/ui/face-id";
import { ScanFace } from 'lucide-react';

// Define form schema with Zod
const formSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

interface LoginFormProps {
  onError?: (error: string) => void;
}

export function LoginForm({ onError }: LoginFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleClose = (open: boolean) => {
    setOpen(open);
  };

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
    },
  });

  // Handle form submission
  async function onSubmit(data: FormValues) {
    setIsLoading(true);

    try {
      const response = await fetch("/api/py/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          first_name: data.firstName,
          last_name: data.lastName,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Authentication failed");
      }

      if (result.id) {
        localStorage.setItem("user_id", result.id);
        router.push("/nodes");
      } else {
        if (onError) {
          onError("No ID Returned.");
        }
      }
    } catch (error) {
      console.error("Login error:", error);

      // Call error callback if provided
      if (onError) {
        onError(
          error instanceof Error ? error.message : "Authentication failed"
        );
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Login</h1>
        <p className="text-muted-foreground mt-2">
          Enter your credentials to sign in
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>LastName</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="Enter your last name"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex w-full gap-4">
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Log in"}
            </Button>

            <Button
              type="button"
              onClick={() => setOpen(true)}
              className="w-9 h-9 p-0 flex items-center justify-center rounded-md border"
            >
              <ScanFace className="w-6 h-6" />
            </Button>
          </div>

          <FaceID open={open} onOpenChange={handleClose} />
        </form>
      </Form>
    </div>
  );
}
