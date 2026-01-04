import { GoogleGenAI, Type } from "@google/genai";

// AI vision utilities for background removal and content generation
export async function removeBackgroundAI(base64Image: string): Promise<string> {
  // Initialize Gemini client right before use to ensure latest API key is used
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        { inlineData: { mimeType: "image/jpeg", data: base64Image } },
        { text: "Output ONLY a high-precision mask (black and white) where the foreground subject is white and the background is black. Return the image as inlineData." }
      ]
    },
  });
  
  for (const part of response.candidates?.[0].content.parts || []) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  throw new Error("Failed to generate background mask");
}

export async function generateThemeSetSuggestions(base64Ref: string): Promise<any[]> {
  // Initialize Gemini client right before use to ensure latest API key is used
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        { inlineData: { mimeType: "image/png", data: base64Ref } },
        { text: "Analyze this icon's style. Suggest prompts for: Recycle Bin (Full/Empty), Control Panel, My PC, Network, and Chrome Browser. Return as JSON array: [{label, prompt}]." }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          suggestions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                label: { type: Type.STRING },
                prompt: { type: Type.STRING }
              }
            }
          }
        }
      }
    }
  });
  return JSON.parse(response.text || '{"suggestions":[]}').suggestions;
}

export async function generateStickerAI(type: string, userPrompt: string, base64Ref?: string): Promise<string> {
  // Initialize Gemini client right before use to ensure latest API key is used
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-2.5-flash-image';
  const instruction = `Create a stylized sticker for ${userPrompt}. Type: ${type}. High contrast, bold colors, white thick border, gaming/pop-art aesthetic. Transparent background.`;
  
  const contents: any = { parts: [{ text: instruction }] };
  if (base64Ref) {
    contents.parts.push({ inlineData: { mimeType: 'image/png', data: base64Ref } });
  }

  const response = await ai.models.generateContent({
    model,
    contents,
    config: { imageConfig: { aspectRatio: "1:1" } }
  });

  for (const part of response.candidates?.[0].content.parts || []) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  throw new Error("Sticker generation failed");
}

export async function getEffectRecommendation(base64Image: string): Promise<string> {
  // Initialize Gemini client right before use to ensure latest API key is used
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        { inlineData: { mimeType: "image/png", data: base64Image } },
        { text: "Recommend 3 specific Mosh Workbench effects for this image to make it look epic. Be creative." }
      ]
    }
  });
  return response.text || "Try adding RGB split and a thick white outline!";
}