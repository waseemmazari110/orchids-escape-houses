"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, ChevronRight, Save, Check, Home, MapPin, Bed, Sparkles, FileText, PoundSterling, Upload, Search } from "lucide-react";
import { toast } from "sonner";

type PropertyFormData = {
  // Essentials
  title: string;
  property_type: string;
  status: string;
  description: string;
  
  // Location
  address: string;
  town: string;
  county: string;
  postcode: string;
  country: string;
  latitude?: number;
  longitude?: number;
  
  // Rooms
  max_guests: number;
  bedrooms: number;
  bathrooms: number;
  
  // Amenities
  amenities: string[];
  features: string[];
  
  // Policies
  check_in_time: string;
  check_out_time: string;
  minimum_stay: number;
  cancellation_policy: string;
  house_rules: string;
  
  // Pricing
  base_price: number;
  weekend_price?: number;
  cleaning_fee?: number;
  security_deposit?: number;
  
  // Media
  images: string[];
  hero_video?: string;
  
  // SEO
  meta_title?: string;
  meta_description?: string;
  slug?: string;
};

const STEPS = [
  { id: 1, name: "Essentials", icon: Home },
  { id: 2, name: "Location", icon: MapPin },
  { id: 3, name: "Rooms", icon: Bed },
  { id: 4, name: "Amenities", icon: Sparkles },
  { id: 5, name: "Policies", icon: FileText },
  { id: 6, name: "Pricing", icon: PoundSterling },
  { id: 7, name: "Media", icon: Upload },
  { id: 8, name: "SEO", icon: Search },
];

const AMENITIES_OPTIONS = [
  "Hot Tub", "Swimming Pool", "Games Room", "Cinema Room", "BBQ", 
  "Garden", "Parking", "WiFi", "Pet Friendly", "Accessible",
  "EV Charging", "Tennis Court", "Beach Access", "Fishing Lake"
];

const PROPERTY_TYPES = [
  "Manor House", "Country House", "Cottage", "Castle", "Luxury House", 
  "Party House", "Stately House", "Quirky Property"
];

interface OwnerPropertyFormProps {
  propertyId?: string;
  initialData?: Partial<PropertyFormData>;
  paidPlanId?: string;
  paymentIntentId?: string;
}

