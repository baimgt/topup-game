"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, Package, ToggleLeft, ToggleRight, Download, Zap, Upload } from "lucide-react";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import { formatCurrency } from "@/lib/utils";
import ImportProductsModal from "@/components/admin/ImportProductsModal";
import ImportGameModal from "@/components/admin/ImportGameModal";

const CATEGORIES = ["Mobile", "PC", "Console", "RPG", "Lainnya"];
const STATUS_CATEGORIES = ["Lagi Populer", "Baru Rilis", "Voucher", "Top Up Langsung", "Top Up Login", "Pulsa", "Entertainment"];

interface Game { _id: string; name: string; slug: string; description?: string; imageUrl?: string; bannerUrl?: string; iconUrl?: string; category: string; statusCategory?: string; isActive: boolean; sortOrder: number; isCheckAccountSupported: boolean; targetFormat?: string; targetInputs?: any[]; products?: Product[]; categoryOrder?: string[]; }
interface Product { _id: string; name: string; description?: string; price: number; sellingPrice: number; digiflazzSku: string; category: string; isActive: boolean; sortOrder: number; }

function formatSamplePreview(inputs: any[], format?: string) {
  if (!inputs || inputs.length === 0) return "84201379912337";

  const sampleValuesList: string[] = inputs.map((input, idx) => {
    let val = "";
    if (input.placeholder && input.placeholder.replace(/[^0-9a-zA-Z]/g, "").length > 0) {
      const cleaned = input.placeholder.replace(/Contoh:\s*/i, "").trim();
      if (cleaned) val = cleaned;
    }
    if (!val) {
      if (idx === 0) val = "842013799";
      else if (idx === 1) val = "12337";
      else val = `VAL${idx + 1}`;
    }
    return val;
  });

  const fmt = (format || "concat").trim();

  if (fmt === "concat") return sampleValuesList.join("");
  if (fmt === "space") return sampleValuesList.join(" ");
  if (fmt === "pipe") return sampleValuesList.join(" | ");

  // Custom template pattern (e.g. "{1}{2}", "{User ID}-{Zone ID}", "{1} | {2}", etc.)
  let result = fmt;
  inputs.forEach((input, idx) => {
    const val = sampleValuesList[idx];
    result = result.replace(new RegExp(`\\{${idx + 1}\\}`, "gi"), val);
    if (input.name) {
      result = result.replace(new RegExp(`\\{${escapeRegExp(input.name)}\\}`, "gi"), val);
    }
    if (input.label) {
      result = result.replace(new RegExp(`\\{${escapeRegExp(input.label)}\\}`, "gi"), val);
    }
  });

  return result;
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getSeparatorLabel(fmt?: string) {
  if (!fmt || fmt === "concat") return "Tanpa Spasi (Direct)";
  if (fmt === "space" || fmt === " ") return "Spasi";
  if (fmt === "pipe" || fmt === " | " || fmt === "|") return "Garis Tegak ( | )";
  if (fmt === "-" || fmt === " - ") return "Strip ( - )";
  return `"${fmt}"`;
}

// ── Edit Game Modal ──────────────────────────────────────────────────────────
function EditGameModal({ game, onClose, onSaved }: { game: Game; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ 
    name: game.name || "", 
    slug: game.slug || "", 
    description: game.description || "", 
    imageUrl: game.imageUrl || "", 
    bannerUrl: game.bannerUrl || game.imageUrl || "",
    iconUrl: game.iconUrl || "",
    category: game.category || CATEGORIES[0], 
    statusCategory: game.statusCategory || "",
    sortOrder: game.sortOrder || 0,
    isCheckAccountSupported: game.isCheckAccountSupported || false,
    targetFormat: (game as any).targetFormat || "concat",
    categoryOrder: (game as any).categoryOrder || [],
    targetInputs: game.targetInputs || [],
  });
  const [saving, setSaving] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [categoriesList, setCategoriesList] = useState<string[]>(game.categoryOrder && game.categoryOrder.length > 0 ? game.categoryOrder : []);

  useEffect(() => {
    if (game._id) {
      const token = localStorage.getItem("token");
      fetch(`/api/admin/products?gameId=${game._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((d) => {
          if (d.success && Array.isArray(d.data)) {
            const set = new Set<string>();
            if (game.categoryOrder && Array.isArray(game.categoryOrder)) {
              game.categoryOrder.forEach((c: string) => set.add(c));
            }
            d.data.forEach((p: any) => {
              if (p.category && p.category.trim()) set.add(p.category.trim());
            });
            const list = Array.from(set);
            setCategoriesList(list);
            setForm((prev) => ({ ...prev, categoryOrder: list }));
          }
        });
    }
  }, [game._id]);

  const moveCategory = (index: number, direction: "up" | "down") => {
    const newList = [...categoriesList];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newList.length) return;
    const temp = newList[index];
    newList[index] = newList[targetIdx];
    newList[targetIdx] = temp;
    setCategoriesList(newList);
    setForm((prev) => ({ ...prev, categoryOrder: newList }));
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingBanner(true);
    const formData = new FormData();
    formData.append("file", file);

    const token = localStorage.getItem("token");

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.url) {
        setForm((prev) => ({ ...prev, bannerUrl: data.url, imageUrl: data.url }));
        toast.success("Gambar banner berhasil diunggah!");
      } else {
        toast.error(data.error || "Gagal mengunggah banner");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan saat mengunggah banner");
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingIcon(true);
    const formData = new FormData();
    formData.append("file", file);

    const token = localStorage.getItem("token");

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.url) {
        setForm((prev) => ({ ...prev, iconUrl: data.url }));
        toast.success("Gambar icon berhasil diunggah!");
      } else {
        toast.error(data.error || "Gagal mengunggah icon");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan saat mengunggah icon");
    } finally {
      setUploadingIcon(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const token = localStorage.getItem("token");
    const isNew = !game._id;
    const res = await fetch(isNew ? "/api/games" : `/api/admin/games/${game._id}`, {
      method: isNew ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.success) { toast.success(`Game berhasil ${isNew ? "ditambahkan" : "diupdate"}`); onSaved(); onClose(); }
    else toast.error(data.error || "Gagal menyimpan");
    setSaving(false);
  };

  const addTargetInput = () => {
    const idx = form.targetInputs.length + 1;
    setForm({ 
      ...form, 
      targetInputs: [
        ...form.targetInputs, 
        { name: `Input ${idx}`, label: "", placeholder: "", type: "text" }
      ] 
    });
  };

  const removeTargetInput = (index: number) => {
    const newInputs = [...form.targetInputs];
    newInputs.splice(index, 1);
    setForm({ ...form, targetInputs: newInputs });
  };

  const updateTargetInput = (index: number, field: string, value: string) => {
    const newInputs = [...form.targetInputs];
    newInputs[index] = { ...newInputs[index], [field]: value };
    setForm({ ...form, targetInputs: newInputs });
  };

  return (
    <div className="space-y-4">
      <Input label="Nama Game" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") })} />
      <Input label="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">Kategori</label>
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full bg-gaming-accent border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm">
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">Status Kategori (Tampil di Home)</label>
        <select value={form.statusCategory} onChange={(e) => setForm({ ...form, statusCategory: e.target.value })} className="w-full bg-gaming-accent border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm">
          <option value="">Tanpa Status Kategori (Tidak Tampil di Home)</option>
          {STATUS_CATEGORIES.map((sc) => <option key={sc} value={sc}>{sc}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">Deskripsi</label>
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full bg-gaming-accent border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none text-sm" />
      </div>
      {/* URL Gambar Banner / Cover */}
      <div className="bg-black/20 border border-white/5 rounded-xl p-3.5 space-y-2">
        <label className="block text-xs font-bold text-purple-300 uppercase tracking-wider">
          🖼️ Gambar Banner / Cover Game (Landscape)
        </label>
        <div className="flex gap-2 items-center">
          <Input 
            value={form.bannerUrl || form.imageUrl} 
            onChange={(e) => setForm({ ...form, bannerUrl: e.target.value, imageUrl: e.target.value })} 
            placeholder="https://... atau klik tombol Unggah Banner" 
          />
          <label className={`flex items-center justify-center gap-1.5 px-4 py-3 bg-purple-600/20 border border-purple-500/30 hover:bg-purple-600/30 text-purple-300 hover:text-white rounded-xl text-sm font-bold transition-all cursor-pointer flex-shrink-0 ${uploadingBanner ? "opacity-50 pointer-events-none" : ""}`}>
            <Upload className="w-4 h-4" />
            {uploadingBanner ? "Mengunggah..." : "Unggah Banner"}
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleBannerUpload} 
              className="hidden" 
            />
          </label>
        </div>
        {(form.bannerUrl || form.imageUrl) && (
          <div className="mt-2 relative h-20 w-full rounded-lg overflow-hidden border border-white/10 bg-black/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={form.bannerUrl || form.imageUrl} alt="Banner Preview" className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      {/* URL Gambar Icon Game (Persegi) */}
      <div className="bg-black/20 border border-white/5 rounded-xl p-3.5 space-y-2">
        <label className="block text-xs font-bold text-cyan-300 uppercase tracking-wider">
          🎮 Gambar Icon Game (Logo / Persegi)
        </label>
        <div className="flex gap-2 items-center">
          <Input 
            value={form.iconUrl} 
            onChange={(e) => setForm({ ...form, iconUrl: e.target.value })} 
            placeholder="https://... atau klik tombol Unggah Icon" 
          />
          <label className={`flex items-center justify-center gap-1.5 px-4 py-3 bg-cyan-600/20 border border-cyan-500/30 hover:bg-cyan-600/30 text-cyan-300 hover:text-white rounded-xl text-sm font-bold transition-all cursor-pointer flex-shrink-0 ${uploadingIcon ? "opacity-50 pointer-events-none" : ""}`}>
            <Upload className="w-4 h-4" />
            {uploadingIcon ? "Mengunggah..." : "Unggah Icon"}
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleIconUpload} 
              className="hidden" 
            />
          </label>
        </div>
        {form.iconUrl && (
          <div className="mt-2 relative w-16 h-16 rounded-xl overflow-hidden border border-cyan-500/30 bg-black/40 shadow-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={form.iconUrl} alt="Icon Preview" className="w-full h-full object-cover" />
          </div>
        )}
      </div>
      <Input label="Urutan Tampil" type="number" value={String(form.sortOrder)} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} />
      
      {/* Target Inputs */}
      <div className="bg-black/20 border border-white/5 rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-white block">Custom Data Target / Kolom Input ID (Opsional)</label>
            <p className="text-xs text-gray-400 mt-0.5">Biarkan kosong untuk menggunakan standar User ID & Server ID.</p>
          </div>
          <Button variant="secondary" size="sm" onClick={addTargetInput}>
            <Plus className="w-4 h-4 mr-1" /> Tambah Kolom
          </Button>
        </div>
        
        {form.targetInputs.length > 0 && (
          <div className="space-y-3">
            {form.targetInputs.map((input: any, idx: number) => (
              <div key={idx} className="bg-white/5 border border-white/10 p-3.5 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                    Kolom Input #{idx + 1}
                  </span>
                  <button 
                    type="button"
                    onClick={() => removeTargetInput(idx)} 
                    className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 font-semibold"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Hapus
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-400 mb-1">Nama System (Key)</label>
                    <Input 
                      placeholder="Contoh: User ID" 
                      value={input.name} 
                      onChange={(e) => updateTargetInput(idx, "name", e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-400 mb-1">Label Teks Kolom (Custom)</label>
                    <Input 
                      placeholder="Contoh: User ID Mobile Legends" 
                      value={input.label || ""} 
                      onChange={(e) => updateTargetInput(idx, "label", e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-400 mb-1">Teks Contoh / Placeholder</label>
                    <Input 
                      placeholder="Contoh: 842013799" 
                      value={input.placeholder || ""} 
                      onChange={(e) => updateTargetInput(idx, "placeholder", e.target.value)} 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-gray-400 mb-1">Tipe Input</label>
                  <select 
                    value={input.type || "text"} 
                    onChange={(e) => updateTargetInput(idx, "type", e.target.value)} 
                    className="bg-gaming-accent border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm w-full"
                  >
                    <option value="text">Teks Bebas (Text)</option>
                    <option value="number">Angka Saja (Number)</option>
                    <option value="email">Email</option>
                    <option value="password">Password (Tersembunyi)</option>
                  </select>
                </div>
              </div>
            ))}

            {/* Target Format Selector & Visual Connector */}
            <div className="bg-purple-950/40 border border-purple-500/30 rounded-xl p-4 space-y-4 mt-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-purple-300 uppercase tracking-wider">
                    Pemisah Antar Kolom ID Target ke Digiflazz
                  </label>
                  <span className="text-[10px] text-purple-400 font-mono">Format Gabungan</span>
                </div>
                <p className="text-xs text-gray-400 mb-3">
                  Tentukan tanda pemisah antara {form.targetInputs.length > 1 ? (
                    <>
                      <span className="text-purple-300 font-semibold">{form.targetInputs[0]?.label || form.targetInputs[0]?.name || "Input 1"}</span> dan <span className="text-purple-300 font-semibold">{form.targetInputs[1]?.label || form.targetInputs[1]?.name || "Input 2"}</span>
                    </>
                  ) : "kolom-kolom input"} saat dikirim ke sistem.
                </p>

                {/* Visual Connector Diagram */}
                {form.targetInputs.length > 1 && (
                  <div className="bg-black/40 border border-white/10 rounded-xl p-3 flex flex-wrap items-center justify-center gap-2 text-xs mb-3">
                    <span className="px-2.5 py-1 bg-purple-900/60 border border-purple-500/40 text-purple-200 font-bold rounded-lg truncate max-w-[140px]">
                      {form.targetInputs[0]?.label || form.targetInputs[0]?.name || "Input 1"}
                    </span>

                    <span className="text-gray-400 font-bold">➔</span>

                    <div className="flex items-center gap-1.5 bg-black/60 border border-purple-400/50 px-3 py-1 rounded-lg">
                      <span className="text-[10px] text-gray-400 font-semibold uppercase">Pemisah:</span>
                      <span className="text-cyan-300 font-mono font-black text-xs">
                        {getSeparatorLabel(form.targetFormat)}
                      </span>
                    </div>

                    <span className="text-gray-400 font-bold">➔</span>

                    <span className="px-2.5 py-1 bg-purple-900/60 border border-purple-500/40 text-purple-200 font-bold rounded-lg truncate max-w-[140px]">
                      {form.targetInputs[1]?.label || form.targetInputs[1]?.name || "Input 2"}
                    </span>
                  </div>
                )}

                {/* Preset Options Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, targetFormat: "concat" })}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      form.targetFormat === "concat" || form.targetFormat === ""
                        ? "bg-purple-600 border-purple-400 text-white shadow-lg ring-2 ring-purple-400/30"
                        : "bg-black/30 border-white/10 text-gray-300 hover:bg-white/10"
                    }`}
                  >
                    <span className="block text-xs font-bold">Tanpa Spasi</span>
                    <span className="block text-[10px] text-purple-200/80 font-mono mt-0.5">84201379912337</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setForm({ ...form, targetFormat: "space" })}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      form.targetFormat === "space" || form.targetFormat === " "
                        ? "bg-purple-600 border-purple-400 text-white shadow-lg ring-2 ring-purple-400/30"
                        : "bg-black/30 border-white/10 text-gray-300 hover:bg-white/10"
                    }`}
                  >
                    <span className="block text-xs font-bold">Spasi</span>
                    <span className="block text-[10px] text-purple-200/80 font-mono mt-0.5">842013799 12337</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setForm({ ...form, targetFormat: "pipe" })}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      form.targetFormat === "pipe" || form.targetFormat === " | " || form.targetFormat === "|"
                        ? "bg-purple-600 border-purple-400 text-white shadow-lg ring-2 ring-purple-400/30"
                        : "bg-black/30 border-white/10 text-gray-300 hover:bg-white/10"
                    }`}
                  >
                    <span className="block text-xs font-bold">Garis Tegak ( | )</span>
                    <span className="block text-[10px] text-purple-200/80 font-mono mt-0.5">842013799 | 12337</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setForm({ ...form, targetFormat: "-" })}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      form.targetFormat === "-" || form.targetFormat === " - "
                        ? "bg-purple-600 border-purple-400 text-white shadow-lg ring-2 ring-purple-400/30"
                        : "bg-black/30 border-white/10 text-gray-300 hover:bg-white/10"
                    }`}
                  >
                    <span className="block text-xs font-bold">Strip ( - )</span>
                    <span className="block text-[10px] text-purple-200/80 font-mono mt-0.5">842013799-12337</span>
                  </button>
                </div>

                {/* Custom Character Input Box */}
                <div className="mt-3 bg-black/30 border border-white/10 rounded-xl p-3 space-y-1.5">
                  <label className="block text-[11px] font-medium text-gray-300">
                    Atau Ketik Karakter Pemisah Kustom Sendiri (Misal: <code className="text-cyan-300 font-mono">#</code>, <code className="text-cyan-300 font-mono">/</code>, <code className="text-cyan-300 font-mono">_</code>, <code className="text-cyan-300 font-mono">@</code>, dll):
                  </label>
                  <Input
                    placeholder="Contoh: # atau / atau -"
                    value={
                      form.targetFormat === "concat" ? "" :
                      form.targetFormat === "space" ? " " :
                      form.targetFormat === "pipe" ? " | " :
                      form.targetFormat
                    }
                    onChange={(e) => setForm({ ...form, targetFormat: e.target.value })}
                  />
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="bg-black/50 border border-purple-500/20 rounded-lg p-3 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-400 font-medium">Contoh Tampilan Hasil yang Terkirim ke Sistem:</span>
                  <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Live Preview</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Hasil Format:</span>
                  <span className="text-cyan-300 font-mono font-bold text-sm bg-cyan-950/60 px-3 py-1 rounded border border-cyan-500/40 tracking-wide">
                    {formatSamplePreview(form.targetInputs, form.targetFormat)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Urutan Tampil Kategori Produk (Pilih Kategori Paling Atas) */}
      {categoriesList.length > 0 && (
        <div className="bg-black/30 border border-purple-500/20 rounded-xl p-4 space-y-3">
          <div>
            <label className="text-sm font-bold text-white block">Urutan Tampil Kategori Produk (Pilih Kategori Paling Atas)</label>
            <p className="text-xs text-gray-400 mt-0.5">
              Gunakan tombol <span className="text-purple-300 font-bold">⬆️ Naik</span> atau <span className="text-purple-300 font-bold">⬇️ Turun</span> untuk menempatkan kategori (seperti <span className="text-emerald-400 font-bold">Bulanan / Membership</span>) di posisi paling atas tampilan user.
            </p>
          </div>
          <div className="space-y-2">
            {categoriesList.map((cat, idx) => (
              <div key={cat} className="flex items-center justify-between bg-white/5 border border-white/10 px-3.5 py-2 rounded-xl text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-purple-600/40 text-purple-300 font-mono text-[10px] flex items-center justify-center font-bold">
                    {idx + 1}
                  </span>
                  <span className="text-white text-sm">{cat}</span>
                  {idx === 0 && (
                    <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded border border-emerald-500/30 font-bold">
                      ⭐ Paling Atas
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveCategory(idx, "up")}
                    className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-purple-300 disabled:opacity-30 disabled:pointer-events-none rounded-lg border border-white/10 transition-all text-xs font-bold"
                  >
                    ⬆️ Naik
                  </button>
                  <button
                    type="button"
                    disabled={idx === categoriesList.length - 1}
                    onClick={() => moveCategory(idx, "down")}
                    className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-purple-300 disabled:opacity-30 disabled:pointer-events-none rounded-lg border border-white/10 transition-all text-xs font-bold"
                  >
                    ⬇️ Turun
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between bg-gaming-accent/50 border border-white/10 p-4 rounded-xl">
        <div>
          <label className="text-sm font-medium text-white block">Support Cek Akun</label>
          <p className="text-xs text-gray-400 mt-0.5">Aktifkan untuk memunculkan tombol Cek Akun (Validasi ID) saat top up.</p>
        </div>
        <button
          type="button"
          onClick={() => setForm({ ...form, isCheckAccountSupported: !form.isCheckAccountSupported })}
          className={`flex-shrink-0 transition-colors ${form.isCheckAccountSupported ? "text-green-400 hover:text-green-300" : "text-gray-500 hover:text-gray-400"}`}
        >
          {form.isCheckAccountSupported ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
        </button>
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="secondary" className="flex-1" onClick={onClose}>Batal</Button>
        <Button variant="primary" className="flex-1" loading={saving} onClick={handleSave}>Simpan</Button>
      </div>
    </div>
  );
}

// ── Edit Product Modal ───────────────────────────────────────────────────────
function EditProductModal({
  product,
  existingCategories = [],
  onClose,
  onSaved,
}: {
  product: Product;
  existingCategories?: string[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({ name: product.name, description: product.description || "", price: product.price, sellingPrice: product.sellingPrice, digiflazzSku: product.digiflazzSku, category: product.category, sortOrder: product.sortOrder });
  const [saving, setSaving] = useState(false);

  const margin = form.sellingPrice - form.price;
  const marginPct = form.price > 0 ? ((margin / form.price) * 100).toFixed(0) : "0";

  const handleSave = async () => {
    setSaving(true);
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/admin/products/${product._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.success) { toast.success("Produk berhasil diupdate"); onSaved(); onClose(); }
    else toast.error(data.error || "Gagal menyimpan");
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <Input label="Nama Produk" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Harga Modal (Rp)" type="number" value={String(form.price)} onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) || 0 })} />
        <Input label="Harga Jual (Rp)" type="number" value={String(form.sellingPrice)} onChange={(e) => setForm({ ...form, sellingPrice: parseInt(e.target.value) || 0 })} />
      </div>
      {/* Margin preview */}
      <div className={`rounded-lg px-4 py-2.5 text-sm ${margin >= 0 ? "bg-green-500/10 border border-green-500/20 text-green-400" : "bg-red-500/10 border border-red-500/20 text-red-400"}`}>
        Margin: {formatCurrency(margin)} ({marginPct}%)
      </div>
      <Input label="SKU Digiflazz" value={form.digiflazzSku} onChange={(e) => setForm({ ...form, digiflazzSku: e.target.value })} />
      <div>
        <Input label="Kategori Produk" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Top Up, Bulanan, Pass, Voucher, dll" />
        {existingCategories && existingCategories.length > 0 && (
          <div className="mt-2 space-y-1.5">
            <span className="text-[11px] text-gray-400 font-medium">Kategori yang Sudah Ada di Game Ini:</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {existingCategories.map((cat) => {
                const isSelected = form.category?.trim().toLowerCase() === cat.toLowerCase();
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setForm({ ...form, category: cat })}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all font-semibold flex items-center gap-1 ${
                      isSelected
                        ? "bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-sm"
                        : "bg-white/5 hover:bg-white/10 text-gray-300 border-white/10"
                    }`}
                  >
                    <span>🏷️</span>
                    <span>{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">Deskripsi (opsional)</label>
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full bg-gaming-accent border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none text-sm" />
      </div>
      <Input label="Urutan Tampil" type="number" value={String(form.sortOrder)} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} />
      <div className="flex gap-3 pt-2">
        <Button variant="secondary" className="flex-1" onClick={onClose}>Batal</Button>
        <Button variant="primary" className="flex-1" loading={saving} onClick={handleSave}>Simpan</Button>
      </div>
    </div>
  );
}

