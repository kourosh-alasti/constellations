"use client";

import React, { useState, useEffect, useRef } from "react";
import Head from "next/head";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";

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

const generateData = (numNodes = 20, theme = "dark"): GraphData => {
  // Space-themed names
  const names = [
    "Andromeda",
    "Sirius",
    "Vega",
    "Rigel",
    "Altair",
    "Antares",
    "Polaris",
    "Arcturus",
    "Betelgeuse",
    "Procyon",
    "Castor",
    "Aldebaran",
    "Deneb",
    "Regulus",
    "Bellatrix",
  ];

  // Star colors based on theme
  const starColors =
    theme === "dark"
      ? [
          "var(--star-color-1)",
          "var(--star-color-2)",
          "var(--star-color-3)",
          "var(--star-color-4)",
          "var(--star-color-5)",
        ]
      : [
          "var(--sun-color-1)",
          "var(--sun-color-2)",
          "var(--sun-color-3)",
          "var(--sun-color-4)",
          "var(--sun-color-5)",
        ];

  const nodes = Array.from(Array(numNodes).keys()).map((i) => ({
    id: i,
    name: names[i % names.length] + `_${i}`,
    x: Math.random() * 1000,
    y: Math.random() * 800,
    vx: 0,
    vy: 0,
    color: starColors[i % starColors.length],
    size: Math.random() * 3 + 3,
  }));

  const edges = Array.from(Array(numNodes).keys())
    .filter((i) => i > 0)
    .map((i) => ({
      source: i,
      target: Math.floor(Math.random() * i),
      value: Math.random() * 2 + 1,
    }));

  return { nodes, edges };
};

const NodesPage = () => {
  const [graphData, setGraphData] = useState<GraphData>({
    nodes: [],
    edges: [],
  });
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    // Generate initial data with current theme
    setGraphData(generateData(15, theme));

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
    <div className="min-h-screen bg-space text-foreground">
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
          <ThemeToggle />
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
            <button className="bg-primary hover:bg-primary/80 text-primary-foreground px-4 py-2 rounded-md transition-colors glow">
              Add New Star
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NodesPage;
