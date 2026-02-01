"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar, User, Minus, Plus, Loader } from "lucide-react";
import { formatDateUKLong } from "@/lib/date-utils";
import { format } from "date-fns";
import { GEH_API } from "@/lib/api-client";
import { toast } from "sonner";

interface BookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  propertySlug: string;
  propertyTitle: string;
  priceFrom: number;
}

export default function BookingModal({
  open,
  onOpenChange,
  propertyId,
  propertySlug,
  propertyTitle,
  priceFrom,
}: BookingModalProps) {
  const [checkInDate, setCheckInDate] = useState<Date | undefined>(undefined);
  const [checkOutDate, setCheckOutDate] = useState<Date | undefined>(undefined);
  const [guests, setGuests] = useState(2);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [guestsOpen, setGuestsOpen] = useState(false);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [unavailableDates, setUnavailableDates] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch availability when modal opens
  useEffect(() => {
    if (open && propertyId) {
      fetchAvailability();
    }
  }, [open, propertyId]);

  const fetchAvailability = async () => {
    try {
      setIsLoadingAvailability(true);
      const url = `/api/properties/${propertyId}/availability`;
      console.log('🔍 [iCal] Fetching availability from:', url);
      
      const response = await fetch(url);
      console.log('🔍 [iCal] API Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 [iCal] API Response data:', data);
        setUnavailableDates(data.unavailableDates || []);
        console.log('✅ [iCal] Set unavailable dates:', data.unavailableDates);
      } else {
        console.error('❌ [iCal] API error - Status:', response.status, 'Text:', await response.text());
        setUnavailableDates([]);
      }
    } catch (error) {
      console.error('❌ [iCal] Error fetching availability:', error);
      setUnavailableDates([]);
    } finally {
      setIsLoadingAvailability(false);
    }
  };

  const isDateDisabled = (date: Date): boolean => {
    const today = new Date(new Date().setHours(0, 0, 0, 0));
    const dateStr = date.toISOString().split('T')[0];
    
    // Disable past dates and unavailable dates from iCal/bookings
    return date < today || unavailableDates.includes(dateStr);
  };

  const handleBookNow = async () => {
    if (!checkInDate || !checkOutDate) {
      toast.error("Please select check-in and check-out dates");
      return;
    }

    if (guests < 1) {
      toast.error("Please select at least 1 guest");
      return;
    }

    // Since this is a commission-free platform, redirect to enquiry form
    // Pre-fill the dates in the enquiry form
    const checkIn = format(checkInDate, "yyyy-MM-dd");
    const checkOut = format(checkOutDate, "yyyy-MM-dd");
    
    // Close the modal
    onOpenChange(false);
    
    // Scroll to enquiry form or redirect to property page with enquiry open
    const enquirySection = document.querySelector('#enquiry-form') || document.querySelector('[data-enquiry-form]');
    
    if (enquirySection) {
      enquirySection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Store booking details for pre-filling the form
      sessionStorage.setItem('booking_dates', JSON.stringify({ checkIn, checkOut, guests }));
      toast.success("Please complete the enquiry form below to book this property");
    } else {
      // If no enquiry form on current page, redirect to property page
      window.location.href = `/properties/${propertySlug}?checkin=${checkIn}&checkout=${checkOut}&guests=${guests}#enquiry`;
    }
  };

  const dateRangeDisplay =
    checkInDate && checkOutDate
      ? `${formatDateUKLong(checkInDate)} → ${formatDateUKLong(checkOutDate)}`
      : checkInDate
      ? `${formatDateUKLong(checkInDate)} → ?`
      : "Select dates";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl" style={{ fontFamily: "var(--font-display)" }}>
            Book {propertyTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Dates */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Check-in / Check-out
            </label>
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal h-12"
                >
                  <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                  <span className={checkInDate ? "text-gray-900" : "text-gray-500"}>
                    {dateRangeDisplay}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="p-4 border-b flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-700">
                      {!checkInDate && "Select check-in date"}
                      {checkInDate && !checkOutDate && "Select check-out date"}
                      {checkInDate && checkOutDate && "Your dates"}
                    </p>
                    {isLoadingAvailability && (
                      <Loader className="h-4 w-4 animate-spin text-[var(--color-accent-sage)]" />
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setCheckInDate(undefined);
                      setCheckOutDate(undefined);
                    }}
                    className="text-sm text-[var(--color-accent-sage)] hover:text-[var(--color-accent-gold)] transition-colors font-medium"
                    type="button"
                  >
                    Clear dates
                  </button>
                </div>
                {unavailableDates.length > 0 && (
                  <div className="px-4 py-2 bg-blue-50 border-b text-xs text-gray-600 flex items-start gap-2">
                    <svg className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span>Grayed-out dates are unavailable (booked or synced from your calendar)</span>
                  </div>
                )}
                <CalendarComponent
                  mode="range"
                  selected={
                    checkInDate && checkOutDate
                      ? { from: checkInDate, to: checkOutDate }
                      : checkInDate
                      ? { from: checkInDate, to: undefined }
                      : undefined
                  }
                  onSelect={(range) => {
                    if (!range) return;
                    
                    if ('from' in range && range.from) {
                      setCheckInDate(range.from);
                      
                      if (range.to) {
                        setCheckOutDate(range.to);
                        // Close when both dates selected
                        setTimeout(() => setDatePickerOpen(false), 300);
                      } else {
                        setCheckOutDate(undefined);
                      }
                    }
                  }}
                  numberOfMonths={2}
                  disabled={isDateDisabled}
                  modifiersClassNames={{
                    range_start: "ge-date-start",
                    range_end: "ge-date-end",
                    range_middle: "ge-date-in-range",
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Guests */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Guests
            </label>
            <Popover open={guestsOpen} onOpenChange={setGuestsOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal h-12"
                >
                  <User className="mr-2 h-4 w-4 text-gray-400" />
                  <span className="text-gray-900">
                    {guests} guest{guests !== 1 ? "s" : ""}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-6" align="start">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">Guests</div>
                  </div>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-12 w-12 min-h-[48px] min-w-[48px] rounded-lg border-2 border-[var(--color-accent-sage)]"
                        onClick={() => setGuests(Math.max(1, guests - 1))}
                        aria-label="Decrease guests"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-semibold" aria-live="polite">{guests}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-12 w-12 min-h-[48px] min-w-[48px] rounded-lg border-2 border-[var(--color-accent-sage)]"
                        onClick={() => setGuests(guests + 1)}
                        aria-label="Increase guests"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Price Summary */}
          <div className="rounded-lg bg-[var(--color-bg-secondary)] p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-[var(--color-neutral-dark)]">
                From £{priceFrom} per night
              </span>
            </div>
            {checkInDate && checkOutDate && (
              <div className="text-sm text-[var(--color-neutral-dark)]">
                {Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))}{" "}
                night{Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)) !== 1 ? "s" : ""}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleBookNow}
              disabled={isProcessing || !checkInDate || !checkOutDate}
              style={{
                background: "var(--color-accent-sage)",
                color: "white",
              }}
            >
              {isProcessing ? "Processing..." : "Book Now"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}