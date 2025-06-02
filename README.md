# Knittt Lite v2

A comprehensive lead management and journey automation platform with advanced calling, SMS, and email capabilities.

## Features

### Journey Builder
- **Visual Journey Designer**: Drag-and-drop interface for creating complex lead journeys
- **Multi-Channel Actions**: Support for calls, SMS, email, webhooks, and more
- **Advanced Call Features**: 
  - **Interactive Voice Response (IVR)**: Configure complex phone menus with multiple options
  - Transfer groups and DID management
  - Call recording and voicemail templates
  - Script templates for agent guidance
- **Conditional Logic**: Branch journeys based on lead data and responses
- **Delay Management**: Schedule actions with various timing options
- **Email Preview**: Real-time preview of email templates with variable substitution

### IVR Configuration
The Journey Builder now supports comprehensive IVR (Interactive Voice Response) configuration for call actions:

#### IVR Features:
- **Menu Options**: Configure responses for keys 0-9, *, #, and default (no input/invalid)
- **Multiple Actions**: Each key can trigger different actions:
  - **Transfer**: Route to specific numbers or transfer groups
  - **Play Recording**: Play pre-recorded messages or text-to-speech
  - **Hang Up**: End the call
  - **Collect Input**: Gather additional input from caller
  - **Add Tag**: Tag the lead based on their selection
  - **Webhook**: Trigger external API calls
- **Advanced Settings**:
  - Configurable timeout for input collection
  - Maximum retry attempts for invalid input
  - Custom invalid input messages
  - Step jumping for complex flow control

#### IVR Configuration Example:
```json
{
  "ivrEnabled": true,
  "ivrPromptText": "Press 1 for sales, 2 for support, or 0 for operator",
  "ivrTimeout": 10,
  "ivrMaxRetries": 3,
  "ivrOptions": {
    "1": {
      "action": "transfer",
      "transferGroupId": 123,
      "description": "Sales Department"
    },
    "2": {
      "action": "transfer", 
      "transferNumber": "+1234567890",
      "description": "Support Line"
    },
    "0": {
      "action": "transfer",
      "transferNumber": "+1800555000", 
      "description": "Operator"
    },
    "default": {
      "action": "playRecording",
      "recordingText": "Invalid selection. Please try again.",
      "description": "Invalid input handler"
    }
  }
}
```

### Lead Management
- **Contact Import**: Bulk import with intelligent field mapping
- **Journey Enrollment**: Automatic and manual lead assignment
- **Activity Tracking**: Complete audit trail of all interactions
- **Custom Fields**: Flexible lead data structure

### Communication Channels
- **SMS Campaigns**: Template-based messaging with delivery tracking
- **Email Marketing**: Rich HTML templates with preview functionality
- **Voice Calls**: Automated dialing with IVR and recording capabilities
- **Webhooks**: Integration with external systems

### Analytics & Reporting
- **Journey Performance**: Track conversion rates and step completion
- **Communication Metrics**: Delivery rates, response tracking
- **Lead Analytics**: Conversion funnels and engagement metrics
- **Real-time Dashboards**: Live system status and performance monitoring

## Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Redis (for session management)
- Asterisk PBX (for voice features)

### Installation
1. Clone the repository
2. Install dependencies: `npm install`
3. Configure environment variables (see `.env.example`)
4. Run database migrations
5. Start the development server: `npm run dev`

### Configuration
- **API Endpoints**: Configure backend API URLs in environment variables
- **Authentication**: Set up JWT tokens and session management
- **PBX Integration**: Configure Asterisk connection for voice features
- **SMS Provider**: Set up Twilio or similar SMS service
- **Email Service**: Configure SMTP or email service provider

## Usage

### Creating a Journey with IVR
1. Navigate to Journey Builder
2. Create a new journey or edit existing one
3. Add a "Call" action step
4. Enable IVR in the action configuration
5. Configure IVR prompt text and timeout settings
6. Add menu options for each key press
7. Set actions for each option (transfer, recording, etc.)
8. Test the journey with sample leads

### Managing Call Templates
1. Go to Calls → Dialplan tab
2. Create script templates for agent guidance
3. Create voicemail templates for automated messages
4. Use templates in Journey Builder call actions
5. Preview templates with sample data

### System Monitoring
- Check Capabilities dashboard for system status
- Monitor dialplan generation and deployment
- Track call completion and IVR interaction rates
- Review error logs for troubleshooting

## API Documentation
The platform provides comprehensive REST APIs for:
- Journey management and execution
- Lead data and activity tracking  
- Template and dialplan operations
- Communication channel integration
- Analytics and reporting data

## Support
For technical support and feature requests, please refer to the documentation or contact the development team.
