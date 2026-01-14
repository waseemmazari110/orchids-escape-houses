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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16 bg-white p-8 rounded-3xl border border-gray-100 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--color-accent-sage)] to-[var(--color-accent-gold)]"></div>
        {[
          { icon: Award, label: "UK's Specialist Platform", sub: "Built specifically for large groups" },
          { icon: Zap, label: "Direct Enquiries", sub: "Guests book with you directly" },
          { icon: ShieldCheck, label: "Zero Commission", sub: "Keep 100% of your booking fee" },
          { icon: Star, label: "5-Star Owner Support", sub: "Expert help from our UK team" }
        ].map((item, i) => (
          <div key={i} className="flex flex-col items-center text-center group">
            <div className="w-12 h-12 rounded-2xl bg-[var(--color-accent-sage)]/10 flex items-center justify-center mb-3 group-hover:bg-[var(--color-accent-sage)] group-hover:text-white transition-all duration-300">
              <item.icon className="w-6 h-6 text-[var(--color-accent-sage)] group-hover:text-white transition-colors" />
            </div>
            <div className="font-bold text-sm text-[var(--color-text-primary)]">{item.label}</div>
            <div className="text-[10px] uppercase tracking-wider text-[var(--color-neutral-dark)] mt-1">{item.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-16 items-stretch">
        {plans.map((plan) => (
          <div 
            key={plan.id}
            onClick={() => setSelectedPlan(plan.id)}
            className={`cursor-pointer rounded-[2.5rem] p-8 border-2 transition-all duration-500 relative flex flex-col group ${
              selectedPlan === plan.id 
                ? "bg-white shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] scale-[1.05] z-20 border-[var(--color-accent-sage)]" 
                : "border-gray-200 bg-white/40 hover:border-[var(--color-accent-sage)]/40 opacity-90"
            }`}
          >
            {plan.popular && (
              <div 
                className="absolute -top-5 left-1/2 -translate-x-1/2 bg-[var(--color-accent-gold)] text-white px-8 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.25em] shadow-xl z-30"
              >
                Recommended
              </div>
            )}
            
            <div className="mb-8 text-center">
              <h3 className="text-2xl font-bold mb-3" style={{ fontFamily: "var(--font-display)" }}>{plan.name}</h3>
              <p className="text-[var(--color-neutral-dark)] text-sm leading-relaxed min-h-[3rem] px-4">{plan.description}</p>
            </div>
            
            <div className={`mb-8 p-8 rounded-3xl border transition-all duration-500 text-center ${
              selectedPlan === plan.id 
                ? "bg-[var(--color-bg-primary)] border-[var(--color-accent-sage)]/20 shadow-inner" 
                : "bg-gray-50/50 border-gray-100"
            }`}>
              <div className="flex flex-col items-center">
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold tracking-tight">{plan.price}</span>
                  <span className="text-[var(--color-neutral-dark)] font-semibold text-sm">/ yr</span>
                </div>
                <div className="mt-3 py-1 px-3 bg-white/80 rounded-full text-[10px] font-bold text-[var(--color-accent-sage)] border border-[var(--color-accent-sage)]/10">
                   ONLY £{plan.monthlyPrice} PER MONTH
                </div>
                <div className="text-[10px] text-gray-400 mt-4 font-medium tracking-widest uppercase opacity-60">
                  EXCL. VAT
                </div>
              </div>
            </div>
            
            <ul className="space-y-5 mb-10 flex-grow px-2">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className={`mt-1 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-colors ${selectedPlan === plan.id ? "bg-[var(--color-accent-sage)]" : "bg-gray-100"}`}>
                    <Check 
                      className={`w-3 h-3 ${selectedPlan === plan.id ? "text-white" : "text-gray-400"}`}
                    />
                  </div>
                  <span className={`text-sm leading-tight ${selectedPlan === plan.id ? "font-semibold text-[var(--color-text-primary)]" : "text-[var(--color-neutral-dark)]"}`}>{feature}</span>
                </li>
              ))}
            </ul>

            <div className={`mt-auto pt-6 border-t border-gray-100 flex items-center justify-center gap-2 transition-all duration-500 ${selectedPlan === plan.id ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 group-hover:opacity-40 group-hover:translate-y-2"}`}>
               <span className="text-xs font-black text-[var(--color-accent-sage)] uppercase tracking-[0.2em]">Active Selection</span>
               <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent-sage)] animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center gap-10 mb-24 relative">
        {/* Money Back Guarantee Badge */}
        <div className="absolute -top-12 right-0 hidden lg:block animate-bounce-slow">
           <div className="w-24 h-24 rounded-full bg-white border-2 border-[var(--color-accent-gold)] flex flex-col items-center justify-center p-2 shadow-lg transform rotate-12">
             <ShieldCheck className="w-8 h-8 text-[var(--color-accent-gold)] mb-1" />
             <span className="text-[8px] font-black text-center leading-tight uppercase tracking-tighter">Secure<br/>Payment</span>
           </div>
        </div>

        <div className="text-center w-full max-w-xl">
          <Button 
            onClick={handleProceed}
            disabled={loading}
            size="lg"
            className="w-full rounded-2xl py-10 text-2xl font-bold text-white shadow-[0_25px_50px_-12px_rgba(150,173,148,0.4)] hover:shadow-[0_30px_60px_-15px_rgba(150,173,148,0.6)] transition-all bg-[var(--color-accent-sage)] hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
            {loading ? <><Loader2 className="w-6 h-6 mr-3 animate-spin" /> Finalizing...</> : <><CreditCard className="w-6 h-6 mr-3" /> Get Started Now</>}
          </Button>
          <p className="mt-4 text-xs font-bold text-[var(--color-accent-sage)] uppercase tracking-[0.2em]">Instant Access to Your Dashboard</p>
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
      <Header />
      <main className="pt-32 pb-20 px-6">
        <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[var(--color-accent-sage)]" /></div>}>
          <ChoosePlanContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
