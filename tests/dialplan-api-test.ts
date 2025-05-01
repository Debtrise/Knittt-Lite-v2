import { 
  getProjects, 
  createProject, 
  getProjectDetails, 
  updateProject, 
  deleteProject, 
  cloneProject,
  getContextsForProject,
  createContext,
  getContextDetails,
  getNodesForContext,
  createNode,
  getNodeDetails,
  getNodeTypes,
  getConnectionsForContext,
  createConnection,
  validateProject,
  generateDialplan,
  checkDialplanCapabilities
} from '../app/utils/dialplanApi';

async function testDialplanAPIs() {
  console.log('Starting Dialplan API Tests');
  
  // Initialize variables
  let newProjectId: number | null = null;
  let contextId: number | null = null;
  let entryNodeId: number | null = null; 
  let hangupNodeId: number | null = null;
  let clonedProjectId: number | null = null;
  
  // Step 1: Check capabilities
  console.log('\n--- Testing: Check Capabilities ---');
  try {
    const capabilities = await checkDialplanCapabilities();
    console.log('Capabilities:', capabilities);
    
    if (!capabilities.capabilities.nodeTypes) {
      console.error('Dialplan service is not available. Tests cannot continue.');
      return;
    }
  } catch (error) {
    console.error('Error checking capabilities:', error);
    return;
  }
  
  // Step 2: Get current projects
  console.log('\n--- Testing: Get Projects ---');
  let projects;
  try {
    projects = await getProjects();
    console.log(`Found ${projects.length} projects`);
  } catch (error) {
    console.error('Error getting projects:', error);
  }
  
  // Step 3: Create a new project
  console.log('\n--- Testing: Create Project ---');
  try {
    const newProject = await createProject({
      name: `Test Project ${new Date().toISOString()}`,
      description: 'This is a test project created via API test'
    });
    console.log('Created project:', newProject);
    newProjectId = newProject.id;
  } catch (error) {
    console.error('Error creating project:', error);
    return;
  }
  
  if (!newProjectId) {
    console.error('Failed to get project ID, cannot continue tests');
    return;
  }
  
  // Step 4: Get project details
  console.log('\n--- Testing: Get Project Details ---');
  let projectDetails;
  try {
    projectDetails = await getProjectDetails(newProjectId);
    console.log('Project details:', projectDetails);
  } catch (error) {
    console.error('Error getting project details:', error);
  }
  
  // Step 5: Update project
  console.log('\n--- Testing: Update Project ---');
  try {
    if (projectDetails) {
      const updatedProject = await updateProject(newProjectId, {
        name: `${projectDetails.name} (Updated)`,
        description: `${projectDetails.description} - Updated at ${new Date().toISOString()}`
      });
      console.log('Updated project:', updatedProject);
    }
  } catch (error) {
    console.error('Error updating project:', error);
  }
  
  // Step 6: Create a context
  console.log('\n--- Testing: Create Context ---');
  try {
    const newContext = await createContext(newProjectId, {
      name: 'default',
      description: 'Default context',
      position: { x: 100, y: 100 }
    });
    console.log('Created context:', newContext);
    contextId = newContext.id;
  } catch (error) {
    console.error('Error creating context:', error);
  }
  
  if (!contextId) {
    console.error('Failed to get context ID, skipping node and connection tests');
  } else {
    // Step 7: Get contexts for project
    console.log('\n--- Testing: Get Contexts for Project ---');
    try {
      const contexts = await getContextsForProject(newProjectId);
      console.log(`Found ${contexts.length} contexts:`, contexts);
    } catch (error) {
      console.error('Error getting contexts:', error);
    }
    
    // Step 8: Get node types
    console.log('\n--- Testing: Get Node Types ---');
    let nodeTypes;
    try {
      nodeTypes = await getNodeTypes();
      console.log(`Found ${nodeTypes.length} node types`);
      
      // Step 9: Create nodes if node types are available
      if (nodeTypes && nodeTypes.length > 0) {
        console.log('\n--- Testing: Create Nodes ---');
        try {
          // Find entry and hangup node types
          const entryNodeType = nodeTypes.find((nt: any) => nt.category === 'extension');
          const hangupNodeType = nodeTypes.find((nt: any) => nt.name.includes('Hangup'));
          
          if (entryNodeType && hangupNodeType) {
            // Create entry node
            const entryNode = await createNode(contextId, {
              nodeTypeId: entryNodeType.id,
              name: 'entry',
              label: 'Main Entry',
              position: { x: 100, y: 100 },
              properties: {
                extension: 's',
                priority: 1
              }
            });
            console.log('Created entry node:', entryNode);
            entryNodeId = entryNode.id;
            
            // Create hangup node
            const hangupNode = await createNode(contextId, {
              nodeTypeId: hangupNodeType.id,
              name: 'hangup',
              label: 'End Call',
              position: { x: 400, y: 100 },
              properties: {}
            });
            console.log('Created hangup node:', hangupNode);
            hangupNodeId = hangupNode.id;
          } else {
            console.error('Could not find required node types');
          }
        } catch (error) {
          console.error('Error creating nodes:', error);
        }
      }
    } catch (error) {
      console.error('Error getting node types:', error);
    }
    
    // Step 10: Get nodes for context
    console.log('\n--- Testing: Get Nodes for Context ---');
    try {
      const nodes = await getNodesForContext(contextId);
      console.log(`Found ${nodes.length} nodes in context`);
    } catch (error) {
      console.error('Error getting nodes:', error);
    }
    
    // Step 11: Create connection between nodes
    if (entryNodeId && hangupNodeId) {
      console.log('\n--- Testing: Create Connection ---');
      let connectionId;
      try {
        const connection = await createConnection({
          sourceNodeId: entryNodeId,
          targetNodeId: hangupNodeId,
          priority: 1
        });
        console.log('Created connection:', connection);
        connectionId = connection.id;
      } catch (error) {
        console.error('Error creating connection:', error);
      }
      
      // Step 12: Get connections for context
      console.log('\n--- Testing: Get Connections for Context ---');
      try {
        const connections = await getConnectionsForContext(contextId);
        console.log(`Found ${connections.length} connections in context`);
      } catch (error) {
        console.error('Error getting connections:', error);
      }
    } else {
      console.log('Skipping connection tests as nodes were not created');
    }
  }
  
  if (newProjectId) {
    // Step 13: Validate project
    console.log('\n--- Testing: Validate Project ---');
    try {
      const validationResult = await validateProject(newProjectId);
      console.log('Validation result:', validationResult);
    } catch (error) {
      console.error('Error validating project:', error);
    }
    
    // Step 14: Generate dialplan
    console.log('\n--- Testing: Generate Dialplan ---');
    try {
      const generationResult = await generateDialplan(newProjectId);
      console.log('Generation result:', generationResult);
    } catch (error) {
      console.error('Error generating dialplan:', error);
    }
    
    // Step 15: Clone project
    console.log('\n--- Testing: Clone Project ---');
    try {
      const clonedProject = await cloneProject(newProjectId, `Cloned Test Project ${new Date().toISOString()}`);
      console.log('Cloned project:', clonedProject);
      clonedProjectId = clonedProject.id;
    } catch (error) {
      console.error('Error cloning project:', error);
    }
  }
  
  // Cleanup: Delete projects
  console.log('\n--- Cleanup: Delete Test Projects ---');
  try {
    if (clonedProjectId) {
      await deleteProject(clonedProjectId);
      console.log(`Deleted cloned project ${clonedProjectId}`);
    }
    
    if (newProjectId) {
      await deleteProject(newProjectId);
      console.log(`Deleted test project ${newProjectId}`);
    }
  } catch (error) {
    console.error('Error deleting test projects:', error);
  }
  
  console.log('\nDialplan API Tests Completed');
}

// Run the tests
testDialplanAPIs().catch(error => {
  console.error('Test run failed:', error);
}); 