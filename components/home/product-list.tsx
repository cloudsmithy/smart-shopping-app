import { ChevronRight, ChevronDown } from "lucide-react";

interface ProductItem {
  name: string;
  description: string;
}

interface ProductListProps {
  products: ProductItem[];
  onItemClick?: (item: ProductItem) => void;
  onLoadMore?: () => void;
}

export function ProductList({ products, onItemClick, onLoadMore }: ProductListProps) {
  return (
    <div className="flex-1 overflow-auto px-4 mt-2">
      {products.map((item, index) => (
        <button
          key={index}
          type="button"
          className="w-full flex items-center justify-between py-3 border-b border-[#f2f2f2] text-left hover:bg-gray-50 transition-colors"
          onClick={() => onItemClick?.(item)}
        >
          <div>
            <div className="text-sm">{item.name}</div>
            <div className="text-xs text-[#979797] mt-1">{item.description}</div>
          </div>
          <ChevronRight className="w-5 h-5 text-[#979797]" />
        </button>
      ))}
      <div className="flex justify-center mt-4 mb-2">
        <button 
          type="button"
          className="text-xs text-[#979797] flex items-center hover:text-gray-600 transition-colors"
          onClick={onLoadMore}
        >
          更多 <ChevronDown className="w-3 h-3 ml-1" />
        </button>
      </div>
    </div>
  );
}