"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  MessageSquare, 
  Eye, 
  Plus, 
  Calendar, 
  Settings, 
  LogOut,
  CreditCard,
  ChevronRight,
  Loader2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Check,
  ArrowRight,
  Shield
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import Image from "next/image";

const PLANS = [
  {
    id: "bronze",
    name: "Essential Listing",
    price: "£450",
    monthlyPrice: "£45",
    period: "/ year",
    description: "Everything you need to start receiving direct enquiries.",
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
    features: [
      "Everything in Professional",
      "Themed blog feature",
      "3 x Holiday Focus page inclusion",
      "Homepage featured placement",
      "Specialist page (Weddings/Corporate/etc)"
    ]
  }
];

export default function OwnerDashboard() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState<any[]>([]);
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState("bronze");

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/owner-login");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchProperties();
      const userPlan = (session.user as any).planId;
      if (userPlan) {
        setSelectedPlan(userPlan);
      }
    }
  }, [session]);

  const fetchProperties = async () => {
    try {
      const response = await fetch(`/api/properties?ownerId=${session?.user?.id}`);
      if (response.ok) {
        const data = await response.json();
        setProperties(data);
      }
    } catch (error) {
      console.error("Error fetching properties:", error);
    } finally {
      setPropertiesLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    await authClient.signOut();
    toast.success("Logged out successfully");
    router.push("/");
  };

  const handleManageBilling = async (propertyId: number) => {
    setLoading(true);
    try {
      const response = await fetch("/api/billing-portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create portal session");
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to open billing portal");
    } finally {
      setLoading(false);
    }
  };

  if (isPending) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-[var(--color-accent-sage)]" /></div>;
  if (!session) return null;

  const user = session.user as any;
  const pendingProperty = properties.find(p => p.status !== 'Active');

  const showPaymentBanner = !!pendingProperty || (user.paymentStatus === 'pending' && user.planId && properties.length === 0);

  const handlePayNow = async (propertyId?: number, planId?: string) => {
    setLoading(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          planId: planId || user.planId || 'bronze',
          propertyId: propertyId?.toString() || ""
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
      toast.error(err instanceof Error ? err.message : "Failed to initiate payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      <Header />

      <main className="pt-32 pb-20 px-6">
        <div className="max-w-[1200px] mx-auto">
          {/* Welcome Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
              <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>
                Welcome, {user.name.split(' ')[0]}
              </h1>
              <p className="text-[var(--color-neutral-dark)]">Manage your property and track performance from your dashboard.</p>
            </div>
            <div className="flex gap-4">
              <Button variant="outline" className="rounded-xl border-gray-200" onClick={handleLogout} disabled={loading}>
                <LogOut className="w-4 h-4 mr-2" />
                Log Out
              </Button>
              <Button 
                onClick={() => router.push("/admin/properties/new")}
                className="rounded-xl bg-[var(--color-accent-sage)] hover:bg-[var(--color-accent-sage)]/90 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Listing
              </Button>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Properties */}
            <div className="lg:col-span-2 space-y-8">
              {propertiesLoading ? (
                <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[var(--color-accent-sage)]" /></div>
              ) : properties.length > 0 && (
                <div className="space-y-6">
                  <h3 className="font-bold text-2xl">Your Properties</h3>
                  {properties.map((property) => (
                    <div key={property.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                      <div className="p-6 flex flex-col md:flex-row gap-6">
                        <div className="relative w-full md:w-48 h-32 rounded-2xl overflow-hidden flex-shrink-0">
                          <Image src={property.heroImage} alt={property.title} fill className="object-cover" />
                        </div>
                        <div className="flex-grow">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-bold text-xl">{property.title}</h4>
                              <p className="text-sm text-[var(--color-neutral-dark)]">{property.location}</p>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                              property.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {property.status || 'Pending'}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-[var(--color-neutral-dark)] mt-4">
                            <div className="flex items-center gap-1">
                              <CreditCard className="w-4 h-4" />
                              Plan: {property.plan || 'Not Selected'}
                              {property.nextPaymentDate && (
                                <span className="ml-2 text-xs">
                                  (Next: {new Date(property.nextPaymentDate).toLocaleDateString()})
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              0 Views
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageSquare className="w-4 h-4" />
                              0 Enquiries
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 px-6 flex justify-between items-center">
                        <div className="text-sm">
                          {property.status !== 'Active' ? (
                            <span className="text-amber-600 font-medium flex items-center gap-1">
                              <AlertCircle className="w-4 h-4" />
                              Payment required to activate listing
                            </span>
                          ) : (
                            <div className="flex items-center gap-4">
                              <span className="text-green-600 font-medium flex items-center gap-1">
                                <CheckCircle2 className="w-4 h-4" />
                                Listing is live and searchable
                              </span>
                              {property.stripeCustomerId && (
                                <button 
                                  onClick={() => handleManageBilling(property.id)}
                                  className="text-xs text-[var(--color-accent-sage)] hover:underline flex items-center gap-1"
                                  disabled={loading}
                                >
                                  <Settings className="w-3 h-3" />
                                  Manage Billing
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="rounded-lg" asChild>
                            <Link href={`/admin/properties/${property.id}/edit`}>Edit</Link>
                          </Button>
                          {property.status !== 'Active' ? (
                            <Button 
                              size="sm" 
                              className="bg-amber-600 hover:bg-amber-700 text-white rounded-lg"
                              onClick={() => {
                                if (property.plan) {
                                  handlePayNow(property.id, property.plan.toLowerCase());
                                } else {
                                  router.push(`/choose-plan?propertyId=${property.id}`);
                                }
                              }}
                              disabled={loading}
                            >
                              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Pay & Activate"}
                            </Button>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="rounded-lg border-[var(--color-accent-sage)] text-[var(--color-accent-sage)] hover:bg-[var(--color-accent-sage)] hover:text-white"
                              onClick={() => handleManageBilling(property.id)}
                              disabled={loading}
                            >
                              Upgrade Plan
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

{/* Payment & Plan Section - Improved UX */}
              {user.paymentStatus !== 'active' && (
                <div className="bg-gradient-to-br from-[var(--color-accent-sage)]/10 to-[var(--color-accent-sage)]/5 rounded-3xl overflow-hidden border border-[var(--color-accent-sage)]/20">
                  <div className="bg-[var(--color-accent-sage)] text-white py-8 px-8 text-center">
                    <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }}>
                      You're Almost There!
                    </h2>
                    <p className="text-white/90 text-lg">
                      Choose your plan to go live and start receiving enquiries
                    </p>
                  </div>

                  <div className="p-8">
                    <div className="grid md:grid-cols-3 gap-6 mb-8">
                      {PLANS.map((plan, index) => (
                        <div
                          key={plan.id}
                          onClick={() => setSelectedPlan(plan.id)}
                          className={`relative bg-white rounded-2xl p-6 cursor-pointer transition-all transform hover:scale-[1.02] ${
                            selectedPlan === plan.id
                              ? "ring-2 ring-[var(--color-accent-sage)] shadow-xl"
                              : "border border-gray-200 hover:border-[var(--color-accent-sage)]/50 hover:shadow-lg"
                          }`}
                        >
                          {index === 1 && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                              MOST POPULAR
                            </div>
                          )}
                          <div className="flex justify-between items-start mb-4">
                            <h3 className="font-bold text-lg">{plan.name}</h3>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                              selectedPlan === plan.id 
                                ? "bg-[var(--color-accent-sage)] border-[var(--color-accent-sage)]" 
                                : "border-gray-300"
                            }`}>
                              {selectedPlan === plan.id && <Check className="w-4 h-4 text-white" />}
                            </div>
                          </div>
                          <div className="mb-4">
                            <span className="text-3xl font-bold">{plan.price}</span>
                            <span className="text-sm text-[var(--color-neutral-dark)]"> + VAT / year</span>
                          </div>
                          <p className="text-sm text-[var(--color-neutral-dark)] mb-4">{plan.description}</p>
                          <ul className="space-y-2">
                            {plan.features.map((feature, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm">
                                <Check className="w-4 h-4 text-[var(--color-accent-sage)] mt-0.5 flex-shrink-0" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>

                    <div className="text-center space-y-4">
                      <Button
                        onClick={() => handlePayNow(pendingProperty?.id, selectedPlan)}
                        className="bg-[var(--color-accent-sage)] hover:bg-[var(--color-accent-sage)]/90 text-white px-16 py-7 text-xl rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02]"
                        disabled={loading}
                      >
                        {loading ? (
                          <Loader2 className="w-6 h-6 animate-spin mr-3" />
                        ) : (
                          <ArrowRight className="w-6 h-6 mr-3" />
                        )}
                        Activate & Go Live
                      </Button>
                      <div className="flex items-center justify-center gap-6 text-sm text-[var(--color-neutral-dark)]">
                        <span className="flex items-center gap-1">
                          <Shield className="w-4 h-4" />
                          Secure payment
                        </span>
                        <span className="flex items-center gap-1">
                          <CreditCard className="w-4 h-4" />
                          Cancel anytime
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Billing & Account */}
            <div className="space-y-8">
              {/* Account Summary */}
              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-xl mb-6">Account Summary</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-[var(--color-neutral-dark)] mb-1">Status</div>
                    <div className={`font-bold ${user.paymentStatus === 'active' ? 'text-green-600' : 'text-amber-600'}`}>
                      {user.paymentStatus === 'active' ? 'Active Subscription' : 'Payment Pending'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-[var(--color-neutral-dark)] mb-1">Email</div>
                    <div className="font-medium truncate">{user.email}</div>
                  </div>
                </div>
                <div className="mt-8 pt-8 border-t border-gray-100 space-y-4">
                  <Button variant="outline" className="w-full rounded-xl border-gray-200" onClick={() => toast.info("Settings coming soon")}>
                    <Settings className="w-4 h-4 mr-2" />
                    Account Settings
                  </Button>
                  {user.paymentStatus === 'pending' ? (
                    <Button 
                      onClick={() => handlePayNow(pendingProperty?.id, user.planId)} 
                      className="w-full rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-md"
                      disabled={loading}
                    >
                      {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <><CreditCard className="w-4 h-4 mr-2" /> Pay Now & Activate</>}
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      className="w-full rounded-xl border-gray-200" 
                      disabled={loading || properties.length === 0}
                      onClick={() => properties[0] && handleManageBilling(properties[0].id)}
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Manage Billing
                    </Button>
                  )}
                </div>
              </div>

              {/* Property Support */}
              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-xl mb-4">Property Support</h3>
                <p className="text-sm text-[var(--color-neutral-dark)] mb-6">Need help with your listing or account? Our expert team is on hand to assist.</p>
                <div className="space-y-2">
                  <p className="text-sm font-bold">Email us:</p>
                  <a href="mailto:hello@groupescapehouses.co.uk" className="text-[var(--color-accent-sage)] hover:underline">
                    hello@groupescapehouses.co.uk
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
