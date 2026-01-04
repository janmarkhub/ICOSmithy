
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

export async function generatePackPrompts(source: string, category: string, style: string): Promise<{ items: GeneratedPackItem[], masterPrompt: string }> {
  // Use Search Grounding to ensure lore/reality accuracy
  const groundingResponse = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Explain what the most iconic visual assets for "${source}" (${category}) look like in detail. Focus on shapes, specific colors, and key defining features used in the source material.`,
    config: {
      tools: [{googleSearch: {}}],
    },
  });
  
  const groundedContext = groundingResponse.text;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `We are creating a 10-icon desktop theme for "${source}" (${category}) in "${style}" style. 
    Context from research: ${groundedContext}
    
    The 10 icons are: 1. Recycle Bin Empty, 2. Recycle Bin Full, 3. Start Button, 4. My PC, 5. Control Panel, 6. Network, 7. Account, 8. Folder, 9. Primary Theme Asset, 10. Secondary Theme Asset.
    
    TASK:
    1. Provide a short label for each icon based on the specific source "${source}".
    2. Provide a single 'masterPrompt' for a 5x2 sprite sheet (5 columns, 2 rows).
    CRITICAL: The prompt must explicitly describe a grid of 10 distinct, perfectly centered squares on a PURE FLAT WHITE background (#FFFFFF). Each icon should occupy only the center 60% of its cell. NO shading between icons.
    Return as JSON: { "items": [{ "label": "..." }], "masterPrompt": "..." }`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                label: { type: Type.STRING }
              }
            }
          },
          masterPrompt: { type: Type.STRING }
        },
        required: ["items", "masterPrompt"]
      }
    }
  });
  return JSON.parse(response.text || '{"items": [], "masterPrompt": ""}');
}

export async function generateIconGrid(masterPrompt: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { text: `Create a professional icon sprite sheet. 2 rows, 5 columns. 10 unique icons. THEME: ${masterPrompt}. BACKGROUND: Solid flat #FFFFFF white. Each icon must be centered in its grid cell with large margins around it. Style must be consistent across all 10 icons.` }
      ]
    },
    config: { imageConfig: { aspectRatio: "1:1" } }
  });

  for (const part of response.candidates?.[0].content.parts || []) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  throw new Error("Grid image generation failed");
}

export async function generateIconImage(prompt: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { text: `Create a single high-quality app icon for: ${prompt}. PURE FLAT WHITE #FFFFFF background. Professional, clean design, centered.` }
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
  const instruction = `Create a stylized sticker for ${userPrompt}. Type: ${type}. High contrast, bold colors, white thick border, gaming/pop-art aesthetic. Pure flat white background.`;
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
