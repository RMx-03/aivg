// This file helps Vercel understand the project structure
export default function handler(req, res) {
  res.status(200).json({ 
    message: 'AI Video Generation API',
    endpoints: {
      health: '/api/health',
      generate: '/api/generate-video',
      test: '/api/test'
    }
  });
}
