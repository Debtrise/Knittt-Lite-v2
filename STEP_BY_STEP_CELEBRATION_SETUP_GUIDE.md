# Step-by-Step Celebration Setup Guide

## Overview
This guide will walk you through setting up the complete celebration system using the UI:
1. Add sales reps and their photos
2. Create a celebration template/project
3. Set up the webhook system
4. Test the complete workflow

## Prerequisites
- Development server running on `http://localhost:3000`
- Backend API running on `http://34.122.156.88:3001`
- Admin access (username: `admin`, password: `admin123`)

## Step 1: Access the Application

1. **Open your browser** and navigate to `http://localhost:3000`
2. **Login** with admin credentials:
   - Username: `admin`
   - Password: `admin123`
3. **Verify** you're logged in and can see the dashboard

## Step 2: Add Sales Reps and Photos

### Option A: Using the Sales Rep Photos Panel (Recommended)

1. **Navigate to Settings → Users** (`/settings/users`)
2. **Look for the Sales Rep Photos section** on the page
3. **Click "Add Photo"** to upload individual photos
4. **Fill in the form**:
   - **Photo File**: Select an image file (JPG, PNG, etc.)
   - **Sales Rep Email**: Enter the rep's email (e.g., `john.doe@company.com`)
   - **Sales Rep Name**: Enter the rep's full name (e.g., `John Doe`)
   - **Replace existing**: Check if you want to replace an existing photo
5. **Click "Upload"** to save the photo

### Option B: Bulk Upload (For Multiple Reps)

1. **From the Sales Rep Photos panel**, click **"Bulk Upload"**
2. **Select multiple image files** at once
3. **Map each file** to an email and name
4. **Click "Upload All"** to process the batch

### Option C: CSV Upload (For Large Lists)

1. **Prepare a CSV file** with columns: `name`, `email`, `photoUrl`
2. **Click "CSV Upload"** in the Sales Rep Photos panel
3. **Upload your CSV file** and map the columns
4. **The system will automatically download and process** the photos

### Verify Photos Are Added

1. **Check the photos grid** to see all uploaded photos
2. **Use the search bar** to find specific reps
3. **Click the eye icon** to preview photos
4. **Set a fallback photo** (optional) for reps without specific photos

## Step 3: Create a Celebration Template

### Access the Content Creator

1. **Navigate to Content Creator** (`/content-creator`)
2. **You'll see the Project Overview** with existing projects and templates
3. **Click "Create New Project"** to start fresh

### Create a New Celebration Project

1. **In the Create Project dialog**:
   - **Name**: `Deal Celebration Template`
   - **Description**: `Template for celebrating closed deals`
   - **Canvas Size**: Select `1920x1080 (Full HD)` for displays
   - **Background Color**: Choose a celebratory color (e.g., gold/blue)
   - **Template**: Start from scratch or choose an existing template
2. **Click "Create Project"**

### Design the Celebration Template

1. **Add Elements** using the left sidebar:
   - **Text Elements**: Add congratulatory messages
     - "Congratulations {rep_name}!"
     - "Deal Closed: ${deal_amount}"
     - "Client: {company_name}"
   - **Sales Rep Photo**: Add a photo element
     - Select `sales_rep_photo` element type
     - This will automatically bind to `{rep_photo}` variable
   - **Background Elements**: Add celebration graphics
   - **Logo**: Add your company logo

2. **Use Variables** for dynamic content:
   - `{rep_name}` - Sales rep name
   - `{rep_email}` - Sales rep email
   - `{deal_amount}` - Deal amount
   - `{company_name}` - Company name
   - `{rep_photo}` - Sales rep photo (automatically handled)

3. **Style the Elements**:
   - Use the **Properties Panel** on the right to adjust colors, fonts, sizes
   - Position elements for maximum visual impact
   - Add animations if desired

### Save as Template

1. **Click "Save as Template"** in the toolbar
2. **Fill in template details**:
   - **Name**: `Deal Celebration Template`
   - **Description**: `Template for celebrating closed deals with rep photos`
   - **Category**: `celebration`
   - **Tags**: `deal`, `celebration`, `sales`
   - **Visibility**: Public (for team use)
3. **Click "Save Template"**

## Step 4: Set Up the Webhook System

### Access Webhook Management

1. **Navigate to Webhooks** (`/webhooks`)
2. **Click "Create New Webhook"** to start the setup

