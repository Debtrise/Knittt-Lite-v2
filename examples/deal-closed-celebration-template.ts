/**
 * Deal Closed Celebration Template Example
 * 
 * This template demonstrates the exact setup described in the documentation
 * for creating announcement templates that automatically populate sales rep photos
 * when triggered via webhook.
 */

export const dealClosedCelebrationTemplate = {
  name: "Deal Closed Celebration - Video Background",
  description: "Celebration template with raining money animation and video background - auto-fills sales rep photo from webhook data",
  category: "celebrations",
  canvasSize: { width: 1920, height: 1080 },
  
  // Enhanced canvas background - now supports video as documented
  canvasBackground: {
    type: "video", // New video background type
    url: "https://assets.example.com/celebration-background.mp4" // Video will loop muted behind all elements
  },
  
  // Alternative background options (comment/uncomment as needed):
  /*
  // Solid color background
  canvasBackground: {
    type: "solid",
    color: "#1a1a2e" // Dark background
  },
  
  // Gradient background  
  canvasBackground: {
    type: "gradient", 
    gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
  },
  
  // Image background
  canvasBackground: {
    type: "image",
    imageUrl: "https://assets.example.com/celebration-bg.jpg"
  }
  */
  
  templateData: {
    elements: [
      // Sales Rep Photo Element - binds to {rep_photo} variable
      {
        elementType: "sales_rep_photo", // Documented element type
        position: { x: 100, y: 200, z: 3 },
        size: { width: 480, height: 480 }, // Documented default size
        properties: {
          src: "{rep_photo}", // KEY: This is the webhook variable binding as documented
          alt: "Sales Representative Photo",
          fit: "cover", // Documented property name
          borderRadius: "50%", // Circular frame as documented
          autoFill: true, // Indicates this auto-fills from webhook
          webhookVariable: "rep_photo" // The variable name webhook will populate
        },
        styles: {
          borderRadius: "50%", // Circular styling
          border: "5px solid #ffd700", // Gold border for celebration
          boxShadow: "0 10px 25px rgba(255, 215, 0, 0.3)", // Gold shadow
          backgroundColor: "#f3f4f6" // Loading state background
        },
        layerOrder: 3,
        opacity: 1
      },
      
      // Main Congratulations Text
      {
        elementType: "text",
        position: { x: 700, y: 200, z: 2 },
        size: { width: 1000, height: 120 },
        properties: {
          text: "🎉 CONGRATULATIONS! 🎉\n{rep_first_name} closed the deal!", // Uses webhook variables
          textAlign: "center"
        },
        styles: {
          fontSize: "56px",
          fontWeight: "bold",
          color: "#ffd700", // Gold text
          fontFamily: "Inter, sans-serif",
          textShadow: "3px 3px 6px rgba(0, 0, 0, 0.8)", // Strong shadow for video background
          lineHeight: "1.2"
        },
        layerOrder: 2,
        opacity: 1
      },
      
      // Deal Details Card
      {
        elementType: "text", 
        position: { x: 700, y: 380, z: 2 },
        size: { width: 1000, height: 200 },
        properties: {
          text: "Deal Value: {deal_amount}\nClient: {client_name}\nSales Rep: {rep_first_name} {rep_last_name}\nDate: {close_date}",
          textAlign: "center"
        },
        styles: {
          fontSize: "32px",
          fontWeight: "500", 
          color: "#ffffff", // White text for contrast on video
          fontFamily: "Inter, sans-serif",
          backgroundColor: "rgba(0, 0, 0, 0.7)", // Semi-transparent background
          padding: "30px",
          borderRadius: "15px",
          border: "2px solid #ffd700",
          textShadow: "2px 2px 4px rgba(0, 0, 0, 0.8)",
          lineHeight: "1.4"
        },
        layerOrder: 2, 
        opacity: 1
      },
      
      // Raining Money Animation - positioned behind other elements but above video
      {
        elementType: "animation", // Maps to documented database type
        position: { x: 0, y: 0, z: 1 },
        size: { width: 1920, height: 1080 },
        properties: {
          customElementType: "raining_money", // Enhanced element type
          billCount: 50,
          billTypes: ["$1", "$5", "$10", "$20", "$50", "$100"],
          fallSpeed: { min: 2, max: 5 },
          swayAmount: 100,
          rotationSpeed: { min: 1, max: 3 },
          billSize: { min: 80, max: 160 },
          continuous: true,
          sparkleEffect: true,
          colors: {
            "$1": "#22c55e",
            "$5": "#f59e0b", 
            "$10": "#eab308",
            "$20": "#06b6d4",
            "$50": "#ec4899",
            "$100": "#10b981"
          }
        },
        styles: {
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%", 
          pointerEvents: "none",
          overflow: "hidden",
          zIndex: 1
        },
        layerOrder: 1,
        opacity: 0.9
      },
      
      // Success Badge
      {
        elementType: "shape",
        position: { x: 1600, y: 100, z: 4 },
        size: { width: 200, height: 200 },
        properties: {
          shapeType: "circle",
          text: "DEAL\nCLOSED!"
        },
        styles: {
          backgroundColor: "#22c55e",
          color: "#ffffff",
          fontSize: "24px",
          fontWeight: "bold",
          border: "5px solid #ffd700",
          boxShadow: "0 8px 20px rgba(34, 197, 94, 0.4)",
          textAlign: "center",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        },
        layerOrder: 4,
        opacity: 1
      }
    ],
    
    // Video background configuration - documented behavior
    canvasBackground: {
      type: "video",
      url: "https://assets.example.com/celebration-background.mp4"
      // During export, this becomes:
      // <video class="background-video" src="..." autoplay loop muted playsinline
      //  style="position:absolute;left:0;top:0;width:100%;height:100%;object-fit:cover;z-index:-1;"></video>
    }
  },
  
  // Variables that will be populated by webhook
  variables: {
    rep_photo: {
      name: "rep_photo",
      displayName: "Sales Rep Photo",
      description: "URL to the sales representative's photo", 
      dataType: "image",
      dataSource: "external_api",
      sourceField: "rep_email", // Lookup based on rep_email
      defaultValue: "https://assets.example.com/default-avatar.jpg",
      category: "sales_rep",
      isSystemVariable: false,
      isRequired: true
    },
    rep_first_name: {
      name: "rep_first_name", 
      displayName: "Sales Rep First Name",
      description: "First name of the sales representative",
      dataType: "string",
      dataSource: "lead",
      sourceField: "assigned_rep_first_name",
      defaultValue: "Sales Rep",
      category: "sales_rep",
      isSystemVariable: false,
      isRequired: true
    },
    rep_last_name: {
      name: "rep_last_name",
      displayName: "Sales Rep Last Name", 
      description: "Last name of the sales representative",
      dataType: "string",
      dataSource: "lead",
      sourceField: "assigned_rep_last_name", 
      defaultValue: "",
      category: "sales_rep",
      isSystemVariable: false,
      isRequired: false
    },
    deal_amount: {
      name: "deal_amount",
      displayName: "Deal Amount",
      description: "Value of the closed deal",
      dataType: "string",
      dataSource: "lead", 
      sourceField: "deal_value",
      formatTemplate: "${value}",
      defaultValue: "$0",
      category: "deal",
      isSystemVariable: false,
      isRequired: true
    },
    client_name: {
      name: "client_name",
      displayName: "Client Name",
      description: "Name of the client/company",
      dataType: "string",
      dataSource: "lead",
      sourceField: "company_name",
      defaultValue: "Valued Client",
      category: "client", 
      isSystemVariable: false,
      isRequired: true
    },
    close_date: {
      name: "close_date",
      displayName: "Close Date", 
      description: "Date the deal was closed",
      dataType: "date",
      dataSource: "system",
      sourceField: "current_date",
      formatTemplate: "MMMM dd, yyyy",
      defaultValue: new Date().toISOString(),
      category: "deal",
      isSystemVariable: true,
      isRequired: true
    }
  },
  
  isPublic: true,
  usageCount: 0,
  createdAt: new Date().toISOString()
};

