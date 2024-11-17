const { app } = require('@azure/functions');
const fs = require('fs').promises;
const path = require('path');
const { marked } = require('marked');

function convertToMicrosoft365FormsTemplate(formStructure) {
    const m365Form = {
        title: formStructure.title,
        questions: []
    };

    formStructure.sections.forEach(section => {
        section.questions.forEach(question => {
            let m365Question = {
                id: crypto.randomUUID(), // Unique identifier for each question
                title: question.text,
                type: 'text', // Default type
                isRequired: false // Optional by default
            };

            // Map question types
            switch(question.type) {
                case 'multipleChoice':
                    m365Question.type = 'choice';
                    m365Question.choices = question.options.map(option => ({
                        id: crypto.randomUUID(),
                        text: option
                    }));
                    break;
                case 'openText':
                    m365Question.type = 'text';
                    break;
                default:
                    m365Question.type = 'text';
            }

            m365Form.questions.push(m365Question);
        });
    });

    return m365Form;
}

async function parseMarkdownToForm(markdownContent) {
    try {
        const tokens = marked.lexer(markdownContent);

        const formStructure = {
            title: '',
            sections: []
        };

        let currentSection = null;
        let currentQuestion = null;
        console.log('Raw Markdown Content:', markdownContent);
        console.log('Parsed Tokens:', JSON.stringify(tokens, null, 2));
        tokens.forEach(token => {
            switch(token.type) {
                case 'heading':
                    if (token.depth === 1) {
                        formStructure.title = token.text;
                    } else if (token.depth === 2) {
                        currentSection = {
                            title: token.text,
                            questions: []
                        };
                        formStructure.sections.push(currentSection);
                    } else if (token.depth === 4) {
                        currentQuestion = {
                            text: token.text,
                            type: 'text', // default type
                            options: []
                        };
                        currentSection.questions.push(currentQuestion);
                    }
                    break;
                case 'list':
                    if (currentQuestion) {
                        if (token.ordered === false) {
                            currentQuestion.type = 'multipleChoice';
                            currentQuestion.options = token.items.map(item => item.text.replace(/\[ \]/g, '').trim());
                        }
                    }
                    break;
                case 'paragraph':
                    if (currentQuestion && token.text.includes('[Open text response]')) {
                        currentQuestion.type = 'openText';
                    }
                    break;
            }
        });

        return formStructure;
    } catch (error) {
        console.error('Error parsing markdown:', error);
        throw error;
    }
}

app.http('MarkdownToSurvey', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log('Markdown to Survey function processed a request.');

        try {
            // Log the raw request body for debugging
            const rawBody = await request.text();
            context.log('Raw Request Body:', rawBody);

            // Check if the body is JSON or raw markdown
            let markdownContent;
            try {
                // Try parsing as JSON first
                const requestBody = JSON.parse(rawBody);
                markdownContent = requestBody.markdown;
            } catch {
                // If not JSON, treat the body as raw markdown
                markdownContent = rawBody;
            }

            if (!markdownContent) {
                return {
                    status: 400,
                    body: JSON.stringify({
                        error: 'No markdown content provided',
                        message: 'Please include markdown text in the request body'
                    })
                };
            }

            const formStructure = await parseMarkdownToForm(markdownContent);
            const m365FormsTemplate = convertToMicrosoft365FormsTemplate(formStructure);

            return {
                status: 200,
                body: JSON.stringify(m365FormsTemplate),
                headers: {
                    'Content-Type': 'application/json'
                }
            };
        } catch (error) {
            context.log('Unhandled Error:', error);
            return {
                status: 500,
                body: JSON.stringify({
                    error: 'Failed to generate form',
                    message: error.toString(),
                    stack: error.stack
                })
            };
        }
    }
});
