'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';
import { Search, BookOpen, Menu, X } from 'lucide-react';

export default function Navbar() {
  const [query, setQuery] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setMobileOpen(false);
    }
  };

  const navLinks = [
    { href: '/', label: 'Ana Sayfa' },
    { href: '/manga', label: 'Manga Listesi' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-surface border-b border-border backdrop-blur-md bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <BookOpen className="w-7 h-7 text-accent" />
            <span className="font-bold text-lg hidden sm:block">
              <span className="text-accent">Geri Dönen</span>
              <span className="text-white"> Scans</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-accent ${
                  pathname === link.href ? 'text-accent' : 'text-muted'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Search + Mobile Toggle */}
          <div className="flex items-center gap-3">
            <form onSubmit={handleSearch} className="hidden sm:flex items-center">
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Manga ara..."
                  className="bg-surface-2 border border-border text-white placeholder-muted rounded-lg pl-4 pr-10 py-2 text-sm w-48 focus:w-64 transition-all duration-300 focus:outline-none focus:border-accent"
                />
                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-accent">
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </form>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden text-muted hover:text-white"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-surface border-t border-border px-4 py-4 space-y-3">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block text-sm font-medium text-muted hover:text-accent transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <form onSubmit={handleSearch} className="flex items-center gap-2 mt-2">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Manga ara..."
              className="flex-1 bg-surface-2 border border-border text-white placeholder-muted rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-accent"
            />
            <button type="submit" className="bg-accent text-white rounded-lg px-3 py-2">
              <Search className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </nav>
  );
}
