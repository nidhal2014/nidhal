const express = require('express');
const cors = require('cors');
const ytdl = require('@distube/ytdl-core');
const yts = require('yt-search');
const https = require('https');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Server is active');
});

// 1. مسار البحث عن الفيديوهات مع الصور المصغرة خفيفة الدقة
app.get('/search', async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) return res.status(400).json({ error: 'كلمة البحث مطلوبة' });

        const r = await yts(query);
        const videos = r.videos.slice(0, 10).map(v => ({
            title: v.title,
            url: v.url,
            timestamp: v.timestamp,
            author: v.author.name,
            // اختيار أصغر صورة مصغرة ممكّنة (hqdefault أو default) لتقليل حجم البيانات
            thumbnail: v.thumbnail || `https://i.ytimg.com/vi/${v.videoId}/default.jpg`
        }));

        res.json(videos);
    } catch (error) {
        res.status(500).json({ error: 'فشل البحث' });
    }
});

// 2. مسار جلب رابط الفيديو بدقة 144p مع تحسين الاتصال
app.get('/video', async (req, res) => {
    try {
        const videoUrl = req.query.url;
        if (!videoUrl) return res.status(400).send('رابط الفيديو مطلوب');

        // خيارات لتفادي حجب يوتيوب
        const info = await ytdl.getInfo(videoUrl, {
            requestOptions: {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
                }
            }
        });

        // البحث عن دقة 144p أو 240p تحتوي على صوت وفيديو معا
        let format = info.formats.find(f => f.qualityLabel === '144p' && f.hasVideo && f.hasAudio);
        if (!format) {
            format = info.formats.find(f => f.qualityLabel === '240p' && f.hasVideo && f.hasAudio);
        }
        if (!format) {
            format = info.formats.find(f => f.hasVideo && f.hasAudio);
        }

        res.json({
            title: info.videoDetails.title,
            streamUrl: format ? format.url : null
        });
    } catch (error) {
        console.error('Error fetching video:', error.message);
        res.status(500).json({ error: 'فشل جلب الفيديو' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    
    // إرسال تنبيه ذاتي كل 10 دقائق لإبقاء السيرفر نشطاً
    const SERVER_URL = 'https://nidhal-q0ru.onrender.com';
    setInterval(() => {
        https.get(SERVER_URL, () => {}).on('error', () => {});
    }, 10 * 60 * 1000);
});
