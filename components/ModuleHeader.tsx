'use client';
import React from "react";

export interface ModuleHeaderProps {
  title: string;
  subtitle?: string;
  extraHeader?: React.ReactNode;
}

export const ModuleHeader: React.FC<ModuleHeaderProps> = ({ title, subtitle, extraHeader }) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-white rounded-xl border border-slate-100 shadow-sm p-6">
      <div>
        <h2 className="text-2xl font-bold text-[#1a4fd6] tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-slate-500 font-medium">{subtitle}</p>
        )}
      </div>
      {extraHeader}
    </div>
  );
};
