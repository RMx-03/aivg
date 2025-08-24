// CORS headers for Vercel
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

module.exports = async function handler(req, res) {
    // Set CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
        res.setHeader(key, value);
    });

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const hasApiKey = !!process.env.STABILITY_API_KEY;
    console.log('Health check accessed, API key configured:', hasApiKey);
    
    res.status(200).json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        message: 'AI Video Generation API is running on Vercel',
        apiKey: hasApiKey ? 'configured' : 'missing',
        environment: process.env.NODE_ENV || 'development'
    });
};