/**
 * Example webhook payload that would trigger this template:
 * 
 * POST /api/webhooks/announcement
 * {
 *   "templateId": "deal-closed-celebration",
 *   "displayIds": ["display-001", "display-002"],
 *   "variables": {
 *     "deal_amount": "$250,000",
 *     "company_name": "TechCorp Solutions", 
 *     "rep_name": "Sarah Johnson",
 *     "rep_email": "sarah.johnson@company.com"
 *     // rep_photo will be auto-populated by backend based on rep_email
 *   },
 *   "duration": 10000,
 *   "priority": "high"
 * }
 * 
 * The backend will:
 * 1. Look up the photo for sarah.johnson@company.com using /api/sales-rep-photos/by-email/sarah.johnson@company.com
 * 2. Populate the {rep_photo} variable with the photo URL (or fallback if not found)
 * 3. Generate the announcement with all variables filled
 * 4. Display it on the specified displays
 */

/**
 * Frontend implementation workflow:
 * 
 * 1. Upload photos:
 *    - Use /api/sales-rep-photos/upload to associate photos with email addresses
 *    - Or use bulk upload endpoints for multiple photos
 * 
 * 2. Design announcement:
 *    - Create template with sales_rep_photo element
 *    - Set src property to "{rep_photo}" 
 *    - Element will auto-fill when webhook triggers
 * 
 * 3. Webhook triggers:
 *    - Deal closes, webhook sends rep_email and other data
 *    - Backend looks up photo and populates {rep_photo}
 *    - Announcement displays with correct sales rep photo
 */

