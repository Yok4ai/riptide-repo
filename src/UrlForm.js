import React, { useState } from 'react';
import './UrlForm.css'; // Import CSS for styling

const UrlForm = () => {
    const [url, setUrl] = useState('');
    const [error, setError] = useState('');
    const [downloading, setDownloading] = useState(false); // Track download state

    const handleSubmit = async (e) => {
        e.preventDefault();
        setDownloading(true); // Start downloading

        try {
            const response = await fetch('http://localhost:5000/download', { // Replace with your Flask backend URL
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url }),
            });

            if (!response.ok) {
                throw new Error('Failed to fetch video');
            }

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = 'video.mp4';
            document.body.appendChild(a);
            a.click();
            a.remove();

            // Clear input field and error
            setUrl('');
            setError('');
        } catch (error) {
            console.error('Error downloading video:', error);
            setError('Failed to fetch video');
        } finally {
            setDownloading(false); // Stop downloading
        }
    };

    return (
        <div className="url-form-container">
            <form onSubmit={handleSubmit} className="centered-form">
                <input
                    type="text"
                    placeholder="Enter URL"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="url-input"
                />
                <button type="submit" className="submit-button">Fetch Data</button>
                {error && <p className="error-message">{error}</p>}
                {downloading && <div className="downloading-indicator"></div>}
            </form>
        </div>
    );
};

export default UrlForm;
