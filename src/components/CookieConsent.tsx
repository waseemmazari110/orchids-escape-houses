"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setShowBanner(false);
  };

  const declineCookies = () => {
    localStorage.setItem("cookie-consent", "declined");
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-1 md:p-4 animate-fade-up">
      <div className="max-w-[1000px] mx-auto">
        <div
          className="rounded-lg md:rounded-xl shadow-2xl p-3 md:p-5 relative"
          style={{ 
            background: "var(--color-text-primary)",
            color: "var(--color-bg-primary)"
          }}
        >
          <button
            onClick={declineCookies}
            className="absolute top-2 right-2 w-5 h-5 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          <div className="flex flex-col md:flex-row gap-2 md:gap-6 items-start md:items-center justify-between pr-4 md:pr-6">
            <div className="flex-1">
              <h3 
                className="text-sm md:text-lg mb-0.5 md:mb-1 font-semibold"
                style={{ 
                  fontFamily: "var(--font-display)",
                  color: "var(--color-accent-gold)"
                }}
              >
                We Use Cookies
              </h3>
              <p className="text-[10px] md:text-xs text-[var(--color-bg-secondary)] leading-tight md:leading-normal">
                We use cookies to enhance your browsing experience, analyse site traffic, and provide personalised content. By clicking "Accept", you consent to our use of cookies.{" "}
                <Link 
                  href="/privacy" 
                  className="underline hover:text-[var(--color-accent-sage)] transition-colors"
                >
                  Read our Privacy Policy
                </Link>
              </p>
            </div>

            <div className="flex flex-row gap-2 w-full md:w-auto mt-2 md:mt-0">
              <Button
                onClick={declineCookies}
                variant="ghost"
                className="flex-1 md:flex-none rounded-md md:rounded-lg px-3 md:px-5 py-1 md:py-1.5 text-[10px] md:text-xs font-medium border border-white/20 transition-all hover:bg-white/10"
                style={{
                  color: "var(--color-bg-primary)"
                }}
              >
                Decline
              </Button>
              <Button
                onClick={acceptCookies}
                className="flex-1 md:flex-none rounded-md md:rounded-lg px-3 md:px-6 py-1 md:py-1.5 text-[10px] md:text-xs font-semibold transition-all hover:shadow-lg"
                style={{
                  background: "var(--color-accent-sage)",
                  color: "white"
                }}
              >
                Accept Cookies
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}