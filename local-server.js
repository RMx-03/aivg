const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Import the Vercel API functions for local testing
const generateVideoHandler = require('./api/generate-video.js').default;
const healthHandler = require('./api/health.js').default;
const testHandler = require('./api/test.js').default;

// Create wrapper functions for Express
const wrapHandler = (handler) => {
    return async (req, res) => {
        try {
            await handler(req, res);
        } catch (error) {
            console.error('Handler error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    };
};

// API routes
app.post('/api/generate-video', wrapHandler(generateVideoHandler));
app.get('/api/health', wrapHandler(healthHandler));
app.get('/api/test', wrapHandler(testHandler));

// Serve static files from frontend dist (for production testing)
app.use(express.static(path.join(__dirname, 'frontend/dist')));

// Catch-all handler for SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/dist/index.html'));
});

app.listen(PORT, '127.0.0.1', () => {
    console.log(`🚀 Local development server running on http://127.0.0.1:${PORT}`);
    console.log(`🏥 Health check: http://127.0.0.1:${PORT}/api/health`);
    console.log(`🧪 Test endpoint: http://127.0.0.1:${PORT}/api/test`);
    console.log(`🎬 Main API: http://127.0.0.1:${PORT}/api/generate-video`);
    console.log(`📁 Frontend: Start with 'npm run dev' in /frontend folder`);
});
