import React from 'react';
import { Search } from 'lucide-react';

interface CatalogFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  categories: string[];
}

export const CatalogFilters: React.FC<CatalogFiltersProps> = ({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
}) => {
  return (
    <div className="p-8 pb-4 flex gap-4">
      <div className="relative flex-1 group">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30 group-focus-within:text-primary transition-colors" />
        <input
          type="text"
          placeholder="BUSCAR PRODUCTOS..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full theme-input rounded-2xl py-4 pl-14 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-1 focus:ring-primary/20 transition-all"
        />
      </div>
      <select
        value={selectedCategory}
        onChange={(e) => onCategoryChange(e.target.value)}
        className="theme-input rounded-2xl px-8 py-4 text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer"
      >
        <option value="all">TODAS LAS CATEGORÍAS</option>
        {categories.filter(c => c !== 'all').map(cat => (
          <option key={cat} value={cat}>{cat.toUpperCase()}</option>
        ))}
      </select>
    </div>
  );
};
