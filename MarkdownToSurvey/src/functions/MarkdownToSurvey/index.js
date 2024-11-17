const { app } = require('@azure/functions');
const fs = require('fs').promises;
const path = require('path');
const { marked } = require('marked');

async function parseMarkdownToForm(markdownPath) {
    try {
        const markdownContent = await fs.readFile(markdownPath, 'utf8');
        const tokens = marked.lexer(markdownContent);
        
        const formStructure = {
            title: '',
            questions: []
        };

        let currentQuestion = null;

        tokens.forEach(token => {
            switch(token.type) {
                case 'heading':
                    if (token.depth === 1) {
                        formStructure.title = token.text;
                    } else if (token.depth === 2) {
                        currentQuestion = {
                            text: token.text,
                            type: 'text', // default type
                            options: []
                        };
                        formStructure.questions.push(currentQuestion);
                    }
                    break;
                case 'list':
                    if (currentQuestion && token.ordered === false) {
                        currentQuestion.type = 'multipleChoice';
                        currentQuestion.options = token.items.map(item => item.text);
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
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log('Markdown to Survey function processed a request.');
        
        try {
            const surveyPath = path.join(__dirname, '..', '..', '..', 'test', 'UserSurvey.md');
            const formStructure = await parseMarkdownToForm(surveyPath);
            
            return {
                status: 200,
                body: JSON.stringify(formStructure),
                headers: {
                    'Content-Type': 'application/json'
                }
            };
        } catch (error) {
            return {
                status: 500,
                body: JSON.stringify({ error: 'Failed to generate form' })
            };
        }
    }
});
