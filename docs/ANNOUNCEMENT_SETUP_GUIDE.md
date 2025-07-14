# Content Creator Announcement Setup Guide

This guide walks you through setting up announcements in the Content Creator system, from creating templates to configuring webhooks that automatically trigger content on displays.

## 🎯 Overview

The announcement system allows you to:
1. **Create announcement templates** in the Content Creator
2. **Configure webhook triggers** that automatically populate templates with data
3. **Display content** on OptiSigns displays when events occur (deals, milestones, etc.)

## 📋 Step-by-Step Setup

### Step 1: Create an Announcement Template

1. **Open Content Creator**
   ```
   Navigate to: /content-creator
   ```

2. **Design Your Template**
   - Add elements like text, images, animations
   - Use **variable placeholders** in text elements: `{variable_name}`
   - For sales rep photos, use the **Sales Rep Photo element** with `{rep_photo}` binding
   - Set up video backgrounds if desired

3. **Example Template Elements:**
   ```typescript
   // Text element with variables
   {
     elementType: "text",
     properties: {
       text: "🎉 Congratulations {rep_first_name}!\nDeal closed: {deal_amount}"
     }
   }
   
   // Sales rep photo element (auto-fills from webhook)
   {
     elementType: "sales_rep_photo",
     properties: {
       src: "{rep_photo}", // This will be populated automatically
       alt: "Sales Representative Photo"
     }
   }
   ```

4. **Save as Template**
   - Click the "Save as Template" button
   - Choose category: "announcement", "celebration", etc.
   - Make it public so webhooks can access it
   - Note the template ID for webhook configuration

### Step 2: Configure Variables

Define the variables your template uses:

**Common Announcement Variables:**
- `{rep_photo}` - Sales rep photo (auto-populated from rep_email)
- `{rep_first_name}` - Sales rep first name
- `{rep_last_name}` - Sales rep last name  
- `{deal_amount}` - Deal value
- `{client_name}` - Client/company name
- `{close_date}` - Deal close date
- `{achievement}` - Milestone achievement
- `{employee_name}` - New hire name
- `{title}` - Announcement title
- `{message}` - Announcement message

### Step 3: Set Up Sales Rep Photos (Optional)

If using sales rep photos in announcements:

1. **Upload Photos**
   ```
   Navigate to: Content Creator → Sales Rep Photos panel
   ```

2. **Associate with Emails**
   - Upload individual photos with rep email
   - Or use bulk upload with CSV mapping
   - Photos will auto-populate in templates when `rep_email` is provided

3. **Test Photo Lookup**
   ```
   GET /api/sales-rep-photos/by-email/{email}
   ```

### Step 4: Create Webhook Configuration

1. **Navigate to Webhooks**
   ```
   Go to: /webhooks → Create New Webhook
   ```

2. **Basic Configuration**
   - **Name**: "Deal Celebration Webhook"
   - **Type**: Select "Announcement"
   - **Description**: Describe the webhook purpose

3. **Announcement Configuration**
   ```typescript
   {
     "announcementConfig": {
       "enabled": true,
       "contentCreator": {
         "templateId": "your-template-id", // From Step 1
         "variableMapping": {
           "rep_first_name": "rep_name",
           "deal_amount": "deal_amount", 
           "client_name": "company_name",
           "rep_photo": "rep_email" // Will lookup photo by email
         },
         "autoGenerate": true,
         "projectName": "Deal Celebration - {{rep_name}}"
       },
       "optisigns": {
         "displaySelection": {
           "mode": "all" // or "specific" with displayIds
         },
         "takeover": {
           "priority": "HIGH",
           "duration": 30, // seconds
           "restoreAfter": true
         },
         "scheduling": {
           "immediate": true
         }
       }
     }
   }
   ```

4. **Field Mapping**
   Map incoming webhook fields to template variables:
   ```typescript
   {
     "fieldMapping": {
       "rep_name": "rep_name",
       "deal_amount": "deal_amount",
       "company_name": "company_name", 
       "rep_email": "rep_email" // For photo lookup
     }
   }
   ```

### Step 5: Test Your Setup

1. **Test Webhook**
   ```
   Use the webhook test functionality in the UI
   Send sample payload:
   {
     "rep_name": "John Doe",
     "rep_email": "john.doe@company.com",
     "deal_amount": "$50,000",
     "company_name": "Acme Corp"
   }
   ```

2. **Verify Results**
   - Content should generate automatically
   - Variables should be populated
   - Sales rep photo should appear (if configured)
   - Display takeover should trigger

## 🎨 Template Design Best Practices

