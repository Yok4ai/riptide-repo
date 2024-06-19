const express = require('express');
const cors = require('cors');
const { exec } = require('youtube-dl-exec');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const getVideoInfo = async (url) => {
    const info = await exec(url, {
        dumpSingleJson: true,
        noCheckCertificate: true,
        noWarnings: true,
        preferFreeFormats: true
    });

    return {
        title: info.title,
        author: info.uploader,
        length: info.duration,
        views: info.view_count,
        description: info.description
    };
};

const downloadVideo = async (url) => {
    const videoFile = 'video_only.mp4';
    const audioFile = 'audio_only.mp4';

    await exec(url, {
        output: videoFile,
        format: 'bestvideo[ext=mp4]'
    });

    await exec(url, {
        output: audioFile,
        format: 'bestaudio[ext=mp4]'
    });

    return { videoFile, audioFile };
};

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

app.post('/download', async (req, res) => {
    const { url } = req.body;
    try {
        const info = await getVideoInfo(url);
        const { videoFile, audioFile } = await downloadVideo(url);
        const outputFile = 'final_output.mp4';

        await mergeVideoAudio(videoFile, audioFile, outputFile);

        // Remove intermediate files
        fs.unlinkSync(videoFile);
        fs.unlinkSync(audioFile);

        res.download(outputFile, `${info.title}.mp4`, (err) => {
            if (err) {
                console.error(err);
                res.status(500).json({ error: 'File download failed' });
            }
            fs.unlinkSync(outputFile); // Remove the output file after sending
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

// Endpoint to manually test with a YouTube link
app.get('/test-download', async (req, res) => {
    const { url } = req.query; // Assuming you'll pass the YouTube URL as a query parameter
    try {
        const info = await getVideoInfo(url);
        const { videoFile, audioFile } = await downloadVideo(url);
        const outputFile = 'test_output.mp4';

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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
