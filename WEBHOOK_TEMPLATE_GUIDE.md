# Webhook Template System Guide

## Overview

The webhook system now supports comprehensive template integration for creating dynamic announcements. This guide covers how to set up and use webhooks with templates for sales achievement announcements.

## 🎯 What We've Built

### ✅ Working Components

1. **Authentication System** - Admin login with JWT tokens
2. **Sales Rep Photo System** - Photo storage and retrieval by email
3. **Content Template System** - Template creation and management
4. **Content Project System** - Project creation from templates
5. **OptiSigns Display Integration** - Display targeting and control
6. **Webhook System** - Complete webhook creation and processing
7. **Frontend Webhook Form** - Full UI for webhook configuration

### ✅ Verified Functionality

- **Template Creation**: Create reusable announcement templates
- **Project Generation**: Generate projects from templates with variables
- **Webhook Processing**: Process webhooks and trigger announcements
- **Display Targeting**: Target specific displays (KASH OFFICE confirmed online)
- **Variable Substitution**: Replace template variables with webhook data
- **Sales Rep Photo Integration**: Automatically include sales rep photos

## 🚀 Quick Start

### 1. Complete Setup (Creates Everything)

```bash
node test-complete-webhook-with-templates.js
```

This script will:
- ✅ Authenticate with admin credentials
- ✅ Create/verify sales rep photo
- ✅ Find KASH office display
- ✅ Create announcement template (if needed)
- ✅ Create project from template
- ✅ Create webhook with template configuration
- ✅ Test the complete flow

### 2. Simple Setup (Uses Existing Resources)

```bash
node test-existing-templates-webhook.js
```

This script will:
- ✅ Use existing templates and projects
- ✅ Create a simple webhook configuration
- ✅ Test with different sales rep data

## 📋 Template System

### Template Structure

Templates include:
- **Canvas Size**: Display dimensions (1920x1080)
- **Elements**: Text, images, shapes, sales rep photos
- **Variables**: Placeholder values for dynamic content
- **Styling**: Colors, fonts, positioning

### Available Variables

Standard variables for sales announcements:
- `{{rep_name}}` - Sales representative name
- `{{rep_email}}` - Sales representative email
- `{{deal_amount}}` - Deal value (e.g., "$50,000")
- `{{company_name}}` - Customer company name
- `{{rep_photo}}` - Sales rep photo URL (auto-populated)
- `{{timestamp}}` - Current timestamp

### Template Example

```json
{
  "name": "Sales Achievement Celebration",
  "category": "announcement",
  "canvasSize": { "width": 1920, "height": 1080 },
  "variables": {
    "rep_name": "John Smith",
    "deal_amount": "$50,000",
    "company_name": "Acme Corporation"
  },
  "templateData": {
    "elements": [
      {
        "elementType": "text",
        "properties": { "text": "🎉 CONGRATULATIONS! 🎉" },
        "styles": { "fontSize": "64px", "color": "#FFFFFF" }
      },
      {
        "elementType": "sales_rep_photo",
        "size": { "width": 400, "height": 400 },
        "properties": { "borderRadius": "50%" }
      },
      {
        "elementType": "text",
        "properties": { "text": "{{rep_name}}" },
        "styles": { "fontSize": "48px", "color": "#FFD700" }
      }
    ]
  }
}
```

## 🔗 Webhook Configuration

### Webhook Types

1. **Template-based**: Uses existing templates with variable substitution
2. **Video**: Generates video content with sales rep photos
3. **Image**: Creates image announcements with photos

### Frontend Configuration

The webhook form (`WebhookForm.tsx`) supports:

#### Announcement Type Selection
```typescript
announcementType: 'template' | 'video' | 'image'
```

#### Content Creator Configuration
```typescript
contentCreator: {
  projectId: string,           // Template/project to use
  autoGenerate: boolean,       // Auto-generate content
  projectName: string,         // Generated project name
  variableMapping: object      // Map webhook fields to variables
}
```

#### Display Selection
```typescript
optisigns: {
  displaySelection: {
    mode: 'all' | 'specific' | 'group',
    displayIds: string[]       // Specific display IDs
  },
  takeover: {
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
    duration: number,          // Seconds
    restoreAfter: boolean      // Restore previous content
  }
}
```

### Backend Processing

The webhook receiver (`/api/webhook-receiver/[endpointKey]/route.ts`) handles:
1. **Authentication**: Validates security tokens
2. **Field Mapping**: Maps incoming data to template variables
3. **Photo Lookup**: Finds sales rep photos by email
4. **Content Generation**: Creates projects from templates
5. **Display Targeting**: Triggers announcements on displays

## 📊 API Endpoints

### Content Templates
- `GET /api/content/templates` - List templates
- `POST /api/content/templates` - Create template
- `GET /api/content/templates/:id` - Get template details

### Content Projects
- `GET /api/content/projects` - List projects
- `POST /api/content/projects` - Create project
- `GET /api/content/projects/:id` - Get project details

### Sales Rep Photos
- `GET /api/sales-rep-photos/by-email/:email` - Get photo by email
- `POST /api/sales-rep-photos` - Upload new photo

### Webhooks
- `POST /api/webhooks` - Create webhook
- `POST /api/webhook-receiver/:endpointKey` - Process webhook

## 🧪 Testing

