
import { GoogleGenAI, Type } from "@google/genai";

export interface IconDetection {
  name: string;
  box_2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax]
}

/**
 * Identifies icons in an image using Gemini's vision capabilities.
 * Updated to use gemini-3-flash-preview which supports vision reasoning and responseSchema.
 */
export async function identifyIconsInImage(
  base64Image: string, 
  prompt: string
): Promise<IconDetection[]> {
  // Fix: Obtained API key exclusively from environment variable as required.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    // Fix: Using gemini-3-flash-preview as gemini-2.5-flash-image does not support responseSchema.
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Image,
          },
        },
        {
          text: `Identify and extract all individual icons or logos matching the request: "${prompt}". 
          Return the results as a JSON array of objects, each with a "name" and "box_2d" (normalized coordinates [ymin, xmin, ymax, xmax] from 0-1000). 
          Be precise with the boxes to capture only the icon silhouette.`,
        },
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          icons: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                box_2d: { 
                  type: Type.ARRAY, 
                  items: { type: Type.NUMBER },
                  description: "[ymin, xmin, ymax, xmax]"
                }
              },
              required: ["name", "box_2d"]
            }
          }
        },
        required: ["icons"]
      }
    }
  });

  try {
    // Fix: Access response.text property directly as per extracts from GenerateContentResponse guidelines.
    const text = response.text;
    const data = JSON.parse(text || '{"icons":[]}');
    return data.icons || [];
  } catch (e) {
    console.error("Failed to parse AI response", e);
    return [];
  }
}
