// Import required modules
import FormData from 'form-data';
import fetch from 'node-fetch';

// CORS headers for Vercel
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(req, res) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.status(200);
        Object.entries(corsHeaders).forEach(([key, value]) => {
            res.setHeader(key, value);
        });
        return res.end();
    }

    // Set CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
        res.setHeader(key, value);
    });

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

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
                return res.status(200).send(videoBuffer);
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
        return res.status(200).json({
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
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}
