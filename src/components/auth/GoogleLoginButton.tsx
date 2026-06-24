"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

interface GoogleLoginButtonProps {
  onSuccess: (credential: string) => void;
  onError?: (error: string) => void;
}

export default function GoogleLoginButton({ onSuccess, onError }: GoogleLoginButtonProps) {
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "1056581452294-8tfe1h12m5m4d04q8k9mfgp70gfeghj8.apps.googleusercontent.com";

  useEffect(() => {
    // 1. Check if script already exists
    const existingScript = document.getElementById("google-gsi-script");
    if (existingScript) {
      setScriptLoaded(true);
      return;
    }

    // 2. Load script dynamically
    const script = document.createElement("script");
    script.id = "google-gsi-script";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => {
      if (onError) onError("Gagal memuat Google SDK");
    };
    document.head.appendChild(script);
  }, [onError]);

  useEffect(() => {
    if (!scriptLoaded) return;

    try {
      const google = (window as any).google;
      if (google) {
        google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: any) => {
            if (response.credential) {
              onSuccess(response.credential);
            } else {
              if (onError) onError("Autentikasi Google gagal");
            }
          },
        });

        google.accounts.id.renderButton(buttonRef.current, {
          theme: "filled_blue",
          size: "large",
          width: 350,
          text: "signin_with",
          shape: "pill",
        });
      }
    } catch (err) {
      console.error("Failed to render Google button:", err);
    }
  }, [scriptLoaded, clientId, onSuccess, onError]);

  return (
    <div className="w-full flex flex-col items-center justify-center my-3">
      {!scriptLoaded ? (
        <div className="flex items-center gap-2 justify-center py-2 text-sm text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
          Memuat Google Sign-In...
        </div>
      ) : (
        <div ref={buttonRef} className="w-full flex justify-center hover:scale-[1.01] active:scale-[0.99] transition-transform duration-200" />
      )}
    </div>
  );
}
