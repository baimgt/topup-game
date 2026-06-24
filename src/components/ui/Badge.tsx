import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "purple" | "gold";
  className?: string;
  glow?: boolean;
}

const variants = {
  default: "bg-white/5 text-gray-300 border border-white/10",
  success: "bg-green-500/10 text-green-400 border border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.1)]",
  warning: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 shadow-[0_0_10px_rgba(234,179,8,0.1)]",
  danger: "bg-red-500/10 text-red-400 border border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.1)]",
  info: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.1)]",
  purple: "bg-purple-500/10 text-purple-400 border border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.1)]",
  gold: "bg-yellow-400/10 text-yellow-300 border border-yellow-400/50 shadow-[0_0_15px_rgba(250,204,21,0.2)]",
};

export default function Badge({ children, variant = "default", glow, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold backdrop-blur-sm transition-all",
        variants[variant],
        glow && "animate-glow",
        className
      )}
    >
      {children}
    </span>
  );
}

export function PaymentStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; variant: BadgeProps["variant"] }> = {
    UNPAID: { label: "Belum Bayar", variant: "warning" },
    PAID: { label: "Lunas", variant: "success" },
    EXPIRED: { label: "Kadaluarsa", variant: "default" },
    FAILED: { label: "Gagal", variant: "danger" },
    REFUNDED: { label: "Dikembalikan", variant: "info" },
  };

  const { label, variant } = config[status] || { label: status, variant: "default" };
  return <Badge variant={variant}>{label}</Badge>;
}

export function OrderStatusBadge({ status, glow }: { status: string; glow?: boolean }) {
  const config: Record<string, { label: string; variant: BadgeProps["variant"] }> = {
    PENDING: { label: "Menunggu", variant: "default" },
    PROCESSING: { label: "Diproses", variant: "purple" },
    SUCCESS: { label: "Sukses", variant: "success" },
    FAILED: { label: "Gagal", variant: "danger" },
  };

  const { label, variant } = config[status] || { label: status, variant: "default" };
  return <Badge variant={variant} glow={glow}>{label}</Badge>;
}
