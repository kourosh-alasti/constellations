"use client";

import { redirect } from "next/navigation";
import { useEffect } from "react";

export default function OtherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const userId = localStorage.getItem("user_id");

    if (!userId) {
      redirect("/login");
    }
  });

  return <>{children}</>;
}
