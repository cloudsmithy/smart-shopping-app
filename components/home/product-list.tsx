import { useState } from "react";
import { ChevronRight, ChevronDown, ChevronUp } from "lucide-react";

interface ProductItem {
  name: string;
  description: string;
}

interface ProductListProps {
  products: ProductItem[];
  onItemClick?: (item: ProductItem) => void;
  onLoadMore?: () => void;
}

export function ProductList({ products, onItemClick }: ProductListProps) {
  const [showAll, setShowAll] = useState(false);
  const initialDisplayCount = 3;
  
  // 决定要显示的产品
  const displayedProducts = showAll ? products : products.slice(0, initialDisplayCount);
  const hasMoreProducts = products.length > initialDisplayCount;

  const handleToggleShowMore = () => {
    setShowAll(!showAll);
  };

  return (
    <div className="flex-1 overflow-auto px-6 mt-2 pb-6">
      <div className="space-y-3">
        {displayedProducts.map((item, index) => (
          <button
            key={index}
            type="button"
            className="w-full flex items-center justify-between p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200/60 text-left hover:bg-white/80 hover:shadow-md hover:scale-[1.02] transition-all duration-200 group"
            onClick={() => onItemClick?.(item)}
          >
            <div className="flex-1">
              <div className="text-sm font-medium text-slate-900 mb-1">{item.name}</div>
              <div className="text-xs text-slate-600 leading-relaxed">{item.description}</div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-1 transition-all ml-3" />
          </button>
        ))}
      </div>
      
      {/* 只有当产品数量大于初始显示数量时才显示按钮 */}
      {hasMoreProducts && (
        <div className="flex justify-center mt-6">
          <button 
            type="button"
            className="text-sm text-slate-500 flex items-center hover:text-slate-700 transition-colors duration-200 px-4 py-2 rounded-full hover:bg-slate-100/60 group"
            onClick={handleToggleShowMore}
          >
            <span className="font-medium">
              {showAll ? '收起' : '更多'}
            </span>
            {showAll ? (
              <ChevronUp className="w-4 h-4 ml-2 group-hover:-translate-y-0.5 transition-transform" />
            ) : (
              <ChevronDown className="w-4 h-4 ml-2 group-hover:translate-y-0.5 transition-transform" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}