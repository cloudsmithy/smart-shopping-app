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
        title="智能助手"
        showBackButton
        onBack={() => router.push("/")}
      />

      {/* Chat Content */}
      <div className="flex-1 overflow-auto p-6 bg-gradient-to-b from-slate-50/50 to-blue-50/30">
        {/* System Message Bubbles - Only show when coming from home */}
        {searchParams.get('from') === 'home' && (
          <>
            <div className="flex justify-start mb-6 animate-fade-in">
              <div className="max-w-[85%] bg-white/90 backdrop-blur-sm rounded-2xl py-4 px-5 shadow-lg shadow-blue-500/10 border border-white/20">
                <p className="text-sm text-slate-800 leading-relaxed" style={{color: '#1e293b'}}>
                  中午好！我是您的购物健康小助手<br />
                  今天来超市想买点什么呢？
                </p>
              </div>
            </div>

            <div className="flex justify-start mb-6 animate-slide-up">
              <div className="max-w-[90%] bg-white/90 backdrop-blur-sm rounded-2xl py-4 px-5 shadow-lg shadow-blue-500/10 border border-white/20">
                <p className="text-sm text-slate-800 leading-relaxed mb-3" style={{color: '#1e293b'}}>
                  只需用手机拍摄商品，我就能立刻为您：
                </p>
                <div className="space-y-2 text-sm text-slate-700">
                  <div className="flex items-start">
                    <span className="text-emerald-500 mr-3 font-medium" style={{color: '#10b981'}}>✓</span>
                    <span style={{color: '#374151'}}>解析隐藏风险（过敏原/添加剂预警）</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-emerald-500 mr-3 font-medium" style={{color: '#10b981'}}>✓</span>
                    <span style={{color: '#374151'}}>量化健康指数（含糖量/卡路里热量计算）</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-emerald-500 mr-3 font-medium" style={{color: '#10b981'}}>✓</span>
                    <span style={{color: '#374151'}}>全网比价（对比京东/淘宝，帮您聪明购物，锁定最佳性价比）</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-start mb-6 animate-slide-up" style={{animationDelay: '0.1s'}}>
              <div className="max-w-[85%] bg-white/90 backdrop-blur-sm rounded-2xl py-4 px-5 shadow-lg shadow-blue-500/10 border border-white/20">
                <p className="text-sm text-slate-800 leading-relaxed" style={{color: '#1e293b'}}>
                  您还可以试试按住下方的话筒，<br />
                  说出您想查询的商品
                </p>
              </div>
            </div>

            <div className="flex justify-start mb-8 animate-slide-up" style={{animationDelay: '0.2s'}}>
              <div className="max-w-[90%] bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl py-4 px-5 shadow-lg shadow-blue-500/10 border border-blue-200/50">
                <p className="text-sm text-slate-700 leading-relaxed" style={{color: '#374151'}}>
                  您可以说「请帮我查查光明酸奶的含糖量对比其他品牌如何？是否有更健康的？」
                </p>
              </div>
            </div>
          </>
        )}

        {/* Photo Recognition Result */}
        {photoData && (
          <div className="flex justify-end mb-6 animate-scale-in">
            <div className="max-w-[70%]">
              <div 
                className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-4 mb-2 shadow-lg shadow-blue-500/25 text-force-white"
                style={{
                  backgroundColor: '#2563eb', // fallback color
                  color: '#ffffff'
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-force-white" style={{color: '#ffffff'}}>图片上传完成</div>
                  <Check className="w-4 h-4" style={{color: '#ffffff'}} />
                </div>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm text-force-white" style={{color: '#ffffff'}}>识别为 {photoData.recognitionResult}</div>
                  <Check className="w-4 h-4" style={{color: '#ffffff'}} />
                </div>
                <button
                  type="button"
                  onClick={() => router.push("/photo")}
                  className="text-blue-100 text-sm hover:text-white transition-colors underline"
                  style={{color: '#dbeafe'}}
                >
                  识别有误 重新拍照
                </button>
              </div>
            </div>
            <div className="w-16 h-16 ml-3 rounded-xl overflow-hidden shadow-lg border-2 border-white">
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
          <div key={index} className="flex justify-end mb-6 animate-scale-in">
            <div 
              className="max-w-[85%] bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl py-4 px-5 shadow-lg shadow-blue-500/25 text-force-white"
              style={{
                backgroundColor: '#2563eb', // fallback color
                color: '#ffffff'
              }}
            >
              <p className="text-sm leading-relaxed text-force-white" style={{color: '#ffffff'}}>{message}</p>
            </div>
          </div>
        ))}

        {/* System Response Messages */}
        {systemMessages.map((message, index) => (
          <div key={`system-${index}`} className="flex justify-start mb-6 animate-fade-in">
            <div className="max-w-[85%] bg-white/90 backdrop-blur-sm rounded-2xl py-4 px-5 shadow-lg shadow-blue-500/10 border border-white/20">
              <p className="text-sm text-slate-800 leading-relaxed" style={{color: '#1e293b'}}>{message.text}</p>
              {message.audioUrl && (
                <button
                  type="button"
                  onClick={() => playAudio(message.audioUrl!)}
                  className="mt-3 inline-flex items-center text-xs text-blue-600 hover:text-blue-700 transition-colors font-medium"
                  style={{color: '#2563eb'}}
                >
                  🔊 播放语音回复
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Processing indicator */}
        {isProcessingAudio && (
          <div className="flex justify-end mb-6">
            <div 
              className="max-w-[70%] bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl py-4 px-5 shadow-lg shadow-blue-500/25 text-force-white"
              style={{
                backgroundColor: '#2563eb', // fallback color
                color: '#ffffff'
              }}
            >
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-white/70 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-white/70 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-white/70 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                <span className="text-sm ml-2 text-force-white" style={{color: '#ffffff'}}>正在识别语音...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-6 flex items-center justify-center gap-6 bg-white/60 backdrop-blur-sm border-t border-slate-200/60">
        <button
          type="button"
          onClick={() => router.push("/photo")}
          className="w-14 h-14 bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl flex items-center justify-center hover:from-slate-600 hover:to-slate-800 transition-all duration-200 shadow-lg shadow-slate-500/25 hover:scale-105"
          style={{
            backgroundColor: '#374151', // fallback color
          }}
          aria-label="拍照"
        >
          <Camera className="w-6 h-6" style={{color: '#ffffff'}} />
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
