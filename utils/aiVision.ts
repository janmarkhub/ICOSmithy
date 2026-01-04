
import { GoogleGenAI, Type } from "@google/genai";
import { PersonBio, GeneratedPackItem } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getPackRecommendations(source: string): Promise<string[]> {
  const seed = Math.floor(Math.random() * 100000);
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Suggest 5 diverse sub-categories or specific entities related to "${source}" for an icon pack. Seed: ${seed}. Return as a JSON array of strings only.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });
  return JSON.parse(response.text || '[]');
}

export async function getSubThemes(parentTheme: string): Promise<string[]> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `The parent theme is "${parentTheme}". Provide 4 contrasting sub-themes for a desktop icon set. Return as a JSON array of 4 strings.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });
  return JSON.parse(response.text || '[]');
}

export async function getPersonProfile(name: string): Promise<PersonBio | null> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Provide a personality profile for "${name}" (could be fictional or real). Focus on their "known for" (one sentence) and their likely desktop "vibe" (colors, aesthetic). If you cannot find information for this person, return NULL.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          knownFor: { type: Type.STRING },
          vibe: { type: Type.STRING },
          wallpaperColors: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["name", "knownFor", "vibe", "wallpaperColors"]
      }
    }
  });
  const text = response.text;
  if (!text || text.toUpperCase().includes('NULL')) return null;
  return JSON.parse(text);
}

export async function generatePackPrompts(source: string, category: string, style: string): Promise<GeneratedPackItem[]> {
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `Generate 10 icon prompts for a desktop theme based on "${source}" with the specific focus of "${category}" in the style of "${style}". 
    The 10 icons must correspond to: 
    1. Recycle Bin Empty, 2. Recycle Bin Full, 3. Start Button Idle, 4. My PC, 5. Control Panel, 6. Network, 7. Account, 8. Folder, 9. Themed Asset A, 10. Themed Asset B.
    Each prompt should be a specific description for an image generation model. Return as a JSON array of objects with 'label' and 'prompt'.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            label: { type: Type.STRING },
            prompt: { type: Type.STRING }
          },
          required: ["label", "prompt"]
        }
      }
    }
  });
  return JSON.parse(response.text || '[]');
}

export async function generateIconImage(prompt: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { text: `Create a single high-quality app icon for: ${prompt}. Solid background color (will be removed later). Professional, clean design, centered.` }
      ]
    },
    config: { imageConfig: { aspectRatio: "1:1" } }
  });

  for (const part of response.candidates?.[0].content.parts || []) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  throw new Error("Icon image generation failed");
}

export async function generateStickerAI(type: string, userPrompt: string, base64Ref?: string): Promise<string> {
  const instruction = `Create a stylized sticker for ${userPrompt}. Type: ${type}. High contrast, bold colors, white thick border, gaming/pop-art aesthetic. Transparent background.`;
  const contents: any = { parts: [{ text: instruction }] };
  if (base64Ref) {
    contents.parts.push({ inlineData: { mimeType: 'image/png', data: base64Ref } });
  }
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents,
    config: { imageConfig: { aspectRatio: "1:1" } }
  });
  for (const part of response.candidates?.[0].content.parts || []) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  throw new Error("Sticker generation failed");
}

export async function getEffectRecommendation(base64Image: string): Promise<string> {
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
