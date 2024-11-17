const { app } = require('@azure/functions');

app.http('MarkdownToSurvey', {
    methods: ['GET', 'POST'],
    authLevel: 'function',
    handler: async (request, context) => {
        context.log('Markdown to Survey function processed a request.');

        const name = request.query.get('name') || await request.text() || 'world';
        
        return {
            body: `Hello, ${name}! This is the Markdown to Survey function.`
        };
    }
});
