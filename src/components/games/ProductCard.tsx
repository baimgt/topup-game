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
      type="button"
      onClick={() => onSelect(product)}
      className={cn(
        "relative w-full text-left p-4 rounded-xl border transition-all duration-200 flex flex-col justify-between h-full group",
        selected
          ? "border-purple-500 bg-purple-500/15 shadow-lg shadow-purple-500/25 ring-1 ring-purple-500/50"
          : "border-white/10 bg-gaming-card hover:border-purple-500/50 hover:bg-gaming-accent/60"
      )}
    >
      {selected && (
        <div className="absolute top-2.5 right-2.5 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center shadow-md">
          <Check className="w-3.5 h-3.5 text-white" />
        </div>
      )}

      {/* Nama Produk Saja (Tanpa Deskripsi) */}
      <div className="pr-6">
        <p className="text-white font-bold text-sm leading-snug group-hover:text-cyan-300 transition-colors">
          {product.name}
        </p>
      </div>

      {/* Harga Produk */}
      <div className="mt-3 pt-2 border-t border-white/5">
        {product.isFlashSale && product.originalPrice && (
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[10px] text-red-400 font-extrabold px-1.5 py-0.5 bg-red-500/10 rounded border border-red-500/20">
              ⚡ Flash Sale
            </span>
            <span className="text-[11px] text-gray-500 line-through font-mono">
              {formatCurrency(product.originalPrice)}
            </span>
          </div>
        )}
        <div className={cn(
          "text-base font-extrabold tracking-tight",
          selected ? "text-purple-300" : (product.isFlashSale ? "text-red-400" : "text-cyan-300")
        )}>
          {formatCurrency(product.sellingPrice)}
        </div>
      </div>
    </button>
  );
}
