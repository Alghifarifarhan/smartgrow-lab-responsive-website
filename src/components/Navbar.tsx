"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface NavbarProps {
  isHomePage?: boolean;
  joinUsLink?: string;
}

export default function Navbar({ isHomePage = true, joinUsLink = "#" }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  const navLinks = [
    { label: "Home", href: isHomePage ? "#hero" : "/#hero" },
    { label: "News & Events", href: isHomePage ? "#berita-kegiatan" : "/#berita-kegiatan" },
    { label: "Project", href: isHomePage ? "#proyek" : "/#proyek" },
    { label: "About", href: isHomePage ? "#tentang-kami" : "/#tentang-kami" },
  ];

  useEffect(() => {
    if (!isHomePage) return;

    const handleScroll = () => {
      const sections = document.querySelectorAll("section");
      let current = "";
      sections.forEach((section) => {
        const sectionTop = section.offsetTop;
        if (window.scrollY >= sectionTop - 60) {
          current = "#" + section.getAttribute("id");
        }
      });
      setActiveSection(current);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHomePage]);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (isHomePage && href.startsWith("#")) {
      e.preventDefault();
      const targetElement = document.querySelector(href);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: "smooth" });
      }
      setMobileMenuOpen(false);
    } else {
      setMobileMenuOpen(false);
    }
  };

  return (
    <nav className="sticky top-0 bg-white/95 backdrop-blur-md py-4 z-40 border-b border-gray-200 transition-all duration-300">
      <div className="container mx-auto flex items-center justify-between px-4">
        <Link href={isHomePage ? "#" : "/"} className="transition-transform duration-300 hover:scale-105">
          <img
            src="/assets/img/logo_full.png"
            alt="logo"
            width={200}
            height={34.38}
            className="animate-fade-in"
          />
        </Link>

        {/* Desktop Nav */}
        <ul className="hidden md:flex gap-8 animate-fade-in">
          {navLinks.map((link) => {
            const isActive = isHomePage && activeSection === link.href;
            return (
              <li key={link.label}>
                <a
                  href={link.href}
                  onClick={(e) => handleLinkClick(e, link.href)}
                  className={`nav-link block font-semibold text-center px-4 py-3 rounded-md transition-all duration-300 hover:text-primary ${
                    isActive ? "text-primary active scale-105" : "text-gray-500 hover:scale-105"
                  }`}
                >
                  {link.label}
                </a>
              </li>
            );
          })}
        </ul>

        {/* Join Us CTA */}
        <a
          href={joinUsLink || "#"}
          target={joinUsLink && joinUsLink !== "#" ? "_blank" : undefined}
          rel={joinUsLink && joinUsLink !== "#" ? "noopener noreferrer" : undefined}
          className="join-us-button"
        >
          <button className="hidden md:block bg-primary text-white rounded-full px-6 py-3 font-semibold shadow-md shadow-primary/50 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/60 transition-all duration-300 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0">
            Join Us!
          </button>
        </a>

        {/* Hamburger Button with Animated Morphing Icon */}
        <button
          id="mobile-menu-button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-gray-700 cursor-pointer rounded-lg hover:bg-gray-100 transition-colors focus:outline-none"
          aria-label="Toggle mobile menu"
        >
          <div className="w-6 h-6 flex flex-col justify-around relative">
            <span
              className={`block h-0.5 w-6 bg-current transform transition-all duration-300 ease-in-out ${
                mobileMenuOpen ? "rotate-45 translate-y-2" : ""
              }`}
            />
            <span
              className={`block h-0.5 w-6 bg-current transition-all duration-200 ease-in-out ${
                mobileMenuOpen ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`block h-0.5 w-6 bg-current transform transition-all duration-300 ease-in-out ${
                mobileMenuOpen ? "-rotate-45 -translate-y-2" : ""
              }`}
            />
          </div>
        </button>
      </div>

      {/* Mobile Menu with Slide-Down Animation */}
      {mobileMenuOpen && (
        <div
          id="mobile-menu"
          className="md:hidden border-t border-gray-100 bg-white/98 backdrop-blur-md shadow-lg animate-slide-down"
        >
          <ul className="flex flex-col gap-2 p-4">
            {navLinks.map((link, idx) => (
              <li
                key={link.label}
                className="animate-fade-in-up"
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                <a
                  href={link.href}
                  onClick={(e) => handleLinkClick(e, link.href)}
                  className="nav-link block font-semibold px-4 py-3 rounded-lg text-gray-600 hover:text-primary hover:bg-gray-50 transition-all"
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li className="animate-fade-in-up" style={{ animationDelay: `${navLinks.length * 60}ms` }}>
              <a
                href={joinUsLink || "#"}
                target={joinUsLink && joinUsLink !== "#" ? "_blank" : undefined}
                rel={joinUsLink && joinUsLink !== "#" ? "noopener noreferrer" : undefined}
                className="join-us-button block w-full mt-2"
              >
                <button className="w-full bg-primary text-white rounded-full px-6 py-3 font-semibold shadow-md shadow-primary/50 hover:bg-primary/90 transition-all duration-200 cursor-pointer">
                  Join Us!
                </button>
              </a>
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
}
