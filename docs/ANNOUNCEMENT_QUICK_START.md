# 🚀 Announcement Quick Start

## 5-Minute Setup for Deal Celebrations

### 1. Create Template (2 minutes)
1. Go to **Content Creator** (`/content-creator`)
2. Add these elements:
   ```
   📍 Sales Rep Photo Element → Properties: src = "{rep_photo}"
   📍 Text Element → "🎉 {rep_first_name} closed a {deal_amount} deal!"
   📍 Text Element → "Client: {client_name}"
   📍 Animation Element → "Raining Money" or "Confetti"
   ```
3. **Save as Template** → Category: "celebration" → Make Public ✅

### 2. Configure Webhook (2 minutes)
1. Go to **Webhooks** (`/webhooks`) → **Create New**
2. Set **Type**: "Announcement"
3. **Template ID**: Copy from step 1
4. **Variable Mapping**:
   ```json
   {
     "rep_first_name": "rep_name",
     "deal_amount": "deal_amount", 
     "client_name": "company_name",
     "rep_photo": "rep_email"
   }
   ```
5. **Display Settings**: "All displays" + "HIGH priority" + "30 seconds"

### 3. Test (1 minute)
Send test webhook:
```json
{
  "rep_name": "John Doe",
  "rep_email": "john.doe@company.com", 
  "deal_amount": "$50,000",
  "company_name": "Acme Corp"
}
```

## 🎯 Essential Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `{rep_photo}` | Sales rep photo (auto-lookup) | *Auto-filled from rep_email* |
| `{rep_first_name}` | Rep first name | "Sarah" |
| `{deal_amount}` | Deal value | "$250,000" |
| `{client_name}` | Client/company | "TechCorp Solutions" |
| `{close_date}` | Deal close date | "Jan 15, 2024" |

## 🎨 Quick Template Ideas

### Deal Celebration
- **Background**: Video celebration or gradient
- **Elements**: Sales rep photo + deal details + money animation
- **Duration**: 30-45 seconds

### New Hire Welcome  
- **Background**: Company colors/logo
- **Elements**: Employee photo + welcome message + department info
- **Duration**: 45-60 seconds

### Milestone Achievement
- **Background**: Achievement-themed (fireworks, confetti)
- **Elements**: Team/person photo + milestone details + celebration
- **Duration**: 60 seconds

## ⚡ Pro Tips

1. **Upload Sales Rep Photos First**
   - Use Sales Rep Photos panel in Content Creator
   - Associate with email addresses
   - Photos auto-populate in announcements

2. **Test Variables**
   - Use webhook test feature
   - Verify all variables populate correctly
   - Check photo lookup works

3. **Video Backgrounds**
   - Use MP4 format
   - Keep under 10MB for best performance
   - Ensure good contrast with text

4. **Display Strategy**
   - Start with "All displays" for maximum impact
   - Use HIGH priority for important celebrations
   - Set 30-60 second duration for optimal viewing

## 🔗 Quick Links

- **Content Creator**: `/content-creator`
- **Webhooks**: `/webhooks`
- **Sales Rep Photos**: Content Creator → Sales Rep Photos tab
- **Templates**: Content Creator → Templates tab
- **OptiSigns Displays**: `/optisigns/displays`

## 📞 Need Help?

- Check the full **Announcement Setup Guide** for detailed instructions
- Use webhook test functionality to debug issues
- Monitor webhook event logs for troubleshooting 