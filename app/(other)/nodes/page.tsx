"use client";

import React, { useState, useEffect, useRef } from "react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import CameraDialog from "@/components/ui/camera-dialog";
import EditProfileButton from "@/components/ui/edit-profile";
import { redirect, useRouter } from "next/navigation";
import { LogOutIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import SearchFace from "@/components/ui/search-face";

// Dynamically import the Graph component to avoid SSR issues
const GraphComponent = dynamic(
  () => import("./_graph").then((mod) => ({ default: mod.Graph })),
  {
    ssr: false,
  }
);

interface Node {
  id: number;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color?: string;
  size?: number;
}

interface Edge {
  source: number;
  target: number;
  value?: number;
}

interface GraphData {
  nodes: Node[];
  edges: Edge[];
}

const NodesPage = () => {
  const router = useRouter();
  const [graphData, setGraphData] = useState<GraphData>({
    nodes: [],
    edges: [],
  });
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  // dialog
  const [open, setOpen] = useState(false);
  const handleClose = (open: boolean) => {
    setOpen(open);
  };
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    // Generate initial data with current theme
    async function fetcher() {
      const userId = localStorage.getItem("user_id");
      if (!userId) {
        redirect("/login");
      }

      const response = await fetch(`/api/py/graph/${userId}`);
      if (!response.ok) throw new Error("Failed to fetch user graph");
      const data = await response.json();

      setGraphData(data);
    }

    fetcher();

    // Set initial dimensions
    updateDimensions();

    // Update dimensions on window resize
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, [theme]);

  // Function to update dimensions based on container size
  const updateDimensions = () => {
    if (containerRef.current) {
      const { width } = containerRef.current.getBoundingClientRect();
      setDimensions({
        width: width,
        height: 800, // Fixed height or use clientHeight for fully responsive
      });
    }
  };

  return (
    <div className="min-h-screen text-foreground">
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 font-space text-gradient">
              Your Constellation
            </h1>
            <p className="text-muted-foreground">
              Explore your connections in the cosmic web
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Button
              className="bg-primary hover:bg-primary/80 text-primary-foreground px-4 py-2 rounded-md transition-colors glow flex flex-row gap-1"
              onClick={() => {
                localStorage.removeItem("user_id");
                router.replace("/login");
              }}
            >
              <LogOutIcon />
              Log Out
            </Button>
            <EditProfileButton />
            <ThemeToggle />
          </div>
        </div>

        <div
          ref={containerRef}
          className="bg-card/40 rounded-lg w-full h-[800px] border border-border/50 shadow-xl overflow-hidden card-space"
        >
          {dimensions.width > 0 && dimensions.height > 0 ? (
            <GraphComponent
              data={graphData}
              width={dimensions.width}
              height={dimensions.height}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Mapping the stars...</p>
            </div>
          )}
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card/90 p-6 rounded-lg card-space">
            <h3 className="text-lg font-bold mb-2 font-space">Cosmic Stats</h3>
            <p className="text-muted-foreground">
              Total Connections: {graphData.edges.length}
            </p>
            <p className="text-muted-foreground">
              Stars in Network: {graphData.nodes.length}
            </p>
          </div>
          <div className="bg-card/90 p-6 rounded-lg card-space">
            <h3 className="text-lg font-bold mb-2 font-space">
              Navigation Tips
            </h3>
            <ul className="text-muted-foreground space-y-2">
              <li>• Click on stars to focus on specific connections</li>
              <li>• Hover over stars to see details</li>
              <li>• Drag stars to rearrange your constellation</li>
            </ul>
          </div>
          <div className="bg-card/90 p-6 rounded-lg card-space">
            <h3 className="text-lg font-bold mb-2 font-space">
              Celestial Actions
            </h3>
            <div className="flex justify-between gap-2">
              <button
                className="bg-primary hover:bg-primary/80 text-primary-foreground px-4 py-2 rounded-md transition-colors glow"
                onClick={() => setOpen(true)}
              >
                Add New Star
              </button>
              <button
                className="bg-primary hover:bg-primary/80 text-primary-foreground px-4 py-2 rounded-md transition-colors glow w-1/2"
                onClick={() => setSearchOpen(true)}
              >
                Search The Stars
              </button>
            </div>
          </div>
        </div>
        <CameraDialog open={open} onOpenChange={handleClose} />
        <SearchFace open={searchOpen} onOpenChange={setSearchOpen} />
      </main>
    </div>
  );
};

export default NodesPage;
