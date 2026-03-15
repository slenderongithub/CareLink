require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));

if (!process.env.GEMINI_API_KEY) {
  console.warn('GEMINI_API_KEY is not set. Chat endpoints will fail until it is configured.');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

const SYSTEM_PROMPT = `You are CareLink AI, a friendly and empathetic health assistant for elderly users and their caregivers.

Guidelines:
- Use simple, warm language. Avoid medical jargon.
- Keep responses concise (2-4 short paragraphs max).
- If asked about medications, remind users to consult their doctor before changes.
- Encourage healthy habits: walking, hydration, sleep, social connection.
- For emergency keywords (fall, chest pain, stroke, bleeding), always advise calling emergency services immediately.
- Never diagnose conditions. Always suggest consulting a healthcare professional.
- Be encouraging about their care score and daily progress.
- Use emojis sparingly to keep a friendly tone.`;

app.post('/chat', async (req, res) => {
  try {
    const { message, healthContext } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    let contextStr = '';
    if (healthContext && typeof healthContext === 'object') {
      contextStr = `\n\n[User's Health Context Today]\n- Steps: ${healthContext.steps ?? 'N/A'}\n- Medications taken: ${healthContext.medicationsTaken ?? 'N/A'}/${healthContext.medicationsTotal ?? 'N/A'}\n- Heart rate: ${healthContext.heartRate ?? 'N/A'} bpm\n- Care score: ${healthContext.careScore ?? 'N/A'}%\n`;
    }

    const fullPrompt = `${SYSTEM_PROMPT}${contextStr}\n\nUser: ${message}`;

    const result = await model.generateContent(fullPrompt);
    const text = result.response.text();

    return res.json({ reply: text });
  } catch (error) {
    console.error('Gemini API error:', error);
    return res.status(500).json({
      error: 'Failed to generate response',
      details: error.message,
    });
  }
});

app.post('/transcribe', async (req, res) => {
  try {
    const { audioBase64, mimeType } = req.body;

    if (!audioBase64 || typeof audioBase64 !== 'string') {
      return res.status(400).json({ error: 'audioBase64 is required' });
    }

    const safeMimeType = typeof mimeType === 'string' && mimeType ? mimeType : 'audio/m4a';

    const result = await model.generateContent([
      {
        text: 'Transcribe this audio clearly into plain text. Return only the transcript.',
      },
      {
        inlineData: {
          mimeType: safeMimeType,
          data: audioBase64,
        },
      },
    ]);

    const transcript = result.response.text().trim();
    return res.json({ transcript });
  } catch (error) {
    console.error('Gemini transcription error:', error);
    return res.status(500).json({
      error: 'Failed to transcribe audio',
      details: error.message,
    });
  }
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', model: 'gemini-1.5-flash' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`CareLink backend running on http://0.0.0.0:${PORT}`);
});
