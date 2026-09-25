const express = require('express');
const cors = require('cors');
const yts = require('yt-search'); // مكتبة البحث الخاصة بك المضمونة 100%
const axios = require('axios');
const https = require('https');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Server is active');
});

// 1. مسار البحث (يعمل بشكل ممتاز بدون أي مشاكل)
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

// 2. مسار التشغيل الفائق (جلب الرابط بـ 12+ طريقة وسيرفر مختلف)
app.get('/video', async (req, res) => {
    const id = req.query.id;
    if (!id) return res.status(400).send('معرف الفيديو مطلوب');

    // قائمة شاملة لأقوى سيرفرات Piped و Invidious حول العالم
    const providers = [
        // سيرفرات Piped APIs
        { type: 'piped', url: `https://pipedapi.kavin.rocks/streams/${id}` },
        { type: 'piped', url: `https://api.piped.privacydev.net/streams/${id}` },
        { type: 'piped', url: `https://pipedapi.tokhmi.xyz/streams/${id}` },
        { type: 'piped', url: `https://pipedapi.moomoo.me/streams/${id}` },
        { type: 'piped', url: `https://pipedapi.synclick.org/streams/${id}` },
        
        // سيرفرات Invidious APIs
        { type: 'invidious', url: `https://inv.nadeko.net/api/v1/videos/${id}` },
        { type: 'invidious', url: `https://invidious.nerdvpn.de/api/v1/videos/${id}` },
        { type: 'invidious', url: `https://yt.drgnz.club/api/v1/videos/${id}` },
        { type: 'invidious', url: `https://invidious.flokinet.to/api/v1/videos/${id}` },
        { type: 'invidious', url: `https://invidious.privacydev.net/api/v1/videos/${id}` },
        { type: 'invidious', url: `https://iv.melmac.space/api/v1/videos/${id}` },
        { type: 'invidious', url: `https://invidious.projectsegfau.lt/api/v1/videos/${id}` }
    ];

    let streamUrl = null;
    let title = '';

    // الحلقة التكرارية: تجريب كل سيرفر حتى ينجح واحد منها
    for (let provider of providers) {
        try {
            const response = await axios.get(provider.url, { timeout: 3500 });
            
            if (provider.type === 'piped' && response.data && response.data.videoStreams) {
                const videoData = response.data;
                title = videoData.title || '';
                
                // اختيار بدقة 144p أو أضعف دقة متاحة
                const stream144 = videoData.videoStreams.find(s => s.quality === '144p' || s.quality === '240p');
                streamUrl = stream144 ? stream144.url : videoData.videoStreams[0].url;

                if (streamUrl) break; // نجح التجريب! اخرج من الحلقة فوراً
            } 
            else if (provider.type === 'invidious' && response.data && response.data.formatStreams) {
                title = response.data.title || '';
                
                const format = response.data.formatStreams.find(f => f.quality === '144p' || f.qualityLabel === '144p') 
                            || response.data.formatStreams[0];

                if (format && format.url) {
                    streamUrl = format.url;
                    break; // نجح التجريب! اخرج من الحلقة فوراً
                }
            }
        } catch (e) {
            // السيرفر الحالي لم يستجب أو محجوب، ننتقل فوراً للسيرفر التالي
            continue;
        }
    }

    if (streamUrl) {
        res.json({ title: title, streamUrl: streamUrl });
    } else {
        res.status(500).json({ error: 'جميع المحاولات فشلت، جرب فيديو آخر' });
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
