// Enhanced Publish API Demo - Complete Implementation
// This demonstrates all the new enhanced publish functionality

import { exportApi, PublishOptions, PublishProgress } from '../app/services/exportApi';
import { content } from '../app/lib/api';

// ✅ 1. ENHANCED PUBLISH ENDPOINT
// POST /api/content/projects/:projectId/publish
async function demoEnhancedPublish() {
  console.log('🚀 Enhanced Publish Demo');
  
  const projectId = 'project-123';
  
  // Basic publish with high quality
  const basicOptions: PublishOptions = {
    displayIds: ['display-1', 'display-2'],
    format: 'png',
    quality: 'high'
  };
  
  try {
    const result = await exportApi.publishToOptiSigns(projectId, basicOptions);
    console.log('✅ Basic publish result:', result);
  } catch (error) {
    console.error('❌ Basic publish failed:', error);
  }
}

// ✅ 2. PUBLISH WITH VARIABLE DATA
async function demoVariableDataPublish() {
  console.log('📊 Variable Data Publish Demo');
  
  const projectId = 'project-123';
  
  const variableOptions: PublishOptions = {
    displayIds: ['display-1', 'display-2'], 
    format: 'png',
    quality: 'high',
    variableData: { 
      'lead.name': 'John Doe',
      'event.title': 'Product Launch',
      'date': new Date().toLocaleDateString(),
      'location': 'Conference Room A'
    }
  };
  
  try {
    const result = await exportApi.publishToOptiSigns(projectId, variableOptions);
    console.log('✅ Variable publish result:', result);
  } catch (error) {
    console.error('❌ Variable publish failed:', error);
  }
}

// ✅ 3. EMERGENCY TAKEOVER PUBLISH
async function demoEmergencyTakeover() {
  console.log('🚨 Emergency Takeover Demo');
  
  const projectId = 'emergency-project';
  
  const emergencyOptions: PublishOptions = {
    displayIds: ['display-1', 'display-2', 'display-3'],
    format: 'png',
    quality: 'high',
    takeoverOptions: {
      priority: 'EMERGENCY',
      duration: 300, // 5 minutes
      message: 'Emergency evacuation notice - Please proceed to nearest exit',
      restoreAfter: true
    }
  };
  
  try {
    const result = await exportApi.publishToOptiSigns(projectId, emergencyOptions);
    console.log('🚨 Emergency publish result:', result);
    
    // Monitor takeover results
    if (result.progress?.takeoverResults) {
      result.progress.takeoverResults.forEach(display => {
        console.log(`Display ${display.displayName}: ${display.success ? '✅' : '❌'} ${display.message || ''}`);
      });
    }
  } catch (error) {
    console.error('❌ Emergency publish failed:', error);
  }
}

// ✅ 4. PUBLISH WITH PROGRESS TRACKING
async function demoProgressTracking() {
  console.log('📈 Progress Tracking Demo');
  
  const projectId = 'project-123';
  
  const options: PublishOptions = {
    displayIds: ['display-1', 'display-2'],
    format: 'png',
    quality: 'high',
    variableData: { 'event': 'Live Demo' }
  };
  
  try {
    const result = await exportApi.publishWithProgress(
      projectId,
      options,
      (progress: PublishProgress) => {
        console.log(`📊 Progress Update: ${progress.stage} - ${progress.progress}%`);
        console.log(`   Message: ${progress.message}`);
        console.log(`   Timestamp: ${progress.timestamp}`);
        
        // Handle specific stages
        switch (progress.stage) {
          case 'created':
            console.log('   🎯 Export record created');
            break;
          case 'generating':
            console.log('   🔧 Generating content file...');
            break;
          case 'generated':
            console.log('   ✅ File generated successfully');
            break;
          case 'uploading':
            console.log('   📤 Uploading to OptiSigns...');
            break;
          case 'takeover':
            console.log('   🎮 Executing takeover...');
            break;
          case 'completed':
            console.log('   🎉 Workflow completed successfully!');
            break;
          case 'failed':
            console.log('   ❌ Workflow failed');
            break;
        }
        
        if (progress.takeoverResults && progress.takeoverResults.length > 0) {
          console.log('   📺 Takeover Results:');
          progress.takeoverResults.forEach(result => {
            console.log(`     ${result.displayName || result.displayId}: ${result.success ? '✅' : '❌'}`);
          });
        }
      }
    );
    
    console.log('🎉 Final Result:', result);
    console.log(`   Export ID: ${result.export?.id}`);
    console.log(`   OptiSigns Asset ID: ${result.export?.optiSignsAssetId}`);
    console.log(`   Processing Time: ${result.export?.processingTimeMs}ms`);
    
  } catch (error) {
    console.error('❌ Progress tracking failed:', error);
  }
}

