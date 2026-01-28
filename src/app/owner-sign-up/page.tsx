"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { Loader2, ArrowRight, Eye, EyeOff } from "lucide-react";

function SignUpForm() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    propertyName: "",
    propertyWebsite: "",
    agreeToTerms: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.agreeToTerms) {
      toast.error("You must agree to the terms and conditions");
      return;
    }

    setLoading(true);
    
    try {
      const { data, error } = await (authClient.signUp.email as any)({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        callbackURL: "/owner-dashboard",
        role: "owner",
        phoneNumber: formData.phone,
        propertyName: formData.propertyName,
        propertyWebsite: formData.propertyWebsite,
      });

      if (error) {
        toast.error(error.message || "Something went wrong");
      } else {
        toast.success("Account created successfully! Redirecting to your dashboard...");
        router.push("/owner-dashboard");
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xl border border-gray-100">
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>Create Your Free Account</h2>
        <p className="text-sm sm:text-base text-[var(--color-neutral-dark)]">Start listing your properties with no upfront cost</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
          <Input 
            id="name" 
            name="name"
            autoComplete="name"
            placeholder="" 
            required 
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="rounded-xl border-gray-200 h-11 focus:ring-sage-500/20 focus:border-sage-500"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
          <Input 
            id="email" 
            name="email"
            type="email" 
            autoComplete="email"
            placeholder="" 
            required 
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            className="rounded-xl border-gray-200 h-11 focus:ring-sage-500/20 focus:border-sage-500"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
            <Input 
              id="phone" 
              name="phone"
              type="tel" 
              inputMode="tel"
              autoComplete="tel"
            placeholder="" 
            required 
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            className="rounded-xl border-gray-200 h-11 focus:ring-sage-500/20 focus:border-sage-500"
          />
        </div>

          <div className="space-y-1.5">
            <Label htmlFor="propertyName" className="text-sm font-medium">Property Name</Label>
            <Input 
              id="propertyName" 
              name="company"
              autoComplete="organization"
              placeholder="" 
              required 
              value={formData.propertyName}
              onChange={(e) => setFormData({...formData, propertyName: e.target.value})}
              className="rounded-xl border-gray-200 h-11 focus:ring-sage-500/20 focus:border-sage-500"
            />
          </div>

        <div className="space-y-1.5">
          <Label htmlFor="propertyWebsite" className="text-sm font-medium">Property Website URL (Optional)</Label>
          <Input 
            id="propertyWebsite" 
            name="url"
            type="url" 
            autoComplete="url"
            placeholder="" 
            value={formData.propertyWebsite}
            onChange={(e) => setFormData({...formData, propertyWebsite: e.target.value})}
            className="rounded-xl border-gray-200 h-11 focus:ring-sage-500/20 focus:border-sage-500"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-sm font-medium">Password</Label>
          <div className="relative">
            <Input 
              id="password" 
              name="new-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="" 
              required 
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="rounded-xl border-gray-200 h-11 pr-10 focus:ring-sage-500/20 focus:border-sage-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-start space-x-3 pt-2">
          <Checkbox 
            id="terms" 
            className="mt-1"
            checked={formData.agreeToTerms}
            onCheckedChange={(checked) => setFormData({...formData, agreeToTerms: checked as boolean})}
          />
          <Label htmlFor="terms" className="text-sm font-normal text-[var(--color-neutral-dark)] leading-snug">
            I agree to the <Link href="/terms" className="text-[var(--color-accent-sage)] font-semibold hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-[var(--color-accent-sage)] font-semibold hover:underline">Privacy Policy</Link>
          </Label>
        </div>

        <Button 
          type="submit" 
          disabled={loading}
          className="w-full rounded-xl py-6 text-base sm:text-lg font-semibold text-white shadow-lg transition-all active:scale-[0.98]"
          style={{ background: "var(--color-accent-sage)" }}
        >
          {loading ? (
            <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Creating Account...</>
          ) : (
            <><ArrowRight className="w-5 h-5 mr-2" /> Create Free Account</>
          )}
        </Button>

        <p className="text-center text-sm text-[var(--color-neutral-dark)]">
          Already have an account? <Link href="/owner-login" className="text-[var(--color-accent-sage)] font-bold hover:underline">Log in</Link>
        </p>
      </form>
    </div>
  );
}

export default function OwnerSignUp() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      <Header />
      <main className="pt-24 sm:pt-32 pb-20 px-4 sm:px-6">
        <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[var(--color-accent-sage)]" /></div>}>
          <SignUpForm />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
