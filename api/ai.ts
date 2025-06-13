import { post, postStream, getWebSocketUrl } from "@/lib/utils";

// 用户认证相关
export const initUser = (deviceId: string) => {
  return post("/api/auth/init-user", {
    device_id: deviceId,
  });
};

// 语音识别相关
export const audioSpeechRecognition = (inputAudio: string) => {
  return post("/api/photo/asr", { inputaudio: inputAudio });
};

// 图像识别相关
export const recognizeImage = (imageUrl: string) => {
  return post("/api/photo/recognize", {
    image_url: imageUrl,
  });
};

// 多模态识别（图像+语音+文本查询）
export interface RecognizeUrlParams {
  audio_url?: string;
  fileinfo: string;
  query?: string;
}

export const recognizeUrl = (params: RecognizeUrlParams) => {
  return post("/api/photo/recognize-url", params);
};

// 文件上传相关
export const uploadPhoto = (photo: File) => {
  const formData = new FormData();
  formData.append("photo", photo);

  return post("/api/photo/upload", formData);
};

// 实时语音对话相关
export interface RealtimeSessionResponse {
  session_id: string;
}

export const createRealtimeSession = (): Promise<RealtimeSessionResponse> => {
  return post("/ai/realtime/session");
};

export const getRealtimeWsUrl = (sessionId: string) => {
  return getWebSocketUrl(`/ai/realtime/ws/${sessionId}`);
};

export const uploadAudio = (audio: File) => {
  const formData = new FormData();
  formData.append("audio", audio);

  return post("/api/photo/upload-audio", formData);
};

// 购物指南接口 - 支持流式返回
export interface ShoppingGuideParams {
  question: string;
}

export const getShoppingGuide = (params: ShoppingGuideParams): Promise<Response> => {
  return postStream("/api/shopping/guides", params);
};