// ✅ 5. EXPORT STATUS TRACKING
// GET /api/content/exports/:exportId/status
async function demoStatusTracking(exportId: string) {
  console.log('📋 Status Tracking Demo');
  
  try {
    const status = await exportApi.getExportStatus(exportId);
    
    console.log('📊 Export Status:', {
      exportId: status.export.id,
      status: status.export.status,
      progress: status.progress.progress,
      stage: status.progress.stage,
      message: status.progress.message,
      timestamp: status.progress.timestamp
    });
    
    if (status.export.optiSignsAssetId) {
      console.log(`🎨 OptiSigns Asset ID: ${status.export.optiSignsAssetId}`);
    }
    
    if (status.progress.takeoverResults) {
      console.log('📺 Display Takeover Results:');
      status.progress.takeoverResults.forEach(result => {
        console.log(`  ${result.displayName}: ${result.success ? 'SUCCESS' : 'FAILED'} - ${result.message || 'No message'}`);
      });
    }
    
    if (status.export.processingTimeMs) {
      console.log(`⏱️  Processing Time: ${(status.export.processingTimeMs / 1000).toFixed(2)}s`);
    }
    
  } catch (error) {
    console.error('❌ Status check failed:', error);
  }
}

// ✅ 6. PROJECT EXPORTS HISTORY
// GET /api/content/projects/:projectId/exports
async function demoExportHistory(projectId: string) {
  console.log('📚 Export History Demo');
  
  try {
    const exports = await exportApi.getProjectExports(projectId, {
      status: 'completed',
      exportType: 'image',
      page: 1,
      limit: 10
    });
    
    console.log(`📋 Found ${exports.total} exports for project ${projectId}`);
    
    exports.exports.forEach((exp: any, index: number) => {
      console.log(`\n${index + 1}. Export ${exp.id}`);
      console.log(`   Status: ${exp.status}`);
      console.log(`   Created: ${new Date(exp.createdAt).toLocaleString()}`);
      console.log(`   Progress: ${exp.progress || 0}%`);
      
      if (exp.optiSignsAssetId) {
        console.log(`   OptiSigns Asset: ${exp.optiSignsAssetId}`);
      }
      
      if (exp.takeoverResults) {
        console.log(`   Displays: ${exp.takeoverResults.filter((r: any) => r.success).length}/${exp.takeoverResults.length} successful`);
      }
    });
    
  } catch (error) {
    console.error('❌ Export history failed:', error);
  }
}

// ✅ 7. REAL-TIME POLLING DEMO
async function demoRealTimePolling(exportId: string) {
  console.log('🔄 Real-time Polling Demo');
  
  try {
    const finalResult = await exportApi.pollExportProgress(
      exportId,
      (progress: PublishProgress) => {
        const progressBar = '█'.repeat(Math.floor(progress.progress / 10)) + 
                           '░'.repeat(10 - Math.floor(progress.progress / 10));
        
        console.log(`[${progressBar}] ${progress.progress}% - ${progress.stage}`);
        console.log(`   ${progress.message}`);
        
        if (progress.stage === 'takeover' && progress.takeoverResults) {
          console.log('   🎮 Takeover in progress...');
          progress.takeoverResults.forEach(result => {
            console.log(`     ${result.displayName}: ${result.success ? '✅' : '⏳'}`);
          });
        }
      },
      300000 // 5 minute timeout
    );
    
    console.log('🎉 Polling completed:', finalResult);
    
  } catch (error) {
    console.error('❌ Polling failed:', error);
  }
}

// ✅ 8. BATCH STATUS CHECKING
async function demoBatchStatusCheck(exportIds: string[]) {
  console.log('📦 Batch Status Check Demo');
  
  try {
    const statuses = await exportApi.getMultipleExportStatus(exportIds);
    
    console.log(`📊 Checked ${Object.keys(statuses).length} exports:`);
    
    Object.entries(statuses).forEach(([exportId, status]) => {
      console.log(`\n📄 Export ${exportId}:`);
      console.log(`   Status: ${status.export.status}`);
      console.log(`   Progress: ${status.progress.progress}%`);
      console.log(`   Stage: ${status.progress.stage}`);
      
      if (status.export.processingTimeMs) {
        console.log(`   Time: ${(status.export.processingTimeMs / 1000).toFixed(2)}s`);
      }
    });
    
  } catch (error) {
    console.error('❌ Batch status check failed:', error);
  }
}

