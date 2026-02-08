"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, ChevronRight, Save, Check, Home, MapPin, Bed, Sparkles, FileText, PoundSterling, Upload, Search, Users, Plus, Minus, Users2, UtensilsCrossed, Lock, Globe, Navigation, PartyPopper, ClipboardList, Clock, Calendar, AlertCircle, Banknote, BarChart3, Image, Video, Star, ChevronUp, ChevronDown, Trash2, Link as LinkIcon, Heading2, AlignLeft, Lightbulb } from "lucide-react";
import { toast } from "sonner";

type PropertyFormData = {
  // Essentials
  title: string;
  property_type: string;
  sleeps_min: number;
  sleeps_max: number;
  bedrooms: number;
  bathrooms: number;
  dining_capacity: number;
  best_for: string[]; // Categories: Hen, Birthdays, Corporate, Family, Weddings
  
  // Descriptions
  short_description: string; // Max 2 lines
  description: string; // Full description: why it works for groups
  
  // Location - Private (admin only)
  address: string;
  
  // Location - Public
  town: string;
  county: string;
  postcode: string;
  latitude?: number;
  longitude?: number;
  nearby_attractions?: string;
  
  // Amenities
  amenities: string[]; // Hot tub, Sauna, Games room, Garden, BBQ, Parking, WiFi, Pets allowed
  hens_allowed: boolean;
  corporate_allowed: boolean;
  weddings_allowed: boolean;
  house_rules: string;
  
  // Policies
  check_in_time: string;
  check_out_time: string;
  minimum_stay: number;
  cancellation_policy: string;
  
  // Pricing
  base_price: number;
  weekend_price?: number;
  cleaning_fee?: number;
  security_deposit?: number;
  
  // Media
  images: string[];
  hero_video?: string;
  video_type?: "upload" | "youtube" | "vimeo"; // Type of video
  
  // SEO
  meta_title?: string;
  meta_description?: string;
  slug?: string;
};

const STEPS = [
  { id: 1, name: "Property Details", icon: Home },
  { id: 2, name: "Descriptions", icon: FileText },
  { id: 3, name: "Location", icon: MapPin },
  { id: 4, name: "Amenities", icon: Sparkles },
  { id: 5, name: "Policies", icon: FileText },
  { id: 6, name: "Pricing", icon: PoundSterling },
  { id: 7, name: "Media", icon: Upload },
  { id: 8, name: "SEO", icon: Search },
];

const BEST_FOR_OPTIONS = [
  "Hen Parties",
  "Birthdays",
  "Corporate Events",
  "Family Gatherings",
  "Weddings"
];

const AMENITIES_OPTIONS = [
  "Hot Tub",
  "Sauna",
  "Games Room",
  "Garden",
  "BBQ",
  "Parking",
  "WiFi",
  "Pets Allowed"
];

const PROPERTY_TYPES = [
  "Manor House",
  "Country House",
  "Cottage",
  "Castle",
  "Luxury House",
  "Party House",
  "Stately House",
  "Quirky Property"
];

interface OwnerPropertyFormProps {
  propertyId?: string;
  initialData?: Partial<PropertyFormData>;
  paidPlanId?: string;
  paymentIntentId?: string;
  purchaseId?: number;
}