/**
 * WEBHOOK INTEGRATION WORKFLOW with Video Background:
 *
 * 1. Deal closes in CRM system
 * 2. Webhook payload sent to announcement system:
 *    {
 *      "rep_email": "john.doe@company.com", 
 *      "rep_first_name": "John",
 *      "rep_last_name": "Doe", 
 *      "deal_amount": "$50,000",
 *      "client_name": "Acme Corp",
 *      "template_id": "deal-closed-celebration"
 *    }
 *
 * 3. System processes template:
 *    - Looks up sales rep photo by rep_email
 *    - Populates {rep_photo} variable with photo URL  
 *    - Fills other variables from webhook data
 *    - Generates HTML with video background
 *
 * 4. Generated HTML structure:
 *    ```html
 *    <div class="canvas">
 *      <!-- Video background - loops muted behind everything -->
 *      <video class="background-video" src="celebration-background.mp4" 
 *             autoplay loop muted playsinline 
 *             style="position:absolute;left:0;top:0;width:100%;height:100%;object-fit:cover;z-index:-1;">
 *      </video>
 *      
 *      <!-- Sales rep photo element with populated URL -->
 *      <img src="https://photos.company.com/john.doe.jpg" 
 *           class="sales-rep-photo" 
 *           style="border-radius:50%;..." />
 *      
 *      <!-- Other elements rendered on top -->
 *      <div class="congratulations-text">🎉 CONGRATULATIONS! 🎉<br/>John closed the deal!</div>
 *      <!-- Raining money animation -->
 *      <!-- Deal details -->
 *    </div>
 *    ```
 *
 * 5. Content displays on screens with:
 *    - Video background looping seamlessly behind all content
 *    - Sales rep photo auto-filled from database
 *    - Celebration animations over video background
 *    - All text populated with actual deal data
 *
 * VIDEO BACKGROUND FEATURES:
 * - Loops automatically and seamlessly
 * - Plays muted to avoid audio conflicts  
 * - Positioned behind all other elements (z-index: -1)
 * - Covers entire canvas with object-fit: cover
 * - Supports MP4, WebM, and other standard video formats
 * - Optimized for digital signage displays
 */

export default dealClosedCelebrationTemplate; 