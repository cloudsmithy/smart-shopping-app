"use client";

import { useState } from "react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { APP_CONFIG, SAMPLE_PRODUCTS, ROUTES, PRODUCT_CATEGORY_OPTIONS } from "@/lib/constants";
import type { ProductItem } from "@/lib/types";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const { loading, error } = useAuth();
  const router = useRouter();
  const [currentLocation, setCurrentLocation] = useState<string>(APP_CONFIG.defaultLocation);
  const [selectedCategory, setSelectedCategory] = useState<string>("日用食品");

  if (loading) {
    return <LoadingSpinner message="正在初始化..." />;
  }

  if (error) {
    return <ErrorDisplay message={`初始化失败: ${error}`} />;
  }

  const handleLocationChange = (newLocation: string) => {
    console.log("Location changed to:", newLocation);
    setCurrentLocation(newLocation);
  };

  const handleCategoryChange = (newCategory: string) => {
    console.log("Category changed to:", newCategory);
    setSelectedCategory(newCategory);
  };

  const handleProductClick = (product: ProductItem) => {
    console.log("Product clicked:", product);
    router.push(`/chat?from=productList&product=${encodeURIComponent(product.name)}`);
  };

  const handleLoadMore = () => {
    console.log("Load more clicked");
  };

  // 根据选中的类别获取对应的产品
  const getCurrentCategoryProducts = () => {
    const categoryMap = {
      "日用食品": "daily-food",
      "零食饮料": "snacks-drinks", 
      "时令食材": "seasonal-ingredients"
    } as const;
    
    const categoryKey = categoryMap[selectedCategory as keyof typeof categoryMap];
    const products = categoryKey ? SAMPLE_PRODUCTS[categoryKey] : SAMPLE_PRODUCTS["daily-food"];
    // 将只读数组转换为可变数组
    return [...products];
  };

  return (
    <PageContainer>      
      <LocationDisplay 
        location={currentLocation}
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
          <div 
            className="flex items-center justify-center w-7 h-7 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg shadow-lg shadow-purple-500/25 mr-3 icon-force-white"
            style={{
              background: 'linear-gradient(to bottom right, #a855f7, #4f46e5)',
              boxShadow: '0 10px 15px -3px rgba(168, 85, 247, 0.25), 0 4px 6px -2px rgba(168, 85, 247, 0.05)'
            }}
          >
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-semibold text-slate-900 mr-1">AI</span>
            <span className="text-sm text-slate-600">帮你聪明买</span>
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              type="button"
              className="text-sm text-slate-500 flex items-center hover:text-slate-700 transition-colors duration-200 px-3 py-1.5 rounded-full hover:bg-slate-100/60 group"
            >
              <span>{selectedCategory}</span>
              <ChevronDown className="w-4 h-4 ml-1 group-hover:rotate-180 transition-transform duration-200" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            {PRODUCT_CATEGORY_OPTIONS.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => handleCategoryChange(option.label)}
                className="cursor-pointer"
              >
                <span className="text-sm">{option.label}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ProductList 
        products={getCurrentCategoryProducts()}
        onItemClick={handleProductClick}
        onLoadMore={handleLoadMore}
      />
    </PageContainer>
  );
}
