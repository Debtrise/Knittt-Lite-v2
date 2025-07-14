// Quick Fix: Force Admin Auth State
// Run this in your browser console to temporarily set admin auth state

console.log('=== Force Admin Auth Fix ===');

// Set the auth data in localStorage as if you logged in successfully
const adminAuthData = {
  state: {
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwidXNlcm5hbWUiOiJhZG1pbiIsInRlbmFudElkIjoiMSIsInJvbGUiOiJhZG1pbiIsInBlcm1pc3Npb25zIjp7fSwiaWF0IjoxNzUxNTYzODg2LCJleHAiOjE3NTE2NTAyODZ9.PwbgwJX2TGLL9lIeGzQo77AA1wE5lw6atd3GTQsYWVg',
    user: {
      userId: 4,
      username: 'admin',
      tenantId: '1',
      role: 'admin'
    },
    isAuthenticated: true
  },
  version: 0
};

// Store it in localStorage
localStorage.setItem('auth-storage', JSON.stringify(adminAuthData));

console.log('✅ Admin auth state set!');
console.log('Now refresh the page and you should have admin access.');
console.log('Auth data:', adminAuthData);

// Auto-refresh the page
setTimeout(() => {
  window.location.reload();
}, 2000); 