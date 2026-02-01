"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Calendar as CalendarIcon, ExternalLink, Bookmark, Loader2, X } from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";
import { format } from "date-fns";

interface EnquiryFormProps {
  propertyTitle?: string;
  propertySlug?: string;
  propertyId?: string;
}

export default function EnquiryForm({ propertyTitle, propertySlug, propertyId }: EnquiryFormProps) {
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [saveQuote, setSaveQuote] = useState(false);
  const [isSavingQuote, setIsSavingQuote] = useState(false);
  const [unavailableDates, setUnavailableDates] = useState<string[]>([]);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [checkInDate, setCheckInDate] = useState<Date | undefined>(undefined);
  const [checkOutDate, setCheckOutDate] = useState<Date | undefined>(undefined);
  const [checkInPopoverOpen, setCheckInPopoverOpen] = useState(false);
  const [checkOutPopoverOpen, setCheckOutPopoverOpen] = useState(false);
  
  // Spam protection state
  const [formLoadTime, setFormLoadTime] = useState<number>(0);
  const [honeypot, setHoneypot] = useState("");
  const [userInteraction, setUserInteraction] = useState({ clicks: 0, keystrokes: 0 });
  const formRef = useRef<HTMLFormElement>(null);

  // Debug: Log propertyId when component mounts or updates
  useEffect(() => {
    console.log('🔍 [EnquiryForm] Component mounted/updated with propertyId:', propertyId, 'Type:', typeof propertyId);
  }, [propertyId]);

  // Fetch availability when component mounts
  useEffect(() => {
    if (propertyId) {
      console.log('🔍 [EnquiryForm] Fetching availability for propertyId:', propertyId);
      fetchAvailability();
    } else {
      console.warn('⚠️ [EnquiryForm] propertyId is missing or falsy:', propertyId);
    }
  }, [propertyId]);

  const fetchAvailability = async () => {
    if (!propertyId) return;
    try {
      setIsLoadingAvailability(true);
      const url = `/api/properties/${propertyId}/availability`;
      console.log('🔍 [iCal Enquiry] Fetching availability from:', url);
      
      const response = await fetch(url);
      console.log('🔍 [iCal Enquiry] API Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 [iCal Enquiry] API Response data:', data);
        setUnavailableDates(data.unavailableDates || []);
        console.log('✅ [iCal Enquiry] Set unavailable dates:', data.unavailableDates);
      } else {
        console.error('❌ [iCal Enquiry] API error - Status:', response.status, 'Text:', await response.text());
        setUnavailableDates([]);
      }
    } catch (error) {
      console.error('❌ [iCal Enquiry] Error fetching availability:', error);
      setUnavailableDates([]);
    } finally {
      setIsLoadingAvailability(false);
    }
  };

  // Track form load time and user interaction
  useEffect(() => {
    setFormLoadTime(Date.now());

    const trackClick = () => {
      setUserInteraction(prev => ({ ...prev, clicks: prev.clicks + 1 }));
    };

    const trackKeypress = () => {
      setUserInteraction(prev => ({ ...prev, keystrokes: prev.keystrokes + 1 }));
    };

    if (formRef.current) {
      formRef.current.addEventListener('click', trackClick);
      formRef.current.addEventListener('keydown', trackKeypress);
      
      return () => {
        formRef.current?.removeEventListener('click', trackClick);
        formRef.current?.removeEventListener('keydown', trackKeypress);
      };
    }
  }, []);

  // Helper function to convert experience name to URL slug
  const experienceToSlug = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, "-").replace(/&/g, "and");
  };

  const isDateDisabled = (date: Date): boolean => {
    const today = new Date(new Date().setHours(0, 0, 0, 0));
    const dateStr = date.toISOString().split('T')[0];
    
    // Disable past dates and unavailable dates from iCal/bookings
    return date < today || unavailableDates.includes(dateStr);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!checkInDate || !checkOutDate) {
      toast.error("Please select both check-in and check-out dates");
      return;
    }
    
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const addons = formData.getAll('addons');
    
    const checkinStr = format(checkInDate, "yyyy-MM-dd");
    const checkoutStr = format(checkOutDate, "yyyy-MM-dd");
    
    const payload = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      checkin: checkinStr,
      checkout: checkoutStr,
      groupSize: formData.get('groupSize'),
      occasion: formData.get('occasion'),
      addons,
      message: formData.get('message'),
      propertyTitle,
      propertySlug,
      honeypot,
      timestamp: formLoadTime.toString(),
      userInteraction
    };

    try {
      // Generate JavaScript challenge
      const challenge = Math.floor(Date.now() / 10000).toString();

      const response = await fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          challenge,
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send enquiry');
      }

      // Handle Save Quote if requested and logged in
      if (saveQuote && session?.user) {
        setIsSavingQuote(true);
        await fetch("/api/account/save-quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "save",
            quotePayload: {
              propertyTitle,
              propertySlug,
              price: "TBC", // Could be enhanced if price logic is available
              dates: `${payload.checkin} - ${payload.checkout}`,
              groupSize: payload.groupSize,
            }
          }),
        });
        setIsSavingQuote(false);
      }

      setIsSubmitted(true);
      toast.success("Enquiry sent successfully! Our team will get back to you within 24 hours.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send enquiry. Please try again.");
      console.error("Enquiry submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h3 className="text-2xl font-semibold mb-2" style={{ fontFamily: "var(--font-display)" }}>
          Enquiry Sent!
        </h3>
        <p className="text-[var(--color-neutral-dark)] mb-6">
          Thank you for your enquiry. Our team will get back to you within 24 hours.
        </p>
        <Button asChild className="rounded-xl w-full bg-[var(--color-accent-sage)] text-white">
          <Link href="/account/dashboard">View Enquiry History</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-8 shadow-lg sticky top-24">
      <h3 className="text-2xl font-semibold mb-6" style={{ fontFamily: "var(--font-display)" }}>
        Check dates and enquire
      </h3>

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
        {/* Honeypot field - hidden from users */}
        <input
          type="text"
          name="website"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          style={{ 
            position: 'absolute', 
            left: '-9999px', 
            width: '1px', 
            height: '1px' 
          }}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />

          {/* Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name" className="text-sm font-medium mb-2 block">
                Your name
              </Label>
              <Input
                id="name"
                name="name"
                required
                defaultValue={session?.user?.name || ""}
                autoComplete="name"
                className="rounded-xl min-h-[48px] text-base"
              />
            </div>
    
            {/* Email */}
            <div>
              <Label htmlFor="email" className="text-sm font-medium mb-2 block">
                Email address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                defaultValue={session?.user?.email || ""}
                autoComplete="email"
                className="rounded-xl min-h-[48px] text-base"
              />
            </div>
          </div>
    
          {/* Phone & Group Size */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone" className="text-sm font-medium mb-2 block">
                Phone number
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                required
                autoComplete="tel"
                className="rounded-xl min-h-[48px] text-base"
              />
            </div>

            <div>
              <Label htmlFor="groupSize" className="text-sm font-medium mb-2 block">
                Group size
              </Label>
              <Input
                id="groupSize"
                name="groupSize"
                type="number"
                min="1"
                required
                autoComplete="off"
                className="rounded-xl min-h-[48px] text-base"
              />
            </div>
          </div>
    
          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Arrival
              </Label>
              <Popover open={checkInPopoverOpen} onOpenChange={setCheckInPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal h-12 rounded-xl"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-gray-400" />
                    <span className={checkInDate ? "text-gray-900" : "text-gray-500"}>
                      {checkInDate ? format(checkInDate, "dd MMM yyyy") : "Select date"}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-4" align="start">
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Select Arrival Date</p>
                    {unavailableDates.length > 0 && (
                      <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-gray-600 flex items-start gap-2">
                        <span className="text-blue-500 mt-0.5">ℹ️</span>
                        <span>Grayed-out dates are unavailable (booked or synced from your calendar)</span>
                      </div>
                    )}
                  </div>
                  <CalendarComponent
                    mode="single"
                    selected={checkInDate}
                    onSelect={(date) => {
                      setCheckInDate(date);
                      setCheckInPopoverOpen(false);
                    }}
                    disabled={isDateDisabled}
                    modifiersClassNames={{
                      disabled: "text-gray-400 opacity-50 cursor-not-allowed hover:bg-transparent",
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Departure
              </Label>
              <Popover open={checkOutPopoverOpen} onOpenChange={setCheckOutPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal h-12 rounded-xl"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-gray-400" />
                    <span className={checkOutDate ? "text-gray-900" : "text-gray-500"}>
                      {checkOutDate ? format(checkOutDate, "dd MMM yyyy") : "Select date"}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-4" align="start">
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Select Departure Date</p>
                    {checkInDate && (
                      <p className="text-xs text-gray-600 mb-2">From: <strong>{format(checkInDate, "dd MMM yyyy")}</strong></p>
                    )}
                    {unavailableDates.length > 0 && (
                      <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-gray-600 flex items-start gap-2">
                        <span className="text-blue-500 mt-0.5">ℹ️</span>
                        <span>Grayed-out dates are unavailable</span>
                      </div>
                    )}
                  </div>
                  <CalendarComponent
                    mode="single"
                    selected={checkOutDate}
                    onSelect={(date) => {
                      if (date && checkInDate && date <= checkInDate) {
                        toast.error("Departure date must be after arrival date");
                        return;
                      }
                      setCheckOutDate(date);
                      setCheckOutPopoverOpen(false);
                    }}
                    disabled={(date) => {
                      if (checkInDate && date <= checkInDate) {
                        return true;
                      }
                      return isDateDisabled(date);
                    }}
                    modifiersClassNames={{
                      disabled: "text-gray-400 opacity-50 cursor-not-allowed hover:bg-transparent",
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
    
          {/* Occasion */}
          <div>
            <Label htmlFor="occasion" className="text-sm font-medium mb-2 block">
              Occasion
            </Label>
            <Input
              id="occasion"
              name="occasion"
              autoComplete="off"
              className="rounded-xl min-h-[48px] text-base"
            />
          </div>

          {/* Add-ons */}
          <fieldset>
            <legend className="text-sm font-medium mb-3 block">Add experiences (optional)</legend>
            <div className="max-h-[200px] overflow-y-auto pr-2 space-y-2.5 scrollbar-hide">
              {[
                "Cocktail Masterclass",
                "Butlers in the Buff",
                "Life Drawing",
                "Private Chef",
                "Spa Treatments",
                "Mobile Beauty Bar",
                "Make-up Artist",
                "Hair Styling",
                "Prosecco Reception",
                "Afternoon Tea",
                "BBQ Catering",
                "Pizza Making Class",
                "Bottomless Brunch",
                "Brunch Package",
                "Gin Tasting",
                "Wine Tasting",
                "Cocktail Bar Hire",
                "Flower Crown Making",
                "Dance Class",
                "Karaoke Night",
                "Yoga Session",
                "Photography Package",
                "Videography Package",
                "DJ Entertainment",
                "Games & Activities Pack",
                "Decorations & Balloons",
                "Personalised Robes",
                "Pamper Party Package",
              ].map((addon) => {
                const addonId = `addon-${addon.toLowerCase().replace(/\s+/g, '-')}`;
                return (
                  <div key={addon} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id={addonId}
                      name="addons"
                      value={addon}
                      className="w-5 h-5 rounded border-gray-300 accent-[var(--color-accent-sage)]"
                    />
                    <label 
                      htmlFor={addonId}
                      className="text-sm cursor-pointer select-none flex-1 py-1"
                    >
                      {addon}
                    </label>
                  </div>
                );
              })}
            </div>
          </fieldset>

          {/* Message */}
          <div>
            <Label htmlFor="message" className="text-sm font-medium mb-2 block">
              Additional requests
            </Label>
            <Textarea
              id="message"
              name="message"
              rows={4}
              className="rounded-xl min-h-[120px] text-base"
            />
          </div>

          {/* Save Quote for logged in users */}
          {session?.user && (session.user as any).role === "guest" && (
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <input
                type="checkbox"
                id="saveQuote"
                checked={saveQuote}
                onChange={(e) => setSaveQuote(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 accent-[var(--color-accent-sage)]"
              />
              <label htmlFor="saveQuote" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-[var(--color-accent-sage)]" />
                Save this quote to my account
              </label>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl py-6 text-base font-semibold transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 relative z-10 min-h-[56px]"
            style={{
              background: isSubmitting ? "var(--color-bg-secondary)" : "var(--color-accent-sage)",
              color: "white",
            }}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                {isSavingQuote ? "Saving Quote..." : "Sending..."}
              </span>
            ) : "Send Enquiry"}
          </Button>

        <p className="text-xs text-center text-[var(--color-neutral-dark)]">
          Fast response from our UK team. We'll get back to you within 24 hours.
        </p>
      </form>
    </div>
  );
}
