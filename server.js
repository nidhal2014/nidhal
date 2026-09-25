const express = require('express');
const cors = require('cors');
const ytdl = require('@distube/ytdl-core');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/video', async (req, res) => {
    try {
        const videoUrl = req.query.url;
        if (!videoUrl) return res.status(400).send('رابط الفيديو مطلوب');

        const info = await ytdl.getInfo(videoUrl);
        const format = info.formats.find(f => f.qualityLabel === '144p' && f.hasVideo && f.hasAudio) 
                    || info.formats.find(f => f.hasVideo && f.hasAudio);

        res.json({
            title: info.videoDetails.title,
            streamUrl: format ? format.url : null
        });
    } catch (error) {
        res.status(500).json({ error: 'فشل جلب الفيديو' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));