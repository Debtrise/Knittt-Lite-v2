import { updateLeadDialerAssignment, bulkUpdateDialerAssignment } from '../api/leads';

function LeadManagement() {
  const [selectedDialerAssignment, setSelectedDialerAssignment] = useState('');

  const handleDialerAssignmentChange = async (leadId, assignment) => {
    try {
      await updateLeadDialerAssignment(leadId, assignment);
      // Refresh leads or update UI as needed
    } catch (error) {
      console.error('Error updating dialer assignment:', error);
    }
  };

  const handleBulkDialerAssignmentChange = async () => {
    if (selectedLeads.length > 0 && selectedDialerAssignment) {
      try {
        await bulkUpdateDialerAssignment(selectedLeads, selectedDialerAssignment);
        // Refresh leads or update UI as needed
        setSelectedLeads([]);
        setSelectedDialerAssignment('');
      } catch (error) {
        console.error('Error updating bulk dialer assignment:', error);
      }
    }
  };

  return (
    <div>
      <div>
        <select 
          value={selectedDialerAssignment} 
          onChange={(e) => setSelectedDialerAssignment(e.target.value)}
        >
          <option value="">Select Dialer Assignment</option>
          <option value="auto_dialer">Auto Dialer</option>
          <option value="journey_only">Journey Only</option>
          <option value="both">Both</option>
          <option value="none">None</option>
        </select>
        <button onClick={handleBulkDialerAssignmentChange} disabled={selectedLeads.length === 0 || !selectedDialerAssignment}>
          Update Dialer Assignment for Selected
        </button>
      </div>
    </div>
  );
}

export default LeadManagement; 