export function OwnerPropertyForm({ propertyId, initialData, paidPlanId, paymentIntentId, purchaseId }: OwnerPropertyFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState<PropertyFormData>({
    // Essentials
    title: initialData?.title || "",
    property_type: initialData?.property_type || "",
    sleeps_min: initialData?.sleeps_min || 2,
    sleeps_max: initialData?.sleeps_max || 8,
    bedrooms: initialData?.bedrooms || 4,
    bathrooms: initialData?.bathrooms || 2,
    dining_capacity: initialData?.dining_capacity || 8,
    best_for: initialData?.best_for || [],
    
    // Descriptions
    short_description: initialData?.short_description || "",
    description: initialData?.description || "",
    
    // Location - Private
    address: initialData?.address || "",
    
    // Location - Public
    town: initialData?.town || "",
    county: initialData?.county || "",
    postcode: initialData?.postcode || "",
    latitude: initialData?.latitude,
    longitude: initialData?.longitude,
    nearby_attractions: initialData?.nearby_attractions || "",
    
    // Amenities
    amenities: initialData?.amenities || [],
    hens_allowed: initialData?.hens_allowed || false,
    corporate_allowed: initialData?.corporate_allowed || false,
    weddings_allowed: initialData?.weddings_allowed || false,
    house_rules: initialData?.house_rules || "",
    
    // Policies
    check_in_time: initialData?.check_in_time || "15:00",
    check_out_time: initialData?.check_out_time || "10:00",
    minimum_stay: initialData?.minimum_stay || 2,
    cancellation_policy: initialData?.cancellation_policy || "",
    
    // Pricing
    base_price: initialData?.base_price || 0,
    weekend_price: initialData?.weekend_price,
    cleaning_fee: initialData?.cleaning_fee,
    security_deposit: initialData?.security_deposit,
    
    // Media
    images: initialData?.images || [],
    hero_video: initialData?.hero_video,
    video_type: initialData?.video_type || "youtube",
    
    // SEO
    meta_title: initialData?.meta_title,
    meta_description: initialData?.meta_description,
    slug: initialData?.slug,
  });

  const updateField = (field: keyof PropertyFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const canNavigateToStep = (targetStep: number): boolean => {
    // Check all steps before target step to ensure they have required fields
    for (let step = 1; step < targetStep; step++) {
      switch (step) {
        case 1: // Property Details
          if (!formData.title.trim() || !formData.property_type.trim()) return false;
          if (formData.sleeps_min < 1 || formData.sleeps_max < 1) return false;
          break;
        case 2: // Descriptions
          // Optional step
          break;
        case 3: // Location
          if (!formData.address.trim() || !formData.county.trim()) return false;
          break;
        case 4: // Amenities
          // Optional step
          break;
        case 5: // Policies
          // Optional step
          break;
        case 6: // Pricing
          if (formData.base_price <= 0) return false;
          break;
        case 7: // Media
          // Image requirement only enforced on submission, not navigation
          break;
      }
    }
    return true;
  };

  const handleStepClick = (stepId: number) => {
    if (canNavigateToStep(stepId)) {
      setCurrentStep(stepId);
    } else {
      toast.error("Please complete all required fields in previous steps");
    }
  };

  const handleNext = () => {
    // Validate required fields for current step
    const stepErrors: Record<string, string> = {};

    switch (currentStep) {
      case 1: // Property Details
        if (!formData.title.trim()) stepErrors.title = "Title is required";
        if (!formData.property_type.trim()) stepErrors.property_type = "Property type is required";
        if (formData.sleeps_min < 1) stepErrors.sleeps_min = "Min guests must be at least 1";
        if (formData.sleeps_max < 1) stepErrors.sleeps_max = "Max guests must be at least 1";
        if (formData.sleeps_max < formData.sleeps_min) stepErrors.sleeps_max = "Max must be >= Min";
        break;
      case 2: // Descriptions
        // Optional step
        break;
      case 3: // Location
        if (!formData.address.trim()) stepErrors.address = "Address is required";
        if (!formData.county.trim()) stepErrors.county = "County is required";
        break;
      case 4: // Amenities
        // Optional step
        break;
      case 5: // Policies
        // Optional step
        break;
      case 6: // Pricing
        if (formData.base_price <= 0) stepErrors.base_price = "Base price is required";
        break;
      case 7: // Media
        // Image requirement only enforced on submission, not navigation
        break;
      case 8: // SEO
        // Optional step
        break;
    }

    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      toast.error("Please fill in all required fields for this step");
      return;
    }

    setErrors({});
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Helper function to convert form data to API format
  const convertFormDataToAPI = (data: PropertyFormData, additionalFields?: any) => {
    const generateSlug = (title: string) => {
      return title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
    };

    const location = [data.address, data.town, data.county]
      .filter(Boolean)
      .join(', ');

    return {
      title: data.title,
      propertyType: data.property_type,
      slug: data.slug || generateSlug(data.title),
      location: location || data.address,
      region: data.county,
      postcode: data.postcode || null,
      latitude: data.latitude ? (typeof data.latitude === 'number' ? data.latitude : parseFloat(data.latitude as any)) : null,
      longitude: data.longitude ? (typeof data.longitude === 'number' ? data.longitude : parseFloat(data.longitude as any)) : null,
      sleepsMin: data.sleeps_min,
      sleepsMax: data.sleeps_max,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      diningCapacity: data.dining_capacity || null,
      bestFor: data.best_for.length > 0 ? JSON.stringify(data.best_for) : null,
      priceFromMidweek: data.base_price,
      priceFromWeekend: data.weekend_price || data.base_price,
      shortDescription: data.short_description || null,
      description: data.description,
      amenities: data.amenities.length > 0 ? JSON.stringify(data.amenities) : null,
      hensAllowed: data.hens_allowed ? 1 : 0,
      corporateAllowed: data.corporate_allowed ? 1 : 0,
      weddingsAllowed: data.weddings_allowed ? 1 : 0,
      houseRules: data.house_rules || null,
      nearbyAttractions: data.nearby_attractions || null,
      checkInOut: `Check-in: ${data.check_in_time}, Check-out: ${data.check_out_time}`,
      heroImage: data.images[0] || '',
      images: JSON.stringify(data.images),
      videoType: data.video_type || null,
      heroVideo: data.hero_video || null,
      floorplanURL: null,
      featured: false,
      ...additionalFields
    };
  };

  const handleSaveDraft = async () => {
    setIsLoading(true);
    try {
      const draftData = convertFormDataToAPI(formData, {
        isPublished: 0
      });

      if (propertyId) {
        // Update existing property
        const response = await fetch(`/api/properties?id=${propertyId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draftData),
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to save draft");
        }
        
        toast.success("Property draft saved successfully");
      } else {
        // Create new property as draft
        const response = await fetch("/api/properties", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draftData),
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to create property");
        }
        
        const data = await response.json();
        toast.success("Property draft created successfully");
        router.push(`/owner/properties/${data.id}/edit`);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to save draft");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = async () => {
    // Validate minimum images ONLY on submission
    if (formData.images.length === 0) {
      setErrors({ images: "At least one property image is required" });
      toast.error("Please add at least one property image");
      setCurrentStep(7); // Jump to media step
      return;
    }

    // Validate all required fields (minimal validation)
    const requiredFieldsErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) requiredFieldsErrors.title = "Title is required";
    if (!formData.property_type.trim()) requiredFieldsErrors.property_type = "Property type is required";
    if (!formData.address.trim()) requiredFieldsErrors.address = "Address is required";
    if (!formData.county.trim()) requiredFieldsErrors.county = "County is required";
    if (formData.sleeps_max < 1) requiredFieldsErrors.sleeps_max = "Max guests is required";
    if (formData.base_price <= 0) requiredFieldsErrors.base_price = "Base price is required";

    if (Object.keys(requiredFieldsErrors).length > 0) {
      setErrors(requiredFieldsErrors);
      toast.error("Please fill in all required fields");
      // Jump to first step with error
      if (requiredFieldsErrors.title || requiredFieldsErrors.property_type) setCurrentStep(1);
      else if (requiredFieldsErrors.address || requiredFieldsErrors.county) setCurrentStep(3);
      else if (requiredFieldsErrors.sleeps_max) setCurrentStep(1);
      else if (requiredFieldsErrors.base_price) setCurrentStep(6);
      return;
    }

    setIsLoading(true);
    try {
      const publishData = convertFormDataToAPI(formData, {
        isPublished: 1,  // Set as published
        status: 'published'  // Send status so API converts to pending_approval
      });

      // Add payment information if provided (from pre-payment flow)
      if (paidPlanId) {
        const now = new Date();
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        
        publishData.plan_id = paidPlanId;
        publishData.payment_status = 'paid';
        publishData.stripe_payment_intent_id = paymentIntentId;
        publishData.plan_purchased_at = now.toISOString();
        publishData.plan_expires_at = expiresAt.toISOString();
      }

      if (propertyId) {
        // Update existing property
        const response = await fetch(`/api/properties?id=${propertyId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(publishData),
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to update property");
        }
        
        toast.success("Property submitted for approval! Our team will review it shortly.");
        router.push("/owner-dashboard?view=approvals");
      } else {
        // Create new property
        const response = await fetch("/api/properties", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(publishData),
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to create property");
        }
        
        const createdProperty = await response.json();
        
        // If using an existing plan purchase, mark it as used
        if (purchaseId && createdProperty?.id) {
          try {
            await fetch("/api/owner/mark-plan-used", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                purchaseId,
                propertyId: createdProperty.id
              }),
            });
          } catch (err) {
            console.error("Failed to mark plan as used:", err);
            // Non-critical error, continue anyway
          }
        }
        
        toast.success("Property submitted for approval! Our team will review it shortly.");
        router.push("/owner-dashboard?view=approvals");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to publish property");
    } finally {
      setIsLoading(false);
    }
  };

  const addImageUrl = () => {
    const url = prompt("Enter image URL:");
    if (url) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, url]
      }));
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const moveImageUp = (index: number) => {
    if (index <= 0) return;
    setFormData(prev => {
      const newImages = [...prev.images];
      [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
      return { ...prev, images: newImages };
    });
  };

  const moveImageDown = (index: number) => {
    if (index >= formData.images.length - 1) return;
    setFormData(prev => {
      const newImages = [...prev.images];
      [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
      return { ...prev, images: newImages };
    });
  };

  const setHeroImage = (index: number) => {
    setFormData(prev => {
      const newImages = [...prev.images];
      const heroImage = newImages.splice(index, 1)[0];
      return { ...prev, images: [heroImage, ...newImages] };
    });
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return;

    const newImages: string[] = [];
    const maxImages = 20;
    const remainingSlots = maxImages - formData.images.length;

    for (let i = 0; i < Math.min(files.length, remainingSlots); i++) {
      const file = files[i];

      // Validate file type
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toast.error(`Invalid file type: ${file.name}. Only JPG, PNG, and WebP are allowed.`);
        continue;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File ${file.name} is too large. Max 5MB allowed.`);
        continue;
      }

      // Convert file to base64 or blob URL
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, result]
        }));
      };
      reader.readAsDataURL(file);
    }

    if (formData.images.length + files.length > maxImages) {
      toast.warning(`Only ${remainingSlots} more image(s) can be uploaded. Max is ${maxImages}.`);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: // Property Details
        return (
          <div className="space-y-8">
            {/* Basic Info Section */}
            <div className="bg-gradient-to-br from-[var(--color-accent-sage)]/5 to-transparent border border-[var(--color-accent-sage)]/20 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-5 flex items-center gap-2">
                <Home className="w-5 h-5 text-[var(--color-accent-sage)]" />
                Basic Information
              </h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title" className="text-sm font-semibold text-[var(--color-text-primary)]">Property Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    placeholder="e.g., The Brighton Manor House"
                    className={`rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-[var(--color-accent-sage)] focus:border-transparent transition-all mt-2 ${errors.title ? "border-red-500" : ""}`}
                  />
                  {errors.title && <p className="text-red-500 text-xs mt-1.5">{errors.title}</p>}
                </div>

                <div>
                  <Label htmlFor="property_type" className="text-sm font-semibold text-[var(--color-text-primary)]">Property Type *</Label>
                  <Select value={formData.property_type} onValueChange={(value) => updateField("property_type", value)}>
                    <SelectTrigger className={`rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-[var(--color-accent-sage)] focus:border-transparent transition-all mt-2 ${errors.property_type ? "border-red-500" : ""}`}>
                      <SelectValue placeholder="Select property type" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROPERTY_TYPES.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.property_type && <p className="text-red-500 text-xs mt-1.5">{errors.property_type}</p>}
                </div>
              </div>
            </div>

            {/* Best For Section */}
            <div className="bg-gradient-to-br from-[var(--color-accent-gold)]/5 to-transparent border border-[var(--color-accent-gold)]/20 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-5 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[var(--color-accent-gold)]" />
                Best For (Select All That Apply) *
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {BEST_FOR_OPTIONS.map(category => (
                  <div
                    key={category}
                    onClick={() => {
                      if (formData.best_for.includes(category)) {
                        updateField("best_for", formData.best_for.filter(c => c !== category));
                      } else {
                        updateField("best_for", [...formData.best_for, category]);
                      }
                    }}
                    className={`p-4 rounded-lg border-2 transition-all cursor-pointer flex items-center gap-3 ${
                      formData.best_for.includes(category)
                        ? "border-[var(--color-accent-gold)] bg-[var(--color-accent-gold)]/10"
                        : "border-gray-200 hover:border-[var(--color-accent-gold)]/50"
                    }`}
                  >
                    <Checkbox
                      checked={formData.best_for.includes(category)}
                      onCheckedChange={() => {}}
                      className="cursor-pointer"
                    />
                    <span className="text-sm font-medium text-[var(--color-text-primary)]">{category}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Capacity Section */}
            <div className="bg-gradient-to-br from-[#D4A5A5]/10 to-transparent border border-[#D4A5A5]/30 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-5 flex items-center gap-2">
                <Users className="w-5 h-5" style={{color: 'var(--color-accent-pink)'}} />
                Guest Capacity
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Min Guests */}
                <div>
                  <Label className="text-sm font-semibold text-[var(--color-text-primary)] block mb-3">Min Guests *</Label>
                  <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg overflow-hidden shadow-sm">
                    <button
                      type="button"
                      onClick={() => updateField("sleeps_min", Math.max(1, formData.sleeps_min - 1))}
                      className="flex-shrink-0 w-12 h-12 flex items-center justify-center hover:bg-[#D4A5A5]/10 transition-colors" style={{color: 'var(--color-accent-pink)'}}
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={formData.sleeps_min}
                      onChange={(e) => updateField("sleeps_min", parseInt(e.target.value) || 1)}
                      className="flex-1 text-center text-2xl font-bold border-0 focus:ring-0 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => updateField("sleeps_min", formData.sleeps_min + 1)}
                      className="flex-shrink-0 w-12 h-12 flex items-center justify-center hover:bg-[#D4A5A5]/10 transition-colors" style={{color: 'var(--color-accent-pink)'}}
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  {errors.sleeps_min && <p className="text-red-500 text-xs mt-1.5">{errors.sleeps_min}</p>}
                </div>

                {/* Max Guests */}
                <div>
                  <Label className="text-sm font-semibold text-[var(--color-text-primary)] block mb-3">Max Guests *</Label>
                  <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg overflow-hidden shadow-sm">
                    <button
                      type="button"
                      onClick={() => updateField("sleeps_max", Math.max(formData.sleeps_min, formData.sleeps_max - 1))}
                      className="flex-shrink-0 w-12 h-12 flex items-center justify-center hover:bg-[#D4A5A5]/10 transition-colors" style={{color: 'var(--color-accent-pink)'}}
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={formData.sleeps_max}
                      onChange={(e) => updateField("sleeps_max", Math.max(formData.sleeps_min, parseInt(e.target.value) || 1))}
                      className="flex-1 text-center text-2xl font-bold border-0 focus:ring-0 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => updateField("sleeps_max", formData.sleeps_max + 1)}
                      className="flex-shrink-0 w-12 h-12 flex items-center justify-center hover:bg-[#D4A5A5]/10 transition-colors" style={{color: 'var(--color-accent-pink)'}}
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  {errors.sleeps_max && <p className="text-red-500 text-xs mt-1.5">{errors.sleeps_max}</p>}
                </div>
              </div>
            </div>

            {/* Rooms & Facilities Section */}
            <div className="bg-gradient-to-br from-[#89A38F]/10 to-transparent border border-[#89A38F]/30 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-5 flex items-center gap-2">
                <Bed className="w-5 h-5" style={{color: 'var(--color-accent-sage)'}} />
                Rooms & Facilities
              </h3>
              
              <div className="grid grid-cols-3 gap-4">
                {/* Bedrooms */}
                <div>
                  <Label className="text-sm font-semibold text-[var(--color-text-primary)] block mb-3">Bedrooms</Label>
                  <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg overflow-hidden shadow-sm">
                    <button
                      type="button"
                      onClick={() => updateField("bedrooms", Math.max(1, formData.bedrooms - 1))}
                      className="flex-shrink-0 w-12 h-12 flex items-center justify-center text-emerald-600 hover:bg-emerald-50 transition-colors font-bold text-xl"
                    >
                      −
                    </button>
                    <div className="flex-1 flex items-center justify-center">
                      <span className="text-2xl font-bold text-gray-900">{formData.bedrooms}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateField("bedrooms", formData.bedrooms + 1)}
                      className="flex-shrink-0 w-12 h-12 flex items-center justify-center text-emerald-600 hover:bg-emerald-50 transition-colors font-bold text-xl"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Bathrooms */}
                <div>
                  <Label className="text-sm font-semibold text-[var(--color-text-primary)] block mb-3">Bathrooms</Label>
                  <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg overflow-hidden shadow-sm">
                    <button
                      type="button"
                      onClick={() => updateField("bathrooms", Math.max(1, formData.bathrooms - 1))}
                      className="flex-shrink-0 w-12 h-12 flex items-center justify-center text-emerald-600 hover:bg-emerald-50 transition-colors font-bold text-xl"
                    >
                      −
                    </button>
                    <div className="flex-1 flex items-center justify-center">
                      <span className="text-2xl font-bold text-gray-900">{formData.bathrooms}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateField("bathrooms", formData.bathrooms + 1)}
                      className="flex-shrink-0 w-12 h-12 flex items-center justify-center text-emerald-600 hover:bg-emerald-50 transition-colors font-bold text-xl"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Dining Capacity */}
                <div>
                  <Label className="text-sm font-semibold text-[var(--color-text-primary)] block mb-3">Dining Capacity</Label>
                  <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg overflow-hidden shadow-sm">
                    <button
                      type="button"
                      onClick={() => updateField("dining_capacity", Math.max(1, formData.dining_capacity - 1))}
                      className="flex-shrink-0 w-12 h-12 flex items-center justify-center text-emerald-600 hover:bg-emerald-50 transition-colors font-bold text-xl"
                    >
                      −
                    </button>
                    <div className="flex-1 flex items-center justify-center">
                      <span className="text-2xl font-bold text-gray-900">{formData.dining_capacity}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateField("dining_capacity", formData.dining_capacity + 1)}
                      className="flex-shrink-0 w-12 h-12 flex items-center justify-center text-emerald-600 hover:bg-emerald-50 transition-colors font-bold text-xl"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 2: // Descriptions
        return (
          <div className="space-y-8">
            {/* Short Summary Section */}
            <div className="bg-gradient-to-br from-[#89A38F]/10 to-transparent border border-[#89A38F]/30 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-5 flex items-center gap-2">
                <FileText className="w-5 h-5" style={{color: 'var(--color-accent-sage)'}} />
                Quick Summary
              </h3>
              
              <Textarea
                id="short_description"
                value={formData.short_description}
                onChange={(e) => {
                  const lines = e.target.value.split('\n');
                  if (lines.length <= 2) {
                    updateField("short_description", e.target.value);
                  }
                }}
                placeholder="e.g., Stunning 5-bedroom countryside manor with games room and hot tub, perfect for celebrations"
                rows={2}
                maxLength={200}
                className="rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-[#89A38F] focus:border-transparent transition-all resize-none"
              />
              <p className="text-sm text-gray-600 mt-3 flex items-center justify-between">
                <span>Perfect for grabbing attention at a glance</span>
                <span className="font-medium" style={{color: 'var(--color-accent-sage)'}}>{formData.short_description.length}/200</span>
              </p>
            </div>

            {/* Full Description Section */}
            <div className="bg-gradient-to-br from-[#C6A76D]/10 to-transparent border border-[#C6A76D]/30 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-5 flex items-center gap-2">
                <FileText className="w-5 h-5" style={{color: 'var(--color-accent-gold)'}} />
                Detailed Description
              </h3>
              
              <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                Explain what makes this property perfect for group events. Highlight layout, atmosphere, and group-friendly features.
              </p>
              
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Tell the story of your property. What makes it special for groups? Think about:
- Flexible spaces for different group activities
- Unique features (games room, outdoor space, etc.)
- Atmosphere and vibe
- Why groups love this place
- Memorable experiences guests can have here"
                rows={8}
                className="rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-[#C6A76D] focus:border-transparent transition-all resize-none"
              />
              <p className="text-sm text-gray-600 mt-3">
                No character limit. More detail = better search visibility and bookings.
              </p>
            </div>

            {/* Help Tips */}
            <div className="bg-[#D4A5A5]/10 border border-[#D4A5A5]/30 rounded-2xl p-6">
              <h4 className="font-semibold mb-3" style={{color: 'var(--color-accent-pink)'}}>💡 Tips for Great Descriptions</h4>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>✓ Be specific about spaces and features</li>
                <li>✓ Use descriptive language (cozy, spacious, intimate, etc.)</li>
                <li>✓ Mention any recent renovations or updates</li>
                <li>✓ Describe the overall vibe and atmosphere</li>
              </ul>
            </div>
          </div>
        );

      case 3: // Location
        return (
          <div className="space-y-8">
            {/* Privacy Info */}
            <div className="bg-[#C6A76D]/10 border border-[#C6A76D]/30 rounded-2xl p-6 flex items-start gap-3">
              <MapPin className="w-6 h-6 flex-shrink-0 mt-0.5" style={{color: 'var(--color-accent-gold)'}} />
              <div>
                <h4 className="font-semibold mb-2" style={{color: 'var(--color-accent-gold)'}}>Privacy-First Location Data</h4>
                <p className="text-sm text-gray-700">Your full address is kept private and admin-only. Guests will only see the town, county, and postcode area.</p>
              </div>
            </div>

            {/* Private Address */}
            <div className="bg-gradient-to-br from-[#D4A5A5]/10 to-transparent border border-[#D4A5A5]/30 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-5 flex items-center gap-2">
                <Lock className="w-5 h-5" style={{color: 'var(--color-accent-pink)'}} />
                Private Address (Admin Only)
              </h3>
              
              <div>
                <Label htmlFor="address" className="text-sm font-semibold text-[var(--color-text-primary)]">Full Address *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => updateField("address", e.target.value)}
                  placeholder="123 High Street, London, England"
                  className={`rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-[#D4A5A5] focus:border-transparent transition-all mt-2 ${errors.address ? "border-red-500" : ""}`}
                />
                {errors.address && <p className="text-red-500 text-xs mt-1.5">{errors.address}</p>}
                <p className="text-xs text-gray-600 mt-2">This address is never shown to guests</p>
              </div>
            </div>

            {/* Public Location */}
            <div className="bg-gradient-to-br from-[#89A38F]/10 to-transparent border border-[#89A38F]/30 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-5 flex items-center gap-2">
                <Globe className="w-5 h-5" style={{color: 'var(--color-accent-sage)'}} />
                Public Location (Visible to Guests)
              </h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="town" className="text-sm font-semibold text-[var(--color-text-primary)]">Town/City</Label>
                    <Input
                      id="town"
                      value={formData.town}
                      onChange={(e) => updateField("town", e.target.value)}
                      placeholder="e.g., London"
                      className="rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-[#89A38F] focus:border-transparent transition-all mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="county" className="text-sm font-semibold text-[var(--color-text-primary)]">County/Region *</Label>
                    <Input
                      id="county"
                      value={formData.county}
                      onChange={(e) => updateField("county", e.target.value)}
                      placeholder="e.g., Greater London"
                      className={`rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-[#89A38F] focus:border-transparent transition-all mt-2 ${errors.county ? "border-red-500" : ""}`}
                    />
                    {errors.county && <p className="text-red-500 text-xs mt-1.5">{errors.county}</p>}
                  </div>
                </div>

                <div>
                  <Label htmlFor="postcode" className="text-sm font-semibold text-[var(--color-text-primary)]">Postcode Area</Label>
                  <Input
                    id="postcode"
                    value={formData.postcode}
                    onChange={(e) => updateField("postcode", e.target.value)}
                    placeholder="e.g., SW1A (first part only)"
                    className="rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all mt-2"
                  />
                  <p className="text-xs text-gray-600 mt-2">Shows first part of postcode for privacy</p>
                </div>
              </div>
            </div>

            {/* Map Coordinates */}
            <div className="bg-gradient-to-br from-[#C6A76D]/10 to-transparent border border-[#C6A76D]/30 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-5 flex items-center gap-2">
                <Navigation className="w-5 h-5" style={{color: 'var(--color-accent-gold)'}} />
                Map Location (Optional)
              </h3>
              
              <p className="text-sm text-[var(--color-text-secondary)] mb-4">Provide GPS coordinates so guests can find your property on a map</p>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="latitude" className="text-sm font-semibold text-[var(--color-text-primary)]">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="0.0001"
                    value={formData.latitude || ""}
                    onChange={(e) => updateField("latitude", parseFloat(e.target.value) || undefined)}
                    placeholder="e.g., 51.5074"
                    className="rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all mt-2"
                  />
                  <p className="text-xs text-gray-600 mt-1.5">North/South position</p>
                </div>

                <div>
                  <Label htmlFor="longitude" className="text-sm font-semibold text-[var(--color-text-primary)]">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="0.0001"
                    value={formData.longitude || ""}
                    onChange={(e) => updateField("longitude", parseFloat(e.target.value) || undefined)}
                    placeholder="e.g., -0.1278"
                    className="rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all mt-2"
                  />
                  <p className="text-xs text-gray-600 mt-1.5">East/West position</p>
                </div>
              </div>
            </div>

            {/* Nearby Attractions */}
            <div className="bg-gradient-to-br from-[#D4A5A5]/10 to-transparent border border-[#D4A5A5]/30 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-5 flex items-center gap-2">
                <MapPin className="w-5 h-5" style={{color: 'var(--color-accent-pink)'}} />
                Local Highlights (Optional)
              </h3>
              
              <Textarea
                id="nearby_attractions"
                value={formData.nearby_attractions}
                onChange={(e) => updateField("nearby_attractions", e.target.value)}
                placeholder="What's nearby? Examples:
- Central Park · 5 mins walk
- Fine dining restaurants · 10 mins
- Museums and galleries · 15 mins
- Train station · 20 mins
- Beach · 30 mins"
                rows={4}
                className="rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-[#D4A5A5] focus:border-transparent transition-all resize-none"
              />
              <p className="text-xs text-gray-600 mt-2">Help guests plan their stay with local attractions and facilities</p>
            </div>
          </div>
        );

      case 4: // Amenities
        return (
          <div className="space-y-8">
            {/* Amenities Section */}
            <div className="bg-gradient-to-br from-[#89A38F]/10 to-transparent border border-[#89A38F]/30 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-5 flex items-center gap-2">
                <Sparkles className="w-5 h-5" style={{color: 'var(--color-accent-sage)'}} />
                Available Amenities
              </h3>
              
              <p className="text-sm text-[var(--color-text-secondary)] mb-5">
                Select all the amenities that guests will have access to
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {AMENITIES_OPTIONS.map(amenity => (
                  <div
                    key={amenity}
                    onClick={() => {
                      if (formData.amenities.includes(amenity)) {
                        updateField("amenities", formData.amenities.filter(a => a !== amenity));
                      } else {
                        updateField("amenities", [...formData.amenities, amenity]);
                      }
                    }}
                    className={`p-4 rounded-lg border-2 transition-all cursor-pointer flex items-center gap-3 ${
                      formData.amenities.includes(amenity)
                        ? "border-[#89A38F] bg-[#89A38F]/10"
                        : "border-gray-200 hover:border-[#89A38F]/50"
                    }`}
                  >
                    <Checkbox
                      checked={formData.amenities.includes(amenity)}
                      onCheckedChange={() => {}}
                      className="cursor-pointer"
                    />
                    <span className="text-sm font-medium text-[var(--color-text-primary)]">{amenity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Event Types Section */}
            <div className="bg-gradient-to-br from-[#D4A5A5]/10 to-transparent border border-[#D4A5A5]/30 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-5 flex items-center gap-2">
                <PartyPopper className="w-5 h-5" style={{color: 'var(--color-accent-pink)'}} />
                Event Types Allowed
              </h3>
              
              <p className="text-sm text-[var(--color-text-secondary)] mb-5">
                Tell us what types of events you're happy to host
              </p>
              
              <div className="space-y-3">
                <div
                  onClick={() => updateField("hens_allowed", !formData.hens_allowed)}
                  className={`p-4 rounded-lg border-2 transition-all cursor-pointer flex items-center gap-3 ${
                    formData.hens_allowed
                      ? "border-[#D4A5A5] bg-[#D4A5A5]/10"
                      : "border-gray-200 hover:border-[#D4A5A5]/50"
                  }`}
                >
                  <Checkbox
                    checked={formData.hens_allowed}
                    onCheckedChange={() => {}}
                    className="cursor-pointer"
                  />
                  <div>
                    <span className="font-medium text-[var(--color-text-primary)]">Hen Parties</span>
                    <p className="text-xs text-gray-600">Birthday celebrations &amp; girls' nights</p>
                  </div>
                </div>

                <div
                  onClick={() => updateField("corporate_allowed", !formData.corporate_allowed)}
                  className={`p-4 rounded-lg border-2 transition-all cursor-pointer flex items-center gap-3 ${
                    formData.corporate_allowed
                      ? "border-[#C6A76D] bg-[#C6A76D]/10"
                      : "border-gray-200 hover:border-[#C6A76D]/50"
                  }`}
                >
                  <Checkbox
                    checked={formData.corporate_allowed}
                    onCheckedChange={() => {}}
                    className="cursor-pointer"
                  />
                  <div>
                    <span className="font-medium text-[var(--color-text-primary)]">Corporate Events</span>
                    <p className="text-xs text-gray-600">Team building &amp; business gatherings</p>
                  </div>
                </div>

                <div
                  onClick={() => updateField("weddings_allowed", !formData.weddings_allowed)}
                  className={`p-4 rounded-lg border-2 transition-all cursor-pointer flex items-center gap-3 ${
                    formData.weddings_allowed
                      ? "border-[#89A38F] bg-[#89A38F]/10"
                      : "border-gray-200 hover:border-[#89A38F]/50"
                  }`}
                >
                  <Checkbox
                    checked={formData.weddings_allowed}
                    onCheckedChange={() => {}}
                    className="cursor-pointer"
                  />
                  <div>
                    <span className="font-medium text-[var(--color-text-primary)]">Weddings</span>
                    <p className="text-xs text-gray-600">Wedding celebrations &amp; receptions</p>
                  </div>
                </div>
              </div>
            </div>

            {/* House Rules Section */}
            <div className="bg-gradient-to-br from-[#C6A76D]/10 to-transparent border border-[#C6A76D]/30 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-5 flex items-center gap-2">
                <ClipboardList className="w-5 h-5" style={{color: 'var(--color-accent-gold)'}} />
                House Rules (Optional)
              </h3>
              
              <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                Any important rules or restrictions guests should know about?
              </p>
              
              <Textarea
                id="house_rules"
                value={formData.house_rules}
                onChange={(e) => updateField("house_rules", e.target.value)}
                placeholder="Examples:
- Quiet hours after 11 PM
- No smoking inside
- Maximum group size 30 people
- Outdoor footwear in garden only"
                rows={4}
                className="rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all resize-none"
              />
            </div>
          </div>
        );

      case 5: // Policies
        return (
          <div className="space-y-8">
            {/* Check-in / Check-out Times */}
            <div className="bg-gradient-to-br from-orange-50 to-transparent border border-orange-200 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-5 flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-600" />
                Check-in & Check-out
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="check_in_time" className="text-sm font-semibold text-[var(--color-text-primary)]">Check-in Time</Label>
                  <Input
                    id="check_in_time"
                    type="time"
                    value={formData.check_in_time}
                    onChange={(e) => updateField("check_in_time", e.target.value)}
                    className="rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="check_out_time" className="text-sm font-semibold text-[var(--color-text-primary)]">Check-out Time</Label>
                  <Input
                    id="check_out_time"
                    type="time"
                    value={formData.check_out_time}
                    onChange={(e) => updateField("check_out_time", e.target.value)}
                    className="rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all mt-2"
                  />
                </div>
              </div>
            </div>

            {/* Minimum Stay */}
            <div className="bg-gradient-to-br from-violet-50 to-transparent border border-violet-200 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-5 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-violet-600" />
                Booking Requirements
              </h3>
              
              <div>
                <Label htmlFor="minimum_stay" className="text-sm font-semibold text-[var(--color-text-primary)]">Minimum Stay (nights)</Label>
                <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg overflow-hidden shadow-sm mt-2">
                  <button
                    type="button"
                    onClick={() => updateField("minimum_stay", Math.max(1, formData.minimum_stay - 1))}
                    className="flex-shrink-0 w-12 h-12 flex items-center justify-center text-violet-600 hover:bg-violet-50 transition-colors"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={formData.minimum_stay}
                    onChange={(e) => updateField("minimum_stay", parseInt(e.target.value) || 1)}
                    className="flex-1 text-center text-lg font-bold border-0 focus:ring-0 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => updateField("minimum_stay", formData.minimum_stay + 1)}
                    className="flex-shrink-0 w-12 h-12 flex items-center justify-center text-violet-600 hover:bg-violet-50 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-xs text-gray-600 mt-2">Guests must book for at least this many nights</p>
              </div>
            </div>

            {/* Cancellation Policy */}
            <div className="bg-gradient-to-br from-[#D4A5A5]/10 to-transparent border border-[#D4A5A5]/30 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-5 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" style={{color: 'var(--color-accent-pink)'}} />
                Cancellation Policy
              </h3>
              
              <Textarea
                id="cancellation_policy"
                value={formData.cancellation_policy}
                onChange={(e) => updateField("cancellation_policy", e.target.value)}
                placeholder="Examples:
- Free cancellation up to 30 days before
- 50% refund 15-29 days before
- No refund within 14 days
- Specific dates may have different policies"
                rows={4}
                className="rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-[#D4A5A5] focus:border-transparent transition-all resize-none"
              />
              <p className="text-xs text-gray-600 mt-2">Be clear and transparent about cancellation terms</p>
            </div>
          </div>
        );

      case 6: // Pricing
        return (
          <div className="space-y-8">
            {/* Base Pricing Section */}
            <div className="bg-gradient-to-br from-[#89A38F]/10 to-transparent border border-[#89A38F]/30 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-5 flex items-center gap-2">
                <PoundSterling className="w-5 h-5" style={{color: 'var(--color-accent-sage)'}} />
                Nightly Rates
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="base_price" className="text-sm font-semibold text-[var(--color-text-primary)]">Base Price (per night) *</Label>
                  <div className="relative mt-2">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">£</span>
                    <Input
                      id="base_price"
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      value={formData.base_price || ""}
                      onChange={(e) => {
                        const val = e.target.value ? parseFloat(e.target.value) : 0;
                        updateField("base_price", Math.max(0, val));
                      }}
                      className={`pl-8 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-[#89A38F] focus:border-transparent transition-all text-lg font-bold ${errors.base_price ? "border-red-500" : ""}`}
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-2">Monday - Thursday rate</p>
                  {errors.base_price && <p className="text-red-500 text-xs mt-1">{errors.base_price}</p>}
                </div>

                <div>
                  <Label htmlFor="weekend_price" className="text-sm font-semibold text-[var(--color-text-primary)]">Weekend Rate (per night)</Label>
                  <div className="relative mt-2">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">£</span>
                    <Input
                      id="weekend_price"
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      value={formData.weekend_price || ""}
                      onChange={(e) => {
                        const val = e.target.value ? parseFloat(e.target.value) : undefined;
                        updateField("weekend_price", val ? Math.max(0, val) : undefined);
                      }}
                      className="pl-8 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-[#89A38F] focus:border-transparent transition-all text-lg font-bold"
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-2">Friday - Sunday rate (optional)</p>
                </div>
              </div>
            </div>

            {/* Fees Section */}
            <div className="bg-gradient-to-br from-[#C6A76D]/10 to-transparent border border-[#C6A76D]/30 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-5 flex items-center gap-2">
                <Banknote className="w-5 h-5" style={{color: 'var(--color-accent-gold)'}} />
                Additional Fees
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cleaning_fee" className="text-sm font-semibold text-[var(--color-text-primary)]">Cleaning Fee</Label>
                  <div className="relative mt-2">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">£</span>
                    <Input
                      id="cleaning_fee"
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      value={formData.cleaning_fee || ""}
                      onChange={(e) => {
                        const val = e.target.value ? parseFloat(e.target.value) : undefined;
                        updateField("cleaning_fee", val ? Math.max(0, val) : undefined);
                      }}
                      className="pl-8 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all text-lg font-bold"
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-2">One-time per booking</p>
                </div>

                <div>
                  <Label htmlFor="security_deposit" className="text-sm font-semibold text-[var(--color-text-primary)]">Security Deposit</Label>
                  <div className="relative mt-2">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">£</span>
                    <Input
                      id="security_deposit"
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      value={formData.security_deposit || ""}
                      onChange={(e) => {
                        const val = e.target.value ? parseFloat(e.target.value) : undefined;
                        updateField("security_deposit", val ? Math.max(0, val) : undefined);
                      }}
                      className="pl-8 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all text-lg font-bold"
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-2">Refundable after stay</p>
                </div>
              </div>
            </div>

            {/* Pricing Summary */}
            {formData.base_price > 0 && (
              <div className="bg-gradient-to-br from-[#D4A5A5]/10 to-transparent border-2 border-[#D4A5A5]/40 rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{color: 'var(--color-accent-pink)'}}>
                  <BarChart3 className="w-5 h-5" style={{color: 'var(--color-accent-pink)'}} />
                  Your Pricing Summary
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                    <span className="text-gray-700">Base nightly rate:</span>
                    <span className="text-lg font-bold" style={{color: 'var(--color-accent-sage)'}}>£{formData.base_price.toFixed(2)}</span>
                  </div>
                  
                  {formData.weekend_price && (
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                      <span className="text-gray-700">Weekend rate (Fri-Sun):</span>
                      <span className="text-lg font-bold" style={{color: 'var(--color-accent-sage)'}}>£{formData.weekend_price.toFixed(2)}</span>
                    </div>
                  )}
                  
                  {formData.cleaning_fee && formData.cleaning_fee > 0 && (
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                      <span className="text-gray-700">Cleaning fee:</span>
                      <span className="text-lg font-bold" style={{color: 'var(--color-accent-gold)'}}>£{formData.cleaning_fee.toFixed(2)}</span>
                    </div>
                  )}
                  
                  {formData.security_deposit && formData.security_deposit > 0 && (
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                      <span className="text-gray-700">Security deposit:</span>
                      <span className="text-lg font-bold" style={{color: 'var(--color-accent-pink)'}}>£{formData.security_deposit.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      case 7: // Media
        return (
          <div className="space-y-8">
            {/* Images Section */}
            <div className="bg-gradient-to-br from-[#89A38F]/10 to-transparent border border-[#89A38F]/30 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-5 flex items-center gap-2">
                <Image className="w-5 h-5" style={{color: 'var(--color-accent-sage)'}} />
                Property Images
              </h3>
              
              <p className="text-sm text-[var(--color-text-secondary)] mb-5">
                Upload professional photos of your property. The first image becomes your hero. You can drag & drop, click to browse, or paste URLs.
              </p>

              {/* Hidden File Input */}
              <input
                id="image-upload"
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
              />

              {/* Drag and Drop Area */}
              <label
                htmlFor="image-upload"
                onDragOver={handleDragOver}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleFileUpload(e.dataTransfer.files);
                }}
                className="border-2 border-dashed border-[#89A38F]/30 rounded-xl p-8 text-center hover:border-[#89A38F] hover:bg-[#89A38F]/5 transition-all cursor-pointer block mb-6"
              >
                <div className="flex flex-col items-center gap-3 pointer-events-none">
                  <Upload className="w-12 h-12" style={{color: 'var(--color-accent-sage)'}} />
                  <div>
                    <p className="font-semibold text-gray-700">Drop images here or click to browse</p>
                    <p className="text-sm text-gray-600 mt-1">JPG, PNG, WebP • Up to 20 images • Max 5MB each</p>
                  </div>
                  <div className="flex gap-4 text-xs text-gray-500 mt-2">
                    <span>📁 Click to upload</span>
                    <span>|</span>
                    <span>📦 Drag & drop</span>
                  </div>
                </div>
              </label>

              {/* Images Count */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#89A38F]/10 rounded-full text-xs font-semibold mb-6" style={{color: 'var(--color-accent-sage)'}}>
                <span className="w-5 h-5 flex items-center justify-center text-white rounded-full text-xs" style={{backgroundColor: 'var(--color-accent-sage)'}}>{formData.images.length}</span>
                <span>/ 20 images</span>
              </div>

              {/* Images Preview Grid */}
              {formData.images.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-200">
                  <Image className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 font-semibold">No images yet</p>
                  <p className="text-sm text-gray-500 mt-1">Upload images to showcase your property</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {formData.images.map((image, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-4 p-3 rounded-lg border-2 transition-all ${
                        index === 0 ? "border-[#89A38F] bg-[#89A38F]/10" : "border-gray-200 bg-gray-50 hover:border-gray-300"
                      }`}
                    >
                      {/* Image Thumbnail */}
                      <div className="relative flex-shrink-0">
                        <img
                          src={image}
                          alt={`Property ${index + 1}`}
                          className="w-24 h-24 rounded object-cover"
                        />
                        {index === 0 && (
                          <div className="absolute -top-2 -right-2 text-white rounded-full p-1" style={{backgroundColor: 'var(--color-accent-sage)'}}>
                            <Star className="w-4 h-4 fill-current" />
                          </div>
                        )}
                      </div>

                      {/* Image Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-700">Image {index + 1}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {index === 0 ? "🎯 Hero image" : "Supporting photo"}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => moveImageUp(index)}
                          disabled={index === 0}
                          className="p-1.5 text-gray-500 hover:bg-[#89A38F]/10 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.color = 'var(--color-accent-sage)')}
                          onMouseLeave={(e) => e.currentTarget.style.color = ''}
                          title="Move up"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => moveImageDown(index)}
                          disabled={index === formData.images.length - 1}
                          className="p-1.5 text-gray-500 hover:bg-[#89A38F]/10 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.color = 'var(--color-accent-sage)')}
                          onMouseLeave={(e) => e.currentTarget.style.color = ''}
                          title="Move down"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>

                        {index !== 0 && (
                          <button
                            type="button"
                            onClick={() => setHeroImage(index)}
                            className="p-1.5 text-gray-500 hover:bg-[#C6A76D]/10 rounded transition-colors"
                            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-accent-gold)'}
                            onMouseLeave={(e) => e.currentTarget.style.color = ''}
                            title="Set as hero"
                          >
                            <Star className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* URL Input Option */}
              {formData.images.length < 20 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Or add image by URL</p>
                  <div className="flex gap-2">
                    <Input
                      id="hero_image_url"
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const url = (e.target as HTMLInputElement).value;
                          if (url) {
                            updateField("images", [...formData.images, url]);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }
                      }}
                      className="rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-[#89A38F] focus:border-transparent"
                    />
                    <Button
                      type="button"
                      onClick={(e) => {
                        const input = document.getElementById("hero_image_url") as HTMLInputElement;
                        if (input?.value) {
                          updateField("images", [...formData.images, input.value]);
                          input.value = '';
                        }
                      }}
                      className="bg-[#89A38F] text-white hover:bg-[#89A38F]/90 rounded-lg"
                    >
                      Add
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Video Section */}
            <div className="bg-gradient-to-br from-[#C6A76D]/10 to-transparent border border-[#C6A76D]/30 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-5 flex items-center gap-2">
                <Video className="w-5 h-5" style={{color: 'var(--color-accent-gold)'}} />
                Video Tour (Optional)
              </h3>
              
              <p className="text-sm text-[var(--color-text-secondary)] mb-5">
                Add a video tour to help guests see your property in motion
              </p>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div
                    onClick={() => updateField("video_type", "youtube")}
                    className={`p-4 rounded-lg border-2 transition-all cursor-pointer flex items-center gap-3 ${
                      formData.video_type === "youtube"
                        ? "border-[#C6A76D] bg-[#C6A76D]/10"
                        : "border-gray-200 hover:border-[#C6A76D]/50"
                    }`}
                  >
                    <Checkbox checked={formData.video_type === "youtube"} onCheckedChange={() => {}} />
                    <div>
                      <span className="font-medium text-sm">YouTube / Vimeo</span>
                      <p className="text-xs text-gray-600">Paste video link</p>
                    </div>
                  </div>

                  <div
                    onClick={() => updateField("video_type", "upload")}
                    className={`p-4 rounded-lg border-2 transition-all cursor-pointer flex items-center gap-3 ${
                      formData.video_type === "upload"
                        ? "border-[#C6A76D] bg-[#C6A76D]/10"
                        : "border-gray-200 hover:border-[#C6A76D]/50"
                    }`}
                  >
                    <Checkbox checked={formData.video_type === "upload"} onCheckedChange={() => {}} />
                    <div>
                      <span className="font-medium text-sm">Upload Video</span>
                      <p className="text-xs text-gray-600">MP4, WebM</p>
                    </div>
                  </div>
                </div>

                {formData.video_type === "youtube" ? (
                  <div>
                    <Label htmlFor="video_url" className="text-sm font-semibold">Video URL</Label>
                    <Input
                      id="video_url"
                      type="url"
                      placeholder="https://youtu.be/... or https://vimeo.com/..."
                      value={formData.hero_video || ""}
                      onChange={(e) => updateField("hero_video", e.target.value)}
                      className="rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-[#C6A76D] focus:border-transparent transition-all mt-2"
                    />
                    <p className="text-xs text-gray-600 mt-2">Works with YouTube and Vimeo. Share the full URL from the address bar.</p>
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="video_upload" className="text-sm font-semibold">Upload Video File</Label>
                    <p className="text-xs text-gray-600 mb-3 mt-1">MP4 or WebM • Max 500MB</p>
                    <input
                      id="video_upload"
                      type="file"
                      accept="video/mp4,video/webm"
                      className="w-full border-2 border-dashed border-[#C6A76D]/30 rounded-lg p-4 text-sm text-gray-600 focus:outline-none focus:border-[#C6A76D]"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            updateField("hero_video", event.target?.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 8: // SEO
        return (
          <div className="space-y-8">
            {/* Slug Section */}
            <div className="bg-gradient-to-br from-[#89A38F]/10 to-transparent border border-[#89A38F]/30 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-5 flex items-center gap-2">
                <LinkIcon className="w-5 h-5" style={{color: 'var(--color-accent-sage)'}} />
                URL Slug
              </h3>
              
              <Label htmlFor="slug" className="text-sm font-semibold text-[var(--color-text-primary)]">Web Address</Label>
              <Input
                id="slug"
                value={formData.slug || ""}
                onChange={(e) => updateField("slug", e.target.value)}
                placeholder="beautiful-countryside-manor"
                className="rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-[#89A38F] focus:border-transparent transition-all mt-2"
              />
              <p className="text-xs text-gray-600 mt-2">
                🌐 Your property URL: orchidsescapehouse.com/<span className="font-semibold" style={{color: 'var(--color-accent-sage)'}}>{formData.slug || "property-name"}</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">Leave empty to auto-generate from your property title. Only letters, numbers, and hyphens.</p>
            </div>

            {/* Meta Title Section */}
            <div className="bg-gradient-to-br from-[#C6A76D]/10 to-transparent border border-[#C6A76D]/30 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-5 flex items-center gap-2">
                <Heading2 className="w-5 h-5" style={{color: 'var(--color-accent-gold)'}} />
                Search Results Title
              </h3>
              
              <Label htmlFor="meta_title" className="text-sm font-semibold text-[var(--color-text-primary)]">Meta Title</Label>
              <Input
                id="meta_title"
                value={formData.meta_title || ""}
                onChange={(e) => updateField("meta_title", e.target.value)}
                placeholder="Luxury Countryside Manor - Perfect for Group Events & Weddings"
                maxLength={60}
                className="rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-[#C6A76D] focus:border-transparent transition-all mt-2"
              />
              
              <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 font-semibold mb-1">How it appears in Google:</p>
                <p className="text-sm font-semibold line-clamp-1" style={{color: 'var(--color-accent-sage)'}}>
                  {formData.meta_title || "Luxury Countryside Manor - Perfect for Group Events & Weddings"}
                </p>
                <p className="text-xs text-gray-600 mt-0.5">
                  orchidsescapehouse.com › {formData.slug || "property"}
                </p>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-gray-600">
                  {formData.meta_title?.length || 0} / 60 characters
                </span>
                <span className={formData.meta_title && formData.meta_title.length > 60 ? "text-red-600 font-semibold" : "font-semibold"} style={formData.meta_title && formData.meta_title.length > 60 ? {} : {color: 'var(--color-accent-sage)'}}>
                  {(formData.meta_title?.length || 0) > 60 ? "Too long" : "Good"}
                </span>
              </div>
            </div>

            {/* Meta Description Section */}
            <div className="bg-gradient-to-br from-[#D4A5A5]/10 to-transparent border border-[#D4A5A5]/30 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-5 flex items-center gap-2">
                <AlignLeft className="w-5 h-5" style={{color: 'var(--color-accent-pink)'}} />
                Search Results Description
              </h3>
              
              <Label htmlFor="meta_description" className="text-sm font-semibold text-[var(--color-text-primary)]">Meta Description</Label>
              <Textarea
                id="meta_description"
                value={formData.meta_description || ""}
                onChange={(e) => updateField("meta_description", e.target.value)}
                placeholder="Stunning property with 5 bedrooms, hot tub, and games room. Perfect for celebrations, corporate events, and family gatherings. Book your memorable group experience today."
                rows={3}
                maxLength={160}
                className="rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-[#D4A5A5] focus:border-transparent transition-all resize-none mt-2"
              />
              
              <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 font-semibold mb-1">Search engine preview:</p>
                <p className="text-sm text-gray-700 line-clamp-2">
                  {formData.meta_description || "Your compelling description appears here in search results"}
                </p>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-gray-600">
                  {formData.meta_description?.length || 0} / 160 characters
                </span>
                <span className="font-semibold" style={{
                  color: formData.meta_description && formData.meta_description.length > 160 
                    ? '#dc2626'
                    : formData.meta_description && formData.meta_description.length >= 120 
                    ? 'var(--color-accent-sage)' 
                    : 'var(--color-accent-gold)'
                }}>
                  {(formData.meta_description?.length || 0) > 160 ? "Too long" : (formData.meta_description?.length || 0) >= 120 ? "Perfect" : "Add more"}
                </span>
              </div>
            </div>

            {/* SEO Tips */}
            <div className="bg-[#C6A76D]/10 border border-[#C6A76D]/30 rounded-2xl p-6">
              <h4 className="font-semibold mb-4 flex items-center gap-2" style={{color: 'var(--color-accent-gold)'}}>
                <Lightbulb className="w-5 h-5" style={{color: 'var(--color-accent-gold)'}} />
                SEO Tips
              </h4>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>✓ Include target keywords (location, event types, features)</li>
                <li>✓ Be specific and descriptive about your property</li>
                <li>✓ Write for humans first, search engines second</li>
                <li>✓ Use your best photos and compelling descriptions</li>
                <li>✓ Update regularly as you add new features</li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            
            return (
              <div key={step.id} className="flex-1">
                <div className="flex items-center">
                  <button
                    onClick={() => handleStepClick(step.id)}
                    className={`relative flex flex-col items-center group ${
                      isActive ? "text-[var(--color-accent-sage)]" : isCompleted ? "text-[#89A38F]" : "text-gray-400"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                        isActive
                          ? "border-[var(--color-accent-sage)] bg-[var(--color-accent-sage)] text-white"
                          : isCompleted
                          ? "border-[#89A38F] bg-[#89A38F] text-white"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <span className="text-xs mt-2 font-medium hidden lg:block">{step.name}</span>
                  </button>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 ${
                        currentStep > step.id ? "bg-[#89A38F]" : "bg-gray-300"
                      }`}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-white rounded-2xl shadow-md p-6 md:p-8 mb-8 border border-gray-100">
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-6">{STEPS[currentStep - 1].name}</h2>
        {renderStepContent()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center gap-3 flex-wrap">
        <Button
          type="button"
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 1}
          className="rounded-xl border-2 border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 font-semibold"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        <div className="flex gap-2 flex-wrap">
          <Button
            type="button"
            variant="outline"
            onClick={handleSaveDraft}
            disabled={isLoading}
            className="rounded-xl border-2 border-[var(--color-accent-gold)] text-[var(--color-accent-gold)] hover:bg-[var(--color-accent-gold)]/5 disabled:opacity-50 font-semibold"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>

          {currentStep < STEPS.length ? (
            <Button 
              type="button" 
              onClick={handleNext}
              className="rounded-xl text-white disabled:opacity-50 font-semibold bg-gray-800 hover:bg-gray-900"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handlePublish}
              disabled={isLoading}
              className="rounded-xl text-white disabled:opacity-50 font-semibold bg-gray-800 hover:bg-gray-900"
            >
              <Check className="w-4 h-4 mr-2" />
              {propertyId ? "Update Property" : "Publish Property"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
