const express = require('express');
const { execFile } = require('child_process');
const path = require('path');

const app = express();
const port = 3000;

app.use(express.json());

// Endpoint to download a YouTube video
app.post('/download', (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).send('URL is required');
    }

    const ytDlpPath = path.join(__dirname, 'yt-dlp_linux');
    const outputPath = path.join(__dirname, 'downloads', '%(title)s.%(ext)s');

    execFile(ytDlpPath, [url, '-o', outputPath], (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`);
            return res.status(500).send('Error downloading video');
        }
        if (stderr) {
            console.error(`Stderr: ${stderr}`);
        }
        console.log(`Stdout: ${stdout}`);
        res.send('Video downloaded successfully');
    });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

