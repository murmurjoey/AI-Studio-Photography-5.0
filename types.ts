
export interface UploadedImage {
  base64: string;
  mimeType: string;
  previewUrl: string;
}

export interface GeneratedResult {
  id: string;
  image: string | null;
  text: string | null;
}

export interface GenerationOptions {
  style: string;
  lighting: string;
  background: string;
  angle: string;
  composition: string;
  lens: string;
  expression: string;
  pose: string;
  numberOfVariations: number;
  aspectRatio: string;
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  sourceImage: UploadedImage;
  clothingImage: UploadedImage | null;
  clothingPrompt: string;
  additionalPrompt: string;
  options: GenerationOptions;
  results: GeneratedResult[];
}
