import { getTenant, updateTenant } from './app/utils/api';

// Type definition for schedule object
type Schedule = {
  [key: string]: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  }
};

/**
 * This function tests updating the working hours schedule for a tenant
 * It uses the existing API functions from the project
 */
const testUpdateWorkingHours = async (): Promise<void> => {
  try {
    // Replace with the actual tenant ID you want to update
    const tenantId = 1;
    
    // First get current tenant data
    console.log(`Fetching tenant data for ID: ${tenantId}...`);
    const currentTenant = await getTenant(tenantId);
    console.log('Current schedule:', JSON.stringify(currentTenant.schedule, null, 2));
    
    // Create updated schedule
    // Days of week: 0 = Sunday, 1 = Monday, etc.
    const updatedSchedule: Schedule = {
      '0': { enabled: false, startTime: '09:00', endTime: '17:00' }, // Sunday
      '1': { enabled: true, startTime: '08:00', endTime: '16:00' },  // Monday
      '2': { enabled: true, startTime: '08:00', endTime: '16:00' },  // Tuesday
      '3': { enabled: true, startTime: '08:00', endTime: '16:00' },  // Wednesday
      '4': { enabled: true, startTime: '08:00', endTime: '16:00' },  // Thursday
      '5': { enabled: true, startTime: '08:00', endTime: '16:00' },  // Friday
      '6': { enabled: false, startTime: '09:00', endTime: '17:00' }  // Saturday
    };
    
    // Update the tenant with new schedule
    const updatedTenant = {
      ...currentTenant,
      schedule: updatedSchedule
    };
    
    console.log('Updating tenant with new schedule...');
    await updateTenant(tenantId, updatedTenant);
    
    // Verify update was successful
    console.log('Verifying update...');
    const verifiedTenant = await getTenant(tenantId);
    console.log('Updated schedule:', JSON.stringify(verifiedTenant.schedule, null, 2));
    
    console.log('Test completed successfully');
  } catch (error) {
    console.error('Test failed:', error);
  }
};

// Run the test
testUpdateWorkingHours(); 