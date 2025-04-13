"use client";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="container mx-auto p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold font-space text-gradient">
          Constellations
        </h1>
        <ThemeToggle />
      </header>

      <main className="flex-1 flex items-center justify-center">
        <div className="container px-4 py-16 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="max-w-2xl">
            <h2 className="text-5xl md:text-6xl font-bold mb-6 font-space text-gradient">
              {theme === "dark"
                ? "Explore Your Cosmic Network"
                : "Discover Your Solar System"}
            </h2>
            <p className="text-xl mb-8 text-muted-foreground">
              {theme === "dark"
                ? "Visualize your connections as a constellation of stars in an interactive cosmic network. Navigate through your personal universe and discover new patterns."
                : "See your connections orbit around you like planets around the sun. Explore the warm glow of your network and the celestial bodies that revolve in your system."}
            </p>
            <div className="flex gap-4">
              <Button
                asChild
                size="lg"
                className="bg-primary hover:bg-primary/80 text-primary-foreground glow"
              >
                <Link href="/nodes">
                  {theme === "dark" ? "Launch Explorer" : "Enter Orbit"}
                </Link>
              </Button>
              <Button variant="outline" size="lg">
                Learn More
              </Button>
            </div>
          </div>

          <div className="w-full max-w-md aspect-square card-space rounded-full flex items-center justify-center relative">
            <div className="absolute inset-0 opacity-30 rounded-full overflow-hidden">
              {/* Animated stars/sun background */}
              <div
                className={`absolute inset-0 ${
                  theme === "dark"
                    ? "bg-[radial-gradient(ellipse_at_center,_var(--nebula-color-1)_0%,_transparent_70%)]"
                    : "bg-[radial-gradient(ellipse_at_center,_var(--solar-flare-1)_0%,_transparent_70%)]"
                }`}
              ></div>
            </div>
            <div className="text-6xl font-bold font-space text-gradient z-10">
              {theme === "dark" ? "✧" : "☀"}
            </div>
          </div>
        </div>
      </main>

      <footer className="container mx-auto p-4 border-t border-border/30 text-center text-muted-foreground">
        <p>
          {theme === "dark"
            ? "Navigate the stars • Explore your network • Discover new connections"
            : "Bask in the glow • Orbit your connections • Shine like the sun"}
        </p>
      </footer>
    </div>
  );
}
