const express = require('express');
const cors = require('cors');
const yts = require('yt-search'); // مكتبة البحث كما هي بدون تغيير
const axios = require('axios');
const https = require('https');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Server is active');
});

// 1. مسار البحث (بقي كما هو تماماً ليعمل بنفس الكفاءة)
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

// 2. مسار التشغيل الجديد (يجلب رابط 144p المباشر بالـ id)
app.get('/video', async (req, res) => {
    try {
        const id = req.query.id;
        if (!id) return res.status(400).send('معرف الفيديو مطلوب');

        const instances = [
            'https://inv.nadeko.net',
            'https://invidious.nerdvpn.de',
            'https://yt.drgnz.club'
        ];

        let streamUrl = null;
        let title = '';

        for (let inst of instances) {
            try {
                const response = await axios.get(`${inst}/api/v1/videos/${id}`, { timeout: 4000 });
                title = response.data.title;
                
                const format = response.data.formatStreams.find(f => f.quality === '144p' || f.qualityLabel === '144p') 
                            || response.data.formatStreams[0];

                if (format && format.url) {
                    streamUrl = format.url;
                    break;
                }
            } catch (e) {
                continue;
            }
        }

        if (streamUrl) {
            res.json({ title: title, streamUrl: streamUrl });
        } else {
            res.status(500).json({ error: 'تعذر جلب رابط الفيديو' });
        }
    } catch (error) {
        res.status(500).json({ error: 'خطأ في الاتصال' });
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
