import express, { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(express.json({ limit: '2mb' }));

// Helper to get or initialize Google Gen AI
function getGenAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'thinklog-ai-backend',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
    timestamp: new Date().toISOString(),
  });
});

// Credential verification endpoint for default credentials
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: 'Username dan password wajib diisi.' });
  }

  // Check designated credentials: ananabila / pakailogikamu86
  if (username.trim().toLowerCase() === 'ananabila' && password === 'pakailogikamu86') {
    return res.json({
      success: true,
      user: {
        uid: 'user_ananabila',
        username: 'ananabila',
        displayName: 'Ana Nabila',
        email: 'ana.farimatun.2302316@students.um.ac.id',
        role: 'Pro Member',
        authMethod: 'credentials',
        photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
      },
    });
  }

  return res.status(401).json({
    error: 'Kredensial tidak valid. Gunakan username "ananabila" dan password "pakailogikamu86".',
  });
});

// AI Summarization endpoint
app.post('/api/ai/summarize', async (req: Request, res: Response) => {
  try {
    const { title, content, style = 'comprehensive' } = req.body || {};

    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'Konten teks catatan wajib dikirimkan.' });
    }

    const ai = getGenAIClient();
    if (!ai) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY belum dikonfigurasi di server environment.',
      });
    }

    const prompt = `Anda adalah asisten cerdas Second Brain & Knowledge Synthesizer bernama ThinkLog AI.
Tugas Anda adalah merangkum catatan/ide berikut secara tajam, terstruktur, dan aplikatif dalam bahasa Indonesia yang profesional namun ramah.

Judul Catatan: ${title || 'Tanpa Judul'}
Gaya Rangkuman: ${style}

Isi Catatan:
"""
${content}
"""

Berikan output dengan format markdown yang jelas:
1. 💡 **Intisari Eksekutif** (2-3 kalimat)
2. 📌 **Poin Kunci & Wawasan Penting** (3-5 butir berbobot)
3. ⚡ **Rekomendasi Tindakan (Action Items)** (2-4 langkah konkret)
4. 🏷️ **Saran Tag Relevan**`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    const summaryText = response.text || 'Gagal menghasilkan rangkuman.';

    return res.json({
      success: true,
      summary: summaryText,
      modelUsed: 'gemini-3.8-flash',
      generatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error generating summary via Gemini API:', error);
    return res.status(500).json({
      error: error?.message || 'Terjadi kesalahan saat memproses permintaan AI.',
    });
  }
});

// AI Brainstorming & Idea Expansion endpoint
app.post('/api/ai/brainstorm', async (req: Request, res: Response) => {
  try {
    const { topic, category = 'General', context = '' } = req.body || {};

    if (!topic || typeof topic !== 'string') {
      return res.status(400).json({ error: 'Topik atau ide awal wajib diisi.' });
    }

    const ai = getGenAIClient();
    if (!ai) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY belum dikonfigurasi di server environment.',
      });
    }

    const prompt = `Anda adalah seorang Creative Strategist & Innovation Consultant di ThinkLog AI.
Pengguna ingin melakukan brainstorming dan inkubasi ide untuk:
Topik: "${topic}"
Kategori: "${category}"
Konteks Tambahan: "${context || 'Tidak ada'}"

Silakan sajikan eksplorasi ide dengan format:
1. 🚀 **Peluang & Sudut Pandang Unik (Unique Angles)**
2. 🧩 **Struktur Konseptual / Kerangka Kerja**
3. 🛠️ **Strategi Eksekusi Langkah Demi Langkah (MVP / Quick Wins)**
4. ⚠️ **Potensi Kendala & Solusi Mitigasi**
5. 🎯 **Pertanyaan Pemicu Refleksi Mendalam (Deep Dive Questions)**

Gunakan bahasa Indonesia yang inspiratif, tajam, dan mudah dieksekusi.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    return res.json({
      success: true,
      result: response.text || 'Gagal menghasilkan ide.',
      modelUsed: 'gemini-3.8-flash',
      generatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in brainstorming API:', error);
    return res.status(500).json({
      error: error?.message || 'Gagal melakukan brainstorming dengan Gemini AI.',
    });
  }
});

// AI Task Extraction from notes
app.post('/api/ai/extract-tasks', async (req: Request, res: Response) => {
  try {
    const { text } = req.body || {};

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Teks catatan wajib dikirimkan.' });
    }

    const ai = getGenAIClient();
    if (!ai) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY belum dikonfigurasi di server environment.',
      });
    }

    const prompt = `Dari teks catatan berikut, ekstraksi daftar tugas/action item yang konkret dan dapat segera dikerjakan.
Format output HANYA JSON array valid tanpa markdown formatting tambahan atau pembungkus kode:
[
  { "title": "Deskripsi tugas ringkas", "priority": "high" | "medium" | "low" }
]

Teks:
"""
${text}
"""`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    let cleaned = (response.text || '[]').trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    let tasks = [];
    try {
      tasks = JSON.parse(cleaned);
    } catch {
      tasks = [{ title: 'Tinjau catatan dan tentukan langkah prioritas', priority: 'medium' }];
    }

    return res.json({
      success: true,
      tasks,
      generatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error extracting tasks:', error);
    return res.status(500).json({
      error: error?.message || 'Gagal mengekstrak tugas dengan Gemini AI.',
    });
  }
});

// Fallback 404 for unknown API routes
app.use('/api/*', (_req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint API tidak ditemukan.' });
});

// Export default app WITHOUT app.listen (ready for Vercel and Vite dev server)
export default app;
