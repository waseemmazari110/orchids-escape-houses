interface UKServiceSchemaProps {
  type: "faq" | "property" | "article" | "itemList";
  data?: any;
}

export default function UKServiceSchema({ type, data }: UKServiceSchemaProps) {
  const baseUrl = "https://www.groupescapehouses.co.uk";
  const siteName = "Group Escape Houses";
  
  // Helper to ensure clean URLs
  const cleanUrl = (path: string) => {
    if (!path) return `${baseUrl}/`;
    if (path.startsWith("http")) return path;
    const separator = path.startsWith("/") ? "" : "/";
    return `${baseUrl}${separator}${path}`;
  };

  const itemListSchema = (type === "itemList" && data?.items) ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": data.name || "Property List",
    "itemListElement": data.items.map((item: any, index: number) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name || item.title || `Item ${index + 1}`,
      "url": item.url ? cleanUrl(item.url) : `${baseUrl}/properties/${item.slug}`
    }))
  } : null;

  const faqSchema = (type === "faq" && data?.faqs) ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": data.faqs.map((faq: any) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  } : null;

  const propertySchema = (type === "property" && data) ? {
    "@context": "https://schema.org",
    "@type": "VacationRental",
    "name": data.name,
    "description": data.description,
    "image": data.image,
    "url": `${baseUrl}/properties/${data.slug || ""}`,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": data.location,
      "addressCountry": "GB"
    },
    "numberOfRooms": data.bedrooms,
    "occupancy": {
      "@type": "QuantitativeValue",
      "maxValue": data.sleeps
    },
    "amenityFeature": data.features?.map((f: string) => ({
      "@type": "LocationFeatureSpecification",
      "name": f,
      "value": true
    })),
    "provider": { "@id": `${baseUrl}/#organization` },
    ...(data.priceFrom && {
      "offers": {
        "@type": "Offer",
        "priceCurrency": "GBP",
        "price": data.priceFrom,
        "availability": "https://schema.org/InStock",
        "url": `${baseUrl}/properties/${data.slug || ""}`
      }
    })
  } : null;

  const articleSchema = (type === "article" && data) ? {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": data.title,
    "description": data.description,
    "image": data.image,
    "datePublished": data.datePublished,
    "dateModified": data.dateModified || data.datePublished,
    "author": {
      "@type": "Organization",
      "@id": `${baseUrl}/#organization`,
      "name": siteName,
      "url": baseUrl
    },
    "publisher": {
      "@type": "Organization",
      "@id": `${baseUrl}/#organization`,
      "name": siteName,
      "url": baseUrl,
      "logo": {
        "@type": "ImageObject",
        "url": "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/document-uploads/stacked_logo-1760785640378.jpg"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `${baseUrl}/blog/${data.slug}`
    }
  } : null;

  const schema = itemListSchema || faqSchema || propertySchema || articleSchema;

  if (!schema) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
