import axios from 'axios';

type Schedule = {
  [key: string]: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  }
};

type TenantData = {
  id: number;
  name: string;
  apiConfig: {
    url: string;
    user: string;
    password: string;
    source: string;
    ingroup: string;
    ingroups: string;
    endpoint: string;
  };
  dialerConfig: {
    speed: number;
    minAgentsAvailable: number | string;
    autoDelete: boolean;
    sortOrder: 'oldest' | 'fewest';
    didDistribution: 'even' | 'local';
  };
  schedule: Schedule;
  amiConfig: {
    host: string;
    port: number;
    trunk: string;
    context: string;
    username: string;
    password: string;
  };
};

const API_URL = 'http://34.122.156.88:3001/api';

// This is a test script, you need to get a valid token first by logging in
// You can obtain a token by calling the login API or checking localStorage in browser
const getToken = (): string => {
  // Replace this with your token or token retrieval logic
  return 'YOUR_AUTH_TOKEN';
};

const api = axios.create({
  baseURL: API_URL,
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Get tenant data
const getTenant = async (id: number): Promise<TenantData> => {
  try {
    const response = await api.get<TenantData>(`/tenants/${id}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Error fetching tenant:', error.response?.data || error.message);
    } else {
      console.error('Error fetching tenant:', error);
    }
    throw error;
  }
};

// Update tenant data
const updateTenant = async (id: number, tenantData: TenantData): Promise<TenantData> => {
  try {
    const response = await api.put<TenantData>(`/tenants/${id}`, tenantData);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Error updating tenant:', error.response?.data || error.message);
    } else {
      console.error('Error updating tenant:', error);
    }
    throw error;
  }
};

// Test updating working hours
const testUpdateWorkingHours = async (): Promise<void> => {
  try {
    // Replace with your actual tenant ID
    const tenantId = 1;
    
    console.log(`Fetching tenant data for ID: ${tenantId}...`);
    const currentTenant = await getTenant(tenantId);
    console.log('Current schedule:', JSON.stringify(currentTenant.schedule, null, 2));
    
    // Create updated schedule
    // This uses a numeric index for days of week (0 = Sunday, 1 = Monday, etc.)
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
    
    // Verify update
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