"use client";

import { ChevronDown } from "lucide-react";
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

export default function HomePage() {
  const { loading, error } = useAuth();

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
  };

  const handleLoadMore = () => {
    console.log("Load more clicked");
  };

  return (
    <PageContainer>
      <PageHeader title="首页" />
      
      <LocationDisplay 
        location={APP_CONFIG.defaultLocation}
        onLocationChange={handleLocationChange}
      />

      <ProductRecognition />

      {/* Voice Assistant Button */}
      <Link href="/chat?from=home" className="mx-4 mt-3">
        <button 
          type="button"
          className="w-full bg-[#07c160] text-white py-3 rounded-md text-center hover:bg-green-600 transition-colors"
        >
          打开语音购物助手
        </button>
      </Link>

      {/* AI Recommendations */}
      <div className="flex items-center justify-between px-4 mt-4">
        <div className="flex items-center">
          <span className="font-bold mr-1">AI</span>
          <span className="text-sm">帮你聪明买</span>
        </div>
        <button 
          type="button"
          className="text-xs text-[#979797] flex items-center hover:text-gray-600 transition-colors"
        >
          日用食品 <ChevronDown className="w-3 h-3 ml-1" />
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
