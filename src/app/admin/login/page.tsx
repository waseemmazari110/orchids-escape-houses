"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Eye, EyeOff, Loader2, Shield } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check if user is already authenticated
  useEffect(() => {
    async function checkAuth() {
      try {
        const session = await authClient.getSession();
        if (session?.data?.user) {
          const userResponse = await fetch("/api/user/profile", { cache: 'no-store' });
          if (userResponse.ok) {
            const userData = await userResponse.json();
            if (userData.role === "admin") {
              router.replace("/admin/dashboard");
              return;
            }
          }
        }
      } catch (error) {
        console.error("Auth check error:", error);
      } finally {
        setIsCheckingAuth(false);
      }
    }
    checkAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);

    try {
      // Use better-auth signIn method
      const { data, error } = await authClient.signIn.email({
        email,
        password,
      });

      if (error) {
        toast.error(error.message || "Invalid credentials");
        setIsLoading(false);
        return;
      }

      // Check if user is an admin
      if ((data?.user as any)?.role !== "admin") {
        toast.error("Admin access required");
        await authClient.signOut();
        setIsLoading(false);
        return;
      }

      toast.success("Welcome back, Admin!");
      router.push("/admin/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      toast.error("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#F5F3F0] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#89A38F]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F3F0] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Back to Home */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-[#374151] hover:text-[#89A38F] transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-6 border border-[#E5D8C5]">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-[#89A38F] to-[#C6A76D] rounded-xl flex items-center justify-center mb-4 shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-[#1F2937] mb-2 font-display">
              Admin Portal
            </h1>
            <p className="text-sm text-[#374151]">
              Sign in to access the admin dashboard
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <Label htmlFor="email" className="text-[#1F2937]">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="mt-1.5 h-11 border-[#E5D8C5] focus:border-[#89A38F] focus:ring-[#89A38F]"
                disabled={isLoading}
              />
            </div>

            {/* Password Field */}
            <div>
              <Label htmlFor="password" className="text-[#1F2937]">Password</Label>
              <div className="relative mt-1.5">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="h-11 pr-10 border-[#E5D8C5] focus:border-[#89A38F] focus:ring-[#89A38F]"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#374151] hover:text-[#89A38F]"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-gradient-to-r from-[#89A38F] to-[#C6A76D] hover:from-[#7a9280] hover:to-[#b89960] text-white font-medium rounded-lg shadow-md transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="pt-4 border-t border-[#E5D8C5]">
            <p className="text-xs text-center text-[#374151]">
              This portal is restricted to authorized administrators only.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
