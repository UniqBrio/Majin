export const CONTENT_TYPES = [
  { value: "text", label: "Text" },
  { value: "image", label: "Image" },
  { value: "video", label: "Video" },
  { value: "audio", label: "Audio" },
  { value: "3d", label: "3D" },
] as const;

export type ContentTypeValue = typeof CONTENT_TYPES[number]['value'];

export interface Model {
  id: string;
  name: string;
  provider: string;
  apiKey: string; // Sensitive: ensure backend handles this securely and consider if it should always be sent to client
  type: ContentTypeValue;
  description?: string;
  active: boolean;
  // Add any other relevant fields from your API response, e.g.:
  // createdAt?: string;
  // updatedAt?: string;
}

export interface NewModelFormData {
  name: string;
  provider: string;
  apiKey: string;
  type: ContentTypeValue;
  description: string;
}