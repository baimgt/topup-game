"use client";

import { useState } from "react";
import { Server, Activity, Database, CheckCircle, Lock, Mail, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

const SECRET_PIN = "200807";

export default function SystemStatusPage() {
  const [showPinPad, setShowPinPad] = useState(false);
  const [pin, setPin] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  
  // Login form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Berhasil masuk sebagai Admin!");
      window.location.href = "/admin";
    } catch (error: any) {
      toast.error(error.message || "Gagal masuk");
    } finally {
      setLoading(false);
    }
  };

  if (unlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-[#0B0B0F]">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <span className="text-white font-bold text-xl">
                Admin<span className="text-red-400">Gateway</span>
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Akses Tersembunyi</h1>
            <p className="text-gray-400 text-sm">Mode Bypass Maintenance</p>
          </div>

          <div className="bg-gaming-card rounded-2xl border border-red-500/20 p-6 shadow-[0_0_30px_rgba(239,68,68,0.1)]">
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <Input
                label="Email Admin"
                type="email"
                placeholder="admin@contoh.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail className="w-4 h-4" />}
                required
              />
              <Input
                label="Password"
                type="password"
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="w-4 h-4" />}
                required
              />
              <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full bg-red-600 hover:bg-red-700 mt-6 text-white border-0">
                Bypass & Masuk
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // --- Decoy Page ---
  return (
    <div className="min-h-screen bg-[#0B0B0F] p-6 sm:p-12 text-center relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[20%] w-96 h-96 bg-blue-500/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-[20%] right-[20%] w-96 h-96 bg-emerald-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-2xl mx-auto space-y-8 relative z-10 pt-10">
        <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Activity className="w-10 h-10 text-blue-400 animate-pulse" />
        </div>
        <h1 className="text-3xl font-bold text-white">System Status</h1>
        <p className="text-gray-400">All services are currently running smoothly.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left mt-8">
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 flex items-center gap-4">
            <Server className="w-8 h-8 text-emerald-400" />
            <div>
              <p className="text-white font-medium">Main Server</p>
              <p className="text-emerald-400 text-sm flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Operational</p>
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 flex items-center gap-4">
            <Database className="w-8 h-8 text-emerald-400" />
            <div>
              <p className="text-white font-medium">Database Node</p>
              <p className="text-emerald-400 text-sm flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Operational</p>
            </div>
          </div>
        </div>

        {/* Hidden Trigger: Very small invisible button / dot */}
        <div className="pt-32 pb-8 flex flex-col items-center">
          <button 
            className="w-1.5 h-1.5 rounded-full bg-white/5 hover:bg-white/20 transition-colors cursor-default focus:outline-none focus:ring-0"
            onClick={() => setShowPinPad(true)}
            aria-hidden="true"
            title="."
          />
          <p className="text-xs text-gray-700 mt-2 select-none">© {new Date().getFullYear()} System Check</p>
        </div>
      </div>

      {/* Secret PIN Pad Popup */}
      {showPinPad && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1a1a24] rounded-3xl p-8 w-full max-w-xs relative border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
            <button onClick={() => { setShowPinPad(false); setPin(""); }} className="absolute top-4 right-4 text-gray-500 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <div className="text-center mb-8">
              <Lock className="w-6 h-6 text-gray-400 mx-auto mb-2" />
              <h3 className="text-white font-bold tracking-widest text-sm uppercase">Enter PIN</h3>
            </div>
            
            <div className="flex justify-center gap-3 mb-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${pin.length > i ? 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'bg-white/10'}`} />
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button
                  key={num}
                  className="bg-white/5 hover:bg-white/15 text-white font-mono text-2xl py-4 rounded-full active:scale-90 transition-all border border-white/5"
                  onClick={() => {
                    const newPin = pin + num;
                    if (newPin.length <= 6) setPin(newPin);
                    if (newPin.length === 6) {
                      setTimeout(() => {
                        if (newPin === SECRET_PIN) {
                          setUnlocked(true);
                          setShowPinPad(false);
                          setPin("");
                        } else {
                          toast.error("PIN Invalid");
                          setPin("");
                        }
                      }, 200);
                    }
                  }}
                >
                  {num}
                </button>
              ))}
              <div />
              <button
                className="bg-white/5 hover:bg-white/15 text-white font-mono text-2xl py-4 rounded-full active:scale-90 transition-all border border-white/5"
                onClick={() => {
                  const newPin = pin + "0";
                  if (newPin.length <= 6) setPin(newPin);
                  if (newPin.length === 6) {
                    setTimeout(() => {
                      if (newPin === SECRET_PIN) {
                        setUnlocked(true);
                        setShowPinPad(false);
                        setPin("");
                      } else {
                        toast.error("PIN Invalid");
                        setPin("");
                      }
                    }, 200);
                  }
                }}
              >
                0
              </button>
              <button
                className="hover:bg-red-500/20 text-gray-400 hover:text-red-400 font-bold py-4 rounded-full active:scale-90 transition-all flex items-center justify-center"
                onClick={() => setPin(pin.slice(0, -1))}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
