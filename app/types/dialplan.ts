// Project Types
export interface DialplanProject {
  id: number;
  name: string;
  description?: string;
  tenantId?: string;
  isActive?: boolean;
  metadata?: Record<string, any>;
  lastDeployed?: string | null;
  createdAt: string;
  updatedAt: string;
  contexts?: DialplanContext[];
  deployments?: DialplanDeployment[];
}

// Context Types
export interface DialplanContext {
  id: number;
  projectId: number;
  name: string;
  description?: string;
  position: {
    x: number;
    y: number;
  };
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  nodes?: DialplanNode[];
}

// Node Types
export interface DialplanNode {
  id: number;
  contextId: number;
  nodeTypeId: number;
  name: string;
  label: string;
  position: {
    x: number;
    y: number;
  };
  properties: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface NodeType {
  id: number;
  name: string;
  description: string;
  category: 'extension' | 'application' | 'flowcontrol' | 'action' | 'terminal';
  inputHandles?: number;
  outputHandles?: number;
  defaultParams?: Record<string, any>;
  paramDefs?: ParamDefinition[];
}

export interface ParamDefinition {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'select';
  required: boolean;
  default?: any;
  options?: string[]; // For select type
  description?: string;
}

// Connection Types
export interface DialplanConnection {
  id: number;
  sourceNodeId: number;
  targetNodeId: number;
  condition: string | null;
  priority: number;
  createdAt: string;
  updatedAt: string;
  sourceNode?: DialplanNode;
  targetNode?: DialplanNode;
}

// Deployment Types
export interface DialplanDeployment {
  id: number;
  projectId: number;
  deployedAt: string;
  status: 'success' | 'failed';
  serverResponse: string;
}

// Validation Types
export interface ValidationResult {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  timestamp: string;
}

export interface ValidationIssue {
  level: 'project' | 'context' | 'node' | 'connection';
  nodeId?: number;
  nodeName?: string;
  contextId?: number;
  contextName?: string;
  message: string;
  severity: 'error' | 'warning';
}

// Generation Types
export interface DialplanGenerationResult {
  dialplan: string;
  project: string;
  contexts: number;
  timestamp: string;
}

// Deployment Request Types
export interface DeploymentRequest {
  server: string;
  port: number;
  username: string;
  password: string;
  asteriskPath: string;
}

// Capabilities Types
export interface DialplanCapabilities {
  message: string;
  capabilities: {
    nodeTypes: any;
    generator: boolean;
    validator: boolean;
    deployment: boolean;
  };
}

// React Flow Types (for the UI)
export interface ReactFlowNode {
  id: string;
  type: string;
  data: {
    label: string;
    nodeType: NodeType;
    properties: Record<string, any>;
    dialplanNode: DialplanNode;
  };
  position: Position;
}

export interface ReactFlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: string;
  data?: {
    condition: string | null;
    priority: number;
    dialplanConnection: DialplanConnection;
  };
}

export interface ReactFlowGraph {
  nodes: ReactFlowNode[];
  edges: ReactFlowEdge[];
}

export interface DialplanEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: string;
} 