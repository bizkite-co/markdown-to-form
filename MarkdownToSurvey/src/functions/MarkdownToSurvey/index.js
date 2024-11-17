const { app } = require('@azure/functions');
const fs = require('fs').promises;
const path = require('path');
const { marked } = require('marked');
const crypto = require('crypto');
const { Client } = require('@microsoft/microsoft-graph-client');
const { DefaultAzureCredential } = require('@azure/identity');

async function getGraphClient() {
    const credential = new DefaultAzureCredential();
    return Client.init({
        authProvider: async (done) => {
            try {
                const token = await credential.getToken('https://graph.microsoft.com/.default');
                done(null, token.token);
            } catch (error) {
                done(error, null);
            }
        }
    });
}

async function createMicrosoftFormsTemplate(markdownContent) {
    const tokens = marked.lexer(markdownContent);
    const formTitle = tokens.find(token => token.type === 'heading' && token.depth === 1)?.text || 'Untitled Survey';

    const formQuestions = [];
    let currentSection = null;

    tokens.forEach(token => {
        if (token.type === 'heading') {
            if (token.depth === 2) {
                currentSection = token.text;
            } else if (token.depth === 4) {
                const questionText = token.text;

                // Determine question type based on subsequent tokens
                const nextToken = tokens[tokens.indexOf(token) + 1];
                let questionType = 'text';
                let choices = [];

                if (nextToken && nextToken.type === 'list' && !nextToken.ordered) {
                    questionType = 'multipleChoice';
                    choices = nextToken.items.map(item => item.text.replace(/\[ \]/g, '').trim());
                }

                formQuestions.push({
                    id: crypto.randomUUID(),
                    title: questionText,
                    type: questionType,
                    choices: choices,
                    section: currentSection
                });
            }
        }
    });

    return {
        title: formTitle,
        questions: formQuestions
    };
}

async function publishMicrosoftForm(formTemplate) {
    const client = await getGraphClient();

    try {
        // Create form
        const formCreationPayload = {
            title: formTemplate.title,
            items: formTemplate.questions.map(question => {
                const baseItem = {
                    title: question.title,
                    quizOptions: {
                        pointValue: 1
                    }
                };

                switch(question.type) {
                    case 'multipleChoice':
                        return {
                            ...baseItem,
                            type: 'multipleChoice',
                            choices: question.choices.map(choice => ({
                                displayName: choice,
                                value: choice
                            }))
                        };
                    case 'text':
                    default:
                        return {
                            ...baseItem,
                            type: 'text'
                        };
                }
            })
        };

        const createdForm = await client.api('/forms')
            .post(formCreationPayload);

        // Publish the form
        await client.api(`/forms/${createdForm.id}/publish`)
            .post({});

        return {
            formId: createdForm.id,
            webUrl: createdForm.webUrl,
            title: createdForm.title
        };
    } catch (error) {
        console.error('Error creating Microsoft Form:', error);
        throw error;
    }
}

app.http('MarkdownToSurvey', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log('Markdown to Survey function processed a request.');

        try {
            const rawBody = await request.text();
            context.log('Raw Request Body:', rawBody);

            let markdownContent, createForm = false;
            try {
                const requestBody = JSON.parse(rawBody);
                markdownContent = requestBody.markdown;
                createForm = requestBody.createForm || false;
            } catch {
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

            const formTemplate = await createMicrosoftFormsTemplate(markdownContent);

            let result = { template: formTemplate };

            if (createForm) {
                const publishedForm = await publishMicrosoftForm(formTemplate);
                result.form = publishedForm;
            }

            return {
                status: 200,
                body: JSON.stringify(result),
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

module.exports = {
    createMicrosoftFormsTemplate,
    publishMicrosoftForm
};