export function OwnerPropertyForm({ propertyId, initialData, paidPlanId, paymentIntentId }: OwnerPropertyFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState<PropertyFormData>({
    // Essentials
    title: initialData?.title || "",
    property_type: initialData?.property_type || "",
    status: initialData?.status || "draft",
    description: initialData?.description || "",
    
    // Location
    address: initialData?.address || "",
    town: initialData?.town || "",
    county: initialData?.county || "",
    postcode: initialData?.postcode || "",
    country: initialData?.country || "United Kingdom",
    latitude: initialData?.latitude,
    longitude: initialData?.longitude,
    
    // Rooms
    max_guests: initialData?.max_guests || 8,
    bedrooms: initialData?.bedrooms || 4,
    bathrooms: initialData?.bathrooms || 2,
    
    // Amenities
    amenities: initialData?.amenities || [],
    features: initialData?.features || [],
    
    // Policies
    check_in_time: initialData?.check_in_time || "15:00",
    check_out_time: initialData?.check_out_time || "10:00",
    minimum_stay: initialData?.minimum_stay || 2,
    cancellation_policy: initialData?.cancellation_policy || "",
    house_rules: initialData?.house_rules || "",
    
    // Pricing
    base_price: initialData?.base_price || 0,
    weekend_price: initialData?.weekend_price,
    cleaning_fee: initialData?.cleaning_fee,
    security_deposit: initialData?.security_deposit,
    
    // Media
    images: initialData?.images || [],
    hero_video: initialData?.hero_video,
    
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
        case 1: // Essentials
          if (!formData.title.trim() || !formData.property_type.trim()) return false;
          break;
        case 2: // Location
          if (!formData.address.trim() || !formData.county.trim()) return false;
          break;
        case 3: // Rooms
          if (formData.max_guests < 1) return false;
          break;
        case 6: // Pricing
          if (formData.base_price <= 0) return false;
          break;
        case 7: // Media
          if (formData.images.length === 0) return false;
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
      case 1: // Essentials
        if (!formData.title.trim()) stepErrors.title = "Title is required";
        if (!formData.property_type.trim()) stepErrors.property_type = "Property type is required";
        break;
      case 2: // Location
        if (!formData.address.trim()) stepErrors.address = "Address is required";
        if (!formData.county.trim()) stepErrors.county = "County is required";
        break;
      case 3: // Rooms
        if (formData.max_guests < 1) stepErrors.max_guests = "Max guests must be at least 1";
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
        if (formData.images.length === 0) stepErrors.images = "At least one property image is required";
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
      slug: data.slug || generateSlug(data.title),
      location: location || data.address,
      region: data.county,
      sleepsMin: Math.min(data.max_guests, 1),
      sleepsMax: data.max_guests,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      priceFromMidweek: data.base_price,
      priceFromWeekend: data.weekend_price || data.base_price,
      description: data.description,
      houseRules: data.house_rules || null,
      checkInOut: `Check-in: ${data.check_in_time}, Check-out: ${data.check_out_time}`,
      heroImage: data.images[0] || '',
      heroVideo: data.hero_video || null,
      floorplanURL: null,
      featured: false,
      status: data.status, // Use the form's status field
      ...additionalFields
    };
  };

  const handleSaveDraft = async () => {
    setIsLoading(true);
    try {
      const draftData = convertFormDataToAPI(formData, {
        isPublished: 0  // Only set isPublished, keep the selected status
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
    // Validate all required fields (minimal validation)
    const requiredFieldsErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) requiredFieldsErrors.title = "Title is required";
    if (!formData.property_type.trim()) requiredFieldsErrors.property_type = "Property type is required";
    if (!formData.address.trim()) requiredFieldsErrors.address = "Address is required";
    if (!formData.county.trim()) requiredFieldsErrors.county = "County is required";
    if (formData.max_guests < 1) requiredFieldsErrors.max_guests = "Max guests is required";
    if (formData.base_price <= 0) requiredFieldsErrors.base_price = "Base price is required";

    if (Object.keys(requiredFieldsErrors).length > 0) {
      setErrors(requiredFieldsErrors);
      toast.error("Please fill in all required fields");
      // Jump to first step with error
      if (requiredFieldsErrors.title || requiredFieldsErrors.property_type) setCurrentStep(1);
      else if (requiredFieldsErrors.address || requiredFieldsErrors.county) setCurrentStep(2);
      else if (requiredFieldsErrors.max_guests) setCurrentStep(3);
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
      case 1: // Essentials
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="title">Property Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="e.g., The Brighton Manor"
                className={`rounded-xl border-gray-200 focus:ring-[var(--color-accent-sage)]/20 focus:border-[var(--color-accent-sage)] ${errors.title ? "border-red-500" : ""}`}
              />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
            </div>

            <div>
              <Label htmlFor="property_type">Property Type *</Label>
              <Select value={formData.property_type} onValueChange={(value) => updateField("property_type", value)}>
                <SelectTrigger className={`rounded-xl border-gray-200 focus:ring-[var(--color-accent-sage)]/20 ${errors.property_type ? "border-red-500" : ""}`}>
                  <SelectValue placeholder="Select property type" />
                </SelectTrigger>
                <SelectContent>
                  {PROPERTY_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.property_type && <p className="text-red-500 text-sm mt-1">{errors.property_type}</p>}
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => updateField("status", value)}>
                <SelectTrigger className="rounded-xl border-gray-200 focus:ring-[var(--color-accent-sage)]/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Describe your property..."
                rows={6}
                className="rounded-xl border-gray-200 focus:ring-[var(--color-accent-sage)]/20 focus:border-[var(--color-accent-sage)]"
              />
            </div>
          </div>
        );

      case 2: // Location
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="address">Full Address *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => updateField("address", e.target.value)}
                placeholder="123 High Street"
                className={`rounded-xl border-gray-200 focus:ring-[var(--color-accent-sage)]/20 focus:border-[var(--color-accent-sage)] ${errors.address ? "border-red-500" : ""}`}
              />
              {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="town">Town/City</Label>
                <Input
                  id="town"
                  value={formData.town}
                  onChange={(e) => updateField("town", e.target.value)}
                  placeholder="e.g., Brighton"
                  className="rounded-xl border-gray-200 focus:ring-[var(--color-accent-sage)]/20 focus:border-[var(--color-accent-sage)]"
                />
              </div>

              <div>
                <Label htmlFor="county">County *</Label>
                <Input
                  id="county"
                  value={formData.county}
                  onChange={(e) => updateField("county", e.target.value)}
                  placeholder="e.g., East Sussex"
                  className={`rounded-xl border-gray-200 focus:ring-[var(--color-accent-sage)]/20 focus:border-[var(--color-accent-sage)] ${errors.county ? "border-red-500" : ""}`}
                />
                {errors.county && <p className="text-red-500 text-sm mt-1">{errors.county}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="postcode">Postcode</Label>
                <Input
                  id="postcode"
                  value={formData.postcode}
                  onChange={(e) => updateField("postcode", e.target.value)}
                  placeholder="e.g., BN1 1AA"
                  className="rounded-xl border-gray-200 focus:ring-[var(--color-accent-sage)]/20 focus:border-[var(--color-accent-sage)]"
                />
              </div>

              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => updateField("country", e.target.value)}
                  className="rounded-xl border-gray-200 focus:ring-[var(--color-accent-sage)]/20 focus:border-[var(--color-accent-sage)]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="0.0001"
                  value={formData.latitude || ""}
                  onChange={(e) => updateField("latitude", parseFloat(e.target.value) || undefined)}
                  placeholder="e.g., 50.8620"
                  className="rounded-xl border-gray-200 focus:ring-[var(--color-accent-sage)]/20 focus:border-[var(--color-accent-sage)]"
                />
              </div>

              <div>
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="0.0001"
                  value={formData.longitude || ""}
                  onChange={(e) => updateField("longitude", parseFloat(e.target.value) || undefined)}
                  placeholder="e.g., -0.0754"
                  className="rounded-xl border-gray-200 focus:ring-[var(--color-accent-sage)]/20 focus:border-[var(--color-accent-sage)]"
                />
              </div>
            </div>
          </div>
        );

      case 3: // Rooms
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="max_guests">Max Guests *</Label>
                <Input
                  id="max_guests"
                  type="number"
                  min="1"
                  value={formData.max_guests}
                  onChange={(e) => updateField("max_guests", parseInt(e.target.value) || 1)}
                  className={`rounded-xl border-gray-200 focus:ring-[var(--color-accent-sage)]/20 focus:border-[var(--color-accent-sage)] ${errors.max_guests ? "border-red-500" : ""}`}
                />
                {errors.max_guests && <p className="text-red-500 text-sm mt-1">{errors.max_guests}</p>}
              </div>

              <div>
                <Label htmlFor="bedrooms">Bedrooms</Label>
                <Input
                  id="bedrooms"
                  type="number"
                  min="1"
                  value={formData.bedrooms}
                  onChange={(e) => updateField("bedrooms", parseInt(e.target.value) || 1)}
                  className="rounded-xl border-gray-200 focus:ring-[var(--color-accent-sage)]/20 focus:border-[var(--color-accent-sage)]"
                />
              </div>

              <div>
                <Label htmlFor="bathrooms">Bathrooms</Label>
                <Input
                  id="bathrooms"
                  type="number"
                  min="1"
                  value={formData.bathrooms}
                  onChange={(e) => updateField("bathrooms", parseInt(e.target.value) || 1)}
                  className="rounded-xl border-gray-200 focus:ring-[var(--color-accent-sage)]/20 focus:border-[var(--color-accent-sage)]"
                />
              </div>
            </div>
          </div>
        );

      case 4: // Amenities
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-base font-semibold mb-4 block">Amenities</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {AMENITIES_OPTIONS.map(amenity => (
                  <div key={amenity} className="flex items-center space-x-2">
                    <Checkbox
                      id={amenity}
                      checked={formData.amenities.includes(amenity)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          updateField("amenities", [...formData.amenities, amenity]);
                        } else {
                          updateField("amenities", formData.amenities.filter(a => a !== amenity));
                        }
                      }}
                    />
                    <Label htmlFor={amenity} className="font-normal cursor-pointer">{amenity}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 5: // Policies
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="check_in_time">Check-in Time</Label>
                <Input
                  id="check_in_time"
                  type="time"
                  value={formData.check_in_time}
                  onChange={(e) => updateField("check_in_time", e.target.value)}
                  className="rounded-xl border-gray-200 focus:ring-[var(--color-accent-sage)]/20 focus:border-[var(--color-accent-sage)]"
                />
              </div>

              <div>
                <Label htmlFor="check_out_time">Check-out Time</Label>
                <Input
                  id="check_out_time"
                  type="time"
                  value={formData.check_out_time}
                  onChange={(e) => updateField("check_out_time", e.target.value)}
                  className="rounded-xl border-gray-200 focus:ring-[var(--color-accent-sage)]/20 focus:border-[var(--color-accent-sage)]"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="minimum_stay">Minimum Stay (nights)</Label>
              <Input
                id="minimum_stay"
                type="number"
                min="1"
                value={formData.minimum_stay}
                onChange={(e) => updateField("minimum_stay", parseInt(e.target.value) || 1)}
                className="rounded-xl border-gray-200 focus:ring-[var(--color-accent-sage)]/20 focus:border-[var(--color-accent-sage)]"
              />
            </div>

            <div>
              <Label htmlFor="cancellation_policy">Cancellation Policy</Label>
              <Textarea
                id="cancellation_policy"
                value={formData.cancellation_policy}
                onChange={(e) => updateField("cancellation_policy", e.target.value)}
                placeholder="Describe your cancellation policy..."
                rows={4}
                className="rounded-xl border-gray-200 focus:ring-[var(--color-accent-sage)]/20 focus:border-[var(--color-accent-sage)]"
              />
            </div>

            <div>
              <Label htmlFor="house_rules">House Rules</Label>
              <Textarea
                id="house_rules"
                value={formData.house_rules}
                onChange={(e) => updateField("house_rules", e.target.value)}
                placeholder="List your house rules..."
                rows={4}
                className="rounded-xl border-gray-200 focus:ring-[var(--color-accent-sage)]/20 focus:border-[var(--color-accent-sage)]"
              />
            </div>
          </div>
        );

      case 6: // Pricing
        return (
          <div className="space-y-6">
            {/* Base Pricing Section */}
            <div>
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Base Pricing</h3>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <Label htmlFor="base_price">Base Price (per night) *</Label>
                  <div className="relative mt-2">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">£</span>
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
                      className={`pl-8 rounded-xl border-gray-200 focus:ring-[var(--color-accent-sage)]/20 focus:border-[var(--color-accent-sage)] ${errors.base_price ? "border-red-500" : ""}`}
                    />
                  </div>
                  <p className="text-sm text-[var(--color-neutral-dark)] mt-2">Midweek nightly rate</p>
                  {errors.base_price && <p className="text-red-500 text-sm mt-1">{errors.base_price}</p>}
                </div>

                <div>
                  <Label htmlFor="weekend_price">Weekend Price (per night)</Label>
                  <div className="relative mt-2">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">£</span>
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
                      className="pl-8 rounded-xl border-gray-200 focus:ring-[var(--color-accent-sage)]/20 focus:border-[var(--color-accent-sage)]"
                    />
                  </div>
                  <p className="text-sm text-[var(--color-neutral-dark)] mt-2">Friday-Sunday rate (optional)</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cleaning_fee">Cleaning Fee</Label>
                  <div className="relative mt-2">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">£</span>
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
                      className="pl-8 rounded-xl border-gray-200 focus:ring-[var(--color-accent-sage)]/20 focus:border-[var(--color-accent-sage)]"
                    />
                  </div>
                  <p className="text-sm text-[var(--color-neutral-dark)] mt-2">One-time cleaning charge</p>
                </div>

                <div>
                  <Label htmlFor="security_deposit">Security Deposit</Label>
                  <div className="relative mt-2">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">£</span>
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
                      className="pl-8 rounded-xl border-gray-200 focus:ring-[var(--color-accent-sage)]/20 focus:border-[var(--color-accent-sage)]"
                    />
                  </div>
                  <p className="text-sm text-[var(--color-neutral-dark)] mt-2">Refundable deposit</p>
                </div>
              </div>
            </div>

            {/* Pricing Summary */}
            {formData.base_price > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mt-6">
                <div className="flex items-start gap-3">
                  <PoundSterling className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-2">Pricing Summary</h4>
                    <div className="space-y-1 text-sm text-blue-800">
                      <p>Base nightly rate: <span className="font-semibold">£{formData.base_price.toFixed(2)}</span></p>
                      {formData.weekend_price && (
                        <p>Weekend nightly rate: <span className="font-semibold">£{formData.weekend_price.toFixed(2)}</span></p>
                      )}
                      {formData.cleaning_fee && (
                        <p>Cleaning fee: <span className="font-semibold">£{formData.cleaning_fee.toFixed(2)}</span></p>
                      )}
                      {formData.security_deposit && (
                        <p>Security deposit: <span className="font-semibold">£{formData.security_deposit.toFixed(2)}</span></p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 7: // Media
        return (
          <div className="space-y-6">
            {/* Property Images Upload */}
            <div>
              <Label className="text-base font-semibold mb-2 block">Property Images *</Label>
              <p className="text-sm text-[var(--color-neutral-dark)] mb-4">
                Upload images of your property OR provide a hero image URL below. At least one is required.
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
                className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-[var(--color-accent-sage)] transition-colors cursor-pointer bg-gray-50 hover:bg-gray-100 block"
              >
                <div className="flex flex-col items-center gap-3 pointer-events-none">
                  <Upload className="w-12 h-12 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-700">Drop images here or click to browse</p>
                    <p className="text-sm text-gray-500 mt-1">JPG, PNG, WebP • Max 5MB • Up to 20 images</p>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">{formData.images.length} / 20 images uploaded</p>
                </div>
              </label>

              {/* Images Preview */}
              {formData.images.length === 0 ? (
                <div className="mt-6 text-center py-8">
                  <div className="flex justify-center mb-3">
                    <Upload className="w-10 h-10 text-gray-300" />
                  </div>
                  <p className="text-gray-600 font-medium">No images uploaded yet</p>
                  <p className="text-sm text-gray-500 mt-1">The first image will be your hero image</p>
                </div>
              ) : (
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img src={image} alt={`Property ${index + 1}`} className="w-full h-24 rounded-lg object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="px-3 py-1 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700"
                        >
                          Remove
                        </button>
                      </div>
                      {index === 0 && (
                        <div className="absolute top-2 left-2 bg-[var(--color-accent-gold)] text-white text-xs font-semibold px-2 py-1 rounded">
                          Hero
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* OR Divider */}
              <div className="mt-8 flex items-center gap-4">
                <div className="flex-1 h-px bg-gray-300"></div>
                <p className="text-sm text-gray-500 font-medium">OR</p>
                <div className="flex-1 h-px bg-gray-300"></div>
              </div>

              {/* Hero Image URL */}
              <div className="mt-8">
                <Label htmlFor="hero_image_url" className="font-semibold">Hero Image URL</Label>
                <p className="text-sm text-[var(--color-neutral-dark)] mt-1 mb-3">
                  Paste a direct URL to an image if you prefer to use a hosted image instead of uploading.
                </p>
                <Input
                  id="hero_image_url"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={formData.images[0] || ""}
                  onChange={(e) => {
                    const url = e.target.value;
                    if (url) {
                      const newImages = [...formData.images];
                      newImages[0] = url;
                      updateField("images", newImages);
                    }
                  }}
                  className="rounded-xl border-gray-200 focus:ring-[var(--color-accent-sage)]/20 focus:border-[var(--color-accent-sage)]"
                />
              </div>
            </div>
          </div>
        );

      case 8: // SEO
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="slug">URL Slug</Label>
              <Input
                id="slug"
                value={formData.slug || ""}
                onChange={(e) => updateField("slug", e.target.value)}
                placeholder="url-friendly-slug"
                className="rounded-xl border-gray-200 focus:ring-[var(--color-accent-sage)]/20 focus:border-[var(--color-accent-sage)]"
              />
              <p className="text-sm text-gray-500 mt-1">
                URL-friendly identifier. Leave empty to auto-generate from property title.
              </p>
            </div>

            <div>
              <Label htmlFor="meta_title">Meta Title (SEO)</Label>
              <Input
                id="meta_title"
                value={formData.meta_title || ""}
                onChange={(e) => updateField("meta_title", e.target.value)}
                placeholder="Unique SEO title for search engines"
                maxLength={60}
                className="rounded-xl border-gray-200 focus:ring-[var(--color-accent-sage)]/20 focus:border-[var(--color-accent-sage)]"
              />
              <p className="text-sm text-gray-500 mt-1">{formData.meta_title?.length || 0}/60 characters</p>
            </div>

            <div>
              <Label htmlFor="meta_description">Meta Description (SEO)</Label>
              <Textarea
                id="meta_description"
                value={formData.meta_description || ""}
                onChange={(e) => updateField("meta_description", e.target.value)}
                placeholder="Unique SEO description for search engines"
                rows={3}
                maxLength={160}
                className="rounded-xl border-gray-200 focus:ring-[var(--color-accent-sage)]/20 focus:border-[var(--color-accent-sage)]"
              />
              <p className="text-sm text-gray-500 mt-1">{formData.meta_description?.length || 0}/160 characters</p>
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
                      isActive ? "text-[var(--color-accent-sage)]" : isCompleted ? "text-green-600" : "text-gray-400"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                        isActive
                          ? "border-[var(--color-accent-sage)] bg-[var(--color-accent-sage)] text-white"
                          : isCompleted
                          ? "border-green-600 bg-green-600 text-white"
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
                        currentStep > step.id ? "bg-green-600" : "bg-gray-300"
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