### Test Scripts Available

1. **`test-complete-webhook-with-templates.js`**
   - Complete end-to-end test
   - Creates all resources from scratch
   - Validates entire system

2. **`test-existing-templates-webhook.js`**
   - Uses existing templates/projects
   - Quick validation test
   - Different sales rep data

3. **`test-kash-webhook.js`**
   - Focused KASH office test
   - Specific display targeting
   - Template validation

### Sample Webhook Payloads

#### Sales Achievement
```json
{
  "rep_name": "John Smith",
  "rep_email": "john.smith@example.com",
  "deal_amount": "$35,000",
  "company_name": "TechCorp Solutions",
  "achievement_type": "deal_closed"
}
```

#### Upsell Success
```json
{
  "rep_name": "Sarah Johnson",
  "rep_email": "sarah.johnson@example.com",
  "deal_amount": "$42,500",
  "company_name": "Global Tech Solutions",
  "achievement_type": "upsell"
}
```

## 🎨 Frontend Integration

### Using the Webhook Form

```typescript
import WebhookForm from '@/app/components/webhooks/WebhookForm';

// Create new webhook
<WebhookForm 
  onSuccess={(webhook) => {
    console.log('Webhook created:', webhook);
  }}
/>

// Edit existing webhook
<WebhookForm 
  webhookId={123}
  isEdit={true}
  onSuccess={(webhook) => {
    console.log('Webhook updated:', webhook);
  }}
/>
```

### Template Selection

The form automatically loads available templates:
```typescript
const fetchAnnouncementProjects = async () => {
  const response = await getAnnouncementTemplates({
    page: 1,
    limit: 100
  });
  setAvailableProjects(response.templates);
};
```

### Display Selection

Displays are loaded from OptiSigns:
```typescript
const fetchAnnouncementDisplays = async () => {
  const response = await getAnnouncementDisplays({ limit: 500 });
  setAvailableDisplays(response.displays);
};
```

## 🔍 System Status

### Verified Components
- ✅ **Authentication**: Admin login working
- ✅ **Sales Rep Photos**: Storage and retrieval working
- ✅ **Templates**: Creation and listing working
- ✅ **Projects**: Creation from templates working
- ✅ **Displays**: KASH OFFICE online and accessible
- ✅ **Webhooks**: Creation and processing working
- ✅ **Frontend**: Complete webhook form functional

### Test Results Summary
```
🎉 Complete webhook test with templates completed!

📋 Final Summary:
   Sales Rep: John Smith (john.smith@example.com)
   Template: Sales Achievement Celebration (0afa8370-abc3-4476-9746-0f07f522671c)
   Project: Sales Achievement - John Smith - 1751753748985 (c09261e3-b26c-426e-98e3-de435755f9c7)
   Display: KASH OFFICE (bc6861d5-18a3-4098-9af0-223e93dadd99)
   Webhook: a0a3583acfb3a8d5fa880c320dc6b18d
   Test Result: ✅ Success
```

## 🛠️ Configuration Examples

### Template-based Webhook
```json
{
  "name": "Sales Achievement Webhook",
  "webhookType": "announcement",
  "announcementConfig": {
    "announcementType": "template",
    "contentCreator": {
      "projectId": "template-id",
      "autoGenerate": true,
      "variableMapping": {
        "rep_name": "rep_name",
        "deal_amount": "deal_amount",
        "company_name": "company_name"
      }
    },
    "optisigns": {
      "displaySelection": {
        "mode": "specific",
        "displayIds": ["bc6861d5-18a3-4098-9af0-223e93dadd99"]
      },
      "takeover": {
        "priority": "HIGH",
        "duration": 30
      }
    }
  }
}
```

### Video-based Webhook
```json
{
  "announcementConfig": {
    "announcementType": "video",
    "contentCreator": {
      "projectId": "video-template-id"
    }
  },
  "fieldMapping": {
    "repEmail": "rep_email",
    "repName": "rep_name",
    "dealAmount": "deal_amount",
    "companyName": "company_name"
  }
}
```

## 📱 Usage Instructions

### 1. Create Templates
- Use the content creator to design announcement templates
- Include variables like `{{rep_name}}`, `{{deal_amount}}`
- Save as public templates for webhook use

### 2. Configure Webhooks
- Access `/webhooks/create` in the frontend
- Select "Announcement" webhook type
- Choose template-based announcement
- Select your template from the dropdown
- Configure display targeting (KASH OFFICE recommended)
- Set takeover priority and duration

### 3. Test Webhooks
- Use the test functionality in the webhook form
- Send sample JSON payloads
- Verify announcements appear on displays

### 4. Production Use
- Integrate webhook URL into your CRM/sales system
- Include required fields: rep_name, rep_email, deal_amount, company_name
- Use the security token for authentication

## 🔒 Security

- All webhook endpoints require authentication tokens
- Admin credentials: `admin` / `admin123`
- Each webhook has a unique security token
- Frontend requires authentication for webhook management

## 🎯 Next Steps

1. **CRM Integration**: Connect your sales system to the webhook URLs
2. **Template Library**: Create more announcement templates
3. **Display Management**: Add more displays for broader coverage
4. **Analytics**: Track announcement performance
5. **Customization**: Add more variables and styling options

The webhook template system is now fully functional and ready for production use! 