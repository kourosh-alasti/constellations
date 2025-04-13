"use client";

import React, { useRef, useCallback, useState, useEffect } from "react";
import ForceGraph2D from "react-force-graph-2d";
import * as d3 from 'd3';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Define Node and Edge interfaces
interface Node {
  id: number;
  name: string;
  color?: string;
  size?: number;
  val?: number;
  neighbors?: number[];
  x?: number;
  y?: number;
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

interface GraphProps {
  data: GraphData;
  width: number;
  height: number;
}

export const Graph = ({ data, width, height }: GraphProps) => {
  const [graphData, setGraphData] = useState<{ nodes: Node[]; links: Edge[] }>({
    nodes: [],
    links: [],
  });
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [highlightLinks, setHighlightLinks] = useState<Edge[]>([]);
  const [highlightNodes, setHighlightNodes] = useState<Node[]>([]);
  const [hoverNode, setHoverNode] = useState<Node | null>(null);
  const backgroundRef = useRef<HTMLCanvasElement>(null);

  // Add state for dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [nodeDetails, setNodeDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const cachedDataRef = useRef<Map<number, any>>(new Map());

  // Theme settings inspired by Obsidian
  const theme = {
    background: "transparent",
    node: "rgba(189, 147, 249, 1)", // Purple star color
    nodeHover: "rgba(255, 121, 198, 1)", // Pink star color
    nodeSelected: "rgba(139, 233, 253, 1)", // Cyan star color
    link: "rgba(255, 255, 255, 0.15)",
    linkHighlight: "rgba(139, 233, 253, 1)", // Cyan link highlight
    text: "rgba(236, 239, 244, 1)",
    tooltipBackground: "rgba(22, 27, 34, 1)",
    grid: "transparent",
    dots: "rgba(255, 255, 255, 0.05)",
  };

  // Light mode theme settings
  const lightTheme = {
    background: "transparent",
    node: "rgba(217, 119, 6, 1)", // Orange star color
    nodeHover: "rgba(249, 115, 22, 1)", // Brighter orange star color
    nodeSelected: "rgba(245, 158, 11, 1)", // Yellow star color
    link: "rgba(234, 88, 12, 0.4)",
    linkHighlight: "rgba(245, 158, 11, 1)", // Yellow link highlight
    text: "rgba(45, 55, 72, 1)",
    tooltipBackground: "rgba(255, 248, 234, 1)",
    grid: "transparent",
    dots: "rgba(245, 158, 11, 0.6)",
  };

  // Determine which theme to use based on dark mode
  const [themeMode, setThemeMode] = useState(theme);

  useEffect(() => {
    // Check if system is in dark mode or light mode
    const isDarkMode = document.documentElement.classList.contains("dark");
    setThemeMode(isDarkMode ? theme : lightTheme);

    // Listen for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          const isDark = document.documentElement.classList.contains("dark");
          setThemeMode(isDark ? theme : lightTheme);
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });

    return () => observer.disconnect();
  }, []);

  // Create dot matrix background pattern
  useEffect(() => {
    const canvas = backgroundRef.current;
    if (!canvas || !width || !height) return;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Fill background
    ctx.fillStyle = themeMode.background;
    ctx.fillRect(0, 0, width, height);

    // Draw dot matrix
    const dotSize = 1.5;
    const spacing = 20;
    ctx.fillStyle = themeMode.dots;

    for (let x = spacing; x < width; x += spacing) {
      for (let y = spacing; y < height; y += spacing) {
        ctx.beginPath();
        ctx.arc(x, y, dotSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, [width, height, themeMode.background, themeMode.dots]);

  // Process data on mount
  useEffect(() => {
    if (data && data.nodes.length > 0) {
      // Create a map for faster node lookups
      const nodeMap = new Map<number, Node>();

      // Process nodes to ensure they have all necessary properties
      const processedNodes = data.nodes.map((node) => {
        const processedNode = {
          ...node,
          val: node.size || 5,
          color: themeMode.node || node.color,
          neighbors: [],
        };
        nodeMap.set(node.id, processedNode);
        return processedNode;
      });

      // Process edges and build neighbor lists
      const processedLinks = data.edges.map((edge) => {
        const sourceId =
          typeof edge.source === "number" ? edge.source : edge.source;
        const targetId =
          typeof edge.target === "number" ? edge.target : edge.target;

        // Add to neighbors list
        const sourceNode = nodeMap.get(sourceId);
        const targetNode = nodeMap.get(targetId);

        if (sourceNode && targetNode) {
          if (!sourceNode.neighbors) sourceNode.neighbors = [];
          if (!targetNode.neighbors) targetNode.neighbors = [];

          sourceNode.neighbors.push(targetId);
          targetNode.neighbors.push(sourceId);
        }

        return {
          ...edge,
          source: sourceId,
          target: targetId,
          value: edge.value || 1,
        };
      });

      setGraphData({
        nodes: processedNodes,
        links: processedLinks,
      });

      console.log("Graph initialized with:", {
        nodes: processedNodes.length,
        links: processedLinks.length,
      });
    }
  }, [data, themeMode.node]);

  // Add function to fetch node data
  const fetchNodeData = useCallback(async (nodeId: number) => {
    // If data is already cached, don't fetch again
    if (cachedDataRef.current.has(nodeId)) {
      return cachedDataRef.current.get(nodeId);
    }

    setIsLoading(true);
    try {
      // Simulate API call - replace with your actual API endpoint
      const response = await new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            id: nodeId,
            details: {
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              status: "Active",
              connections: Math.floor(Math.random() * 20) + 1,
              description: `Detailed information about node ${nodeId}`,
            },
          });
        }, 300); // Simulate network delay
      });

      // Cache the result
      cachedDataRef.current.set(nodeId, response);
      return response;
    } catch (error) {
      console.error("Error fetching node data:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  function nodePaint(node: Node, ctx: CanvasRenderingContext2D, color: string) {
    // Determine if node is hovered, selected or highlighted
    const isSelected = selectedNode && node.id === selectedNode.id;
    const isHighlighted = highlightNodes.some((n) => n.id === node.id);
    const isHovered = hoverNode && node.id === hoverNode.id;

    // Add node.color
    let nodeColor = themeMode.node;
    if (isSelected) nodeColor = themeMode.nodeSelected;
    else if (isHovered) nodeColor = themeMode.nodeHover;
    else if (isHighlighted) nodeColor = themeMode.nodeHover;

    ctx.fillStyle = nodeColor;

    // Draw star for all nodes
    let spikes = 5;
    let outerRadius = 7;
    let innerRadius = 3;
    let rotation = (Math.PI / 2) * 3;
    let step = Math.PI / spikes;

    ctx.beginPath();
    for (let i = 0; i < spikes; i++) {
      let x1 = node.x! + Math.cos(rotation) * outerRadius;
      let y1 = node.y! + Math.sin(rotation) * outerRadius;
      ctx.lineTo(x1, y1);
      rotation += step;

      let x2 = node.x! + Math.cos(rotation) * innerRadius;
      let y2 = node.y! + Math.sin(rotation) * innerRadius;
      ctx.lineTo(x2, y2);
      rotation += step;
    }
    ctx.closePath();
    ctx.fill();

    // Add subtle glow effect for stars
    if (isSelected || isHovered) {
      ctx.save();
      ctx.shadowColor = nodeColor;
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.restore();
    }

    // Add node name label
    ctx.font = "8px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = themeMode.text;

    // Draw text with slight offset above the node, showing only first name
    const firstName = node.name.split(' ')[0];
    ctx.fillText(firstName, node.x!, node.y! - outerRadius - 5);
  }

  // Link styling
  const linkColor = useCallback(
    (link: Edge) => {
      return highlightLinks.some(
        (l) =>
          (l.source === link.source && l.target === link.target) ||
          (l.source === link.target && l.target === link.source)
      )
        ? themeMode.linkHighlight
        : themeMode.link;
    },
    [highlightLinks, themeMode]
  );

  // Handle node hover with prefetch
  const handleNodeHover = useCallback(
    (node: Node | null) => {
      if (!node) {
        setHoverNode(null);
        if (!selectedNode) {
          setHighlightLinks([]);
          setHighlightNodes([]);
        }
        return;
      }

      setHoverNode(node);

      // Prefetch data when hovering
      fetchNodeData(node.id);

      // Don't change highlighting if a node is selected
      if (selectedNode) return;

      // Highlight connected links and nodes
      const connectedLinks = graphData.links.filter(
        (link) => link.source === node.id || link.target === node.id
      );

      const connectedNodes = graphData.nodes.filter((n) =>
        node.neighbors?.includes(n.id)
      );

      setHighlightLinks(connectedLinks);
      setHighlightNodes(connectedNodes);
    },
    [selectedNode, graphData.links, graphData.nodes, fetchNodeData]
  );

  // Handle node click with dialog
  const handleNodeClick = useCallback(
    async (node: Node) => {
      // If clicking the selected node, deselect it
      if (selectedNode && selectedNode.id === node.id) {
        setSelectedNode(null);
        setHighlightLinks([]);
        setHighlightNodes([]);
        return;
      }

      setSelectedNode(node);

      // Highlight connected links and nodes
      const connectedLinks = graphData.links.filter(
        (link) => link.source === node.id || link.target === node.id
      );

      const connectedNodes = graphData.nodes.filter((n) =>
        node.neighbors?.includes(n.id)
      );

      setHighlightLinks(connectedLinks);
      setHighlightNodes(connectedNodes);

      // Get node details (from cache if available)
      const details = await fetchNodeData(node.id);
      setNodeDetails(details);
      setDialogOpen(true);

      console.log("Selected node:", node);
    },
    [selectedNode, graphData.links, graphData.nodes, fetchNodeData]
  );

  // Handle background click
  const handleBackgroundClick = useCallback(() => {
    setSelectedNode(null);
    setHighlightLinks([]);
    setHighlightNodes([]);
  }, []);

  return (
    <div
      style={{
        width: width,
        height: height,
        position: "relative",
        background: themeMode.background,
        borderRadius: "8px",
        overflow: "hidden",
      }}
    >
      {/* Dot Matrix Background */}
      <canvas
        ref={backgroundRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      />

      <ForceGraph2D
        graphData={graphData}
        width={width}
        height={height}
        nodeRelSize={6}
        nodeVal={(node) =>
          (node.val || 5) * (selectedNode?.id === node.id ? 1.5 : 1)
        }
        nodeCanvasObject={(node, ctx) =>
          nodePaint(node, ctx, node.color || themeMode.node)
        }
        nodeCanvasObjectMode={() => "replace"}
        linkWidth={(link) => (highlightLinks.includes(link as Edge) ? 3 : 1.5)}
        linkColor={linkColor}
        linkDirectionalParticles={5}
        linkDirectionalParticleWidth={(link) =>
          highlightLinks.includes(link as Edge) ? 6 : 0
        }
        linkDirectionalParticleSpeed={0.003}
        backgroundColor="transparent"
        onNodeHover={handleNodeHover}
        onNodeClick={handleNodeClick}
        onBackgroundClick={handleBackgroundClick}
        cooldownTicks={300}
        d3AlphaDecay={0.001} // Even slower decay for much smoother transitions
        d3VelocityDecay={0.08} // Slightly higher to dampen sudden movements
        warmupTicks={100}
        onEngineStop={() => {
          console.log("Graph physics settled");
        }}
        d3Force={(engine: any) => {
          engine.force('charge')
            .strength(-30) // Even weaker repulsion
            .distanceMax(500); // Longer distance for charge effect
          
          engine.force('link')
            .distance(200)
            .strength(0.1); // Much weaker link force for smoother movement
          
          engine.force('center')
            .strength(0.005); // Very gentle centering force
          
          // Add collision force to prevent overlap but keep it very gentle
          engine.force('collision')
            .radius(20)
            .strength(0.1);
        }}
        minZoom={0.5}
        maxZoom={4}
      />

      {/* Info Panel for Selected Node */}
      {selectedNode && (
        <div
          style={{
            position: "absolute",
            top: 20,
            left: 20,
            background: themeMode.tooltipBackground,
            padding: "12px 16px",
            borderRadius: 6,
            color: themeMode.text,
            maxWidth: 200,
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            zIndex: 10,
            backdropFilter: "blur(8px)",
            border: `1px solid ${themeMode.linkHighlight}40`,
          }}
        >
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: "bold" }}>
            {selectedNode.name.split(' ')[0]}
          </h3>
          <p style={{ margin: "8px 0 0", fontSize: 14, opacity: 0.7 }}>
            {selectedNode.neighbors?.length || 0} connection
            {selectedNode.neighbors?.length !== 1 ? "s" : ""}
          </p>
        </div>
      )}

      {/* Help text */}
      <div
        style={{
          position: "absolute",
          bottom: 20,
          right: 20,
          color: themeMode.text,
          fontSize: 12,
          textAlign: "right",
        }}
      >
        Drag to pan • Scroll to zoom • Click node to select
      </div>

      {/* Node Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedNode?.name}</DialogTitle>
            <DialogDescription>Node details and information</DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
              </div>
            ) : nodeDetails ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm font-medium">ID</div>
                  <div>{nodeDetails.id}</div>

                  <div className="text-sm font-medium">Status</div>
                  <div>{nodeDetails.details.status}</div>

                  <div className="text-sm font-medium">Connections</div>
                  <div>{nodeDetails.details.connections}</div>

                  <div className="text-sm font-medium">Created</div>
                  <div>
                    {new Date(nodeDetails.details.createdAt).toLocaleString()}
                  </div>

                  <div className="text-sm font-medium">Updated</div>
                  <div>
                    {new Date(nodeDetails.details.updatedAt).toLocaleString()}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium mb-2">Description</div>
                  <p className="text-sm">{nodeDetails.details.description}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">No details available</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
