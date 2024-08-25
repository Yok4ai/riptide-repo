// const express = require('express');
// const { execFile } = require('child_process');
// const path = require('path');
// const fs = require('fs');
// const cors = require('cors');

// const app = express();
// const port = 3000;

// app.use(cors());
// app.use(express.json());

// app.post('/download', (req, res) => {
//     const { url } = req.body;

//     if (!url) {
//         return res.status(400).send('URL is required');
//     }

//     const ytDlpPath = path.join(__dirname, 'yt-dlp_linux');
//     const outputPath = path.join(__dirname, 'downloads', '%(title)s.%(ext)s');
    
//     console.log('Starting download...');

//     execFile(ytDlpPath, [url, '-o', outputPath, '-f', 'mp4'], (error, stdout, stderr) => {
//         if (error) {
//             console.error(`Error: ${error.message}`);
//             return res.status(500).send('Error downloading video');
//         }
//         if (stderr) {
//             console.error(`Stderr: ${stderr}`);
//         }

//         console.log('Download complete. Processing file...');

//         // Parse stdout to find the exact output file name
//         const regex = /Destination: (.+)/;
//         const match = stdout.match(regex);
//         if (!match) {
//             return res.status(500).send('Error parsing download output');
//         }

//         const outputFile = match[1];
//         const fileName = path.basename(outputFile);

//         res.download(outputFile, fileName, (err) => {
//             if (err) {
//                 console.error(`Error sending file: ${err.message}`);
//             }
//             // Optional: Clean up the downloaded file after sending it
//             fs.unlink(outputFile, (unlinkErr) => {
//                 if (unlinkErr) {
//                     console.error(`Error deleting file: ${unlinkErr.message}`);
//                 }
//             });
//         });
//     });
// });

// app.listen(port, () => {
//     console.log(`Server is running on port ${port}`);
// });


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
        console.error('Error: No URL provided in the request');
        return res.status(400).send('URL is required');
    }


    // Replace 'https://youtube.com' and 'https://www.youtube.com' with 'https://yewtu.be' while preserving the rest of the URL
    const youtubeUrlPattern = /^https:\/\/(www\.)?youtube\.com(\/.*)?$/;
    if (youtubeUrlPattern.test(url)) {
        url = url.replace(/^https:\/\/(www\.)?youtube\.com/, 'https://yewtu.be');
    }

    const ytDlpPath = path.join(__dirname, 'yt-dlp_linux');
    const outputPath = path.join(__dirname, 'downloads', '%(title)s.%(ext)s');

    console.log(`Starting download for URL: ${url}`);
    console.log(`yt-dlp executable path: ${ytDlpPath}`);
    console.log(`Output path: ${outputPath}`);

    execFile(ytDlpPath, [url, '-o', outputPath, '-f', 'mp4', '--user-agent',
         'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'],
          (error, stdout, stderr) => {

        if (error) {
            console.error(`Error during execFile: ${error.message}`);
            console.error(`Stderr output: ${stderr}`);
            return res.status(500).send(`Error downloading video: ${error.message}`);
        }

        if (stderr) {
            console.error(`Stderr output: ${stderr}`);
        }

        console.log(`Stdout output:\n${stdout}`);

        console.log('Download complete. Processing file...');

        // Parse stdout to find the exact output file name
        const regex = /Destination: (.+)/;
        const match = stdout.match(regex);
        if (!match) {
            console.error('Error: Unable to parse the output file name from stdout');
            return res.status(500).send('Error parsing download output');
        }

        const outputFile = match[1];
        const fileName = path.basename(outputFile);

        console.log(`Parsed output file: ${outputFile}`);
        console.log(`Sending file: ${fileName} to client`);

        res.download(outputFile, fileName, (err) => {
            if (err) {
                console.error(`Error sending file to client: ${err.message}`);
            } else {
                console.log(`File sent successfully: ${fileName}`);
            }

            // Optional: Clean up the downloaded file after sending it
            fs.unlink(outputFile, (unlinkErr) => {
                if (unlinkErr) {
                    console.error(`Error deleting file: ${unlinkErr.message}`);
                } else {
                    console.log(`File deleted successfully: ${outputFile}`);
                }
            });
        });
    });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
