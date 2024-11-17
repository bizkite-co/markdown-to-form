const { app } = require('@azure/functions');

app.http('MarkdownToSurvey', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log('Markdown to Survey function processed a request.');
        context.log('Request method:', request.method);
        context.log('Request headers:', JSON.stringify(request.headers));

        const name = request.query.get('name') || await request.text() || 'world';

        return {
            status: 200,
            body: `Hello, ${name}! This is the Markdown to Survey function.`
        };
    }
});
