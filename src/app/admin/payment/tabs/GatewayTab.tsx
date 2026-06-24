"use client";

import { useEffect, useState } from "react";
import {
  Save, Eye, EyeOff, CheckCircle, XCircle, Loader2,
  RefreshCw, ExternalLink, AlertTriangle, Zap, CreditCard,
  ShieldCheck, Info,
} from "lucide-react";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

interface Config {
  activePaymentGateway: "midtrans" | "duitku";
  midtransServerKey: string;
  midtransClientKey: string;
  midtransIsProduction: boolean;
  midtransEnabled: boolean;
  duitkuMerchantCode: string;
  duitkuApiKey: string;
  duitkuIsProduction: boolean;
  duitkuEnabled: boolean;
  digiflazzUsername: string;
  digiflazzApiKey: string;
  digiflazzWebhookSecret: string;
  digiflazzEnabled: boolean;
  updatedAt?: string;
  updatedBy?: string;
}

type TestStatus = "idle" | "loading" | "success" | "error";
interface TestResult { status: TestStatus; message: string; details?: Record<string, unknown> }

function Toggle({ value, onChange, label, description }: {
  value: boolean; onChange: (v: boolean) => void; label: string; description?: string;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <div onClick={() => onChange(!value)} className={`relative mt-0.5 w-11 h-6 rounded-full transition-colors flex-shrink-0 ${value ? "bg-purple-600" : "bg-gray-700"}`}>
        <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${value ? "translate-x-5" : "translate-x-0"}`} />
      </div>
      <div>
        <p className="text-gray-200 text-sm font-medium group-hover:text-white transition-colors">{label}</p>
        {description && <p className="text-gray-500 text-xs mt-0.5">{description}</p>}
      </div>
    </label>
  );
}

function SecretInput({ label, value, onChange, placeholder, hint }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; hint?: string;
}) {
  const [show, setShow] = useState(false);
  const isMasked = value.includes("****");
  return (
    <div className="space-y-1">
      <div className="relative">
        <Input label={label} type={show ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="pr-10" />
        <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-9 text-gray-400 hover:text-white transition-colors">
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {isMasked && <p className="text-yellow-500/80 text-xs flex items-center gap-1"><Info className="w-3 h-3" />Nilai tersimpan. Ketik ulang untuk mengubah.</p>}
      {hint && !isMasked && <p className="text-gray-600 text-xs">{hint}</p>}
    </div>
  );
}

function TestBadge({ result }: { result: TestResult }) {
  if (result.status === "idle") return null;
  if (result.status === "loading") return <div className="flex items-center gap-2 text-gray-400 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Menguji koneksi...</div>;
  if (result.status === "success") return (
    <div className="flex items-start gap-2 bg-green-500/10 border border-green-500/20 rounded-xl p-3">
      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-green-300 text-sm font-medium">{result.message}</p>
        {result.details && <div className="mt-1">{Object.entries(result.details).map(([k, v]) => <p key={k} className="text-green-500/70 text-xs">{k}: {String(v)}</p>)}</div>}
      </div>
    </div>
  );
  return (
    <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
      <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
      <p className="text-red-300 text-sm">{result.message}</p>
    </div>
  );
}

export default function GatewayTab() {
  const [config, setConfig] = useState<Config>({ 
    activePaymentGateway: "midtrans",
    midtransServerKey: "", 
    midtransClientKey: "", 
    midtransIsProduction: false, 
    midtransEnabled: true, 
    duitkuMerchantCode: "",
    duitkuApiKey: "",
    duitkuIsProduction: false,
    duitkuEnabled: false,
    digiflazzUsername: "", 
    digiflazzApiKey: "", 
    digiflazzWebhookSecret: "", 
    digiflazzEnabled: true 
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [midtransTest, setMidtransTest] = useState<TestResult>({ status: "idle", message: "" });
  const [digiflazzTest, setDigiflazzTest] = useState<TestResult>({ status: "idle", message: "" });
  const token = () => localStorage.getItem("token") || "";

  useEffect(() => {
    fetch("/api/admin/payment-config", { headers: { Authorization: `Bearer ${token()}` } })
      .then((r) => r.json()).then((d) => { if (d.success && d.data) setConfig((p) => ({ ...p, ...d.data })); })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch("/api/admin/payment-config", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` }, body: JSON.stringify(config) });
    const data = await res.json();
    if (data.success) {
      toast.success("Konfigurasi berhasil disimpan!");
      const reload = await fetch("/api/admin/payment-config", { headers: { Authorization: `Bearer ${token()}` } });
      const rd = await reload.json();
      if (rd.success && rd.data) setConfig((p) => ({ ...p, ...rd.data }));
    } else toast.error(data.error || "Gagal menyimpan");
    setSaving(false);
  };

  const testConnection = async (provider: "midtrans" | "digiflazz") => {
    const setter = provider === "midtrans" ? setMidtransTest : setDigiflazzTest;
    setter({ status: "loading", message: "" });
    const res = await fetch("/api/admin/payment-config/test", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` }, body: JSON.stringify({ provider }) });
    const data = await res.json();
    setter({ status: data.success ? "success" : "error", message: data.message || data.error || "Unknown", details: data.details });
  };

  const update = (key: keyof Config, value: unknown) => setConfig((p) => ({ ...p, [key]: value }));

  if (loading) return <div className="flex justify-center py-16"><div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" /></div>;

  const origin = typeof window !== "undefined" ? window.location.origin : "https://yourdomain.com";

  return (
    <div className="space-y-6 max-w-3xl">
      {config.updatedAt && (
        <div className="flex items-center gap-2 text-gray-500 text-xs">
          <RefreshCw className="w-3 h-3" />
          Terakhir diupdate: {new Date(config.updatedAt).toLocaleString("id-ID")}
          {config.updatedBy && ` oleh ${config.updatedBy}`}
        </div>
      )}

      {/* Active Gateway Switcher */}
      <div className="bg-gaming-card rounded-2xl border border-white/5 overflow-hidden p-6 relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-[50px] rounded-full pointer-events-none" />
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-purple-400" /> Gateway Pembayaran Utama
        </h3>
        <p className="text-gray-400 text-sm mb-5">Pilih gateway pembayaran yang akan digunakan saat pelanggan melakukan checkout.</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button 
            onClick={() => update("activePaymentGateway", "midtrans")}
            className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all ${config.activePaymentGateway === "midtrans" ? "border-blue-500 bg-blue-500/10" : "border-white/5 bg-black/20 hover:border-white/20"}`}
          >
            <div className={`w-4 h-4 rounded-full border-2 mb-4 flex items-center justify-center ${config.activePaymentGateway === "midtrans" ? "border-blue-500" : "border-gray-500"}`}>
              {config.activePaymentGateway === "midtrans" && <div className="w-2 h-2 rounded-full bg-blue-500" />}
            </div>
            <span className="text-white font-bold text-lg mb-1">Midtrans</span>
            <span className="text-gray-400 text-xs text-center">Gunakan Midtrans sebagai pemroses pembayaran</span>
          </button>
          
          <button 
            onClick={() => update("activePaymentGateway", "duitku")}
            className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all ${config.activePaymentGateway === "duitku" ? "border-green-500 bg-green-500/10" : "border-white/5 bg-black/20 hover:border-white/20"}`}
          >
            <div className={`w-4 h-4 rounded-full border-2 mb-4 flex items-center justify-center ${config.activePaymentGateway === "duitku" ? "border-green-500" : "border-gray-500"}`}>
              {config.activePaymentGateway === "duitku" && <div className="w-2 h-2 rounded-full bg-green-500" />}
            </div>
            <span className="text-white font-bold text-lg mb-1">Duitku</span>
            <span className="text-gray-400 text-xs text-center">Gunakan Duitku sebagai pemroses pembayaran</span>
          </button>
        </div>
      </div>

      {/* Midtrans */}
      <div className={`bg-gaming-card rounded-2xl border ${config.activePaymentGateway === "midtrans" ? "border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]" : "border-white/5"} overflow-hidden transition-all duration-300`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-gaming-accent/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center"><CreditCard className="w-5 h-5 text-blue-400" /></div>
            <div><h2 className="text-white font-semibold">Midtrans</h2><p className="text-gray-500 text-xs">Payment gateway untuk menerima pembayaran</p></div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs px-2.5 py-1 rounded-full border ${config.midtransEnabled ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-gray-500/10 text-gray-400 border-gray-500/20"}`}>{config.midtransEnabled ? "Aktif" : "Nonaktif"}</span>
            <a href="https://dashboard.midtrans.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors"><ExternalLink className="w-4 h-4" /></a>
          </div>
        </div>
        <div className="p-6 space-y-5">
          <Toggle value={config.midtransEnabled} onChange={(v) => update("midtransEnabled", v)} label="Aktifkan Midtrans" description="Nonaktifkan untuk sementara menutup semua pembayaran" />
          <div className="bg-gaming-accent/50 rounded-xl p-4 border border-white/5">
            <div className="flex items-center justify-between mb-3">
              <div><p className="text-white text-sm font-medium">Mode Operasi</p><p className="text-gray-500 text-xs mt-0.5">Sandbox untuk testing, Production untuk live</p></div>
              <div className="flex items-center gap-1 bg-gaming-dark rounded-lg p-1">
                <button onClick={() => update("midtransIsProduction", false)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${!config.midtransIsProduction ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30" : "text-gray-500 hover:text-gray-300"}`}>Sandbox</button>
                <button onClick={() => update("midtransIsProduction", true)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${config.midtransIsProduction ? "bg-green-500/20 text-green-300 border border-green-500/30" : "text-gray-500 hover:text-gray-300"}`}>Production</button>
              </div>
            </div>
            {config.midtransIsProduction && (
              <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-lg px-3 py-2">
                <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0" />
                <p className="text-orange-300 text-xs">Mode Production aktif — transaksi akan diproses secara nyata</p>
              </div>
            )}
          </div>
          <SecretInput label="Server Key" value={config.midtransServerKey} onChange={(v) => update("midtransServerKey", v)} placeholder={config.midtransIsProduction ? "Mid-server-xxxx" : "SB-Mid-server-xxxx"} hint="Digunakan di backend untuk membuat transaksi" />
          <SecretInput label="Client Key" value={config.midtransClientKey} onChange={(v) => update("midtransClientKey", v)} placeholder={config.midtransIsProduction ? "Mid-client-xxxx" : "SB-Mid-client-xxxx"} hint="Digunakan di frontend untuk Snap popup" />
          <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2"><ShieldCheck className="w-4 h-4 text-blue-400" /><p className="text-blue-300 text-sm font-medium">URL Notifikasi Webhook</p></div>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-gaming-dark rounded-lg px-3 py-2 text-blue-200 text-xs font-mono break-all">{origin}/api/payment/notification</code>
              <button onClick={() => { navigator.clipboard.writeText(`${origin}/api/payment/notification`); toast.success("URL disalin!"); }} className="text-gray-400 hover:text-white p-2 hover:bg-white/5 rounded-lg transition-colors flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-gray-300 text-sm font-medium">Test Koneksi</p>
            <Button variant="outline" size="sm" onClick={() => testConnection("midtrans")} loading={midtransTest.status === "loading"}><Zap className="w-3.5 h-3.5" /> Test Midtrans</Button>
          </div>
          <TestBadge result={midtransTest} />
        </div>
      </div>

      {/* Duitku */}
      <div className={`bg-gaming-card rounded-2xl border ${config.activePaymentGateway === "duitku" ? "border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.1)]" : "border-white/5"} overflow-hidden transition-all duration-300`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-gaming-accent/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center"><CreditCard className="w-5 h-5 text-green-400" /></div>
            <div>
              <h2 className="text-white font-semibold">Duitku</h2>
              <p className="text-gray-500 text-xs">Payment gateway alternatif</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs px-2.5 py-1 rounded-full border ${config.duitkuEnabled ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-gray-500/10 text-gray-400 border-gray-500/20"}`}>{config.duitkuEnabled ? "Aktif" : "Nonaktif"}</span>
            <a href="https://duitku.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors"><ExternalLink className="w-4 h-4" /></a>
          </div>
        </div>
        <div className="p-6 space-y-5">
          <Toggle value={config.duitkuEnabled} onChange={(v) => update("duitkuEnabled", v)} label="Aktifkan Konfigurasi Duitku" description="Sediakan data API untuk dapat digunakan" />
          <div className="bg-gaming-accent/50 rounded-xl p-4 border border-white/5">
            <div className="flex items-center justify-between mb-3">
              <div><p className="text-white text-sm font-medium">Mode Operasi</p><p className="text-gray-500 text-xs mt-0.5">Sandbox untuk testing, Production untuk live</p></div>
              <div className="flex items-center gap-1 bg-gaming-dark rounded-lg p-1">
                <button onClick={() => update("duitkuIsProduction", false)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${!config.duitkuIsProduction ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30" : "text-gray-500 hover:text-gray-300"}`}>Sandbox</button>
                <button onClick={() => update("duitkuIsProduction", true)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${config.duitkuIsProduction ? "bg-green-500/20 text-green-300 border border-green-500/30" : "text-gray-500 hover:text-gray-300"}`}>Production</button>
              </div>
            </div>
            {config.duitkuIsProduction && (
              <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-lg px-3 py-2">
                <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0" />
                <p className="text-orange-300 text-xs">Mode Production aktif — transaksi akan diproses secara nyata</p>
              </div>
            )}
          </div>
          <div>
            <Input label="Merchant Code" value={config.duitkuMerchantCode} onChange={(e) => update("duitkuMerchantCode", e.target.value)} placeholder={config.duitkuIsProduction ? "Dxxxxxx" : "DSxxxx"} />
            <p className="text-gray-500 text-xs mt-1">Kode Merchant dari Duitku Dashboard</p>
          </div>
          <SecretInput label="API Key" value={config.duitkuApiKey} onChange={(v) => update("duitkuApiKey", v)} placeholder="API Key Duitku" hint="Digunakan di backend untuk membuat signature transaksi" />
          <div className="bg-green-500/5 border border-green-500/15 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2"><ShieldCheck className="w-4 h-4 text-green-400" /><p className="text-green-300 text-sm font-medium">URL Callback / Notifikasi Duitku</p></div>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-gaming-dark rounded-lg px-3 py-2 text-green-200 text-xs font-mono break-all">{origin}/api/payment/duitku</code>
              <button onClick={() => { navigator.clipboard.writeText(`${origin}/api/payment/duitku`); toast.success("URL disalin!"); }} className="text-gray-400 hover:text-white p-2 hover:bg-white/5 rounded-lg transition-colors flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              </button>
            </div>
            <p className="text-gray-500 text-xs mt-2">Masukkan URL ini di menu Project Duitku Anda sebagai Callback URL.</p>
          </div>
        </div>
      </div>

      {/* Digiflazz */}
      <div className="bg-gaming-card rounded-2xl border border-white/5 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-gaming-accent/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center"><Zap className="w-5 h-5 text-purple-400" /></div>
            <div><h2 className="text-white font-semibold">Digiflazz</h2><p className="text-gray-500 text-xs">Supplier produk digital untuk top up game</p></div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs px-2.5 py-1 rounded-full border ${config.digiflazzEnabled ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-gray-500/10 text-gray-400 border-gray-500/20"}`}>{config.digiflazzEnabled ? "Aktif" : "Nonaktif"}</span>
            <a href="https://digiflazz.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors"><ExternalLink className="w-4 h-4" /></a>
          </div>
        </div>
        <div className="p-6 space-y-5">
          <Toggle value={config.digiflazzEnabled} onChange={(v) => update("digiflazzEnabled", v)} label="Aktifkan Digiflazz" description="Nonaktifkan untuk menghentikan pemrosesan top up otomatis" />
          <Input label="Username Digiflazz" value={config.digiflazzUsername} onChange={(e) => update("digiflazzUsername", e.target.value)} placeholder="username-digiflazz-anda" />
          <SecretInput label="API Key (Production)" value={config.digiflazzApiKey} onChange={(v) => update("digiflazzApiKey", v)} placeholder="api-key-dari-digiflazz" hint="Dapatkan dari Digiflazz Dashboard → Pengaturan → API" />
          <SecretInput label="Webhook Secret (opsional)" value={config.digiflazzWebhookSecret} onChange={(v) => update("digiflazzWebhookSecret", v)} placeholder="webhook-secret" hint="Untuk verifikasi notifikasi dari Digiflazz" />
          <div className="bg-purple-500/5 border border-purple-500/15 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2"><ShieldCheck className="w-4 h-4 text-purple-400" /><p className="text-purple-300 text-sm font-medium">URL Callback Digiflazz</p></div>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-gaming-dark rounded-lg px-3 py-2 text-purple-200 text-xs font-mono break-all">{origin}/api/digiflazz/callback</code>
              <button onClick={() => { navigator.clipboard.writeText(`${origin}/api/digiflazz/callback`); toast.success("URL disalin!"); }} className="text-gray-400 hover:text-white p-2 hover:bg-white/5 rounded-lg transition-colors flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-gray-300 text-sm font-medium">Test Koneksi</p>
            <Button variant="outline" size="sm" onClick={() => testConnection("digiflazz")} loading={digiflazzTest.status === "loading"}><Zap className="w-3.5 h-3.5" /> Test Digiflazz</Button>
          </div>
          <TestBadge result={digiflazzTest} />
        </div>
      </div>

      {/* Status overview */}
      <div className="bg-gaming-card rounded-2xl border border-white/5 p-5">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-green-400" /> Status Konfigurasi</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Midtrans", ok: !!config.midtransServerKey && !!config.midtransClientKey && config.midtransEnabled, detail: config.midtransEnabled ? (config.midtransServerKey ? `${config.midtransIsProduction ? "Production" : "Sandbox"} — Terkonfigurasi` : "Key belum diisi") : "Dinonaktifkan", active: config.activePaymentGateway === "midtrans" },
            { label: "Duitku", ok: !!config.duitkuMerchantCode && !!config.duitkuApiKey && config.duitkuEnabled, detail: config.duitkuEnabled ? (config.duitkuApiKey ? `${config.duitkuIsProduction ? "Production" : "Sandbox"} — Terkonfigurasi` : "Key belum diisi") : "Dinonaktifkan", active: config.activePaymentGateway === "duitku" },
            { label: "Digiflazz", ok: !!config.digiflazzUsername && !!config.digiflazzApiKey && config.digiflazzEnabled, detail: config.digiflazzEnabled ? (config.digiflazzUsername ? `@${config.digiflazzUsername} — Terkonfigurasi` : "Credentials belum diisi") : "Dinonaktifkan" },
          ].map((item) => (
            <div key={item.label} className={`rounded-xl p-4 border relative overflow-hidden ${item.ok ? "bg-green-500/5 border-green-500/20" : "bg-red-500/5 border-red-500/20"}`}>
              {item.active && <div className="absolute top-0 right-0 bg-gradient-to-l from-purple-500/30 to-transparent w-16 h-16 blur-xl" />}
              <div className="flex items-center gap-2 mb-1">
                {item.ok ? <CheckCircle className="w-4 h-4 text-green-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
                <span className="text-white text-sm font-medium">{item.label}</span>
                {item.active && <span className="ml-auto text-[10px] uppercase font-bold bg-purple-500 text-white px-2 py-0.5 rounded-md">Gateway Aktif</span>}
              </div>
              <p className={`text-xs ${item.ok ? "text-green-500/70" : "text-red-500/70"}`}>{item.detail}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end pb-4">
        <Button variant="primary" size="lg" onClick={handleSave} loading={saving}><Save className="w-5 h-5" /> Simpan Konfigurasi</Button>
      </div>
    </div>
  );
}
