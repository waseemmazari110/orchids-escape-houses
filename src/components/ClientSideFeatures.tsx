"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const WhatsAppChat = dynamic(() => import("./WhatsAppChat"), { 
  ssr: false,
  loading: () => null,
});
const CookieConsent = dynamic(() => import("./CookieConsent"), { 
  ssr: false,
  loading: () => null,
});
const VisualEditsMessenger = dynamic(() => import("../visual-edits/VisualEditsMessenger"), { 
  ssr: false,
  loading: () => null,
});
const ToasterForClient = dynamic(() => import("@/components/ui/sonner").then(mod => mod.Toaster), { 
  ssr: false,
  loading: () => null,
});

export default function ClientSideFeatures() {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Defer non-critical features until after main content is interactive
    const timer = setTimeout(() => setMounted(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  // Hide WhatsApp/floating icons on login pages and dashboards
  const isLoginOrDashboard = pathname?.includes('login') || 
                             pathname?.startsWith('/owner-dashboard') ||
                             pathname?.startsWith('/admin') ||
                             pathname?.startsWith('/account') ||
                             pathname?.includes('choose-plan') ||
                             pathname?.includes('sign-up');
  
  const showWhatsApp = !isLoginOrDashboard && mounted;

  return (
    <>
      {showWhatsApp && <WhatsAppChat />}
      <CookieConsent />
      {mounted && <ToasterForClient />}
    </>
  );
}
