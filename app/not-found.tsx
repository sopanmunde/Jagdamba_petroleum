import Link from "next/link";
import { Fuel, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 bg-red-600/20 text-[#D9232D] rounded-2xl flex items-center justify-center mb-4 border border-red-500/30">
        <Fuel className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-extrabold text-white mb-2">404 - Page Not Found</h1>
      <p className="text-slate-400 text-sm mb-6 max-w-md">
        The requested page does not exist on Jagdamba Petroleum Feedback Portal.
      </p>
      <Link href="/">
        <Button variant="gradient" className="gap-2">
          <Home className="w-4 h-4" />
          Back to Feedback Form
        </Button>
      </Link>
    </div>
  );
}