### Configure the Webhook

1. **Step 1: Basic Information**
   - **Name**: `Deal Celebration Webhook`
   - **Description**: `Triggers celebration announcements when deals are closed`
   - **Event Type**: `deal_closed` or `opportunity_won`
   - **Status**: Active

2. **Step 2: Trigger Conditions**
   - **Field**: `deal_status` or `opportunity_stage`
   - **Operator**: `equals`
   - **Value**: `closed_won` or `won`
   - **Add additional conditions** if needed

3. **Step 3: Field Mapping**
   - **Rep Email**: Map to the field containing the sales rep's email
   - **Rep Name**: Map to the sales rep name field
   - **Deal Amount**: Map to the deal value field
   - **Company Name**: Map to the company/account name field

4. **Step 4: Actions Configuration**
   - **Enable Announcement**: Toggle ON
   - **Content Project**: Select your celebration template
   - **Display Selection**: Choose target displays (KASH OFFICE or all)
   - **Takeover Settings**:
     - **Priority**: HIGH
     - **Duration**: 30 seconds
     - **Restore After**: Yes

5. **Step 5: Journey Integration** (Optional)
   - **Auto-enroll in Journey**: Select a follow-up journey if desired
   - **Journey Variables**: Map additional data for the journey

6. **Step 6: Review and Test**
   - **Review all settings**
   - **Click "Test Webhook"** to send a sample payload
   - **Verify the announcement displays correctly**

### Save the Webhook

1. **Click "Create Webhook"** to save the configuration
2. **Copy the webhook URL** for integration with your CRM
3. **Note the endpoint key** for authentication

## Step 5: Test the Complete System

### Manual Test via UI

1. **Go to the webhook details page**
2. **Click "Test Announcement"**
3. **Fill in test data**:
   - **Rep Email**: Use an email with an uploaded photo
   - **Rep Name**: Sales rep name
   - **Deal Amount**: Test amount (e.g., $50,000)
   - **Company Name**: Test company name
4. **Click "Send Test"**
5. **Check the OptiSigns display** to see the celebration

### Test with Sample Webhook Data

1. **Use the webhook testing script** we created earlier
2. **Run the test**: `node test-kash-webhook.js`
3. **Verify the webhook processes correctly**
4. **Check the display for the announcement**

### Integration Test

1. **Configure your CRM** to send webhooks to the generated URL
2. **Close a test deal** in your CRM
3. **Verify the webhook is triggered**
4. **Check that the celebration appears on displays**

## Step 6: Monitor and Maintain

### Monitor Webhook Activity

1. **Check webhook logs** in the webhook details page
2. **Review successful/failed executions**
3. **Monitor display status** in OptiSigns section

### Update Templates

1. **Edit the celebration template** as needed
2. **Save changes** to update all future celebrations
3. **Test updated templates** before deploying

### Manage Sales Rep Photos

1. **Regularly update photos** as team members change
2. **Set up automated photo sync** if your CRM supports it
3. **Monitor photo usage** in the statistics panel

## Troubleshooting

### Common Issues

1. **Photos not displaying**:
   - Check that the email in the webhook matches the photo email exactly
   - Verify the fallback photo is set
   - Check photo file formats (JPG, PNG supported)

2. **Webhook not triggering**:
   - Verify the webhook URL is correct in your CRM
   - Check authentication headers
   - Review webhook conditions and field mappings

3. **Display not showing announcements**:
   - Verify display is online in OptiSigns
   - Check display permissions and assignments
   - Verify takeover settings

### Support Resources

- **API Documentation**: Check the `docs/` folder for detailed API specs
- **Backend Status**: Monitor `http://34.122.156.88:3001` for API health
- **Logs**: Check browser console and network tab for errors

## Success Metrics

- ✅ Sales rep photos uploaded and accessible
- ✅ Celebration template created and saved
- ✅ Webhook configured and tested
- ✅ End-to-end test successful
- ✅ CRM integration working
- ✅ Celebrations displaying on target screens

## Next Steps

1. **Train your team** on updating photos and templates
2. **Set up additional webhook types** for other events
3. **Create more templates** for different celebration types
4. **Monitor usage** and optimize based on feedback

---

**Need Help?** The system includes comprehensive error handling and user feedback. Check the browser console for detailed error messages, and use the test functions to verify each component works correctly. 