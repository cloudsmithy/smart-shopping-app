"use client";

import { Camera, Check } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef, Suspense } from "react";
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

// Mock对话数据
const mockConversations = {
  "安全的食用油": {
    userMessage: "如何选购安全的食用油？",
    systemMessages: [
      "我来为您介绍几种常见食用油的选购要点：",
      "1. 花生油\n特点：高烟点，适合煎炸。富含单不饱和脂肪酸（MUFA）和维生素E。\n风险：易受黄曲霉毒素污染，需选购知名品牌，注意过敏。\n建议：适用于高温烹饪，但需确保来源安全。",
      "2. 菜籽油 (芥花油)\n特点：低饱和脂肪，高单不饱和脂肪，含Omega-3脂肪酸，烟点高。\n优势：有益心血管健康，适合日常多样烹饪。现代芥花油低芥酸，安全。\n建议：日常烹饪的经济健康之选，尽量选非转基因认证产品。",
      "3. 橄榄油\n特级初榨橄榄油（EVOO）：最健康，富含抗氧化剂和单不饱和脂肪酸。烟点相对低（不宜高温煎炸）。\n普通橄榄油：经精炼，烟点较高，适用更多烹饪方式。",
      "优势：强抗炎和抗氧化作用，对心血管健康益处大。\n建议：EVOO用于凉拌、中低温烹饪。普通橄榄油可用于高温。"
    ]
  },
  "无添加剂的深海鱼": {
    userMessage: "选购无含水剂的深海鱼？",
    systemMessages: [
      "保水剂（如磷酸盐）是什么？\n保水剂是食品添加剂，用于帮助鱼肉在冷冻、解冻时保持水分，增加重量和改善外观。它们能让鱼肉看起来更饱满、晶莹。",
      "为什么海产品会添加保水剂？\n为了增加产品重量以提高利润，并使鱼肉看起来更美观、更\"新鲜\"。",
      "潜在健康风险：\n长期过量摄入磷酸盐可能导致磷过量，影响骨骼健康（如骨质疏松），并增加心血管疾病风险，特别是对肾功能不佳者。此外，添加保水剂还会稀释鱼肉的营养价值。",
      "区分处理过的鱼和未处理过的鱼：",
      "看外观：\n处理过的：鱼肉异常光亮、晶莹剔透，甚至有点\"发胀\"。解冻后会大量析出乳白色液体。\n未处理的：颜色自然，解冻后仅少量清澈液体。",
      "摸触感：\n处理过的：手感异常滑腻或\"粘手\"，肉质松散，按压难恢复。\n未处理的：肉质紧实有弹性，按压后迅速回弹。",
      "读标签：最重要线索！仔细查看配料表，避开含有磷酸盐（Phosphates）、三聚磷酸钠（Sodium Tripolyphosphate, STPP）等字样的产品。",
      "烹饪表现：\n处理过的：烹饪时大量出水、缩水，肉质可能变得松散。\n未处理的：出水少，鱼肉保持紧实，味道鲜美。",
      "价格：警惕价格异常便宜的产品。"
    ]
  },
  "正宗的五常大米": {
    userMessage: "如何选购正宗五常大米？",
    systemMessages: [
      "五常大米，中国优质大米代表，以其独特的米香和口感闻名。",
      "1. 正宗五常大米的特点\n香气：独特的自然米香味，熟后尤其浓郁，甚至有油润感。\n口感：米饭软糯适中，略带Q弹，咀嚼时有回甘。",
      "外观：米粒饱满均匀，色泽清亮，呈半透明或乳白色，腹白较小或无，米粒两端略呈绿色（青纱）。\n味道：冷饭不硬，依然香糯。",
      "2. 识别假冒伪劣产品\n市场上假冒五常大米泛滥，多用外地米掺假或假冒。",
      "闻香：假米可能无香或香精味（化学味），真米香气自然。\n看外观：假米大小不一，色泽暗淡，腹白大，可能混有碎米或异色米。",
      "尝口感：假米可能偏硬、松散或无回甘。\n看价格：正宗五常大米价格较高，远低于市场价的要警惕。",
      "3. 选购实用技巧\n认准产地标识：寻找包装上的\"地理标志产品保护\"专用标志。这是官方认证，表明产地和品质。",
      "核对产地：包装上应明确标注\"黑龙江省五常市\"，具体到乡镇更好（如民乐乡、龙凤山等核心产区）。",
      "查看执行标准：认准GB/T 19266国家标准号。这是五常大米的核心标准。",
      "识别品牌：选择知名、有信誉的五常大米品牌（如\"五常大米\"公共品牌下的注册商标，或老牌子）。",
      "购买渠道：从大型超市、官方旗舰店、授权经销商等正规渠道购买，避免街边小店或来源不明的网店。",
      "溯源系统：部分品牌提供二维码溯源，可查询生产、加工等信息。",
      "4. 五常大米的储存\n阴凉干燥：存放于避光、阴凉、干燥的地方，避免阳光直射和高温潮湿。",
      "密封保存：使用密封容器（如米桶、密封袋）储存，防止受潮、生虫和串味。",
      "远离异味：避免与有强烈气味的物品放在一起。",
      "适量购买：建议少量多次购买，尤其在夏季，避免长时间存放影响风味。",
      "冷藏（可选）：如果量少，可放入冰箱冷藏，能更好保持新鲜度和香气。"
    ]
  }
};

function ChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [photoData, setPhotoData] = useState<PhotoData | null>(null);
  const [userMessages, setUserMessages] = useState<string[]>([]);
  const [systemMessages, setSystemMessages] = useState<SystemMessage[]>([]);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [currentPlayingAudio, setCurrentPlayingAudio] = useState<HTMLAudioElement | null>(null);
  const [mockDataLoaded, setMockDataLoaded] = useState(false);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    // Check for photo data from sessionStorage
    const storedPhotoData = sessionStorage.getItem('photoData');
    if (storedPhotoData) {
      setPhotoData(JSON.parse(storedPhotoData));
      // Clear the data after reading
      sessionStorage.removeItem('photoData');
    }

    // 检查是否从商品列表进入，加载对应的mock对话
    const productName = searchParams.get('product');
    const fromParam = searchParams.get('from');
    
    // 如果不是从productList进入，重置状态
    if (fromParam !== 'productList') {
      setMockDataLoaded(false);
      return;
    }
    
    if (fromParam === 'productList' && productName && !mockDataLoaded) {
      const decodedProductName = decodeURIComponent(productName);
      const conversation = mockConversations[decodedProductName as keyof typeof mockConversations];
      
      if (conversation) {
        // 标记已加载，防止重复
        setMockDataLoaded(true);
        
        // 清空现有消息
        setUserMessages([]);
        setSystemMessages([]);
        
        // 清理之前的timeout
        timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
        timeoutsRef.current = [];
        
        // 延迟显示消息，模拟对话效果
        const userTimeout = setTimeout(() => {
          setUserMessages([conversation.userMessage]);
        }, 500);
        timeoutsRef.current.push(userTimeout);
        
        // 逐个显示系统消息
        conversation.systemMessages.forEach((message, index) => {
          const systemTimeout = setTimeout(() => {
            setSystemMessages(prev => [...prev, { text: message }]);
          }, 1000 + index * 800);
          timeoutsRef.current.push(systemTimeout);
        });
      }
    }
  }, [searchParams, mockDataLoaded]);

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
          fileinfo: photoData?.imageUrl || "",
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

  const handleSuggestionClick = async (suggestionType: string) => {
    const suggestions = {
      '成分分析': '请分析这个商品的主要成分和配料表，并评估其对健康的影响。',
      '营养价值': '请分析这个商品的营养成分，并提供营养价值评估和健康建议。',
      '选购建议': '请提供这类商品的选购建议，以及推荐的品牌。'
    };

    const query = suggestions[suggestionType as keyof typeof suggestions];
    
    if (!query) return;

    try {
      setIsProcessingAudio(true);
      
      const recognizeResponse = await recognizeUrl({
        fileinfo: photoData?.imageUrl || "",
        query: query
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
    } catch (error) {
      console.error('Error processing suggestion:', error);
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

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

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
          <>
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

            {/* Suggestion Buttons */}
            <div className="flex justify-center mb-6 animate-fade-in" style={{animationDelay: '0.3s'}}>
              <div className="flex gap-3 max-w-[95%]">
                <button
                  type="button"
                  onClick={() => handleSuggestionClick('成分分析')}
                  disabled={isProcessingAudio}
                  className="flex-1 min-w-0 bg-white/95 backdrop-blur-sm rounded-xl py-4 px-3 shadow-lg shadow-blue-500/10 border-2 border-white/40 hover:bg-white hover:border-blue-200 hover:shadow-xl transition-all duration-200 text-center disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                >
                  <div className="text-sm font-semibold text-slate-800 whitespace-nowrap" style={{color: '#1e293b'}}>💡 成分分析</div>
                </button>
                
                <button
                  type="button"
                  onClick={() => handleSuggestionClick('营养价值')}
                  disabled={isProcessingAudio}
                  className="flex-1 min-w-0 bg-white/95 backdrop-blur-sm rounded-xl py-4 px-3 shadow-lg shadow-blue-500/10 border-2 border-white/40 hover:bg-white hover:border-blue-200 hover:shadow-xl transition-all duration-200 text-center disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                >
                  <div className="text-sm font-semibold text-slate-800 whitespace-nowrap" style={{color: '#1e293b'}}>🏥 营养价值</div>
                </button>
                
                <button
                  type="button"
                  onClick={() => handleSuggestionClick('选购建议')}
                  disabled={isProcessingAudio}
                  className="flex-1 min-w-0 bg-white/95 backdrop-blur-sm rounded-xl py-4 px-3 shadow-lg shadow-blue-500/10 border-2 border-white/40 hover:bg-white hover:border-blue-200 hover:shadow-xl transition-all duration-200 text-center disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                >
                  <div className="text-sm font-semibold text-slate-800 whitespace-nowrap" style={{color: '#1e293b'}}>🏷️ 选购建议</div>
                </button>
              </div>
            </div>
          </>
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
              <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-line" style={{color: '#1e293b'}}>{message.text}</div>
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
                <span className="text-sm ml-2 text-force-white" style={{color: '#ffffff'}}>正在处理...</span>
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
