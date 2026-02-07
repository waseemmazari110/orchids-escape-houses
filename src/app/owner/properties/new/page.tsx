"use client";

import { OwnerPropertyForm } from "@/components/OwnerPropertyForm";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { toast } from "sonner";

function OwnerNewPropertyPageContent() {
  const searchParams = useSearchParams();
  const paymentSuccess = searchParams.get("payment");
  const planId = searchParams.get("planId");
  const sessionId = searchParams.get("session_id");
  const purchaseId = searchParams.get("purchaseId");
  
  const [verifiedPayment, setVerifiedPayment] = useState<any>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    // If using existing plan purchase, show success message
    if (purchaseId && planId) {
      toast.success(`Using your purchased ${planId.toUpperCase()} plan. Complete your property details below.`);
      setVerifiedPayment({ planId, purchaseId });
      return;
    }

    // Verify payment if coming from Stripe
    if (paymentSuccess === "success" && sessionId) {
      setVerifying(true);
      fetch(`/api/payment/verify?session_id=${sessionId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setVerifiedPayment(data);
            toast.success(`Payment successful! Your ${data.planId?.toUpperCase()} plan is active. Now complete your property details.`);
          } else {
            toast.error("Payment verification failed. Please contact support.");
          }
        })
        .catch(err => {
          console.error("Payment verification error:", err);
          toast.error("Could not verify payment. Please contact support.");
        })
        .finally(() => setVerifying(false));
    }
  }, [paymentSuccess, sessionId, purchaseId, planId]);

  return (
    <>
      {/* Payment Success Banner */}
      {verifiedPayment && (
        <div className="mb-8 p-6 bg-green-50 border-2 border-green-200 rounded-xl">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-600 mt-1" />
            <div>
              <h3 className="font-bold text-green-900 mb-2 text-lg">Payment Successful!</h3>
              <p className="text-green-800">
                Your <span className="font-semibold">{verifiedPayment.planId?.toUpperCase()} Plan</span> is now active. 
                Complete the property details below to submit for approval.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <Link href="/owner-dashboard">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mb-4 text-[var(--color-accent-sage)] hover:text-[var(--color-accent-sage)]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <h1 
          className="text-3xl sm:text-4xl font-bold text-[var(--color-text-primary)] mb-3"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Add New Property
        </h1>
        <p className="text-[var(--color-neutral-dark)] text-lg">
          Complete all steps to create your property listing.
        </p>
      </div>

      {/* Multi-Step Form */}
      <div>
        <OwnerPropertyForm 
          paidPlanId={verifiedPayment?.planId}
          paymentIntentId={verifiedPayment?.paymentIntentId}
          purchaseId={verifiedPayment?.purchaseId}
        />
      </div>
    </>
  );
}

export default function OwnerNewPropertyPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      <Header />
      
      <main className="pt-24 pb-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <Suspense fallback={<div>Loading...</div>}>
            <OwnerNewPropertyPageContent />
          </Suspense>
        </div>
      </main>

      <Footer />
    </div>
  );
}
