"use client";

import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Loader2, ArrowLeft, CreditCard, Star, ShieldCheck, Zap, Award } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import ReviewSlider from "@/components/ReviewSlider";

const ownerReviews = [
  {
    name: "Sarah Mitchell",
    rating: 5,
    comment: "Our professional listing paid for itself in the first week. The quality of enquiries from large groups is much higher than other platforms.",
    date: "Manor House Owner",
    image: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/8330e9be-5e47-4f2b-bda0-4162d899b6d9/generated_images/professional-portrait-photograph-of-a-co-c2a10f6e-20251127184832.jpg"
  },
  {
    name: "James Thornton",
    rating: 5,
    comment: "I love the direct enquiry model. No commission and I get to talk to my guests before they book. Highly recommend the Professional plan.",
    date: "Estate Owner",
    image: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/8330e9be-5e47-4f2b-bda0-4162d899b6d9/generated_images/professional-portrait-photograph-of-a-fr-81c7fcec-20251127184832.jpg"
  },
  {
    name: "Emma Richardson",
    rating: 5,
    comment: "The onboarding was seamless. The team helped us build a beautiful page that really showcases our property to the right audience.",
    date: "Country House Owner",
    image: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/8330e9be-5e47-4f2b-bda0-4162d899b6d9/generated_images/professional-portrait-photograph-of-a-su-474d0a6c-20251127184832.jpg"
  }
];

const plans = [
  {
    id: "bronze",
    name: "Essential Listing",
    price: "£450",
    monthlyPrice: "£45",
    period: "/ year",
    description: "Perfect for getting started with direct enquiries.",
    color: "#B87333",
    features: [
      "Full property listing page",
      "Unlimited direct enquiries",
      "iCal calendar sync",
      "Direct website link",
      "Standard SEO optimization"
    ]
  },
  {
    id: "silver",
    name: "Professional Listing",
    price: "£650",
    monthlyPrice: "£65",
    period: "/ year",
    description: "Enhanced visibility and targeted promotion.",
    color: "#71717A",
    popular: true,
    features: [
      "Everything in Essential",
      "Professional page build & support",
      "Social media promotion",
      "Enhanced search visibility",
      "Priority support",
      "Late Availability features"
    ]
  },
  {
    id: "gold",
    name: "Premium Listing",
    price: "£850",
    monthlyPrice: "£85",
    period: "/ year",
    description: "Maximum exposure across the platform.",
    color: "#C6A76D",
    features: [
      "Everything in Professional",
      "Homepage featured placement",
      "Themed blog spotlight",
      "Holiday Focus page inclusion",
      "Premium production support"
    ]
  }
];

function ChoosePlanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPlan = searchParams.get("plan") || "bronze";
  const [selectedPlan, setSelectedPlan] = useState(initialPlan);
  const [loading, setLoading] = useState(false);
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/owner-login?callbackURL=/choose-plan");
    }
  }, [session, isPending, router]);

  const handleProceed = async () => {
    setLoading(true);
    try {
      const propertyId = searchParams.get("propertyId");
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          planId: selectedPlan,
          propertyId: propertyId 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to proceed to payment");
    } finally {
      setLoading(false);
    }
  };

  if (isPending) return <div className="flex justify-center py-40"><Loader2 className="w-10 h-10 animate-spin text-[var(--color-accent-sage)]" /></div>;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-16">
        <button 
          onClick={() => router.push("/owner-sign-up")}
          className="inline-flex items-center text-[var(--color-accent-sage)] hover:text-[var(--color-accent-sage)]/80 mb-8 font-semibold transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
          Back to registration
        </button>
        <h2 className="text-4xl lg:text-5xl font-bold mb-6" style={{ fontFamily: "var(--font-display)" }}>Choose Your Listing Plan</h2>
        <p className="text-xl text-[var(--color-neutral-dark)] max-w-2xl mx-auto">Select the membership that best fits your marketing goals. Zero commission on all bookings.</p>
      </div>

      {/* Trust Signals Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
        {[
          { icon: Award, label: "Specialist Platform", sub: "UK's #1 for groups" },
          { icon: Zap, label: "Direct Enquiries", sub: "No middleman" },
          { icon: ShieldCheck, label: "Zero Commission", sub: "Keep 100% revenue" },
          { icon: Star, label: "Expert Support", sub: "We build your page" }
        ].map((item, i) => (
          <div key={i} className="flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-full bg-[var(--color-accent-sage)]/10 flex items-center justify-center mb-3">
              <item.icon className="w-5 h-5 text-[var(--color-accent-sage)]" />
            </div>
            <div className="font-bold text-sm">{item.label}</div>
            <div className="text-xs text-[var(--color-neutral-dark)]">{item.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-16">
        {plans.map((plan) => (
          <div 
            key={plan.id}
            onClick={() => setSelectedPlan(plan.id)}
            className={`cursor-pointer rounded-3xl p-8 border-2 transition-all relative flex flex-col group ${
              selectedPlan === plan.id 
                ? "bg-white shadow-2xl scale-[1.03] z-10 border-[var(--color-accent-sage)]" 
                : "border-gray-200 bg-white/50 hover:border-[var(--color-accent-sage)]/30 opacity-80"
            }`}
          >
            {plan.popular && (
              <div 
                className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[var(--color-accent-gold)] text-white px-6 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg"
              >
                Most Popular
              </div>
            )}
            
            <div className="mb-8">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>{plan.name}</h3>
                {selectedPlan === plan.id && (
                  <div className="w-6 h-6 bg-[var(--color-accent-sage)] rounded-full flex items-center justify-center shadow-inner">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
              <p className="text-[var(--color-neutral-dark)] text-sm leading-relaxed">{plan.description}</p>
            </div>
            
            <div className="mb-8 p-6 bg-[var(--color-bg-primary)] rounded-2xl border border-gray-100">
              <div className="flex flex-col">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-[var(--color-neutral-dark)] font-medium text-sm">+ VAT {plan.period}</span>
                </div>
                <div className="text-[10px] text-gray-400 mt-2 font-medium tracking-wide uppercase">
                  Approx. £{Math.round(parseInt(plan.price.replace('£', '')) * 1.2)} inc. VAT
                </div>
              </div>
            </div>
            
            <ul className="space-y-4 mb-8 flex-grow">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className={`mt-1 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${selectedPlan === plan.id ? "bg-[var(--color-accent-sage)]/20" : "bg-gray-100"}`}>
                    <Check 
                      className={`w-3 h-3 ${selectedPlan === plan.id ? "text-[var(--color-accent-sage)]" : "text-gray-400"}`}
                    />
                  </div>
                  <span className={`text-sm ${selectedPlan === plan.id ? "font-medium text-[var(--color-text-primary)]" : "text-[var(--color-neutral-dark)]"}`}>{feature}</span>
                </li>
              ))}
            </ul>

            <div className={`mt-auto pt-6 border-t border-gray-100 flex items-center justify-between ${selectedPlan === plan.id ? "opacity-100" : "opacity-0 group-hover:opacity-40 transition-opacity"}`}>
               <span className="text-xs font-bold text-[var(--color-accent-sage)] uppercase tracking-widest">Select Plan</span>
               <ArrowRight className="w-4 h-4 text-[var(--color-accent-sage)]" />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center gap-8 mb-24">
        <div className="text-center">
          <Button 
            onClick={handleProceed}
            disabled={loading}
            size="lg"
            className="rounded-2xl px-16 py-8 text-2xl font-bold text-white shadow-[0_20px_40px_-15px_rgba(150,173,148,0.5)] hover:shadow-[0_25px_50px_-12px_rgba(150,173,148,0.6)] transition-all bg-[var(--color-accent-sage)] hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? <><Loader2 className="w-6 h-6 mr-3 animate-spin" /> Preparing...</> : <><CreditCard className="w-6 h-6 mr-3" /> Continue to Secure Payment</>}
          </Button>
        </div>
        
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-sm text-[var(--color-neutral-dark)] max-w-md leading-relaxed">
            Your payment is secured by Stripe. You will be redirected to complete the transaction and then returned to your dashboard.
          </p>
          <div className="flex gap-6 items-center opacity-60 grayscale hover:grayscale-0 transition-all cursor-default">
            <Image src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" width={60} height={25} className="h-6 w-auto" />
            <div className="h-4 w-[1px] bg-gray-300" />
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
              <ShieldCheck className="w-3 h-3" />
              SSL Encrypted
            </div>
          </div>
        </div>
      </div>

      {/* Social Proof Section */}
      <div className="py-20 border-t border-gray-100">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold mb-4" style={{ fontFamily: "var(--font-display)" }}>Loved by Property Owners</h3>
          <p className="text-[var(--color-neutral-dark)]">Join hundreds of successful owners who have switched to our direct model.</p>
        </div>
        <ReviewSlider reviews={ownerReviews} />
      </div>

      {/* FAQ Mini */}
      <div className="max-w-3xl mx-auto py-20 border-t border-gray-100">
        <h3 className="text-2xl font-bold mb-8 text-center" style={{ fontFamily: "var(--font-display)" }}>Quick Questions</h3>
        <div className="grid gap-6">
          {[
            { q: "Can I upgrade later?", a: "Yes! You can upgrade your plan at any time through your dashboard settings." },
            { q: "How do enquiries work?", a: "They go directly to your chosen email address. No platform interference." },
            { q: "What about VAT?", a: "VAT will be added at checkout. A full VAT invoice will be emailed to you." }
          ].map((faq, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-gray-50 shadow-sm">
              <div className="font-bold mb-2">{faq.q}</div>
              <div className="text-sm text-[var(--color-neutral-dark)]">{faq.a}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ChoosePlan() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      <Header hideListingButton={true} />
      <main className="pt-32 pb-20 px-6">
        <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[var(--color-accent-sage)]" /></div>}>
          <ChoosePlanContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
