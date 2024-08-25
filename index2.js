const express = require('express');
const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.post('/download', (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).send('URL is required');
    }

    const ytDlpPath = path.join(__dirname, 'yt-dlp_linux');
    const outputPath = path.join(__dirname, 'downloads', '%(title)s.%(ext)s');
    
    console.log('Starting download...');

    execFile(ytDlpPath, [url, '-o', outputPath, '-f', 'mp4'], (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`);
            return res.status(500).send('Error downloading video');
        }
        if (stderr) {
            console.error(`Stderr: ${stderr}`);
        }

        console.log('Download complete. Processing file...');

        // Parse stdout to find the exact output file name
        const regex = /Destination: (.+)/;
        const match = stdout.match(regex);
        if (!match) {
            return res.status(500).send('Error parsing download output');
        }

        const outputFile = match[1];
        const fileName = path.basename(outputFile);

        res.download(outputFile, fileName, (err) => {
            if (err) {
                console.error(`Error sending file: ${err.message}`);
            }
            // Optional: Clean up the downloaded file after sending it
            fs.unlink(outputFile, (unlinkErr) => {
                if (unlinkErr) {
                    console.error(`Error deleting file: ${unlinkErr.message}`);
                }
            });
        });
    });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
