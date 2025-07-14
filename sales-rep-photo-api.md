# Sales Rep Photo API

These endpoints let you upload and manage sales rep photos used in announcement templates. All routes require Bearer authentication and are prefixed with `/api`.

When using the Content Creator, you can place a photo on the canvas by adding an element with `elementType: "sales_rep_photo"`. The element automatically binds to the `{rep_photo}` variable so that the correct representative's image is displayed when a deal is closed.

| Method | Path | Description |
| ------ | ---- | ----------- |
| `POST` | `/sales-rep-photos/upload` | Upload a photo for a single sales rep. Form fields: `photo`, `repEmail`, optional `repName`. |
| `POST` | `/sales-rep-photos/bulk-upload` | Bulk upload multiple photos. Accepts `photos` files array and `mappings` JSON describing `{filename,email,name}`. |
| `POST` | `/sales-rep-photos/bulk-csv` | Upload a CSV of reps with `name`, `email` and `photoUrl` columns to create users and fetch their photos. |
| `POST` | `/sales-rep-photos/fallback` | Set or replace the default fallback photo shown when a rep photo is missing. |
| `GET` | `/sales-rep-photos/fallback` | Retrieve the current fallback photo. Returns 404 if not configured. |
| `GET` | `/sales-rep-photos/by-email/:email` | Fetch a photo asset by rep email address. |
| `GET` | `/sales-rep-photos` | List uploaded sales rep photos with pagination. Supports `page` and `limit` query params. |
| `POST` | `/sales-rep-photos/generate-video` | Produce a celebration video using the rep photo. Body fields: `repEmail`, optional `repName`, `dealAmount`, `companyName`. |
| `DELETE` | `/sales-rep-photos/:id` | Delete a photo asset by ID. |

### Fallback photo
If a sales rep photo isn't found for the provided email, the webhook logs a
message similar to `No photo found for someone@example.com and no fallback
configured`. Upload a default image using the `/sales-rep-photos/fallback`
endpoint so the system can display it whenever a rep photo is missing.

## Validation

### Single Photo Upload Validation
- **Required Fields**: `photo` (image file), `repEmail` (valid email format)
- **File Requirements**: 
  - Must be an image file (JPG, PNG, GIF, etc.)
  - Maximum file size: 10MB
  - Valid image MIME type
- **Email Validation**: Must be valid email format (xxx@xxx.xxx)

### Bulk Upload Validation
- **File Limits**: Maximum 50 photos per bulk upload
- **Mappings**: JSON array with `filename`, `email`, and optional `name` for each photo
- **Email Validation**: All emails must be valid format
- **File Requirements**: Same as single upload (10MB max, image files only)

### CSV Upload Validation
The CSV upload endpoint includes comprehensive validation:

#### Required CSV Format
- **Headers**: Flexible column naming supported:
  - **Name**: `name`, `fullname`, or `rep_name`
  - **Email**: `email`, `email_address`, or `rep_email`  
  - **Photo URL**: `photoUrl`, `photo_url`, `imageurl`, `image_url`, or `url`
- **File Limits**: Maximum 5MB CSV file size, up to 1000 rows recommended
- **Required Data**: All three columns must have values for each row

#### Validation Checks
- **Email Format**: Must be valid email format (xxx@xxx.xxx)
- **Photo URLs**: Must be valid HTTP/HTTPS URLs pointing to image files
- **Duplicate Detection**: Warns about duplicate emails within CSV
- **Row Validation**: Validates each row and reports specific errors with row numbers

#### Validation Response
```json
{
  "isValid": true,
  "errors": [],
  "warnings": ["Row 15: Duplicate email found: john@company.com"],
  "totalRows": 100,
  "validRows": 99,
  "preview": [
    {"name": "John Doe", "email": "john@company.com", "photoUrl": "https://example.com/photo.jpg"}
  ]
}
```

## Quick Test
The setup script provides example commands for uploading a photo and triggering a webhook:

```bash
curl -X POST http://34.122.156.88:3001/api/sales-rep-photos/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "photo=@test.jpg" \
  -F "repEmail=john@company.com" \
  -F "repName=John Doe"
```

Upload many reps at once from a CSV file with `name`, `email` and `photoUrl` columns:

```bash
curl -X POST http://34.122.156.88:3001/api/sales-rep-photos/bulk-csv \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "csv=@reps.csv"
```

Example CSV format (reps.csv):
```csv
name,email,photoUrl
John Doe,john@company.com,https://example.com/photos/john.jpg
Jane Smith,jane@company.com,https://example.com/photos/jane.png
Mike Johnson,mike@company.com,https://example.com/photos/mike.jpeg
```

Test webhook trigger:
```bash
curl -X POST http://34.122.156.88:3001/api/webhooks/endpoint/YOUR_ENDPOINT_KEY \
  -H "Authorization: Bearer YOUR_WEBHOOK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "salesRep": {"name": "John Doe", "email": "john@company.com"},
    "deal": {"value": "$50,000"},
    "client": {"company": "Acme Corp"}
  }'
```