// ── Add Product Modal ────────────────────────────────────────────────────────
function AddProductModal({
  gameId,
  existingCategories = [],
  onClose,
  onSaved,
}: {
  gameId: string;
  existingCategories?: string[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({ name: "", description: "", price: "", sellingPrice: "", digiflazzSku: "", category: existingCategories[0] || "Top Up", sortOrder: "0" });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.name || !form.price || !form.sellingPrice || !form.digiflazzSku || !form.category) {
      toast.error("Lengkapi semua field wajib"); return;
    }
    setSaving(true);
    const token = localStorage.getItem("token");
    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...form, gameId, price: parseInt(form.price), sellingPrice: parseInt(form.sellingPrice), sortOrder: parseInt(form.sortOrder) }),
    });
    const data = await res.json();
    if (data.success) { toast.success("Produk berhasil ditambahkan"); onSaved(); onClose(); }
    else toast.error(data.error || "Gagal menambahkan");
    setSaving(false);
  };

  const margin = parseInt(form.sellingPrice || "0") - parseInt(form.price || "0");

  return (
    <div className="space-y-4">
      <Input label="Nama Produk *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="86 Diamond" />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Harga Modal (Rp) *" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="15000" />
        <Input label="Harga Jual (Rp) *" type="number" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} placeholder="17000" />
      </div>
      {form.price && form.sellingPrice && (
        <div className={`rounded-lg px-4 py-2 text-sm ${margin >= 0 ? "bg-green-500/10 border border-green-500/20 text-green-400" : "bg-red-500/10 border border-red-500/20 text-red-400"}`}>
          Margin: {formatCurrency(margin)}
        </div>
      )}
      <Input label="SKU Digiflazz *" value={form.digiflazzSku} onChange={(e) => setForm({ ...form, digiflazzSku: e.target.value })} placeholder="mlbb-86" />
      <div>
        <Input label="Kategori Produk *" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Top Up, Bulanan, Pass, Voucher, dll" />
        {existingCategories && existingCategories.length > 0 && (
          <div className="mt-2 space-y-1.5">
            <span className="text-[11px] text-gray-400 font-medium">Kategori yang Sudah Ada di Game Ini:</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {existingCategories.map((cat) => {
                const isSelected = form.category?.trim().toLowerCase() === cat.toLowerCase();
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setForm({ ...form, category: cat })}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all font-semibold flex items-center gap-1 ${
                      isSelected
                        ? "bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-sm"
                        : "bg-white/5 hover:bg-white/10 text-gray-300 border-white/10"
                    }`}
                  >
                    <span>🏷️</span>
                    <span>{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">Deskripsi (opsional)</label>
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full bg-gaming-accent border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none text-sm" />
      </div>
      <Input label="Urutan Tampil" type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} />
      <div className="flex gap-3 pt-2">
        <Button variant="secondary" className="flex-1" onClick={onClose}>Batal</Button>
        <Button variant="primary" className="flex-1" loading={saving} onClick={handleSave}>Tambah Produk</Button>
      </div>
    </div>
  );
}

function getGameCategories(products?: Product[]): string[] {
  if (!products || products.length === 0) return [];
  const set = new Set<string>();
  products.forEach((p) => {
    if (p.category && p.category.trim()) {
      set.add(p.category.trim());
    }
  });
  return Array.from(set);
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function AdminGamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [productsByGame, setProductsByGame] = useState<Record<string, Product[]>>({});
  const [loadingProducts, setLoadingProducts] = useState<string | null>(null);

  // Modals
  const [editGame, setEditGame] = useState<Game | null>(null);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [addProductGameId, setAddProductGameId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "game" | "product"; id: string; name: string } | null>(null);
  const [importGame, setImportGame] = useState<Game | null | undefined>(undefined);
  const [showImportGameModal, setShowImportGameModal] = useState(false);

  const fetchGames = async () => {
    setLoading(true);
    // Pakai endpoint admin agar semua game tampil (termasuk nonaktif)
    const token = localStorage.getItem("token");
    const res = await fetch("/api/games?admin=1", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.success) setGames(data.data);
    setLoading(false);
  };

  useEffect(() => { fetchGames(); }, [refreshKey]);

  const loadProducts = async (gameId: string) => {
    if (productsByGame[gameId]) return; // already loaded
    setLoadingProducts(gameId);
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/admin/products?gameId=${gameId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.success) {
      setProductsByGame((prev) => ({ ...prev, [gameId]: data.data }));
    }
    setLoadingProducts(null);
  };

  const toggleExpand = (gameId: string) => {
    if (expandedId === gameId) {
      setExpandedId(null);
    } else {
      setExpandedId(gameId);
      loadProducts(gameId);
    }
  };

  const refreshProducts = async (gameId: string) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/admin/products?gameId=${gameId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.success) {
      setProductsByGame((prev) => ({ ...prev, [gameId]: data.data }));
    }
  };

  const toggleGameActive = async (game: Game) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/admin/games/${game._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ isActive: !game.isActive }),
    });
    const data = await res.json();
    if (data.success) { toast.success(`Game ${!game.isActive ? "diaktifkan" : "dinonaktifkan"}`); fetchGames(); }
    else toast.error("Gagal mengubah status");
  };

  const toggleProductActive = async (product: Product, gameId: string) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/admin/products/${product._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ isActive: !product.isActive }),
    });
    const data = await res.json();
    if (data.success) { toast.success(`Produk ${!product.isActive ? "diaktifkan" : "dinonaktifkan"}`); refreshProducts(gameId); }
    else toast.error("Gagal mengubah status");
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
        const token = localStorage.getItem("token");
    const url = deleteConfirm.type === "game"
      ? `/api/admin/games/${deleteConfirm.id}`
      : `/api/admin/products/${deleteConfirm.id}`;
    const res = await fetch(url, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (data.success) {
      toast.success(`${deleteConfirm.type === "game" ? "Game" : "Produk"} berhasil dihapus`);
      if (deleteConfirm.type === "game") fetchGames();
      else {
        const gameId = games.find((g) => productsByGame[g._id]?.some((p) => p._id === deleteConfirm.id))?._id;
        if (gameId) refreshProducts(gameId);
      }
    } else toast.error("Gagal menghapus");
    setDeleteConfirm(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/[0.02] backdrop-blur-md border border-white/5 p-6 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[80px] rounded-full pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">Data Game</h1>
          <p className="text-gray-400 text-sm mt-1">Kelola {games.length} game yang tersedia di website Anda.</p>
        </div>
        <div className="relative z-10 flex gap-3">
          <button
            onClick={() => setShowImportGameModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 hover:from-blue-600/30 hover:to-cyan-600/30 text-cyan-300 border border-blue-500/30 px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] hover:scale-105"
          >
            <Zap className="w-4 h-4 text-cyan-400" />
            Auto-Import
          </button>
          <button 
            onClick={() => setEditGame({} as Game)}
            className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-purple-500/25 hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            Game Manual
          </button>
        </div>
      </div>

      {/* Game List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-gaming-card rounded-xl border border-white/5 p-4 animate-pulse h-16" />
          ))}
        </div>
      ) : games.length === 0 ? (
        <div className="bg-gaming-card rounded-xl border border-white/5 p-12 text-center text-gray-500">
          Belum ada game. Tambahkan game pertama!
        </div>
      ) : (
        <div className="space-y-3">
          {games.map((game) => {
            const isExpanded = expandedId === game._id;
            const products = productsByGame[game._id] || [];

            return (
              <div key={game._id} className="bg-gaming-card rounded-xl border border-white/5 overflow-hidden">
                {/* Game Row */}
                <div className="flex items-center gap-4 px-4 py-3">
                  {/* Avatar / Icon */}
                  <div className="w-11 h-11 rounded-xl overflow-hidden bg-gradient-to-br from-purple-500/30 to-blue-500/30 border border-white/10 flex items-center justify-center flex-shrink-0 relative shadow-sm">
                    {(game.iconUrl || game.imageUrl) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={game.iconUrl || game.imageUrl} alt={game.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white font-bold text-sm">{game.name.charAt(0)}</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium text-sm">{game.name}</span>
                      <Badge variant={game.isActive ? "success" : "default"} className="text-xs">
                        {game.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-gray-500 text-xs px-2 py-0.5 rounded-md bg-white/5 border border-white/5">{game.category}</span>
                      <span className="text-gray-700 text-xs">•</span>
                      <span className="text-gray-400 text-xs font-mono bg-black/20 px-2 py-0.5 rounded-md">/{game.slug}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => setEditGame(game)} title="Edit game" className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleGameActive(game)}
                      title={game.isActive ? "Nonaktifkan" : "Aktifkan"}
                      className={`p-2 rounded-lg transition-all ${game.isActive ? "text-yellow-400 hover:bg-yellow-500/10" : "text-green-400 hover:bg-green-500/10"}`}
                    >
                      {game.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => setDeleteConfirm({ type: "game", id: game._id, name: game.name })}
                      className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
                      title="Hapus game"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    
                    {/* Divider */}
                    <div className="w-px h-6 bg-white/10 mx-1"></div>

                    {/* Expand toggle */}
                    <button
                      onClick={() => toggleExpand(game._id)}
                      className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all border border-white/5"
                    >
                      <Package className="w-4 h-4" />
                      Produk
                      {isExpanded ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
                    </button>
                    {/* Import dari Digiflazz */}
                    <button
                      onClick={() => setImportGame(game)}
                      className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600/20 to-cyan-600/20 hover:from-purple-600/40 hover:to-cyan-600/40 text-white border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                    >
                      <Download className="w-4 h-4 text-cyan-400" />
                      Import
                    </button>
                  </div>
                </div>

                {/* Products Panel */}
                {isExpanded && (
                  <div className="border-t border-white/5 bg-black/40 backdrop-blur-sm p-2 rounded-b-2xl">
                    {/* Products header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-white/5 rounded-xl border border-white/5 mb-2">
                      <span className="text-gray-300 text-sm font-bold">
                        {loadingProducts === game._id ? "Memuat produk..." : `${products.length} Produk Tersedia`}
                      </span>
                      <button onClick={() => setAddProductGameId(game._id)} className="flex items-center gap-1.5 bg-purple-500 hover:bg-purple-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-lg shadow-purple-500/20">
                        <Plus className="w-3.5 h-3.5" /> Tambah Produk
                      </button>
                    </div>

                    {loadingProducts === game._id ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full" />
                      </div>
                    ) : products.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 text-sm bg-black/20 rounded-xl border border-white/5">
                        Belum ada produk untuk game ini
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {products.map((product) => {
                          const margin = product.sellingPrice - product.price;
                          return (
                            <div key={product._id} className="flex items-center gap-4 px-4 py-3 bg-white/[0.02] hover:bg-white/[0.06] rounded-xl border border-white/5 transition-all group">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-white text-sm font-bold group-hover:text-cyan-400 transition-colors">{product.name}</span>
                                  <Badge variant={product.isActive ? "success" : "default"} className="text-[10px] uppercase tracking-wider px-2 py-0.5">
                                    {product.isActive ? "Aktif" : "Off"}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-3 mt-1.5">
                                  <span className="text-gray-400 text-xs font-mono bg-black/20 px-2 py-0.5 rounded-md border border-white/5">{product.digiflazzSku}</span>
                                  <span className="text-gray-500 text-xs">{product.category}</span>
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0 bg-black/20 px-3 py-1.5 rounded-xl border border-white/5">
                                <div className="text-white text-sm font-black">{formatCurrency(product.sellingPrice)}</div>
                                <div className="text-green-400 text-xs font-medium">Margin: +{formatCurrency(margin)}</div>
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0 pl-2 border-l border-white/5">
                                <button onClick={() => setEditProduct(product)} title="Edit produk" className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => toggleProductActive(product, game._id)}
                                  className={product.isActive ? "text-yellow-400 hover:text-yellow-300" : "text-green-400 hover:text-green-300"}
                                >
                                  {product.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                                </button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeleteConfirm({ type: "product", id: product._id, name: product.name })}
                                  className="text-red-400 hover:text-red-300"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Game Modal */}
      <Modal open={!!editGame} onClose={() => setEditGame(null)} title="Edit Game">
        {editGame && <EditGameModal game={editGame} onClose={() => setEditGame(null)} onSaved={fetchGames} />}
      </Modal>

      {/* Edit Product Modal */}
      <Modal open={!!editProduct} onClose={() => setEditProduct(null)} title="Edit Produk">
        {editProduct && (() => {
          const gameId = games.find((g) => productsByGame[g._id]?.some((p) => p._id === editProduct._id))?._id || "";
          return (
            <EditProductModal
              product={editProduct}
              existingCategories={getGameCategories(productsByGame[gameId] || [])}
              onClose={() => setEditProduct(null)}
              onSaved={() => {
                if (gameId) refreshProducts(gameId);
              }}
            />
          );
        })()}
      </Modal>

      {/* Add Product Modal */}
      <Modal open={!!addProductGameId} onClose={() => setAddProductGameId(null)} title="Tambah Produk">
        {addProductGameId && <AddProductModal gameId={addProductGameId} onClose={() => setAddProductGameId(null)} onSaved={() => refreshProducts(addProductGameId)} />}
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Konfirmasi Hapus" size="sm">
        {deleteConfirm && (
          <div className="space-y-4">
            <p className="text-gray-300 text-sm">
              Yakin ingin menghapus <span className="text-white font-semibold">{deleteConfirm.name}</span>?
              {deleteConfirm.type === "game" && <span className="block text-red-400 text-xs mt-1">Semua produk dalam game ini juga akan terhapus.</span>}
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setDeleteConfirm(null)}>Batal</Button>
              <Button variant="danger" className="flex-1" onClick={handleDelete}>Hapus</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Import Produk dari Digiflazz */}
      <ImportProductsModal
        open={importGame !== undefined}
        onClose={() => setImportGame(undefined)}
        onImported={() => {
          if (importGame) refreshProducts(importGame._id);
          setImportGame(undefined);
          setRefreshKey((k) => k + 1);
        }}
        preselectedGame={importGame || undefined}
      />

      {/* Tambah Game dari Digiflazz */}
      <ImportGameModal
        open={showImportGameModal}
        onClose={() => setShowImportGameModal(false)}
        onImported={() => {
          setShowImportGameModal(false);
          setRefreshKey((k) => k + 1); // trigger re-fetch
        }}
      />
    </div>
  );
}
