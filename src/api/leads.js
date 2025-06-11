// Update dialer assignment for a single lead
export async function updateLeadDialerAssignment(leadId, assignment) {
  const response = await fetch(`/api/leads/${leadId}/dialer-assignment`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${getToken()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      dialerAssignment: assignment
    })
  });
  
  return handleResponse(response);
}

// Bulk update dialer assignments for multiple leads
export async function bulkUpdateDialerAssignment(leadIds, assignment) {
  const response = await fetch('/api/leads/bulk-dialer-assignment', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getToken()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      leadIds: leadIds,
      dialerAssignment: assignment
    })
  });
  
  return handleResponse(response);
}

// Get dialer assignment statistics
export async function getDialerStats() {
  const response = await fetch('/api/leads/dialer-stats', {
    headers: {
      'Authorization': `Bearer ${getToken()}`
    }
  });
  
  return handleResponse(response);
} 