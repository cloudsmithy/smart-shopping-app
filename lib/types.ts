// 通用类型定义
export interface ProductItem {
  name: string;
  description: string;
}

export interface Location {
  name: string;
  latitude?: number;
  longitude?: number;
}

export interface ChatMessage {
  id: string;
  content: string;
  type: "user" | "assistant";
  timestamp: Date;
  metadata?: {
    imageUrl?: string;
    productInfo?: ProductItem;
  };
}

export interface CameraCapture {
  dataUrl: string;
  blob: Blob;
  timestamp: Date;
}

export type NavigationScreen = "home" | "photo" | "chat" | "voice";

export interface AuthState {
  token: string | null;
  loading: boolean;
  error: string | null;
}