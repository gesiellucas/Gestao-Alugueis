'use client';
import React from "react";

import { Breadcrumbs, BreadcrumbItem } from "./Breadcrumbs";

export interface ModuleHeaderProps {
  title: string;
  subtitle?: string;
  extraHeader?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
}

export const ModuleHeader: React.FC<ModuleHeaderProps> = ({ title, subtitle, extraHeader, breadcrumbs }) => {
  return (
    <div className="flex flex-col gap-4">
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-white rounded-b-xl border border-slate-100 shadow-sm p-6 border-t-4 border-t-brand-blue border-t-solid">
        <div>
          <h2 className="text-2xl font-bold text-[#004AAD] tracking-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-slate-500 font-medium">{subtitle}</p>
          )}
        </div>
        {extraHeader}
      </div>
    </div>
  );
};
