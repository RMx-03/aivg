module.exports = async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const hasApiKey = !!process.env.STABILITY_API_KEY;
    
    res.status(200).json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        message: 'AI Video Generation API is running on Vercel',
        apiKey: hasApiKey ? 'configured' : 'missing',
        environment: process.env.NODE_ENV || 'development'
    });
};
