"use client";

import React, { useRef, useCallback, useState, useEffect } from "react";
import ForceGraph2D from "react-force-graph-2d";
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
    background: "#1a1a1a",
    node: "#6272a4",
    nodeHover: "#bd93f9",
    nodeSelected: "#ff79c6",
    link: "#4c566a",
    linkHighlight: "#8be9fd",
    text: "#f8f8f2",
    tooltipBackground: "rgba(40, 42, 54, 0.9)",
    grid: "#333333",
    dots: "rgba(255, 255, 255, 0.07)",
  };

  // Create dot matrix background pattern
  useEffect(() => {
    const canvas = backgroundRef.current;
    if (!canvas || !width || !height) return;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Fill background
    ctx.fillStyle = theme.background;
    ctx.fillRect(0, 0, width, height);

    // Draw dot matrix
    const dotSize = 1.5;
    const spacing = 20;
    ctx.fillStyle = theme.dots;

    for (let x = spacing; x < width; x += spacing) {
      for (let y = spacing; y < height; y += spacing) {
        ctx.beginPath();
        ctx.arc(x, y, dotSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, [width, height, theme.background, theme.dots]);

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
          color: node.color || theme.node,
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
  }, [data, theme.node]);

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

    // Apply appropriate color based on state
    let nodeColor = node.color || theme.node;
    if (isSelected) nodeColor = theme.nodeSelected;
    else if (isHovered) nodeColor = theme.nodeHover;
    else if (isHighlighted) nodeColor = theme.nodeHover;

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

    // Add node name label
    ctx.font = "10px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";

    // Draw text with slight offset above the node
    ctx.fillText(node.name, node.x!, node.y! - outerRadius - 5);
  }

  // Link styling
  const linkColor = useCallback(
    (link: Edge) => {
      return highlightLinks.some(
        (l) =>
          (l.source === link.source && l.target === link.target) ||
          (l.source === link.target && l.target === link.source)
      )
        ? theme.linkHighlight
        : theme.link;
    },
    [highlightLinks, theme]
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
        background: theme.background,
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
          nodePaint(node, ctx, node.color || theme.node)
        }
        nodeCanvasObjectMode={() => "replace"}
        linkWidth={(link) => (highlightLinks.includes(link as Edge) ? 3 : 1.5)}
        linkColor={linkColor}
        linkDirectionalParticles={4}
        linkDirectionalParticleWidth={(link) =>
          highlightLinks.includes(link as Edge) ? 6 : 0
        }
        linkDirectionalParticleSpeed={0.005}
        backgroundColor="transparent"
        onNodeHover={handleNodeHover}
        onNodeClick={handleNodeClick}
        onBackgroundClick={handleBackgroundClick}
        cooldownTicks={200}
        d3AlphaDecay={0.01}
        d3VelocityDecay={0.2}
        minZoom={1}
        maxZoom={4}
      />

      {/* Info Panel for Selected Node */}
      {selectedNode && (
        <div
          style={{
            position: "absolute",
            top: 20,
            left: 20,
            background: theme.tooltipBackground,
            padding: "12px 16px",
            borderRadius: 6,
            color: theme.text,
            maxWidth: 200,
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            zIndex: 10,
          }}
        >
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: "bold" }}>
            {selectedNode.name}
          </h3>
          <p style={{ margin: "8px 0 0", fontSize: 14 }}>
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
          color: "rgba(255,255,255,0.5)",
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
