"use client";

import { ChevronDown, MessageCircle, Sparkles } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ErrorDisplay } from "@/components/ui/error-display";
import { LocationDisplay } from "@/components/home/location-display";
import { ProductRecognition } from "@/components/home/product-recognition";
import { ProductList } from "@/components/home/product-list";
import { APP_CONFIG, SAMPLE_PRODUCTS, ROUTES } from "@/lib/constants";
import type { ProductItem } from "@/lib/types";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const { loading, error } = useAuth();
  const router = useRouter();

  if (loading) {
    return <LoadingSpinner message="正在初始化..." />;
  }

  if (error) {
    return <ErrorDisplay message={`初始化失败: ${error}`} />;
  }

  const handleLocationChange = () => {
    console.log("Location change clicked");
  };

  const handleProductClick = (product: ProductItem) => {
    console.log("Product clicked:", product);
    router.push(`/chat?from=productList&product=${encodeURIComponent(product.name)}`);
  };

  const handleLoadMore = () => {
    console.log("Load more clicked");
  };

  return (
    <PageContainer>
      <PageHeader title="智能购物" />
      
      <LocationDisplay 
        location={APP_CONFIG.defaultLocation}
        onLocationChange={handleLocationChange}
      />

      <ProductRecognition />

      {/* Voice Assistant Button */}
      <div className="px-6 mt-4">
        <Link href="/chat?from=home">
          <button 
            type="button"
            className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 transition-all duration-200 shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 hover:scale-[1.02] flex items-center justify-center font-medium py-4 rounded-2xl text-center text-force-white"
            style={{
              color: '#ffffff',
              backgroundColor: '#10b981', // fallback color
            }}
          >
            <MessageCircle className="w-5 h-5 mr-3 text-force-white" style={{color: '#ffffff'}} />
            <span className="text-force-white" style={{color: '#ffffff'}}>打开语音购物助手</span>
          </button>
        </Link>
      </div>

      {/* AI Recommendations */}
      <div className="flex items-center justify-between px-6 mt-6 mb-4">
        <div className="flex items-center">
          <div className="flex items-center justify-center w-7 h-7 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg mr-3 icon-force-white">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-semibold text-slate-900 mr-1">AI</span>
            <span className="text-sm text-slate-600">帮你聪明买</span>
          </div>
        </div>
        <button 
          type="button"
          className="text-sm text-slate-500 flex items-center hover:text-slate-700 transition-colors duration-200 px-3 py-1.5 rounded-full hover:bg-slate-100/60 group"
        >
          <span>日用食品</span>
          <ChevronDown className="w-4 h-4 ml-1 group-hover:rotate-180 transition-transform duration-200" />
        </button>
      </div>

      <ProductList 
        products={SAMPLE_PRODUCTS}
        onItemClick={handleProductClick}
        onLoadMore={handleLoadMore}
      />
    </PageContainer>
  );
}
