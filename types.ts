
export interface UploadedImage {
  base64: string;
  mimeType: string;
  previewUrl: string;
}

export interface GeneratedResult {
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
}