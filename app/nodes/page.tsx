"use client";

import React, { useState, useEffect, useRef } from "react";
import Head from "next/head";
import { Graph } from "./_graph";

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

const generateData = (numNodes = 20): GraphData => {
  const names = [
    "Alex",
    "Jordan",
    "Taylor",
    "Morgan",
    "Casey",
    "Riley",
    "Jamie",
    "Quinn",
    "Avery",
    "Peyton",
    "Blake",
    "Drew",
    "Emerson",
    "Finley",
    "Harper",
  ];

  const nodes = Array.from(Array(numNodes).keys()).map((i) => ({
    id: i,
    name: names[i % names.length] + `_${i}`,
    x: Math.random() * 1000,
    y: Math.random() * 800,
    vx: 0,
    vy: 0,
    color: `rgba(230, 230, 230, 0.5)`,
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

  useEffect(() => {
    setGraphData(generateData(15));

    // Set initial dimensions
    updateDimensions();
  }, []);

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
    <div className="min-h-screen bg-zinc-300 text-zinc-600">
      <Head>
        <title>Your Constellations</title>
      </Head>
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Your Network</h1>
          <p className="text-gray-400">
            Visualize your connections and relationships
          </p>
        </div>

        <div
          ref={containerRef}
          className="bg-black rounded-lg w-full h-[800px] border border-gray-800 shadow-xl overflow-hidden"
        >
          {dimensions.width > 0 && dimensions.height > 0 ? (
            <Graph
              data={graphData}
              width={dimensions.width}
              height={dimensions.height}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-400">Loading your network...</p>
            </div>
          )}
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-900 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Network Stats</h3>
            <p className="text-gray-400">
              Total Connections: {graphData.edges.length}
            </p>
            <p className="text-gray-400">
              People in Network: {graphData.nodes.length}
            </p>
          </div>
          <div className="bg-gray-900 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Tips</h3>
            <ul className="text-gray-400 list-disc list-inside">
              <li>Click on nodes to focus on specific people</li>
              <li>Hover over nodes to see details</li>
              <li>Drag nodes to rearrange the network</li>
            </ul>
          </div>
          <div className="bg-gray-900 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Actions</h3>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
              Add Connection
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NodesPage;
