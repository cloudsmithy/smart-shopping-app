import { post } from "@/utils/request";

// 用户认证相关
export const initUser = (deviceId: string) => {
  return post<any>("/api/auth/init-user", {
    device_id: deviceId,
  });
};

// 语音识别相关
export const audioSpeechRecognition = (inputAudio: string) => {
  return post<{ text: string }>("/api/photo/asr", { inputaudio: inputAudio });
};

// 图像识别相关
export const recognizeImage = (imageUrl: string) => {
  return post<{ result: string }>("/api/photo/recognize", {
    image_url: imageUrl,
  });
};

// 多模态识别（图像+语音+文本查询）
export interface RecognizeUrlParams {
  audio_url?: string;
  image_url: string;
  query?: string;
}

export const recognizeUrl = (params: RecognizeUrlParams) => {
  return post<{ result: string }>("/api/photo/recognize-url", params);
};

// 文件上传相关
export const uploadPhoto = (photo: File) => {
  const formData = new FormData();
  formData.append("photo", photo);

  return post<{ url: string }>("/api/photo/upload", formData);
};

export const uploadAudio = (audio: File) => {
  const formData = new FormData();
  formData.append("audio", audio);

  return post<{ url: string }>("/api/photo/upload-audio", formData);
};
