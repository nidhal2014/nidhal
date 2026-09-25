const express = require('express');
const cors = require('cors');
const yts = require('yt-search');
const axios = require('axios');
const https = require('https');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Server is active');
});

// 1. مسار البحث (يعمل بشكل ممتاز)
app.get('/search', async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) return res.status(400).json({ error: 'كلمة البحث مطلوبة' });

        const r = await yts(query);
        const videos = r.videos.slice(0, 10).map(v => ({
            title: v.title,
            videoId: v.videoId,
            timestamp: v.timestamp,
            author: v.author.name,
            thumbnail: `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`
        }));

        res.json(videos);
    } catch (error) {
        res.status(500).json({ error: 'فشل البحث' });
    }
});

// 2. مسار التشغيل باستخدام API جاهز ومستقر (Piped API)
app.get('/video', async (req, res) => {
    try {
        const id = req.query.id;
        if (!id) return res.status(400).send('معرف الفيديو مطلوب');

        // استخدام API جاهز لا يتأثر بالحظر
        const pipedUrl = `https://pipedapi.kavin.rocks/streams/${id}`;
        const response = await axios.get(pipedUrl, { timeout: 6000 });

        const videoData = response.data;
        const title = videoData.title || '';

        // البحث عن أفضل صيغة فيديو بدقة 144p أو أضعف دقة متاحة
        let streamUrl = null;
        if (videoData.videoStreams && videoData.videoStreams.length > 0) {
            const stream144 = videoData.videoStreams.find(s => s.quality === '144p' || s.quality === '240p');
            streamUrl = stream144 ? stream144.url : videoData.videoStreams[0].url;
        }

        if (streamUrl) {
            res.json({ title: title, streamUrl: streamUrl });
        } else {
            res.status(500).json({ error: 'تعذر العثور على رابط البث' });
        }
    } catch (error) {
        console.error("Video Fetch Error:", error.message);
        res.status(500).json({ error: 'خطأ في جلب بيانات الفيديو' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    
    // إبقاء السيرفر نشطاً
    setInterval(() => {
        https.get('https://nidhal-q0ru.onrender.com', () => {}).on('error', () => {});
    }, 10 * 60 * 1000);
});
