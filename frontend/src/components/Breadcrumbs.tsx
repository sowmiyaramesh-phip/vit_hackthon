import React from "react";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
  active?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  return (
    <nav className="flex items-center space-x-1.5 text-xs text-slate-500 py-2.5 px-6 border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-14 z-20">
      <button
        onClick={items[0]?.onClick}
        className="flex items-center text-slate-400 hover:text-slate-700 transition-colors"
      >
        <Home className="w-3.5 h-3.5 mr-1" />
        <span>Study ABC-101</span>
      </button>

      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
          {item.onClick && !item.active ? (
            <button
              onClick={item.onClick}
              className="text-slate-600 hover:text-blue-600 font-medium transition-colors truncate max-w-xs"
            >
              {item.label}
            </button>
          ) : (
            <span
              className={`truncate max-w-xs ${
                item.active ? "font-semibold text-slate-900" : "text-slate-600"
              }`}
            >
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};
