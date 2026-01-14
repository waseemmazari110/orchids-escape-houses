import Link from "next/link";
import { Instagram, Facebook, Twitter, Youtube, Linkedin, Phone } from "lucide-react";
import { Phone as PhoneIcon } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] pt-16 pb-8">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
          {/* Logo and Tagline */}
          <div className="col-span-1">
            <h3
              className="text-2xl mb-4"
              style={{ fontFamily: "var(--font-display)", color: "var(--color-accent-gold)" }}
            >
              Group Escape Houses
            </h3>
            <p className="text-sm text-[var(--color-bg-secondary)] leading-relaxed mb-4">
              Exceptional large group accommodation across the UK with premium facilities and outstanding service.
            </p>
            <Link href="/our-story" className="text-sm hover:text-[var(--color-accent-sage)] transition-colors">
              Read our story →
            </Link>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Explore</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/properties" className="hover:text-[var(--color-accent-sage)] transition-colors font-medium">
                  Browse Properties
                </Link>
              </li>
              <li>
                <Link href="/destinations" className="hover:text-[var(--color-accent-sage)] transition-colors font-medium">
                  UK Destinations
                </Link>
              </li>
              <li>
                <Link href="/house-styles" className="hover:text-[var(--color-accent-sage)] transition-colors font-medium">
                  House Styles
                </Link>
              </li>
              <li>
                <Link href="/holiday-focus" className="hover:text-[var(--color-accent-sage)] transition-colors font-medium">
                  Holiday Focus
                </Link>
              </li>
              <li>
                <Link href="/occasions" className="hover:text-[var(--color-accent-sage)] transition-colors font-medium">
                  Popular Occasions
                </Link>
              </li>
              <li className="pt-2">
                <Link href="/experiences" className="hover:text-[var(--color-accent-sage)] transition-colors">
                  Activities & Services
                </Link>
              </li>
              <li>
                <Link href="/inspiration" className="hover:text-[var(--color-accent-sage)] transition-colors">
                  Inspiration
                </Link>
              </li>
              <li>
                <Link href="/guides" className="hover:text-[var(--color-accent-sage)] transition-colors">
                  Guides & Resources
                </Link>
              </li>
              <li>
                <Link href="/reviews" className="hover:text-[var(--color-accent-sage)] transition-colors">
                  Guest Reviews
                </Link>
              </li>
            </ul>
          </div>

          {/* House Styles & Destinations */}
          <div>
            <h4 className="font-semibold mb-4 text-white">House Styles</h4>
            <ul className="space-y-2 text-sm mb-6">
              <li><Link href="/house-styles/manor-houses" className="hover:text-[var(--color-accent-sage)]">Manor Houses</Link></li>
              <li><Link href="/house-styles/country-houses" className="hover:text-[var(--color-accent-sage)]">Country Houses</Link></li>
              <li><Link href="/house-styles/luxury-houses" className="hover:text-[var(--color-accent-sage)]">Luxury Houses</Link></li>
              <li><Link href="/house-styles/party-houses" className="hover:text-[var(--color-accent-sage)]">Party Houses</Link></li>
              <li><Link href="/house-styles/castles" className="hover:text-[var(--color-accent-sage)]">Castles & Stately Homes</Link></li>
              <li><Link href="/house-styles/family-holidays" className="hover:text-[var(--color-accent-sage)]">Family Holidays</Link></li>
              <li><Link href="/house-styles/luxury-dog-friendly-cottages" className="hover:text-[var(--color-accent-sage)]">Dog Friendly</Link></li>
            </ul>

            <h4 className="font-semibold mb-4 text-white">Top Destinations</h4>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              <li><Link href="/destinations/bath" className="hover:text-[var(--color-accent-sage)]">Bath</Link></li>
              <li><Link href="/destinations/brighton" className="hover:text-[var(--color-accent-sage)]">Brighton</Link></li>
              <li><Link href="/destinations/cotswolds" className="hover:text-[var(--color-accent-sage)]">Cotswolds</Link></li>
              <li><Link href="/destinations/lake-district" className="hover:text-[var(--color-accent-sage)]">Lake District</Link></li>
              <li><Link href="/destinations/london" className="hover:text-[var(--color-accent-sage)]">London</Link></li>
              <li><Link href="/destinations/york" className="hover:text-[var(--color-accent-sage)]">York</Link></li>
            </ul>
          </div>

          {/* Occasions & Holiday Focus */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Popular Occasions</h4>
            <ul className="space-y-2 text-sm mb-6">
              <li><Link href="/hen-party-houses" className="hover:text-[var(--color-accent-sage)]">Hen Party Houses</Link></li>
              <li><Link href="/weddings" className="hover:text-[var(--color-accent-sage)]">Wedding Venues</Link></li>
              <li><Link href="/special-celebrations" className="hover:text-[var(--color-accent-sage)]">Special Celebrations</Link></li>
              <li><Link href="/weekend-breaks" className="hover:text-[var(--color-accent-sage)]">Weekend Breaks</Link></li>
              <li><Link href="/christmas" className="hover:text-[var(--color-accent-sage)]">Christmas Houses</Link></li>
              <li><Link href="/new-year" className="hover:text-[var(--color-accent-sage)]">New Year Houses</Link></li>
            </ul>

            <h4 className="font-semibold mb-4 text-white">Holiday Focus</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/holiday-focus/girls-weekend-getaways" className="hover:text-[var(--color-accent-sage)]">Girls Weekends</Link></li>
              <li><Link href="/holiday-focus/business-offsite-corporate-accommodation" className="hover:text-[var(--color-accent-sage)]">Corporate Offsites</Link></li>
              <li><Link href="/holiday-focus/retreat-venues" className="hover:text-[var(--color-accent-sage)]">Retreat Venues</Link></li>
              <li><Link href="/holiday-focus/multi-generational-holidays" className="hover:text-[var(--color-accent-sage)]">Multi-generational</Link></li>
              <li><Link href="/holiday-focus/adventure-holidays" className="hover:text-[var(--color-accent-sage)]">Adventure Holidays</Link></li>
            </ul>
          </div>

          {/* Property Owners & Contact */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Property Owners</h4>
            <ul className="space-y-2 text-sm mb-6">
              <li><Link href="/why-list-with-escape-houses" className="hover:text-[var(--color-accent-sage)]">Why List With Us?</Link></li>
              <li><Link href="/advertise-with-us" className="hover:text-[var(--color-accent-sage)]">List Your Property</Link></li>
              <li><Link href="/owner-login" className="hover:text-[var(--color-accent-sage)]">Owner Login</Link></li>
            </ul>

            <h4 className="font-semibold mb-4 text-white">Contact Us</h4>
            <ul className="space-y-3 text-sm text-[var(--color-bg-secondary)] mb-6">
              <li className="flex items-center gap-2">
                <PhoneIcon className="w-4 h-4 flex-shrink-0" />
                <a href="tel:+441273569301" className="hover:text-[var(--color-accent-sage)] transition-colors font-medium">01273 569301</a>
              </li>
              <li>
                <a href="mailto:hello@groupescapehouses.co.uk" className="hover:text-[var(--color-accent-sage)] transition-colors block">
                  hello@groupescapehouses.co.uk
                </a>
              </li>
              <li className="text-xs pt-2">Office, 11a North Street, Brighton, BN41 1DH</li>
            </ul>

            <div className="flex items-center gap-4 mt-4">
              <a href="https://www.instagram.com/groupescapehouses/" className="text-white hover:text-[var(--color-accent-sage)] transition-colors"><Instagram className="w-5 h-5" /></a>
              <a href="https://www.facebook.com/profile.php?id=61580927195664" className="text-white hover:text-[var(--color-accent-sage)] transition-colors"><Facebook className="w-5 h-5" /></a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[var(--color-accent-gold)] opacity-30 mb-8"></div>

        {/* Bottom Bar */}
        <div className="text-center max-w-4xl mx-auto mb-8">
          <p className="text-xs text-[var(--color-bg-secondary)] mb-6 italic">
            Group Escape Houses is an advertising platform. Bookings, payments and contracts are handled directly between guests and property owners.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-[var(--color-bg-secondary)]">
            <Link href="/terms" className="hover:text-[var(--color-accent-sage)] transition-colors">Terms & Conditions</Link>
            <Link href="/booking-terms" className="hover:text-[var(--color-accent-sage)] transition-colors">Booking Terms</Link>
            <Link href="/privacy" className="hover:text-[var(--color-accent-sage)] transition-colors">Privacy & GDPR</Link>
            <Link href="/our-story" className="hover:text-[var(--color-accent-sage)] transition-colors">Our Story</Link>
            <Link href="/contact" className="hover:text-[var(--color-accent-sage)] transition-colors">Contact</Link>
          </div>
          <p className="text-xs text-[var(--color-bg-secondary)] mt-8">
            &copy; {new Date().getFullYear()} Group Escape Houses. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
