import { GoogleGenAI, Modality } from "@google/genai";
import type { UploadedImage, GeneratedResult } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const fileToGenerativePart = (base64: string, mimeType: string) => {
  return {
    inlineData: {
      data: base64,
      mimeType,
    },
  };
};

export const generateStudioPortrait = async (
  personImage: UploadedImage,
  prompt: string,
  clothingImage: UploadedImage | null
): Promise<GeneratedResult> => {
  try {
    const model = 'gemini-2.5-flash-image-preview';

    const personImagePart = fileToGenerativePart(personImage.base64, personImage.mimeType);
    const textPart = {
      text: prompt,
    };
    
    // FIX: Re-structured part assembly to fix a TypeScript type inference error.
    // The original code built the `parts` array incrementally, which caused TypeScript
    // to infer a type that only allowed image parts. This new approach constructs the
    // array in a single expression, allowing TypeScript to correctly infer a union
    // type that accommodates both image and text parts.
    const parts = [
      personImagePart,
      ...(clothingImage ? [fileToGenerativePart(clothingImage.base64, clothingImage.mimeType)] : []),
      textPart,
    ];


    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: parts,
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    let generatedImageBase64: string | null = null;
    let generatedText: string | null = null;

    if (response.candidates && response.candidates.length > 0) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          generatedImageBase64 = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        } else if (part.text) {
          generatedText = part.text;
        }
      }
    }
    
    return { image: generatedImageBase64, text: generatedText };

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to generate image with Gemini API.");
  }
};
