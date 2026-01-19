
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateQuizQuestion = async () => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [{ text: "Generate a fun, random trivia question about technology, science, or history. Return JSON." }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            answer: { type: Type.STRING, description: "The correct option string" },
          },
          required: ["question", "options", "answer"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Quiz Error", error);
    // Fallback
    return {
      question: "What is the powerhouse of the cell?",
      options: ["Nucleus", "Mitochondria", "Ribosome", "Golgi"],
      answer: "Mitochondria"
    };
  }
};

export const generateImageDescription = async (prompt: string) => {
    // Since we can't easily generate real images and host them without a backend in this specific env, 
    // we will use Gemini to "Describe" an image that *would* be generated, 
    // and then use a keyword search on Unsplash/Picsum to mimic it, OR use the real Image model if allowed.
    // The instructions allow `gemini-2.5-flash-image`. Let's try to get base64.
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: prompt }]
            },
            config: {
                imageConfig: {
                    aspectRatio: "1:1",
                    // imageSize is only supported for gemini-3-pro-image-preview
                }
            }
        });
        
        // Extract image
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
        return null;
    } catch (e) {
        console.error("Image Gen Error", e);
        return null;
    }
}

export const generateSubtasks = async (task: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [{ text: `Break down the task "${task}" into 3 to 5 smaller, actionable subtasks.` }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subtasks: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });
    return JSON.parse(response.text || '{"subtasks": []}').subtasks;
  } catch (error) {
    console.error("Subtask Error", error);
    return [];
  }
};

export const performWebSearch = async (query: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { parts: [{ text: query }] },
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const text = response.text || "No results found.";
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    // Extract valid URLs from chunks
    const sources = chunks
      .map((c: any) => c.web)
      .filter((w: any) => w && w.uri && w.title);

    return { text, sources };
  } catch (error) {
    console.error("Search Error", error);
    return { text: "I'm having trouble connecting to the search network.", sources: [] };
  }
};

export const chatWithGemini = async (history: {role: 'user' | 'model', text: string}[], message: string) => {
    try {
        const historyParts = history.map(h => ({ role: h.role, parts: [{ text: h.text }] }));
        const chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            history: historyParts,
            config: {
                systemInstruction: "You are a helpful, concise assistant embedded in a web OS simulator.",
            }
        });
        const result = await chat.sendMessage({ message });
        return result.text;
    } catch (e) {
        console.error("Chat Error", e);
        return "Sorry, I'm having trouble thinking right now.";
    }
}
