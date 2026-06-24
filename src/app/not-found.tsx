import Link from "next/link";
import { Home, Gamepad2 } from "lucide-react";
import Button from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-24 h-24 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <Gamepad2 className="w-12 h-12 text-purple-400" />
        </div>
        <h1 className="text-6xl font-bold gradient-text mb-4">404</h1>
        <h2 className="text-xl font-semibold text-white mb-2">Halaman Tidak Ditemukan</h2>
        <p className="text-gray-400 mb-8">Halaman yang kamu cari tidak ada atau sudah dipindahkan.</p>
        <Link href="/">
          <Button variant="primary" size="lg">
            <Home className="w-5 h-5" />
            Kembali ke Beranda
          </Button>
        </Link>
      </div>
    </div>
  );
}
