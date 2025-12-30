import { GoogleGenAI, Modality } from "@google/genai";
import { Mood } from "../types";

// NOTE: In a real production app, ensure this is handled securely via backend proxy if possible,
// or strictly env vars. For this demo, we assume process.env.API_KEY is available.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
Eres "Calma", un compañero de apoyo emocional empático, cálido y seguro. 
TU OBJETIVO: Proveer contención, escucha activa y sugerir herramientas de regulación emocional (respiración, grounding).
REGLAS ESTRICTAS:
1. NO diagnostiques enfermedades mentales ni condiciones médicas.
2. NO juzgues.
3. Si el usuario menciona autolesión o suicidio, responde con empatía PERO sugiere inmediatamente buscar ayuda profesional o llamar a servicios de emergencia.
4. Mantén respuestas cortas, suaves y fáciles de leer (máximo 2-3 párrafos).
5. Usa un tono calmado, amable y validador.
`;

export const getChatResponse = async (history: { role: string; parts: { text: string }[] }[], message: string): Promise<string> => {
  try {
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7, // Slightly creative but balanced for safety
      },
      history: history
    });

    const result = await chat.sendMessage({ message });
    return result.text || "Lo siento, estoy teniendo problemas para conectar. Pero estoy aquí contigo.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Hubo un error de conexión. Intenta respirar profundo mientras reconecto.";
  }
};

export const getDailyTip = async (mood: Mood): Promise<string> => {
  try {
    const prompt = `El usuario se siente "${mood}". Dame un consejo de bienestar muy breve (1 frase) y gentil. Sin imperativos fuertes.`;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Recuerda ser amable contigo mismo hoy.";
  } catch (error) {
    return "Tómate un momento para respirar.";
  }
};

export const getVoiceGuidance = async (text: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' }, // 'Kore' is usually calm and deep.
            },
        },
      },
    });
    
    // Return base64 string
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
};