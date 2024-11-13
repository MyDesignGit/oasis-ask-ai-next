"use client"

// components/Navbar/index.tsx
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, ChevronDown, Phone } from 'lucide-react';

interface NavLinkProps {
  title: string;
  href?: string;
  hasDropdown?: boolean;
}

const navLinks: NavLinkProps[] = [
  { title: 'Services', hasDropdown: true },
  { title: 'Our Centres', hasDropdown: true },
  { title: 'Fertility Care', hasDropdown: true },
  { title: 'Our Experts', href: '/our-experts' },
  { title: 'About Us', hasDropdown: true },
  { title: 'Blogs', href: '/blogs' },
  { title: 'Why Oasis?', hasDropdown: true }
];

const NavLink: React.FC<NavLinkProps> = ({ title, href, hasDropdown }) => {
  if (href) {
    return (
      <Link 
        href={href}
        className="flex items-center text-[#874487] hover:text-[#673367] font-medium transition-colors"
      >
        {title}
      </Link>
    );
  }

  return (
    <button className="flex items-center gap-1 text-[#874487] hover:text-[#673367] font-medium transition-colors">
      {title}
      {hasDropdown && <ChevronDown size={16} />}
    </button>
  );
};

const Navbar: React.FC = () => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  return (
    <header className="w-full">
      {/* Top Bar */}
      <div className="w-full bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex justify-end items-center h-10 gap-6">
            <button className="text-gray-600 hover:text-[#874487] transition-colors">
              <Search size={20} />
            </button>
            <button className="text-gray-600 hover:text-[#874487] text-sm transition-colors">
              Patient Login
            </button>
            <button className="flex items-center text-gray-600 hover:text-[#874487] text-sm transition-colors gap-1">
              For International Patients
              <ChevronDown size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="w-full bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0">
              <Image 
                src="/oasis-logo.webp" 
                alt="Oasis Fertility"
                width={180}
                height={56}
                priority
                className="h-14 w-auto"
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8">
              {navLinks.map((link, index) => (
                <div
                  key={index}
                  onMouseEnter={() => setActiveDropdown(link.title)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <NavLink {...link} />
                  
                  {/* Dropdown Menu */}
                  {link.hasDropdown && activeDropdown === link.title && (
                    <div className="absolute mt-2 py-2 w-56 bg-white rounded-lg shadow-lg border border-gray-100">
                      {/* Add your dropdown items here */}
                    </div>
                  )}
                </div>
              ))}
              
              {/* Phone Number */}
              <a 
                href="tel:1800-3001-1000" 
                className="flex items-center gap-2 px-4 py-2 border-2 border-[#874487] rounded-lg text-[#874487] hover:bg-[#874487] hover:text-white transition-colors"
              >
                <Phone size={16} />
                1800-3001-1000
              </a>

              {/* WhatsApp */}
              <Link 
                href="https://wa.me/18003001000" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity"
              >
                <Image 
                  src="/whatsapp-icon.png" 
                  alt="WhatsApp"
                  width={32}
                  height={32}
                  className="h-8 w-8"
                />
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button className="lg:hidden text-gray-600">
              {/* Add your mobile menu button here */}
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;