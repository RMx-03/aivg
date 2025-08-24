const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from frontend dist
app.use(express.static(path.join(__dirname, 'frontend/dist')));

// Import the API functions and adapt them for Express
async function generateVideo(req, res) {
    const { prompt } = req.body;
    console.log(`Received request with prompt: "${prompt}"`);

    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    // Check if API key exists
    if (!process.env.STABILITY_API_KEY) {
        console.error('STABILITY_API_KEY not found in environment');
        return res.status(500).json({ 
            error: 'API key not configured',
            details: 'STABILITY_API_KEY environment variable is missing'
        });
    }

    try {
        console.log(`Attempting to generate content with Stability AI for prompt: "${prompt}"`);
        
        // Dynamically import modules
        const FormData = (await import('form-data')).default;
        const fetch = (await import('node-fetch')).default;
        
        // Step 1: Generate image from text prompt using SDXL
        console.log('Step 1: Generating image from text prompt...');
        const imageRequestBody = {
            text_prompts: [
                {
                    text: prompt,
                    weight: 1
                }
            ],
            cfg_scale: 7,
            height: 1024,
            width: 1024,
            samples: 1,
            steps: 30
        };
        
        const imageResponse = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.STABILITY_API_KEY}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(imageRequestBody)
        });

        if (!imageResponse.ok) {
            const errorText = await imageResponse.text();
            console.error('Stability AI Image API Error:', imageResponse.status, errorText);
            return res.status(500).json({ 
                error: `Failed to generate image: ${imageResponse.status}`,
                details: errorText,
                type: 'api_error'
            });
        }

        const imageData = await imageResponse.json();
        console.log('Image generation successful!');
        
        if (!imageData.artifacts || imageData.artifacts.length === 0) {
            return res.status(500).json({ 
                error: 'No image generated from prompt',
                details: 'Image generation returned empty response'
            });
        }

        // Get the base64 image data
        const imageBase64 = imageData.artifacts[0].base64;
        const imageDataUrl = `data:image/png;base64,${imageBase64}`;
        
        // Step 2: Try to convert the generated image to video
        console.log('Step 2: Attempting video generation...');
        
        try {
            const videoFormData = new FormData();
            const imageBuffer = Buffer.from(imageBase64, 'base64');
            videoFormData.append('image', imageBuffer, {
                filename: 'generated-image.png',
                contentType: 'image/png'
            });
            videoFormData.append('cfg_scale', '1.8');
            videoFormData.append('motion_bucket_id', '127');
            videoFormData.append('seed', '0');

            const videoResponse = await fetch('https://api.stability.ai/v2beta/image-to-video', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.STABILITY_API_KEY}`,
                    'Accept': 'video/*',
                    ...videoFormData.getHeaders()
                },
                body: videoFormData
            });

            if (videoResponse.ok) {
                // Successfully generated video!
                console.log('Video generation successful! Sending video data...');
                const videoBuffer = await videoResponse.buffer();
                
                res.setHeader('Content-Type', 'video/mp4');
                res.setHeader('Content-Length', videoBuffer.length);
                return res.send(videoBuffer);
            } else {
                // Video generation failed, but we have the image
                const videoError = await videoResponse.text();
                console.log('Video generation failed, falling back to image:', videoError);
            }
        } catch (videoError) {
            console.log('Video generation error, falling back to image:', videoError.message);
        }
        
        // Return the AI-generated image since video generation failed
        console.log('Returning AI-generated image...');
        return res.json({
            success: true,
            message: `AI image generated for: "${prompt}"`,
            imageData: imageDataUrl,
            note: 'Video generation not available - showing AI-generated image',
            type: 'image'
        });

    } catch (error) {
        console.error('Error in content generation:', error);
        return res.status(500).json({ 
            error: 'Internal Server Error',
            details: error.message
        });
    }
}

function healthCheck(req, res) {
    const hasApiKey = !!process.env.STABILITY_API_KEY;
    console.log('Health check accessed, API key configured:', hasApiKey);
    
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        message: 'AI Video Generation API is running',
        apiKey: hasApiKey ? 'configured' : 'missing',
        environment: process.env.NODE_ENV || 'development'
    });
}

// API Routes
app.post('/api/generate-video', generateVideo);
app.get('/api/health', healthCheck);
app.get('/api/test', (req, res) => {
    res.json({
        message: 'Test endpoint working!',
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.url,
        hasStabilityKey: !!process.env.STABILITY_API_KEY
    });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/dist/index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
    console.log(`🎬 AI Generation: http://localhost:${PORT}/api/generate-video`);
    console.log(`🎨 Frontend: http://localhost:${PORT}`);
});