// ✅ 9. COMPREHENSIVE WORKFLOW DEMO
async function demoCompleteWorkflow() {
  console.log('🎯 Complete Enhanced Publish Workflow Demo');
  console.log('=' * 50);
  
  const projectId = 'demo-project-123';
  
  // Step 1: Basic publish
  console.log('\n1️⃣ Starting basic publish...');
  await demoEnhancedPublish();
  
  // Step 2: Variable data publish
  console.log('\n2️⃣ Publishing with variable data...');
  await demoVariableDataPublish();
  
  // Step 3: Emergency takeover
  console.log('\n3️⃣ Testing emergency takeover...');
  await demoEmergencyTakeover();
  
  // Step 4: Progress tracking
  console.log('\n4️⃣ Publishing with progress tracking...');
  await demoProgressTracking();
  
  // Step 5: Check export history
  console.log('\n5️⃣ Checking export history...');
  await demoExportHistory(projectId);
  
  console.log('\n🎉 Complete workflow demo finished!');
}

// ✅ 10. PROGRESS STAGES MAPPING
const PROGRESS_STAGES = {
  'created': { percentage: 0, message: 'Export record created' },
  'generating': { percentage: 25, message: 'Starting file generation' },
  'generated': { percentage: 50, message: 'File generated successfully' },
  'uploading': { percentage: 75, message: 'Uploading to OptiSigns' },
  'takeover': { percentage: 95, message: 'Executing takeover' },
  'completed': { percentage: 100, message: 'Complete workflow success' },
  'failed': { percentage: 0, message: 'Workflow failed' }
};

// ✅ 11. REACT HOOK USAGE EXAMPLE
/*
import { usePublishWorkflow } from '../app/hooks/usePublishWorkflow';

function MyPublishComponent() {
  const {
    isPublishing,
    progress,
    publishToDisplays,
    publishWithTakeover,
    publishWithVariables,
    getProgressPercentage,
    getProgressStage,
    isCompleted,
    getTakeoverResults
  } = usePublishWorkflow({
    onProgress: (progress) => {
      console.log(`Progress: ${progress.progress}% - ${progress.message}`);
    },
    onComplete: (result) => {
      console.log('Publish completed!', result);
    },
    onError: (error) => {
      console.error('Publish failed:', error);
    }
  });

  const handlePublish = async () => {
    await publishToDisplays('project-123', ['display-1', 'display-2'], 'png', 'high');
  };

  const handleEmergencyPublish = async () => {
    await publishWithTakeover(
      'project-123',
      ['display-1', 'display-2'],
      { priority: 'EMERGENCY', duration: 300, message: 'Emergency notice' },
      'png',
      'high'
    );
  };

  return (
    <div>
      <button onClick={handlePublish} disabled={isPublishing}>
        {isPublishing ? 'Publishing...' : 'Publish'}
      </button>
      
      {progress && (
        <div>
          <div>Stage: {getProgressStage()}</div>
          <div>Progress: {getProgressPercentage()}%</div>
          <div>Message: {progress.message}</div>
        </div>
      )}
      
      {isCompleted() && (
        <div>
          <p>Publish completed successfully!</p>
          {getTakeoverResults().map(result => (
            <div key={result.displayId}>
              {result.displayName}: {result.success ? '✅' : '❌'}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
*/

// Export all demo functions
export {
  demoEnhancedPublish,
  demoVariableDataPublish,
  demoEmergencyTakeover,
  demoProgressTracking,
  demoStatusTracking,
  demoExportHistory,
  demoRealTimePolling,
  demoBatchStatusCheck,
  demoCompleteWorkflow,
  PROGRESS_STAGES
};

// Run complete demo if this file is executed directly
if (typeof window === 'undefined') {
  // Server-side execution
  demoCompleteWorkflow().catch(console.error);
}

// Basic publishing example
async function basicPublishExample() {
  console.log('=== Basic Publish Example ===');
  
  try {
    // Using the correct /publish endpoint
    const result = await exportApi.publishProject('project-123', {
      displayIds: ['display-1', 'display-2'],
      format: 'png',
      quality: 'high'
    });
    
    console.log('✅ Project published successfully:', result);
    console.log('Export ID:', result.export?.id);
    console.log('OptiSigns Asset ID:', result.export?.optiSignsAssetId);
    
    // Track status using correct endpoint
    if (result.export?.id) {
      const status = await exportApi.getExportStatus(result.export.id);
      console.log('Export status:', status.export.status);
    }
    
  } catch (error) {
    console.error('❌ Publish failed:', error);
  }
}

// Publishing with variables example
async function publishWithVariablesExample() {
  console.log('\n=== Publishing with Variables Example ===');
  
  const projectId = 'project-456';
  const variableOptions: PublishOptions = {
    displayIds: ['display-3'],
    priority: 'HIGH',
    message: 'Content with dynamic variables',
    contextData: {
      lead: {
        name: 'John Doe',
        company: 'Acme Corp',
        dealAmount: 50000
      },
      rep: {
        name: 'Sales Rep',
        email: 'rep@company.com'
      }
    }
  };
  
  try {
    const result = await exportApi.publishToOptiSigns(projectId, variableOptions);
    console.log('✅ Variable publish successful:', result);
  } catch (error) {
    console.error('❌ Variable publish failed:', error);
  }
}

