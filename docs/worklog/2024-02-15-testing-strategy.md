# Markdown to Microsoft 365 Forms Conversion - Testing Strategy

## Test Configuration
- Test File: `markdown-to-survey.http`
- Test Endpoint: `/api/MarkdownToSurvey`
- Input: `UserSurvey.md`
- Test Environments:
  1. Local Development Server (http://localhost:7071)
  2. Azure Web App (https://markdown-to-form.azurewebsites.net)

## Testing Approach
1. **Input Flexibility**
   - Supports raw markdown content
   - Handles JSON-wrapped markdown
   - Graceful error handling for invalid inputs

2. **Question Type Coverage**
   - Multiple Choice Questions
   - Single Choice Questions
   - Open Text Responses
   - Rating Scale Questions

3. **Conversion Validation**
   - Unique question identifiers
   - Preserved survey structure
   - Accurate question type mapping

## Recommended Next Steps
- Create comprehensive test cases
- Add unit tests for parsing functions
- Implement input validation
- Create sample markdown templates for different scenarios
