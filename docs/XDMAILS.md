# XDMails - Bulk Email Campaign Module

## Overview

XDMails is a comprehensive bulk email sending module integrated into the AHS-XD Operations dashboard. It enables marketing and outreach campaigns through a professional email composer with support for multiple recipient sources.

## Features

### 📧 Email Composer

- **Rich Text Editor**: Full-featured WYSIWYG editor powered by Tiptap
  - Text formatting (bold, italic, strikethrough)
  - Headers (H1, H2)
  - Lists (ordered and unordered)
  - Text alignment (left, center, right)
  - Links and images
  - Clean, modern interface

### 👥 Recipient Management

- **Multiple Input Methods**:
  - Upload CSV files
  - Upload TXT files
  - Upload Excel files (XLS, XLSX)
  - Manual entry (comma or line-separated)
  - Combined approach (upload + manual)

- **Smart Email Extraction**:
  - Automatically detects email columns in spreadsheets
  - Validates email format
  - Deduplicates recipients
  - Real-time recipient count

### 📨 Campaign Management

- **Draft System**: Save campaigns before sending
- **Campaign List**: View all past and draft campaigns
- **Status Tracking**:
  - Draft
  - Queued
  - Sending
  - Sent
  - Failed
- **Analytics**: Track sent/failed counts per campaign
- **Preview**: View email content before sending
- **Delete**: Remove unwanted campaigns

### 🎨 Professional Email Template

- Branded AHS template wrapper
- Responsive design
- Professional header and footer
- Consistent styling across email clients
- Company branding and contact information

## Access Control

**Authorized Roles**:

- Superadmin
- Admin (CEO)
- Operations

## Usage

### Creating a Campaign

1. Navigate to **Dashboard → XDMails**
2. Click the **Compose** tab
3. Enter your email subject
4. Compose your message using the rich text editor
5. Add recipients:
   - **Upload File**: Click "Choose File" and select CSV/TXT/XLS/XLSX
   - **Manual Entry**: Type or paste emails in the manual entry field
   - **Review**: Check the recipient list and count
6. Click **Save & Queue** to create the draft

### Sending a Campaign

1. Navigate to **Dashboard → XDMails**
2. Click the **Campaigns** tab
3. Find your draft campaign
4. Click the **Send** icon (paper plane)
5. Confirm the send action
6. Monitor the status and results

### Managing Campaigns

- **View**: Click the eye icon to preview campaign details
- **Send**: Click the send icon for draft campaigns
- **Delete**: Click the trash icon to remove campaigns

## File Format Requirements

### CSV Files

```csv
name,email,company
John Doe,john@example.com,Acme Corp
Jane Smith,jane@example.com,Tech Inc
```

### TXT Files

```
john@example.com
jane@example.com
admin@company.com
```

### Excel Files

Must contain a column with "email" or "mail" in the header name.

## Email Configuration

Emails are sent from: **info@ayothealthsolutions.ke**

The system uses the existing Zoho SMTP configuration:

- Host: smtp.zoho.com
- Port: 465 (SSL)
- Authentication via environment variables

## Technical Details

### Database Model

- **Collection**: `EmailCampaign`
- **Fields**:
  - subject: String
  - htmlContent: String
  - recipients: Array of emails
  - attachments: Array (future use)
  - status: Enum
  - sentCount: Number
  - failedCount: Number
  - createdBy: User reference
  - timestamps

### API Actions

- `saveDraftCampaign`: Create new campaign
- `sendCampaign`: Send campaign to all recipients
- `getCampaigns`: Retrieve campaign list
- `deleteCampaign`: Remove campaign

### Components

- `EmailComposer`: Main composition interface
- `CampaignList`: Campaign management table
- React Quill: Rich text editor
- PapaParse: CSV parsing
- XLSX: Excel file parsing

## Responsive Design

The XDMails interface is fully responsive:

- **Desktop**: Full-width editor with side-by-side recipient management
- **Tablet**: Stacked layout with optimized spacing
- **Mobile**: Single-column layout with touch-friendly controls

## Best Practices

1. **Test First**: Send to a test email before bulk sending
2. **Verify Recipients**: Always review the recipient count and list
3. **Professional Content**: Use proper formatting and branding
4. **Subject Lines**: Keep concise and relevant
5. **Compliance**: Ensure recipients have opted in for communications
6. **Monitor Results**: Check sent/failed counts after sending

## Future Enhancements

- [ ] Attachment support
- [ ] Email templates library
- [ ] Scheduled sending
- [ ] A/B testing
- [ ] Advanced analytics (open rates, click rates)
- [ ] Unsubscribe management
- [ ] Email list segmentation
- [ ] Personalization tokens ({{name}}, {{company}})

## Support

For issues or questions about XDMails, contact the development team or refer to the main AHS-XD documentation.
