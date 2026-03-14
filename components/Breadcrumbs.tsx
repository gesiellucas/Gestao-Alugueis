'use client';
import React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  return (
    <nav className="flex items-center space-x-2 text-xs font-semibold text-slate-400 mb-2 overflow-x-auto whitespace-nowrap scrollbar-hide py-1">
      <Link
        href="/"
        className="flex items-center gap-1 hover:text-[#004AAD] transition-colors"
      >
        <Home size={14} />
        <span>Início</span>
      </Link>

      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight size={14} className="text-slate-300 flex-shrink-0" />
          {item.href ? (
            <Link
              href={item.href}
              className="hover:text-[#004AAD] transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-slate-600 font-bold">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};