// Emergency publishing example
async function emergencyPublishExample() {
  console.log('\n=== Emergency Publishing Example ===');
  
  const projectId = 'project-789';
  const emergencyOptions: PublishOptions = {
    displayIds: ['display-1', 'display-2', 'display-3'],
    priority: 'EMERGENCY',
    message: 'URGENT: System maintenance notification',
    duration: 300, // 5 minutes
    restoreAfter: true
  };
  
  try {
    const result = await exportApi.publishToOptiSigns(projectId, emergencyOptions);
    console.log('✅ Emergency publish successful:', result);
  } catch (error) {
    console.error('❌ Emergency publish failed:', error);
  }
}

async function publishWithProgressExample() {
  console.log('=== Publish with Progress Tracking ===');
  
  try {
    const result = await exportApi.publishWithProgress(
      'project-123',
      {
        displayIds: ['display-1'],
        format: 'png',
        quality: 'high'
      },
      (progress) => {
        console.log(`📊 Progress: ${progress.stage} - ${progress.progress}%`);
        console.log(`📝 Message: ${progress.message}`);
      }
    );
    
    console.log('✅ Publish with progress completed:', result);
    
  } catch (error) {
    console.error('❌ Publish with progress failed:', error);
  }
}

async function variablesExample() {
  console.log('=== Variables API Example ===');
  
  try {
    // Get all variables using documented endpoint
    const variables = await content.getVariables();
    console.log('📋 Current variables:', variables);
    
    // Create new variable using documented endpoint
    const newVariable = await content.createVariable({
      name: 'custom.greeting',
      displayName: 'Custom Greeting',
      description: 'A personalized greeting message',
      dataType: 'string',
      dataSource: 'static',
      defaultValue: 'Hello there!',
      category: 'Custom',
      isRequired: false
    });
    
    console.log('✅ Variable created:', newVariable);
    
    // Initialize system variables using documented endpoint
    const systemVars = await content.initializeSystemVariables();
    console.log('🔧 System variables initialized:', systemVars);
    
  } catch (error) {
    console.error('❌ Variables example failed:', error);
  }
}

async function previewExample() {
  console.log('=== Preview Generation Example ===');
  
  try {
    // Generate preview using documented endpoint
    const preview = await content.generatePreview('project-123', {
      device: 'desktop',
      contextData: {
        lead: {
          name: 'John Doe',
          email: 'john@example.com'
        }
      }
    });
    
    console.log('🖼️ Preview generated:', preview);
    
  } catch (error) {
    console.error('❌ Preview generation failed:', error);
  }
}

async function systemStatusExample() {
  console.log('=== System Status Example ===');
  
  try {
    // Check system status using documented endpoint
    const status = await content.getSystemStatus();
    console.log('🟢 System status:', status);
    
  } catch (error) {
    console.error('❌ System status check failed:', error);
  }
}

// Sales Rep Photos Integration Example
async function salesRepPhotoExample() {
  console.log('=== Sales Rep Photos Integration ===');
  
  try {
    // This shows how sales rep photos integrate with Content Creator
    console.log('📸 When placing a sales rep photo element on canvas:');
    console.log('1. Element type: "sales_rep_photo"');
    console.log('2. Automatically binds to {rep_photo} variable');
    console.log('3. Displays correct rep image when deal is closed');
    
    // Example element creation for sales rep photo
    const element = {
      elementType: 'sales_rep_photo',
      position: { x: 100, y: 100, z: 1 },
      size: { width: 200, height: 200 },
      properties: {
        variableBinding: '{rep_photo}',
        fallbackImage: '/default-rep-photo.jpg'
      },
      styles: {
        borderRadius: '50%',
        border: '3px solid #gold'
      }
    };
    
    console.log('📝 Sales rep photo element structure:', element);
    
  } catch (error) {
    console.error('❌ Sales rep photo example failed:', error);
  }
}

// Run all examples
async function runAllExamples() {
  console.log('🚀 Starting Enhanced Publish API Demo');
  console.log('Using documented endpoints exactly as specified\n');
  
  await basicPublishExample();
  console.log('\n');
  
  await publishWithProgressExample();
  console.log('\n');
  
  await variablesExample();
  console.log('\n');
  
  await previewExample();
  console.log('\n');
  
  await systemStatusExample();
  console.log('\n');
  
  await salesRepPhotoExample();
  console.log('\n');
  
  console.log('✨ Enhanced Publish API Demo completed!');
}

// Export for use in other files
export {
  basicPublishExample,
  publishWithProgressExample,
  variablesExample,
  previewExample,
  systemStatusExample,
  salesRepPhotoExample,
  runAllExamples
};

// Run if called directly
if (require.main === module) {
  runAllExamples().catch(console.error);
} 