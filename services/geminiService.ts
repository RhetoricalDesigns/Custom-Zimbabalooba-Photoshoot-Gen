
import { GoogleGenAI } from "@google/genai";
import { MODEL_SHOT_PROMPT } from "../constants";

const getBase64Parts = (base64Image: string) => {
  const match = base64Image.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) {
    throw new Error("Invalid image format.");
  }
  return { mimeType: match[1], data: match[2] };
};

export const generateModelFit = async (
  base64Image: string,
  config: { 
    modelType: string, 
    modelRace: string,
    pose: string, 
    background: string, 
    aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9",
    customInstructions?: string,
    usePro: boolean
  }
): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API configuration missing. Please ensure your key is set.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const { mimeType, data } = getBase64Parts(base64Image);
  const prompt = MODEL_SHOT_PROMPT(config);
  
  // Use Pro model only if requested, otherwise fallback to Flash for higher standard limits
  const modelName = config.usePro ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
  
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [
          { inlineData: { data, mimeType } },
          { text: prompt },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: config.aspectRatio,
          ...(config.usePro ? { imageSize: "1K" } : {})
        }
      }
    });

    const candidate = response.candidates?.[0];
    if (candidate?.content?.parts) {
      const imagePart = candidate.content.parts.find(p => p.inlineData);
      if (imagePart?.inlineData?.data) {
        return `data:image/png;base64,${imagePart.inlineData.data}`;
      }
    }
    
    throw new Error("Generation completed but no image was returned.");
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error.message?.includes('RESOURCE_EXHAUSTED')) {
      throw new Error("Free tier limit reached. Please switch to Pro Mode or try again in a moment.");
    }
    throw new Error(error.message || "Generation failed.");
  }
};

export const editGeneratedImage = async (
  base64Image: string,
  editPrompt: string,
  usePro: boolean
): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API_KEY required.");

  const ai = new GoogleGenAI({ apiKey });
  const { mimeType, data } = getBase64Parts(base64Image);
  const modelName = usePro ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';

  const instruction = `
    Edit this photoshoot: "${editPrompt}".
    Maintain the model's pose and the specific textures of the Zimbabalooba fabric.
  `;
  
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [
          { inlineData: { data, mimeType } },
          { text: instruction },
        ],
      },
      config: {
        imageConfig: {
          ...(usePro ? { imageSize: "1K" } : {})
        }
      }
    });

    const candidate = response.candidates?.[0];
    if (candidate?.content?.parts) {
      const imagePart = candidate.content.parts.find(p => p.inlineData);
      if (imagePart?.inlineData?.data) {
        return `data:image/png;base64,${imagePart.inlineData.data}`;
      }
    }

    throw new Error("Editing failed.");
  } catch (error: any) {
    throw new Error(error.message || "Editing failed.");
  }
};
