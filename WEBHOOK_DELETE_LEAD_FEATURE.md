# Webhook Delete Lead Feature

## Overview
The Delete Lead action allows you to automatically remove leads from your system when specific conditions are met in webhook payloads. This is useful for handling unsubscription requests, data cleanup, or compliance requirements.

## Configuration

### Action Type: `delete_lead`

#### Configuration Fields:

1. **Search Field** - How to identify the lead to delete:
   - `phone` - Phone Number
   - `email` - Email Address  
   - `id` - Lead ID
   - `brand` - Brand
   - `source` - Source

2. **Search Value** - The value to search for (supports variable substitution):
   - Use `{{field_name}}` to reference webhook payload fields
   - Example: `{{user_email}}` or `{{phone_number}}`

3. **Require Confirmation**:
   - `false` - Delete Immediately (permanent deletion)
   - `true` - Mark for Deletion (requires manual confirmation)

4. **Deletion Reason** - Optional reason for auditing:
   - Example: "Unsubscribed via webhook"

## Example Use Cases

### 1. Unsubscription Processing
When your email service provider sends an unsubscribe webhook:

**Condition:**
- Field: `event_type`
- Operator: equals
- Value: `unsubscribe`

**Action:**
- Type: `delete_lead`
- Search Field: `email`
- Search Value: `{{email}}`
- Require Confirmation: `true`
- Reason: `Unsubscribed via email service`

### 2. Phone Number Opt-out
When receiving SMS opt-out notifications:

**Condition:**
- Field: `message`
- Operator: contains
- Value: `STOP`

**Action:**
- Type: `delete_lead`
- Search Field: `phone`
- Search Value: `{{from_number}}`
- Require Confirmation: `false`
- Reason: `SMS opt-out request`

### 3. GDPR Deletion Request
When receiving data deletion requests:

**Condition:**
- Field: `request_type`
- Operator: equals
- Value: `delete_data`

**Action:**
- Type: `delete_lead`
- Search Field: `email`
- Search Value: `{{user_email}}`
- Require Confirmation: `true`
- Reason: `GDPR deletion request`

## Safety Features

### Visual Warnings
- Delete actions are highlighted in red in the UI
- Warning messages indicate the destructive nature
- Special badge with warning icon in detail view

### Confirmation Options
- **Immediate Deletion**: Permanently removes the lead
- **Mark for Deletion**: Flags the lead for manual review before deletion

### Audit Trail
- All deletion actions are logged with timestamps
- Deletion reasons are recorded for compliance
- Webhook payload data is preserved in logs

## Implementation Notes

### Backend Requirements
The backend API needs to support:
- Lead search by various fields
- Soft deletion (marking for deletion)
- Hard deletion (permanent removal)
- Audit logging for all deletion operations

### Variable Substitution
The system supports dynamic values from webhook payloads:
- `{{field_name}}` - Direct field reference
- Nested fields: `{{user.email}}` or `{{contact.phone_number}}`

### Error Handling
- If no lead is found matching the search criteria, log as a warning
- If multiple leads match, apply action to all matches (with confirmation if enabled)
- Failed deletions are logged with error details

## Security Considerations

1. **Access Control**: Only authorized webhooks should have delete permissions
2. **Rate Limiting**: Implement rate limits to prevent bulk deletion attacks
3. **Confirmation**: Use confirmation mode for high-value or sensitive deletions
4. **Backup**: Ensure regular backups before implementing immediate deletions
5. **Monitoring**: Set up alerts for unusual deletion patterns

## Testing

### Safe Testing
1. Start with "Require Confirmation" enabled
2. Test with non-production leads first
3. Use the webhook testing interface to validate conditions
4. Review deletion logs before enabling immediate deletion

### Example Test Payload
```json
{
  "event_type": "unsubscribe",
  "user_email": "test@example.com",
  "timestamp": "2024-01-15T10:30:00Z",
  "reason": "user_requested"
}
```

This would trigger a delete_lead action for the email "test@example.com" if configured properly. 