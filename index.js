const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Function to fetch video information from YouTube
const getVideoInfo = async (url) => {
    try {
        const info = await ytdl.getInfo(url);
        return {
            title: info.videoDetails.title,
            author: info.videoDetails.author.name,
            length: info.videoDetails.lengthSeconds,
            views: info.videoDetails.viewCount,
            description: info.videoDetails.description
        };
    } catch (error) {
        throw new Error('Failed to fetch video information');
    }
};

// Function to download video and audio streams from YouTube
const downloadVideo = async (url) => {
    const videoReadableStream = ytdl(url, { filter: 'videoandaudio', quality: 'highestvideo' });
    const audioReadableStream = ytdl(url, { filter: 'audioonly', quality: 'highestaudio' });

    const videoFile = 'video_only.mp4';
    const audioFile = 'audio_only.mp4';

    const videoWriteStream = fs.createWriteStream(videoFile);
    const audioWriteStream = fs.createWriteStream(audioFile);

    videoReadableStream.pipe(videoWriteStream);
    audioReadableStream.pipe(audioWriteStream);

    await new Promise((resolve, reject) => {
        videoWriteStream.on('finish', () => {
            audioWriteStream.end();
            resolve();
        });
        videoWriteStream.on('error', reject);
        audioWriteStream.on('error', reject);
    });

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
