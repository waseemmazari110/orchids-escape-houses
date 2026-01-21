"use client";

import { OwnerPropertyForm } from "@/components/OwnerPropertyForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function OwnerNewPropertyPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      <Header />
      
      <main className="pt-24 pb-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
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
              Complete all steps to create a new property listing. You can save as draft at any time.
            </p>
          </div>

          {/* Multi-Step Form */}
          <div>
            <OwnerPropertyForm />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
