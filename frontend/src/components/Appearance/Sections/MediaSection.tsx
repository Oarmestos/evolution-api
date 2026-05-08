import React from 'react';
import { Camera, Image as ImageIcon, Upload } from 'lucide-react';

interface MediaSectionProps {
  theme: any;
  onUpload: (type: 'logo' | 'hero') => void;
  logoRef: React.RefObject<HTMLInputElement>;
  heroRef: React.RefObject<HTMLInputElement>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'hero') => void;
}

export const MediaSection: React.FC<MediaSectionProps> = ({ 
  theme, 
  onUpload, 
  logoRef, 
  heroRef, 
  onFileChange 
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-primary">
        <Camera className="w-4 h-4" />
        <h3 className="text-sm font-black uppercase tracking-widest">Identidad Visual</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        {/* Logo */}
        <div className="space-y-4">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Logotipo de Tienda</label>
          <div 
            onClick={() => onUpload('logo')}
            className="relative h-48 theme-surface-alt border-2 border-dashed border-white/5 rounded-[40px] flex flex-col items-center justify-center gap-4 group cursor-pointer hover:border-primary/20 transition-all overflow-hidden"
          >
            {theme.logoUrl ? (
              <>
                <img src={theme.logoUrl} alt="Logo" className="w-full h-full object-contain p-8 group-hover:scale-105 transition-transform" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                  <Upload className="text-white w-8 h-8" />
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <ImageIcon className="text-gray-600 group-hover:text-primary w-8 h-8" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-primary">Subir Logo</span>
              </>
            )}
            <input type="file" ref={logoRef} onChange={(e) => onFileChange(e, 'logo')} className="hidden" accept="image/*" />
          </div>
        </div>

        {/* Hero Image */}
        <div className="space-y-4">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Banner Principal (Hero)</label>
          <div 
            onClick={() => onUpload('hero')}
            className="relative h-48 theme-surface-alt border-2 border-dashed border-white/5 rounded-[40px] flex flex-col items-center justify-center gap-4 group cursor-pointer hover:border-primary/20 transition-all overflow-hidden"
          >
            {theme.heroImageUrl ? (
              <>
                <img src={theme.heroImageUrl} alt="Hero" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                  <Upload className="text-white w-8 h-8" />
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <ImageIcon className="text-gray-600 group-hover:text-primary w-8 h-8" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-primary">Subir Banner</span>
              </>
            )}
            <input type="file" ref={heroRef} onChange={(e) => onFileChange(e, 'hero')} className="hidden" accept="image/*" />
          </div>
        </div>
      </div>
    </div>
  );
};
