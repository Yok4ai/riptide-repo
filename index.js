const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { ytDownload } = require('yt-dlp');
const ffmpeg = require('fluent-ffmpeg');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Function to fetch video information from YouTube
const getVideoInfo = async (url) => {
    try {
        const info = await ytDownload(url, ['-j']);
        return {
            title: info.title,
            author: info.uploader,
            length: info.duration,
            views: info.view_count,
            description: info.description
        };
    } catch (error) {
        throw new Error('Failed to fetch video information');
    }
};

// Function to download video and audio streams from YouTube
const downloadVideo = async (url) => {
    const videoFile = 'video_only.mp4';
    const audioFile = 'audio_only.mp4';

    await ytDownload(url, ['-f', 'bestvideo[ext=mp4]', '-o', videoFile]);
    await ytDownload(url, ['-f', 'bestaudio[ext=mp4]', '-o', audioFile]);

    return { videoFile, audioFile };
};

// Function to merge video and audio files using ffmpeg
const mergeVideoAudio = (videoFile, audioFile, outputFile) => {
    return new Promise((resolve, reject) => {
        ffmpeg()
            .input(videoFile)
            .input(audioFile)
            .outputOptions('-c:v copy')
            .outputOptions('-c:a aac')
            .output(outputFile)
            .on('end', resolve)
            .on('error', reject)
            .run();
    });
};

// Endpoint to download and merge video from a YouTube URL
app.post('/download', async (req, res) => {
    const { url } = req.body;
    try {
        const info = await getVideoInfo(url);
        const { videoFile, audioFile } = await downloadVideo(url);
        const outputFile = `${info.title}.mp4`;

        await mergeVideoAudio(videoFile, audioFile, outputFile);

        // Remove intermediate files
        fs.unlinkSync(videoFile);
        fs.unlinkSync(audioFile);

        // Send the merged video file for download
        res.download(outputFile, (err) => {
            if (err) {
                console.error(err);
                res.status(500).json({ error: 'File download failed' });
            }
            // Remove the output file after sending
            fs.unlinkSync(outputFile);
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

// Endpoint for testing with a YouTube URL
app.get('/test-download', async (req, res) => {
    const { url } = req.query;
    try {
        const info = await getVideoInfo(url);
        const { videoFile, audioFile } = await downloadVideo(url);
        const outputFile = `${info.title}_test.mp4`;

        await mergeVideoAudio(videoFile, audioFile, outputFile);

        // Remove intermediate files
        fs.unlinkSync(videoFile);
        fs.unlinkSync(audioFile);

        res.status(200).json({ message: 'Download and merge successful', info, outputFile });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
