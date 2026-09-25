const express = require('express');
const cors = require('cors');
const ytdl = require('@distube/ytdl-core');
const https = require('https');

const app = express();
app.use(cors());
app.use(express.json());

// مسار رئيسي خفيف للتحقق من أن السيرفر يعمل
app.get('/', (req, res) => {
    res.send('Server is active');
});

// مسار استخراج الفيديو بدقة 144p
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
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    
    // إرسال طلب ذاتي كل 10 دقائق لإبقاء Render نشطاً باستمرار
    const SERVER_URL = 'https://nidhal-q0ru.onrender.com';
    setInterval(() => {
        https.get(SERVER_URL, (res) => {
            console.log('Keep-alive ping sent successfully');
        }).on('error', (err) => {
            console.log('Ping failed:', err.message);
        });
    }, 10 * 60 * 1000); // كل 10 دقائق
});
