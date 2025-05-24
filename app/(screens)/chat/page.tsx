"use client";

import { Camera, Check } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { PageContainer } from "@/components/ui/page-container";
import MicrophoneButton from "@/components/microphone-button";
import { audioSpeechRecognition, uploadAudio, recognizeUrl } from "@/api/ai";

interface PhotoData {
  imageUrl: string;
  photoUrl: string;
  recognitionResult: string;
}

interface SystemMessage {
  text: string;
  audioUrl?: string;
}

function ChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [photoData, setPhotoData] = useState<PhotoData | null>(null);
  const [userMessages, setUserMessages] = useState<string[]>([]);
  const [systemMessages, setSystemMessages] = useState<SystemMessage[]>([]);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [currentPlayingAudio, setCurrentPlayingAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Check for photo data from sessionStorage
    const storedPhotoData = sessionStorage.getItem('photoData');
    if (storedPhotoData) {
      setPhotoData(JSON.parse(storedPhotoData));
      // Clear the data after reading
      sessionStorage.removeItem('photoData');
    }
  }, []);

  const handleNavigate = (screen: string) => {
    if (screen === "home") {
      router.push("/");
    } else if (screen === "photo") {
      router.push("/photo");
    }
  };

  const handleAudioRecognition = async (audioFile: File) => {
    if (!audioFile) return;
    
    try {
      setIsProcessingAudio(true);
      
      // Step 1: Upload audio file to get URL
      const uploadResponse = await uploadAudio(audioFile);
      const audioUrl = uploadResponse.url;
      
      // Step 2: Call ASR with the audio URL
      const asrResponse = await audioSpeechRecognition(audioUrl);
      
      if (asrResponse.result) {
        // Display user message
        setUserMessages(prev => [...prev, asrResponse.result]);
        
        // Step 3: Call recognizeUrl with audio_url and default query
        const recognizeResponse = await recognizeUrl({
          audio_url: audioUrl,
          image_url: photoData?.imageUrl || "",
          query: "请识别这个商品，并提供品牌、类别、净含量和保质期等信息"
        });
        
        if (recognizeResponse.result?.text_result) {
          // Add system message
          const systemMessage: SystemMessage = {
            text: recognizeResponse.result.text_result,
            audioUrl: recognizeResponse.result.audio_url
          };
          setSystemMessages(prev => [...prev, systemMessage]);
          
          // Play audio if available
          if (recognizeResponse.result.audio_url) {
            playAudio(recognizeResponse.result.audio_url);
          }
        }
      }
    } catch (error) {
      console.error('Error processing audio:', error);
    } finally {
      setIsProcessingAudio(false);
    }
  };

  const playAudio = (audioUrl: string) => {
    // Stop current audio if playing
    if (currentPlayingAudio) {
      currentPlayingAudio.pause();
      currentPlayingAudio.currentTime = 0;
    }
    
    // Create and play new audio
    const audio = new Audio(audioUrl);
    setCurrentPlayingAudio(audio);
    
    audio.play().catch(error => {
      console.error('Error playing audio:', error);
    });
    
    // Clean up when audio ends
    audio.onended = () => {
      setCurrentPlayingAudio(null);
    };
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (currentPlayingAudio) {
        currentPlayingAudio.pause();
        currentPlayingAudio.currentTime = 0;
      }
    };
  }, [currentPlayingAudio]);

  return (
    <PageContainer>
      <PageHeader 
        title="对话页"
        showBackButton
        onBack={() => router.push("/")}
      />

      {/* Chat Content */}
      <div className="flex-1 overflow-auto p-4 bg-[#14171885]">
        {/* System Message Bubbles - Only show when coming from home */}
        {searchParams.get('from') === 'home' && (
          <>
            <div className="flex justify-start mb-4">
              <div className="max-w-[85%] bg-white rounded-2xl py-3 px-4 shadow-sm">
                <p className="text-sm text-gray-800 leading-relaxed">
                  中午好！我是您的购物健康小助手<br />
                  今天来超市想买点什么呢？
                </p>
              </div>
            </div>

            <div className="flex justify-start mb-4">
              <div className="max-w-[90%] bg-white rounded-2xl py-3 px-4 shadow-sm">
                <p className="text-sm text-gray-800 leading-relaxed mb-2">
                  只需用手机拍摄商品，我就能立刻为您：
                </p>
                <div className="space-y-1 text-sm text-gray-800">
                  <div className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>解析隐藏风险（过敏原/添加剂预警）</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>量化健康指数（含糖量/卡路里热量计算）</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>全网比价（对比京东/淘宝，帮您聪明购物，锁定最佳性价比）</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-start mb-4">
              <div className="max-w-[85%] bg-white rounded-2xl py-3 px-4 shadow-sm">
                <p className="text-sm text-gray-800 leading-relaxed">
                  您还可以试试按住下方的话筒，<br />
                  说出您想查询的商品
                </p>
              </div>
            </div>

            <div className="flex justify-start mb-6">
              <div className="max-w-[90%] bg-white rounded-2xl py-3 px-4 shadow-sm">
                <p className="text-sm text-gray-800 leading-relaxed">
                  您可以说「请帮我查查光明酸奶的含糖量对比其他品牌如何？是否有更健康的？」
                </p>
              </div>
            </div>
          </>
        )}

        {/* Photo Recognition Result */}
        {photoData && (
          <div className="flex justify-end mb-4">
            <div className="max-w-[70%]">
              <div className="bg-white rounded-lg p-3 mb-2 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm text-gray-800">图片上传完成</div>
                  <Check className="w-4 h-4 text-[#07c160]" />
                </div>
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm text-gray-800">识别为 {photoData.recognitionResult}</div>
                  <Check className="w-4 h-4 text-[#07c160]" />
                </div>
                <button
                  type="button"
                  onClick={() => router.push("/photo")}
                  className="text-[#07c160] text-sm hover:text-green-600 transition-colors"
                >
                  识别有误 重新拍照
                </button>
              </div>
            </div>
            <div className="w-16 h-16 ml-2 rounded-lg overflow-hidden shadow-sm">
              <img
                src={photoData.photoUrl}
                alt="Product thumbnail"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {/* User Voice Messages */}
        {userMessages.map((message, index) => (
          <div key={index} className="flex justify-end mb-4">
            <div className="max-w-[85%] bg-[#FFFFFF] rounded-2xl py-3 px-4 shadow-sm">
              <p className="text-sm text-gray-800 leading-relaxed">{message}</p>
            </div>
          </div>
        ))}

        {/* System Response Messages */}
        {systemMessages.map((message, index) => (
          <div key={`system-${index}`} className="flex justify-start mb-4">
            <div className="max-w-[85%] bg-white rounded-2xl py-3 px-4 shadow-sm">
              <p className="text-sm text-gray-800 leading-relaxed">{message.text}</p>
              {message.audioUrl && (
                <button
                  type="button"
                  onClick={() => playAudio(message.audioUrl!)}
                  className="mt-2 text-xs text-[#07c160] hover:text-green-600 transition-colors"
                >
                  🔊 播放语音回复
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Processing indicator */}
        {isProcessingAudio && (
          <div className="flex justify-end mb-4">
            <div className="max-w-[70%] bg-[#FFFFFF] rounded-2xl py-3 px-4 shadow-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                <span className="text-sm text-gray-600 ml-2">正在识别语音...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 flex items-center justify-center gap-4 bg-[#14171885] border-t border-[#dadada]">
        <button
          type="button"
          onClick={() => router.push("/photo")}
          className="w-14 h-14 bg-[#000000] rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors shadow-lg"
          aria-label="拍照"
        >
          <Camera className="w-7 h-7 text-white" />
        </button>
        <MicrophoneButton 
          onNavigate={handleNavigate} 
          onAudioRecorded={handleAudioRecognition}
          isProcessing={isProcessingAudio}
        />
      </div>
    </PageContainer>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div>加载中...</div>}>
      <ChatContent />
    </Suspense>
  );
}
