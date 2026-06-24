"use client";

import { useEffect, useState } from "react";
import { Save, Globe, Phone, Mail, AlertTriangle, Megaphone, Shield, Eye, EyeOff, Settings2, Instagram } from "lucide-react";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import GatewayTab from "../payment/tabs/GatewayTab";

interface Settings {
  siteName: string;
  siteLogo: string;
  siteDescription: string;
  contactEmail: string;
  contactPhone: string;
  whatsappNumber: string;
  instagramUrl: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  announcementEnabled: boolean;
  announcementText: string;
  announcementImage: string;
  announcementUrl: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  smtpFrom: string;
}

const defaultSettings: Settings = {
  siteName: "GamerStore",
  siteLogo: "",
  siteDescription: "Platform top up game terpercaya",
  contactEmail: "support@gametopup.com",
  contactPhone: "+62 812-3456-7890",
  whatsappNumber: "6281234567890",
  instagramUrl: "https://instagram.com/gametopup",
  maintenanceMode: false,
  maintenanceMessage: "Website sedang dalam maintenance. Silakan coba beberapa saat lagi.",
  announcementEnabled: false,
  announcementText: "",
  announcementImage: "",
  announcementUrl: "",
  smtpHost: "",
  smtpPort: 587,
  smtpUser: "",
  smtpPass: "",
  smtpFrom: "",
};

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<"umum" | "api">("umum");
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSmtpPass, setShowSmtpPass] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("/api/admin/settings", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data && Object.keys(d.data).length > 0) {
          setSettings({ ...defaultSettings, ...d.data });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const token = localStorage.getItem("token");
    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(settings),
    });
    const data = await res.json();
    if (data.success) {
      toast.success("Pengaturan berhasil disimpan!");
    } else {
      toast.error("Gagal menyimpan pengaturan");
    }
    setSaving(false);
  };

  const update = (key: keyof Settings, value: string | boolean | number) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/[0.02] backdrop-blur-md border border-white/5 p-6 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[80px] rounded-full pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">Pengaturan Website</h1>
          <p className="text-gray-400 text-sm mt-1">Kelola informasi dasar, kontak, dan mode maintenance.</p>
        </div>
        <div className="relative z-10">
          {activeTab === "umum" && (
            <button 
              onClick={handleSave} 
              disabled={saving}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-purple-500/25 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Simpan Perubahan
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white/[0.02] backdrop-blur-md rounded-2xl border border-white/5 p-2 w-fit">
        <button
          onClick={() => setActiveTab("umum")}
          className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === "umum"
              ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/25"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Globe className="w-4 h-4" />
          Umum
        </button>
        <button
          onClick={() => setActiveTab("api")}
          className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === "api"
              ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/25"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Settings2 className="w-4 h-4" />
          API Gateway
        </button>
      </div>

      {activeTab === "umum" ? (
        <div className="space-y-6">
          {/* Informasi Website */}
      <div className="bg-white/[0.02] backdrop-blur-md rounded-2xl border border-white/5 p-6 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center gap-3 mb-6 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
            <Globe className="w-5 h-5 text-blue-400" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Informasi Website</h2>
        </div>
        <div className="space-y-5 relative z-10">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Logo Website</label>
            <div className="flex items-center gap-4">
              {settings.siteLogo ? (
                <img
                  src={settings.siteLogo}
                  alt="Site Logo"
                  className="w-16 h-16 object-contain rounded-lg border border-white/10 bg-black/20"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg border border-white/10 bg-black/20 flex items-center justify-center text-gray-500 text-xs">No Logo</div>
              )}
              <label className="flex items-center justify-center px-4 py-2 bg-black/20 border border-white/10 rounded-xl cursor-pointer hover:bg-white/5 transition-colors text-sm text-gray-300">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    
                    const toastId = toast.loading("Mengunggah logo...");
                    try {
                      const formData = new FormData();
                      formData.append("file", file);
                      const res = await fetch("/api/admin/upload", {
                        method: "POST",
                        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                        body: formData,
                      });
                      const data = await res.json();
                      if (data.success) {
                        update("siteLogo", data.url);
                        toast.success("Logo berhasil diunggah", { id: toastId });
                      } else {
                        throw new Error(data.error);
                      }
                    } catch (err: any) {
                      toast.error(err.message || "Gagal mengunggah", { id: toastId });
                    }
                  }}
                />
                Upload Logo
              </label>
            </div>
          </div>

          <Input
            label="Nama Website"
            value={settings.siteName}
            onChange={(e) => update("siteName", e.target.value)}
            placeholder="GamerStore"
          />
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Deskripsi Website</label>
            <textarea
              value={settings.siteDescription}
              onChange={(e) => update("siteDescription", e.target.value)}
              rows={3}
              className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none text-sm transition-shadow"
              placeholder="Deskripsi singkat website..."
            />
          </div>
        </div>
      </div>

      {/* Kontak */}
      <div className="bg-white/[0.02] backdrop-blur-md rounded-2xl border border-white/5 p-6 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-green-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center gap-3 mb-6 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center border border-green-500/20">
            <Phone className="w-5 h-5 text-green-400" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Informasi Kontak</h2>
        </div>
        <div className="space-y-5 relative z-10">
          <Input
            label="Email Support"
            type="email"
            value={settings.contactEmail}
            onChange={(e) => update("contactEmail", e.target.value)}
            icon={<Mail className="w-4 h-4" />}
            placeholder="support@gametopup.com"
          />
          <Input
            label="Nomor Telepon"
            value={settings.contactPhone}
            onChange={(e) => update("contactPhone", e.target.value)}
            icon={<Phone className="w-4 h-4" />}
            placeholder="+62 812-3456-7890"
          />
          <Input
            label="Nomor WhatsApp (format: 628xxx)"
            value={settings.whatsappNumber}
            onChange={(e) => update("whatsappNumber", e.target.value)}
            placeholder="6281234567890"
          />
          <Input
            label="Link Instagram"
            value={settings.instagramUrl}
            onChange={(e) => update("instagramUrl", e.target.value)}
            icon={<Instagram className="w-4 h-4" />}
            placeholder="https://instagram.com/username"
          />
        </div>
      </div>

      {/* Pengumuman */}
      <div className="bg-white/[0.02] backdrop-blur-md rounded-2xl border border-white/5 p-6 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center gap-3 mb-6 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
            <Megaphone className="w-5 h-5 text-yellow-400" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Pengumuman</h2>
        </div>
        <div className="space-y-5 relative z-10">
          <label className="flex items-center gap-4 cursor-pointer p-3 bg-black/20 border border-white/5 rounded-xl hover:bg-white/5 transition-colors">
            <div
              onClick={() => update("announcementEnabled", !settings.announcementEnabled)}
              className={`relative w-12 h-7 rounded-full transition-colors duration-300 ${settings.announcementEnabled ? "bg-purple-600 shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]" : "bg-white/10"}`}
            >
              <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${settings.announcementEnabled ? "translate-x-5" : "translate-x-0"}`} />
            </div>
            <div>
              <div className="text-white font-bold text-sm">Tampilkan Pengumuman</div>
              <div className="text-gray-500 text-xs mt-0.5">Munculkan banner pengumuman di bagian atas halaman utama.</div>
            </div>
          </label>
          
          {settings.announcementEnabled && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Gambar Promo / Banner</label>
                <div className="flex items-center gap-4">
                  {settings.announcementImage && (
                    <img
                      src={settings.announcementImage}
                      alt="Banner Preview"
                      className="w-32 h-auto rounded-lg border border-white/10"
                    />
                  )}
                  <label className="flex items-center justify-center px-4 py-2 bg-black/20 border border-white/10 rounded-xl cursor-pointer hover:bg-white/5 transition-colors text-sm text-gray-300">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        
                        const toastId = toast.loading("Mengunggah gambar...");
                        try {
                          const formData = new FormData();
                          formData.append("file", file);
                          const res = await fetch("/api/admin/upload", {
                            method: "POST",
                            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                            body: formData,
                          });
                          const data = await res.json();
                          if (data.success) {
                            update("announcementImage", data.url);
                            toast.success("Gambar berhasil diunggah", { id: toastId });
                          } else {
                            throw new Error(data.error);
                          }
                        } catch (err: any) {
                          toast.error(err.message || "Gagal mengunggah", { id: toastId });
                        }
                      }}
                    />
                    Upload Gambar
                  </label>
                </div>
              </div>

              <Input
                label="Redirect URL (Link Tujuan)"
                value={settings.announcementUrl}
                onChange={(e) => update("announcementUrl", e.target.value)}
                placeholder="https://example.com/promo"
              />

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Teks Pengumuman</label>
                <textarea
                  value={settings.announcementText}
                  onChange={(e) => update("announcementText", e.target.value)}
                  rows={2}
                  className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none text-sm transition-shadow"
                  placeholder="Contoh: Promo spesial! Top up Mobile Legends diskon 10% hari ini."
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Maintenance */}
      <div className={`bg-white/[0.02] backdrop-blur-md rounded-2xl border p-6 relative overflow-hidden transition-colors duration-500 ${settings.maintenanceMode ? "border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.1)]" : "border-white/5"}`}>
        {settings.maintenanceMode && <div className="absolute top-0 right-0 w-full h-full bg-red-500/5 pointer-events-none animate-pulse" />}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-center gap-3 mb-6 relative z-10">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors ${settings.maintenanceMode ? "bg-red-500/20 border-red-500/30" : "bg-orange-500/10 border-orange-500/20"}`}>
            <AlertTriangle className={`w-5 h-5 ${settings.maintenanceMode ? "text-red-400" : "text-orange-400"}`} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Mode Maintenance</h2>
            {settings.maintenanceMode && (
              <span className="inline-block mt-1 bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md animate-pulse">AKTIF</span>
            )}
          </div>
        </div>

        <div className="space-y-5 relative z-10">
          <label className="flex items-center gap-4 cursor-pointer p-3 bg-black/20 border border-white/5 rounded-xl hover:bg-white/5 transition-colors">
            <div
              onClick={() => update("maintenanceMode", !settings.maintenanceMode)}
              className={`relative w-12 h-7 rounded-full transition-colors duration-300 ${settings.maintenanceMode ? "bg-red-600 shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]" : "bg-white/10"}`}
            >
              <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${settings.maintenanceMode ? "translate-x-5" : "translate-x-0"}`} />
            </div>
            <div>
              <div className="text-white font-bold text-sm">Aktifkan Maintenance</div>
              <div className="text-gray-500 text-xs mt-0.5">Tutup akses website untuk pengunjung publik.</div>
            </div>
          </label>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Pesan Maintenance</label>
            <textarea
              value={settings.maintenanceMessage}
              onChange={(e) => update("maintenanceMessage", e.target.value)}
              rows={2}
              className={`w-full bg-black/20 border rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none text-sm transition-all ${settings.maintenanceMode ? "border-red-500/30" : "border-white/5"}`}
            />
          </div>
        </div>
      </div>

      {/* Konfigurasi SMTP */}
      <div className="bg-white/[0.02] backdrop-blur-md rounded-2xl border border-white/5 p-6 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center gap-3 mb-6 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
            <Mail className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Konfigurasi SMTP</h2>
            <p className="text-gray-400 text-xs mt-0.5">Atur pengiriman email OTP pendaftaran manual (opsional, kosongkan untuk fallback konsol server/env).</p>
          </div>
        </div>
        
        <div className="space-y-5 relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="sm:col-span-3">
              <Input
                label="SMTP Host"
                value={settings.smtpHost}
                onChange={(e) => update("smtpHost", e.target.value)}
                placeholder="smtp.mailtrap.io atau smtp.gmail.com"
              />
            </div>
            <div className="sm:col-span-1">
              <Input
                label="SMTP Port"
                type="number"
                value={settings.smtpPort.toString()}
                onChange={(e) => update("smtpPort", parseInt(e.target.value) || 587)}
                placeholder="587"
              />
            </div>
          </div>

          <Input
            label="SMTP Username"
            value={settings.smtpUser}
            onChange={(e) => update("smtpUser", e.target.value)}
            placeholder="Username atau email SMTP Anda"
          />

          <div className="relative">
            <Input
              label="SMTP Password"
              type={showSmtpPass ? "text" : "password"}
              value={settings.smtpPass}
              onChange={(e) => update("smtpPass", e.target.value)}
              placeholder="Password SMTP Anda"
            />
            <button
              type="button"
              onClick={() => setShowSmtpPass(!showSmtpPass)}
              className="absolute right-3 top-[38px] text-gray-400 hover:text-white transition-colors"
            >
              {showSmtpPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <Input
            label="SMTP Sender (From Email)"
            value={settings.smtpFrom}
            onChange={(e) => update("smtpFrom", e.target.value)}
            placeholder="GamerStore <no-reply@gametopup.com>"
          />
        </div>
      </div>

      {/* API Keys Info */}
      <div className="bg-white/[0.02] backdrop-blur-md rounded-2xl border border-white/5 p-6 relative overflow-hidden">
        <div className="flex items-center gap-3 mb-6 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
            <Shield className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Konfigurasi API</h2>
            <p className="text-gray-400 text-xs mt-0.5">API keys dikonfigurasi melalui <code className="bg-black/30 px-1.5 py-0.5 rounded text-cyan-300 border border-white/5 font-mono">.env.local</code></p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-10">
          {[
            { label: "Digiflazz Username", key: "DIGIFLAZZ_USERNAME" },
            { label: "Digiflazz API Key", key: "DIGIFLAZZ_API_KEY" },
            { label: "Midtrans Server Key", key: "MIDTRANS_SERVER_KEY" },
            { label: "Midtrans Client Key", key: "MIDTRANS_CLIENT_KEY" },
          ].map((item) => (
            <div key={item.key} className="flex flex-col bg-black/20 border border-white/5 rounded-xl p-4">
              <span className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{item.label}</span>
              <code className="text-cyan-400 text-sm font-mono truncate">{item.key}</code>
            </div>
          ))}
        </div>
      </div>
        </div>
      ) : (
        <GatewayTab />
      )}
    </div>
  );
}
