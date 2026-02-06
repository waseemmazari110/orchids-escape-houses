"use client";

import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

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
    description: "Everything you need to start receiving direct enquiries.",
    color: "#B87333",
    saveAmount: null,
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
    description: "Enhanced visibility and social media promotion.",
    color: "#71717A",
    popular: true,
    saveAmount: "£30",
    features: [
      "Everything in Essential",
      "Professional page build & support",
      "Social media promotion (inc Late Deals)",
      "Enhanced search visibility",
      "Priority support"
    ]
  },
  {
    id: "gold",
    name: "Premium Listing",
    price: "£850",
    monthlyPrice: "£85",
    period: "/ year",
    description: "Maximum exposure across the entire platform.",
    color: "#C6A76D",
    saveAmount: "£40",
    features: [
      "Everything in Professional",
      "Themed blog feature",
      "3 x Holiday Focus page inclusion",
      "Homepage featured placement",
      "Specialist page (Weddings/Corporate/etc)"
    ]
  }
];

function ChoosePlanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPlan = searchParams.get("plan") || "bronze";
  const errorParam = searchParams.get("error");
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
      const propertyTitle = searchParams.get("propertyTitle");
      
      // Create checkout session
      const response = await fetch("/api/checkout/property-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          planId: selectedPlan,
          propertyId: propertyId ? parseInt(propertyId) : null,
          propertyTitle: propertyTitle || ""
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

  const propertyId = searchParams.get("propertyId");
  const propertyTitle = searchParams.get("propertyTitle");

  return (
    <div className="max-w-7xl mx-auto px-6">
      <h1 className="text-5xl lg:text-6xl font-bold text-center mb-16" style={{ fontFamily: "var(--font-display)", color: "#2c3e50" }}>
        Choose Your Listing Plan
      </h1>

      <div className="grid md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div 
            key={plan.id}
            className={`bg-white rounded-3xl p-10 shadow-sm relative flex flex-col ${
              plan.popular ? "border-[3px] border-gray-400" : "border border-gray-200"
            }`}
          >
            {plan.popular && (
              <div 
                className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gray-500 text-white px-6 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider"
              >
                RECOMMENDED
              </div>
            )}
            
            <div className="mb-6">
              <h3 
                className="text-2xl font-bold mb-3" 
                style={{ fontFamily: "var(--font-display)", color: plan.color }}
              >
                {plan.name}
              </h3>
              <p className="text-gray-600 text-base leading-relaxed">{plan.description}</p>
            </div>
            
            <div className="mb-8">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-5xl font-bold" style={{ color: "#2c3e50" }}>{plan.price}</span>
                <span className="text-gray-600 font-medium text-base">+ VAT {plan.period}</span>
              </div>
              {plan.saveAmount && (
                <div className="text-sm font-bold text-gray-700 mt-2">
                  SAVE {plan.saveAmount} VALUE
                </div>
              )}
              <div className="text-sm text-gray-500 mt-1">
                or {plan.monthlyPrice} per month
              </div>
            </div>
            
            <ul className="space-y-3 mb-10 flex-grow">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-base leading-relaxed">{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              onClick={() => {
                setSelectedPlan(plan.id);
                handleProceed();
              }}
              disabled={loading && selectedPlan === plan.id}
              className="w-full py-6 text-lg font-semibold rounded-xl transition-all"
              style={{ 
                backgroundColor: plan.color,
                color: "white"
              }}
            >
              {loading && selectedPlan === plan.id ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing...</>
              ) : (
                "Continue to sign up"
              )}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ChoosePlan() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#e8dcc4" }}>
      <Header hideListingButton={true} />
      <main className="pt-32 pb-20">
        <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[var(--color-accent-sage)]" /></div>}>
          <ChoosePlanContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}