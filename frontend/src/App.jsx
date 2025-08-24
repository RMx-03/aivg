import { useState } from 'react';
import './App.css';

function App() {
    const [prompt, setPrompt] = useState('');
    const [videoUrl, setVideoUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setVideoUrl('');

        try {
            console.log('Making request to backend...');
            
            // Use relative URLs - works for both local Express and Vercel deployment
            const apiUrl = '/api/generate-video';
            
            console.log('API URL:', apiUrl);
            console.log('Current URL:', window.location.href);
            
            // First, test if API is reachable with health check
            try {
                const healthUrl = '/api/health';
                
                console.log('Testing API health at:', healthUrl);
                const healthResponse = await fetch(healthUrl);
                if (healthResponse.ok) {
                    const healthData = await healthResponse.json();
                    console.log('API Health Check:', healthData);
                } else {
                    console.warn('Health check failed:', healthResponse.status);
                }
            } catch (healthError) {
                console.warn('Health check error:', healthError.message);
            }
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt }),
            });

            console.log('Response received:', response.status, response.statusText);

            if (!response.ok) {
                let errorMsg = 'Failed to generate content';
                try {
                    const err = await response.json();
                    console.log('Error response:', err);
                    errorMsg = err.error || err.details || errorMsg;
                    
                    // Special handling for 404
                    if (response.status === 404) {
                        errorMsg = 'API endpoint not found. Please check if the serverless functions are deployed correctly.';
                    }
                } catch {
                    errorMsg = `Server error: ${response.status} ${response.statusText}`;
                }
                throw new Error(errorMsg);
            }

            const contentType = response.headers.get('content-type');
            console.log('Content-Type:', contentType);
            
            if (contentType && contentType.includes('video/')) {
                // Handle video blob response - this is the AI-generated video!
                console.log('Received video blob from Stability AI');
                const videoBlob = await response.blob();
                const url = URL.createObjectURL(videoBlob);
                console.log('Created video URL:', url);
                setVideoUrl(url);
                setError('✅ AI video generated successfully!');
            } else if (contentType && contentType.includes('application/json')) {
                // Handle JSON response - might be image data if video failed
                const data = await response.json();
                console.log('Received JSON response:', data);
                
                if (data.imageData && data.type === 'image') {
                    // We got an AI-generated image instead of video
                    setVideoUrl(data.imageData);
                    setError(`✅ ${data.message} - ${data.note}`);
                } else {
                    throw new Error(data.error || 'Unexpected response format');
                }
            } else {
                throw new Error('Expected video or image response but received: ' + contentType);
            }

        } catch (err) {
            console.error('Error:', err);
            setError(`❌ ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="App">
            <header className="App-header">
                <h1>AI Video Generator</h1>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Enter a prompt to generate a video"
                        required
                    />
                    <button type="submit" disabled={loading}>
                        {loading ? 'Generating...' : 'Generate'}
                    </button>
                </form>
                {error && <p className="error">{error}</p>}
                {videoUrl && (
                    <div className="video-container">
                        {videoUrl.startsWith('data:image/') ? (
                            // Display AI-generated image
                            <img 
                                src={videoUrl} 
                                alt="AI Generated Content"
                                style={{maxWidth: '100%', height: 'auto'}}
                                onError={(e) => {
                                    console.error('Image load error:', e);
                                    setError('❌ Failed to load the AI-generated image');
                                    setVideoUrl('');
                                }}
                                onLoad={() => {
                                    console.log('AI image loaded successfully');
                                }}
                            />
                        ) : (
                            // Display AI-generated video
                            <video 
                                src={videoUrl} 
                                controls 
                                autoPlay 
                                loop 
                                onError={(e) => {
                                    console.error('Video load error:', e);
                                    setError('❌ Failed to load the AI-generated video');
                                    setVideoUrl('');
                                }}
                                onLoadStart={() => console.log('AI video started loading...')}
                                onCanPlay={() => {
                                    console.log('AI video ready to play');
                                    setError('✅ AI video loaded successfully!');
                                }}
                            />
                        )}
                    </div>
                )}
            </header>
        </div>
    );
}

export default App;