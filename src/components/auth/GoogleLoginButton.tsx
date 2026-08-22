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
  
  // Simpan callback dalam ref agar useEffect tidak berjalan ulang 
  // setiap kali state parent berubah (menghindari tombol hilang saat ketik input)
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  }, [onSuccess, onError]);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "1056581452294-8tfe1h12m5m4d04q8k9mfgp70gfeghj8.apps.googleusercontent.com";

  useEffect(() => {
    let checkInterval: NodeJS.Timeout;

    const renderGoogleButton = () => {
      const google = (window as any).google;
      if (google && buttonRef.current) {
        try {
          google.accounts.id.initialize({
            client_id: clientId,
            callback: (response: any) => {
              if (response.credential) {
                onSuccessRef.current(response.credential);
              } else if (onErrorRef.current) {
                onErrorRef.current("Autentikasi Google gagal");
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
        } catch (err) {
          console.error("Failed to render Google button:", err);
        }
      }
    };

    // Jika google sudah ada (navigasi balik via Next.js)
    if ((window as any).google) {
      setScriptLoaded(true);
      setTimeout(renderGoogleButton, 50); // Tunggu ref terpasang
    } else {
      // Load script
      const existingScript = document.getElementById("google-gsi-script");
      if (!existingScript) {
        const script = document.createElement("script");
        script.id = "google-gsi-script";
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }

      // Polling setiap 100ms untuk memastikan script selesai dimuat
      checkInterval = setInterval(() => {
        if ((window as any).google) {
          clearInterval(checkInterval);
          setScriptLoaded(true);
          setTimeout(renderGoogleButton, 50);
        }
      }, 100);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [clientId]); // Dependency array HANYA clientId, mencegah re-render berkali-kali

  return (
    <div className="w-full flex flex-col items-center justify-center my-3 min-h-[44px]">
      {!scriptLoaded ? (
        <div className="flex items-center gap-2 justify-center py-2 text-sm text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
          Memuat Google Sign-In...
        </div>
      ) : (
        <div 
          ref={buttonRef} 
          className="w-full flex justify-center hover:scale-[1.01] active:scale-[0.99] transition-transform duration-200" 
        />
      )}
    </div>
  );
}
