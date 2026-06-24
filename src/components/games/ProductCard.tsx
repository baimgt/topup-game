import { Check } from "lucide-react";
import { Product } from "@/types";
import { formatCurrency, cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  selected?: boolean;
  onSelect: (product: Product) => void;
}

export default function ProductCard({ product, selected, onSelect }: ProductCardProps) {
  return (
    <button
      onClick={() => onSelect(product)}
      className={cn(
        "relative w-full text-left p-4 rounded-xl border transition-all duration-200",
        selected
          ? "border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/20"
          : "border-white/10 bg-gaming-card hover:border-purple-500/50 hover:bg-gaming-accent"
      )}
    >
      {selected && (
        <div className="absolute top-2 right-2 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
          <Check className="w-3 h-3 text-white" />
        </div>
      )}

      <div className="pr-6">
        <p className="text-white font-medium text-sm line-clamp-2">{product.name}</p>
        {product.description && (
          <p className="text-gray-500 text-xs mt-1 line-clamp-1">{product.description}</p>
        )}
      </div>

      <div className="mt-3">
        {product.isFlashSale && product.originalPrice && (
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-red-400 font-semibold px-1.5 py-0.5 bg-red-500/10 rounded-md border border-red-500/20">
              ⚡ Flash Sale
            </span>
            <span className="text-xs text-gray-500 line-through">
              {formatCurrency(product.originalPrice)}
            </span>
          </div>
        )}
        <span className={cn(
          "text-base font-bold",
          selected ? "text-purple-300" : (product.isFlashSale ? "text-red-400" : "text-white")
        )}>
          {formatCurrency(product.sellingPrice)}
        </span>
      </div>
    </button>
  );
}
