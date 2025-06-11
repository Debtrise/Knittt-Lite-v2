declare module 'dagre' {
  class Graph {
    setDefaultEdgeLabel(callback: () => any): void;
    setGraph(options: any): void;
    setNode(id: string, node: any): void;
    setEdge(source: string, target: string): void;
    node(id: string): { x: number; y: number };
  }

  namespace graphlib {
    class Graph extends Graph {}
  }

  function layout(graph: Graph): void;
}