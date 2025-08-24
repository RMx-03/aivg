# AI Video Generation Web App

A full-stack web application that generates AI videos from text prompts using the Stability AI API. Built with React frontend and Node.js serverless functions, deployable on Vercel.

## Features

- 🎬 **Real AI Video Generation**: Text-to-Video using Stability AI
- 🖼️ **AI Image Fallback**: High-quality images when video generation isn't available
- ⚡ **Serverless Architecture**: Fast, scalable deployment on Vercel
- 🎨 **Clean React UI**: Responsive design with loading states
- 🔐 **Secure API Keys**: Environment variable configuration

## Project Structure

```
├── api/                    # Vercel serverless functions
│   ├── generate-video.js   # Main AI video generation endpoint
│   └── health.js          # Health check endpoint
├── frontend/              # React application
│   ├── src/
│   │   ├── App.jsx        # Main React component
│   │   ├── App.css        # Styling
│   │   └── main.jsx       # React entry point
│   ├── package.json       # Frontend dependencies
│   └── vite.config.js     # Vite configuration
├── vercel.json            # Vercel deployment configuration
├── package.json           # Root package.json for API dependencies
└── README.md              # This file
```

## Local Development

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Stability AI API key

### Setup

1. **Clone and install dependencies:**
   ```bash
   # Install root dependencies (for API)
   npm install
   
   # Install frontend dependencies
   cd frontend
   npm install
   cd ..
   ```

2. **Create environment file:**
   ```bash
   # Create .env file in root directory
   echo "STABILITY_API_KEY=your_stability_ai_api_key_here" > .env
   ```

3. **Run development server:**
   ```bash
   # Install Vercel CLI
   npm install -g vercel
   
   # Run full-stack development
   vercel dev
   ```
   
   This will start both the frontend and API functions locally, simulating the Vercel environment.

## Deployment to Vercel

### 1. Prepare for Deployment

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

### 2. Deploy with Vercel

1. **Go to [vercel.com](https://vercel.com)** and sign in
2. **Click "New Project"**
3. **Import your GitHub repository**
4. **Configure project:**
   - Framework Preset: `Other`
   - Root Directory: `./` (leave empty)
   - Build Command: `cd frontend && npm run build`
   - Output Directory: `frontend/dist`

### 3. Set Environment Variables

In Vercel dashboard:
1. Go to **Settings** → **Environment Variables**
2. Add:
   - Name: `STABILITY_API_KEY`
   - Value: Your Stability AI API key
   - Environment: All (Production, Preview, Development)

### 4. Deploy

Click **Deploy** and Vercel will:
- Build your frontend
- Deploy serverless functions
- Provide a live URL

## API Endpoints

### POST /api/generate-video
Generates a video from a text prompt.

**Request:**
```json
{
  "prompt": "a beautiful sunset over mountains"
}
```

**Response (Video):**
- Content-Type: `video/mp4`
- Binary video data

**Response (Image fallback):**
```json
{
  "success": true,
  "message": "AI image generated for: \"prompt\"",
  "imageData": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "note": "Video generation API not available - showing generated image",
  "type": "image"
}
```

### GET /api/health
Health check endpoint.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2025-08-23T20:30:00.000Z",
  "message": "AI Video Generation API is running on Vercel"
}
```

## How It Works

1. **User Input**: Enter a text prompt describing the desired video
2. **Step 1**: Generate high-quality image from prompt using Stability AI SDXL
3. **Step 2**: Convert image to video using Stability AI Video Diffusion
4. **Fallback**: If video generation fails, display the AI-generated image
5. **Display**: Show the result in the browser with video controls

## Technology Stack

- **Frontend**: React 19, Vite, CSS3
- **Backend**: Node.js Serverless Functions
- **AI**: Stability AI (SDXL + Video Diffusion)
- **Deployment**: Vercel
- **Environment**: dotenv for configuration

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| STABILITY_API_KEY | Your Stability AI API key | Yes |

## Troubleshooting

### Common Issues

1. **API Key Errors**: Verify your Stability AI API key is valid and has sufficient credits
2. **CORS Errors**: Ensure you're using the correct API URLs for your environment
3. **Build Errors**: Check that all dependencies are installed correctly
4. **Video Generation Fails**: The app will fallback to showing AI-generated images

### Development Tips

1. **Use Vercel CLI**: `vercel dev` provides the most accurate local development environment
2. **Check Logs**: Use `vercel logs` to debug production issues
3. **Environment Variables**: Use `vercel env pull` to sync environment variables locally

## Demo

Try these example prompts:
- "a serene lake surrounded by mountains at golden hour"
- "a bustling city street at night with neon lights"
- "a peaceful forest with sunlight filtering through trees"
- "ocean waves crashing on a rocky shore during sunset"

## Current Project Structure (For Vercel)

**✅ Keep these files/folders:**
- `/api/` - Serverless functions (replaces Express server)
- `/frontend/` - React application
- `vercel.json` - Deployment configuration
- `package.json` (root) - API dependencies
- `.env` - Environment variables

**🗑️ Can be removed:**
- `/backend/` folder - No longer needed (replaced by `/api/`)

The old Express server in `/backend` has been converted to Vercel serverless functions in `/api/`.
