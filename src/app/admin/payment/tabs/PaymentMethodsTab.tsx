"use client";

import { useEffect, useState } from "react";
import { Save, Info, Upload } from "lucide-react";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import { defaultMethods, defaultDuitkuMethods } from "@/lib/payment-methods";
import type { PaymentMethod as Method } from "@/lib/payment-methods";
import { formatCurrency } from "@/lib/utils";

const GROUP_ICONS: Record<string, string> = {
  "E-Wallet": "💳",
  "Transfer Bank": "🏦",
  "QRIS": "📱",
  "Minimarket": "🏪",
  "Kartu": "💰",
};

const GROUP_COLORS: Record<string, string> = {
  "E-Wallet": "from-green-500/10 to-green-600/5 border-green-500/20",
  "Transfer Bank": "from-blue-500/10 to-blue-600/5 border-blue-500/20",
  "QRIS": "from-purple-500/10 to-purple-600/5 border-purple-500/20",
  "Minimarket": "from-orange-500/10 to-orange-600/5 border-orange-500/20",
  "Kartu": "from-yellow-500/10 to-yellow-600/5 border-yellow-500/20",
};

export default function PaymentMethodsTab() {
  const [gateway, setGateway] = useState<"midtrans" | "duitku">("midtrans");
  const [methods, setMethods] = useState<Method[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const token = () => localStorage.getItem("token") || "";

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/payment-methods?gateway=${gateway}`, { headers: { Authorization: `Bearer ${token()}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          const saved: Method[] = d.data;
          const fallbackMethods = gateway === "duitku" ? defaultDuitkuMethods : defaultMethods;
          const merged = fallbackMethods.map((def) => {
            const found = saved.find((s) => s.id === def.id);
            return found || (def as Method);
          });
          setMethods(merged);
        }
      })
      .finally(() => setLoading(false));
  }, [gateway]);

  const toggle = (id: string) =>
    setMethods((prev) => prev.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m)));

  const updateFee = (id: string, fee: number) =>
    setMethods((prev) => prev.map((m) => (m.id === id ? { ...m, fee } : m)));

  // Saat ganti tipe, reset fee ke 0 agar tidak salah kalkulasi
  const updateFeeType = (id: string, feeType: "flat" | "percent") =>
    setMethods((prev) => prev.map((m) => (m.id === id ? { ...m, feeType, fee: 0 } : m)));

  const updateIconUrl = (id: string, iconUrl: string) =>
    setMethods((prev) => prev.map((m) => (m.id === id ? { ...m, iconUrl } : m)));

  const handleUploadIcon = async (id: string, file: File) => {
    if (!file) return;
    const toastId = toast.loading("Mengunggah icon...");
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token()}` },
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        updateIconUrl(id, data.url);
        toast.success("Berhasil mengunggah icon", { id: toastId });
      } else {
        toast.error(data.error || "Gagal mengunggah", { id: toastId });
      }
    } catch (err) {
      toast.error("Terjadi kesalahan saat mengunggah", { id: toastId });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch("/api/admin/payment-methods", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ gateway, methods }),
    });
    const data = await res.json();
    if (data.success) {
      toast.success(`Metode pembayaran ${gateway === "midtrans" ? "Midtrans" : "Duitku"} berhasil disimpan!`);
    } else {
      toast.error(data.error || "Gagal menyimpan");
    }
    setSaving(false);
  };

  const enabledCount = methods.filter((m) => m.enabled).length;

  const groups = methods.reduce<Record<string, Method[]>>((acc, m) => {
    if (!acc[m.group]) acc[m.group] = [];
    acc[m.group].push(m);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Gateway switcher */}
      <div className="bg-gaming-card rounded-xl border border-white/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-white font-bold text-sm">Pilih Gateway Pembayaran</h4>
          <p className="text-gray-500 text-xs mt-0.5">Konfigurasi metode pembayaran aktif dan biaya layanan masing-masing gateway.</p>
        </div>
        <div className="flex gap-2 p-1 bg-black/20 rounded-lg border border-white/5 w-fit">
          <button
            onClick={() => setGateway("midtrans")}
            className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${gateway === "midtrans" ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25" : "text-gray-400 hover:text-white"}`}
          >
            Midtrans
          </button>
          <button
            onClick={() => setGateway("duitku")}
            className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${gateway === "duitku" ? "bg-green-500 text-white shadow-lg shadow-green-500/25" : "text-gray-400 hover:text-white"}`}
          >
            Duitku
          </button>
        </div>
      </div>

      {/* Summary bar */}
      <div className="flex items-center justify-between bg-gaming-card rounded-xl border border-white/5 px-5 py-3">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Info className="w-4 h-4" />
          <span>
            <span className="text-white font-semibold">{enabledCount}</span> dari {methods.length} metode aktif
          </span>
        </div>
        <Button variant="primary" size="sm" onClick={handleSave} loading={saving}>
          <Save className="w-4 h-4" /> Simpan
        </Button>
      </div>

      {/* Groups */}
      {Object.entries(groups).map(([group, groupMethods]) => (
        <div
          key={group}
          className={`bg-gradient-to-br ${GROUP_COLORS[group] || "from-white/5 to-white/2 border-white/10"} rounded-2xl border overflow-hidden`}
        >
          {/* Group header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <span className="text-lg">{GROUP_ICONS[group] || "💳"}</span>
              <h3 className="text-white font-semibold text-sm">{group}</h3>
              <span className="text-gray-500 text-xs">
                ({groupMethods.filter((m) => m.enabled).length}/{groupMethods.length} aktif)
              </span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setMethods((prev) => prev.map((m) => m.group === group ? { ...m, enabled: true } : m))}
                className="text-xs text-green-400 hover:text-green-300 transition-colors"
              >
                Aktifkan semua
              </button>
              <span className="text-gray-700">|</span>
              <button
                onClick={() => setMethods((prev) => prev.map((m) => m.group === group ? { ...m, enabled: false } : m))}
                className="text-xs text-red-400 hover:text-red-300 transition-colors"
              >
                Nonaktifkan semua
              </button>
            </div>
          </div>

          {/* Method rows */}
          <div className="divide-y divide-white/5">
            {groupMethods.map((method) => (
              <div
                key={method.id}
                className={`flex items-center gap-3 px-5 py-3 transition-colors ${method.enabled ? "" : "opacity-40"}`}
              >
                {/* On/Off toggle */}
                <button
                  onClick={() => toggle(method.id)}
                  className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${method.enabled ? "bg-purple-600" : "bg-gray-700"}`}
                >
                  <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${method.enabled ? "translate-x-5" : "translate-x-0"}`} />
                </button>

                {/* Name and Icon Input */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {method.iconUrl && (
                      <img src={method.iconUrl} alt={method.name} className="w-5 h-5 object-contain rounded bg-white/10" />
                    )}
                    <p className="text-white text-sm font-medium truncate">{method.name}</p>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <p className="text-gray-500 text-xs font-mono min-w-[3rem]">{method.id}</p>
                    <div className="flex gap-1">
                      <input
                        type="text"
                        placeholder="URL Icon (opsional)"
                        value={method.iconUrl || ""}
                        onChange={(e) => updateIconUrl(method.id, e.target.value)}
                        className="bg-black/20 border border-white/10 rounded px-2 py-1 text-[10px] text-gray-300 w-full max-w-[130px] focus:outline-none focus:border-purple-500 focus:bg-black/40 transition-colors"
                      />
                      <label className="cursor-pointer bg-white/5 hover:bg-purple-500/50 text-gray-400 hover:text-white px-2 py-1 rounded border border-white/10 flex items-center justify-center transition-all" title="Upload Icon Lokal">
                        <Upload className="w-3 h-3" />
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUploadIcon(method.id, file);
                          }} 
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Fee section */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-gray-500 text-xs hidden sm:block">Biaya:</span>

                  {/* Rp / % type toggle */}
                  <div className="flex rounded-lg overflow-hidden border border-white/10 text-xs">
                    <button
                      onClick={() => updateFeeType(method.id, "flat")}
                      className={`px-2.5 py-1 font-medium transition-colors ${
                        method.feeType === "flat"
                          ? "bg-purple-600 text-white"
                          : "bg-gaming-dark text-gray-400 hover:text-white"
                      }`}
                    >
                      Rp
                    </button>
                    <button
                      onClick={() => updateFeeType(method.id, "percent")}
                      className={`px-2.5 py-1 font-medium transition-colors ${
                        method.feeType === "percent"
                          ? "bg-purple-600 text-white"
                          : "bg-gaming-dark text-gray-400 hover:text-white"
                      }`}
                    >
                      %
                    </button>
                  </div>

                  {/* Numeric input */}
                  <input
                    type="number"
                    value={method.fee}
                    onChange={(e) => updateFee(method.id, parseFloat(e.target.value) || 0)}
                    className="w-20 bg-gaming-dark border border-white/10 rounded-lg px-2 py-1 text-white text-xs text-right focus:outline-none focus:ring-1 focus:ring-purple-500"
                    min={0}
                    step={method.feeType === "percent" ? 0.1 : 500}
                    placeholder="0"
                  />

                  {/* Value preview */}
                  <span className="text-xs min-w-[52px] text-right">
                    {method.fee > 0 ? (
                      <span className="text-yellow-400">
                        {method.feeType === "percent" ? `${method.fee}%` : formatCurrency(method.fee)}
                      </span>
                    ) : (
                      <span className="text-gray-600">Gratis</span>
                    )}
                  </span>
                </div>

                {/* Status pill */}
                <span
                  className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                    method.enabled ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-500"
                  }`}
                >
                  {method.enabled ? "Aktif" : "Off"}
                </span>
              </div>
            ))}
          </div>

          {/* Simulasi biaya — tampil jika ada metode aktif dengan biaya */}
          {groupMethods.some((m) => m.enabled && m.fee > 0) && (
            <div className="px-5 py-2.5 bg-gaming-dark/40 border-t border-white/5">
              <p className="text-gray-500 text-xs mb-1.5">
                Simulasi biaya untuk transaksi{" "}
                <span className="text-white">Rp 50.000</span>:
              </p>
              <div className="flex flex-wrap gap-x-5 gap-y-1">
                {groupMethods
                  .filter((m) => m.enabled && m.fee > 0)
                  .map((m) => {
                    const biaya =
                      m.feeType === "percent"
                        ? Math.round(50000 * (m.fee / 100))
                        : m.fee;
                    return (
                      <span key={m.id} className="text-xs text-gray-400">
                        <span className="text-gray-200">{m.name}:</span>{" "}
                        <span className="text-yellow-400 font-medium">+{formatCurrency(biaya)}</span>
                        {m.feeType === "percent" && (
                          <span className="text-gray-600"> ({m.fee}%)</span>
                        )}
                      </span>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Info */}
      <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl p-4">
        <p className="text-blue-300 text-sm font-medium mb-1.5">ℹ️ Catatan</p>
        <ul className="text-gray-400 text-xs space-y-1">
          <li>• Metode yang dinonaktifkan tidak akan muncul di halaman pembayaran Midtrans Snap</li>
          <li>• Tombol <span className="text-white font-mono bg-gaming-accent px-1 rounded">Rp</span> = biaya tetap dalam Rupiah</li>
          <li>• Tombol <span className="text-white font-mono bg-gaming-accent px-1 rounded">%</span> = biaya persentase dari total transaksi</li>
          <li>• Ganti tipe biaya akan mereset nilai ke 0</li>
        </ul>
      </div>

      <div className="flex justify-end pb-4">
        <Button variant="primary" size="lg" onClick={handleSave} loading={saving}>
          <Save className="w-5 h-5" /> Simpan Metode Pembayaran
        </Button>
      </div>
    </div>
  );
}
