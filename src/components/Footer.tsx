import React from "react";
import type { SiteContent } from "@/types";

interface FooterProps {
  footerData?: SiteContent["footer"];
  className?: string;
}

export default function Footer({ footerData, className = "" }: FooterProps) {
  return (
    <footer className={`bg-[var(--bg-dark,#0b0f12)] p-16 transition-colors duration-300 ${className}`}>
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-6 gap-16 items-center text-gray-400 px-4">
        <div className="md:col-span-2">
          <img
            src="/assets/img/logo_white_footer.png"
            alt="logo footer"
            width={320}
            height={320}
            className="mx-auto"
          />
        </div>
        <div className="md:col-span-4">
          <div className="grid grid-cols-1 md:grid-cols-3 items-start gap-8">
            <div>
              <p className="mb-4 text-white font-bold">Office Address</p>
              <ul id="footer-address-display" className="flex flex-col gap-4 text-sm">
                {footerData?.address ? (
                  <li>{footerData.address}</li>
                ) : null}
              </ul>
            </div>
            <div>
              <p className="mb-4 text-white font-bold">Research & Innovation</p>
              <ul id="footer-research-display" className="flex flex-col gap-4 text-sm">
                {footerData?.research?.map((item, idx) => (
                  <li key={idx}>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-secondary"
                    >
                      {item.text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-4 text-white font-bold">Contact Us</p>
              <ul id="footer-contact-display" className="flex flex-col gap-4 text-sm">
                {footerData?.contact?.map((item, idx) => (
                  <li key={idx}>
                    <a href={item.url} className="hover:text-secondary">
                      {item.text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