### 1. Video Backgrounds
```typescript
canvasBackground: {
  type: "video",
  url: "https://assets.company.com/celebration.mp4"
}
```
- Use MP4 format for compatibility
- Keep file size reasonable for network delivery
- Video loops muted behind all content

### 2. Text Contrast
- Use semi-transparent backgrounds for text over video
- Ensure sufficient color contrast
- Add text shadows for better readability

### 3. Sales Rep Photos
- Use circular frames for professional appearance
- Add borders and shadows for visual separation
- Position prominently but not blocking other content

### 4. Animation Elements
- Layer animations above video backgrounds
- Use celebration effects: raining money, confetti, fireworks
- Keep animations engaging but not overwhelming

## 🔧 Webhook Integration Examples

### Deal Celebration Webhook
```bash
POST /api/webhook-receiver/{webhook-key}
Content-Type: application/json

{
  "rep_name": "Sarah Johnson",
  "rep_email": "sarah.johnson@company.com",
  "deal_amount": "$250,000",
  "company_name": "TechCorp Solutions",
  "deal_type": "Enterprise Sale",
  "close_date": "2024-01-15"
}
```

### New Hire Welcome
```bash
POST /api/webhook-receiver/{webhook-key}
Content-Type: application/json

{
  "employee_name": "Alex Chen",
  "position": "Senior Developer", 
  "department": "Engineering",
  "start_date": "2024-01-20",
  "manager": "Lisa Wong"
}
```

### Milestone Achievement
```bash
POST /api/webhook-receiver/{webhook-key}
Content-Type: application/json

{
  "achievement": "1 Million Users",
  "person_or_team": "Product Team",
  "milestone_value": "1000000",
  "achievement_date": "2024-01-15"
}
```

## 🎯 Advanced Configuration

### Display Selection
```typescript
// All displays
"displaySelection": { "mode": "all" }

// Specific displays
"displaySelection": {
  "mode": "specific",
  "displayIds": ["display-lobby", "display-conference-a"]
}

// Display groups
"displaySelection": {
  "mode": "group", 
  "groupIds": ["group-public-areas", "group-employee-areas"]
}
```

### Takeover Priorities
- **URGENT**: Overrides everything immediately
- **HIGH**: High priority, overrides normal content
- **MEDIUM**: Normal priority
- **LOW**: Low priority, waits for natural breaks

### Scheduling Options
```typescript
"scheduling": {
  "immediate": true // Show right away
}

"scheduling": {
  "immediate": false,
  "delay": 300, // 5 minutes delay
  "businessHoursOnly": true
}

"scheduling": {
  "immediate": false,
  "specificTime": "09:00:00" // 9 AM
}
```

### Conditional Logic
```typescript
"conditions": {
  "enabled": true,
  "rules": [
    {
      "field": "deal_amount",
      "operator": "greater_than", 
      "value": 10000,
      "required": true
    }
  ]
}
```

## 🔍 Troubleshooting

### Common Issues

1. **Template Not Found**
   - Verify template ID in webhook configuration
   - Ensure template is marked as public
   - Check template exists in Content Creator

2. **Variables Not Populating**
   - Check variable mapping in webhook config
   - Verify field names match incoming payload
   - Test with webhook test functionality

3. **Sales Rep Photos Not Showing**
   - Verify photos are uploaded with correct email associations
   - Check rep_email field is being sent in webhook payload
   - Test photo lookup endpoint directly

4. **Display Takeover Fails**
   - Check display connectivity in OptiSigns
   - Verify display IDs in configuration
   - Check takeover priority and scheduling settings

### Debug Tools

1. **Webhook Test Panel**
   - Send test payloads
   - View variable extraction results
   - Check content generation preview

2. **Webhook Event Logs**
   - Monitor webhook events in real-time
   - View success/failure status
   - Check error messages and timing

3. **Display Status Dashboard**
   - Monitor display connectivity
   - View active content and takeovers
   - Check display group assignments

## 🚀 Next Steps

1. **Create Your First Template**
   - Start with a simple celebration template
   - Use basic text and animation elements
   - Test with static content first

2. **Set Up Sales Rep Photos**
   - Upload photos for your sales team
   - Test photo lookup functionality
   - Integrate into announcement templates

3. **Configure Webhooks**
   - Start with one announcement type
   - Test thoroughly before going live
   - Monitor and refine based on usage

4. **Scale and Optimize**
   - Create multiple template variations
   - Set up different webhook triggers
   - Monitor performance and engagement

The announcement system is powerful and flexible - start simple and gradually add more sophisticated features as you become comfortable with the workflow! 