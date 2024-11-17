# Markdown to Microsoft 365 Forms Converter

## Overview
This Azure Function converts markdown survey templates into Microsoft 365 Forms, providing a seamless way to create surveys from markdown documents.

## Features
- Convert markdown to Microsoft 365 Forms template
- Optional direct form creation in Microsoft 365
- Supports various question types:
  - Multiple Choice
  - Single Choice
  - Open Text
  - Rating Scales

## Prerequisites
- Azure Function Core Tools
- Azure AD App Registration
- Microsoft Graph API Permissions
  - Forms.ReadWrite.All (Application or Delegated)

## Authentication
Uses Azure DefaultAzureCredential. Supports:
- Managed Identity
- Service Principal
- Local Development Credentials

## Request Payload

### Get Form Template
```json
{
  "markdown": "# Survey Title\n..."
}
```

### Create Form Directly
```json
{
  "markdown": "# Survey Title\n...",
  "createForm": true
}
```

## Response Structure
```json
{
  "template": { ... },  // Form template JSON
  "form": {             // Only if createForm is true
    "formId": "unique-form-id",
    "webUrl": "https://forms.office.com/..."
  }
}
```

## Local Development Setup
1. Install dependencies
   ```bash
   npm install
   ```

2. Set up Azure AD Authentication
   - Create an App Registration
   - Configure Microsoft Graph API Permissions
   - Set environment variables for local development

3. Run the function locally
   ```bash
   npm start
   ```

## Deployment
- Deploy as an Azure Function
- Configure Managed Identity
- Set up Microsoft Graph API permissions

## Markdown Survey Format
- Use markdown headings for survey structure
- Support for various question types
- See `src/test/UserSurvey.md` for example

## Limitations
- Requires Microsoft 365 Forms API access
- Some advanced form features may not be fully supported

## Contributing
Contributions welcome! Please read the contributing guidelines.

## License
[Specify your license]
