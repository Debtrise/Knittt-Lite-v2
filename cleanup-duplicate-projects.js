const axios = require('axios');

// API configuration
const API_BASE_URL = 'http://34.122.156.88:3001/api';
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwidXNlcm5hbWUiOiJhZG1pbiIsInRlbmFudElkIjoiMSIsInJvbGUiOiJhZG1pbiIsInBlcm1pc3Npb25zIjp7fSwiaWF0IjoxNzUxNTg5MTQwLCJleHAiOjE3NTE2NzU1NDB9.oul3FXbHzhEPyw78qy4zdciEukJqzPYvCFnrx6Dj62c';

const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
};

async function cleanupDuplicateProjects() {
  try {
    console.log('Fetching all projects...');
    
    // Get all projects
    const response = await axios.get(`${API_BASE_URL}/content/projects?limit=100`, { headers });
    const projects = response.data.projects;
    
    console.log(`Found ${projects.length} projects`);
    
    // Find duplicate projects (same name and templateId)
    const duplicateGroups = {};
    
    projects.forEach(project => {
      const key = `${project.name}_${project.templateId}`;
      if (!duplicateGroups[key]) {
        duplicateGroups[key] = [];
      }
      duplicateGroups[key].push(project);
    });
    
    // Identify projects to delete (keep the oldest one in each group)
    const projectsToDelete = [];
    
    Object.entries(duplicateGroups).forEach(([key, group]) => {
      if (group.length > 1) {
        console.log(`Found ${group.length} duplicates for: ${key}`);
        
        // Sort by creation date (oldest first)
        group.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        
        // Keep the first (oldest), delete the rest
        const toDelete = group.slice(1);
        projectsToDelete.push(...toDelete);
        
        console.log(`  Keeping: ${group[0].id} (${group[0].createdAt})`);
        toDelete.forEach(p => {
          console.log(`  Deleting: ${p.id} (${p.createdAt})`);
        });
      }
    });
    
    console.log(`\nTotal projects to delete: ${projectsToDelete.length}`);
    
    if (projectsToDelete.length === 0) {
      console.log('No duplicate projects found to clean up.');
      return;
    }
    
    // Ask for confirmation
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise(resolve => {
      rl.question(`\nDo you want to delete ${projectsToDelete.length} duplicate projects? (y/N): `, resolve);
    });
    
    rl.close();
    
    if (answer.toLowerCase() !== 'y') {
      console.log('Cleanup cancelled.');
      return;
    }
    
    // Delete duplicate projects
    console.log('\nDeleting duplicate projects...');
    let deleted = 0;
    
    for (const project of projectsToDelete) {
      try {
        await axios.delete(`${API_BASE_URL}/content/projects/${project.id}`, { headers });
        console.log(`✓ Deleted: ${project.id} - ${project.name}`);
        deleted++;
      } catch (error) {
        console.error(`✗ Failed to delete ${project.id}:`, error.response?.data || error.message);
      }
    }
    
    console.log(`\nCleanup completed. Deleted ${deleted} duplicate projects.`);
    
  } catch (error) {
    console.error('Cleanup failed:', error.response?.data || error.message);
  }
}

cleanupDuplicateProjects(); 