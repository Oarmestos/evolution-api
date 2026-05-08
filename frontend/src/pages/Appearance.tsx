import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { 
  Palette, 
  RotateCcw, 
  Save, 
  Check, 
  Smartphone, 
  Globe, 
  Camera, 
  Upload, 
  Layout,
  MousePointer2,
  Send,
  Image as ImageIcon,
  Type,
  AlignLeft,
  Copyright
} from 'lucide-react';
import { useThemeConfigStore } from '../store/useThemeConfigStore';
import { useInstanceStore } from '../store/useInstanceStore';
import { cn } from '../utils/cn';
import { LivePreview } from '../components/Appearance/LivePreview';

export const Appearance: React.FC = () => {
  const { activeInstance } = useInstanceStore();
  const { 
    theme, 
    loading, 
    saving, 
    fetchTheme, 
    updateTheme, 
    saveTheme, 
    uploadLogo, 
    uploadHeroImage,
    resetToDefaults, 
    applyTemplate,
    error
  } = useThemeConfigStore();

  const [previewProduct, setPreviewProduct] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const heroFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchTheme();
  }, [fetchTheme, activeInstance]);

  useEffect(() => {
    const fetchPreviewProduct = async () => {
      if (!activeInstance?.instanceName) return;
      try {
        const token = localStorage.getItem('avri_token');
        const response = await axios.get(`/product/${activeInstance.instanceName}`, {
          headers: { apikey: token },
        });
        if (response.data && response.data.length > 0) {
          setPreviewProduct(response.data[0]);
        }
      } catch (error) {
        console.error('Error fetching preview product:', error);
      }
    };
    fetchPreviewProduct();
  }, [activeInstance]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadLogo(file);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }


  const fonts = [
    { name: 'Inter (Moderno)', value: 'Inter' },
    { name: 'Montserrat (Negrita)', value: 'Montserrat' },
    { name: 'Playfair (Elegante)', value: 'Playfair Display' },
    { name: 'Poppins (Suave)', value: 'Poppins' },
  ];

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <p className="text-xs font-bold uppercase tracking-widest">{error}</p>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-white uppercase tracking-tight">Apariencia y Temas</h2>
          <p className="text-gray-400 text-sm">Personaliza cómo se ve tu tienda virtual y tus mensajes en WhatsApp.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={resetToDefaults}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition-all font-bold uppercase tracking-widest text-[10px]"
          >
            <RotateCcw className="w-4 h-4" />
            Restablecer
          </button>
          <button 
            onClick={saveTheme}
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-primary text-black hover:opacity-90 transition-all font-bold uppercase tracking-widest text-[10px] disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Panel - Configuration */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Plantillas */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <Layout className="w-4 h-4" />
              <h3 className="text-sm font-black uppercase tracking-widest">Plantillas de Tienda</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { id: 'moderno', name: 'Moderno (Default)', desc: 'Diseño limpio con emojis sutiles y enfoque en la claridad.', color: 'bg-indigo-500' },
                { id: 'minimalista', name: 'Minimalista', desc: 'Sin distracciones. Ideal para marcas de lujo o servicios.', color: 'bg-black border border-white/20' },
                { id: 'divertido', name: 'Divertido', desc: 'Muchos emojis, fuentes amigables y un tono cercano.', color: 'bg-pink-500' },
              ].map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => applyTemplate(tpl.id)}
                  className={cn(
                    "relative p-6 rounded-3xl border transition-all text-left group",
                    theme.template === tpl.id 
                      ? "bg-white/10 border-primary shadow-[0_0_20px_rgba(0,242,255,0.1)]" 
                      : "bg-[#16171d] border-white/5 hover:border-white/10"
                  )}
                >
                  {theme.template === tpl.id && (
                    <div className="absolute top-3 right-3 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-black font-bold" />
                    </div>
                  )}
                  <div className={cn("w-10 h-10 rounded-xl mb-4", tpl.color)}></div>
                  <h4 className="font-bold text-white text-sm mb-1">{tpl.name}</h4>
                  <p className="text-[10px] text-gray-500 leading-relaxed">{tpl.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Formulario */}
          <div className="bg-[#16171d] p-8 rounded-[40px] border border-white/[0.03] space-y-8">
            <div className="flex items-center gap-2 text-primary">
              <Palette className="w-4 h-4" />
              <h3 className="text-sm font-black uppercase tracking-widest">Colores y Identidad</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Branding */}
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                  Nombre Público de la Tienda (Branding) <Smartphone className="w-3 h-3" />
                </label>
                <input 
                  type="text" 
                  value={theme.storeName}
                  onChange={(e) => updateTheme({ storeName: e.target.value })}
                  placeholder="Ej: Mi Tienda"
                  className="w-full bg-[#0f1016] border border-white/5 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-primary/30 transition-all"
                />
                <p className="text-[9px] text-gray-600 italic ml-1">Este nombre es el que verán tus clientes en WhatsApp y en el catálogo.</p>
              </div>

              {/* Colores */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Color Primario</label>
                <div className="flex items-center gap-3 bg-[#0f1016] border border-white/5 rounded-2xl px-4 py-2">
                  <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-white/10">
                    <input 
                      type="color" 
                      value={theme.primaryColor}
                      onChange={(e) => updateTheme({ primaryColor: e.target.value })}
                      className="absolute inset-0 w-[150%] h-[150%] -translate-x-1/4 -translate-y-1/4 cursor-pointer"
                    />
                  </div>
                  <input 
                    type="text" 
                    value={theme.primaryColor}
                    onChange={(e) => updateTheme({ primaryColor: e.target.value })}
                    className="bg-transparent border-none text-xs text-white uppercase focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Color de Botones</label>
                <div className="flex items-center gap-3 bg-[#0f1016] border border-white/5 rounded-2xl px-4 py-2">
                  <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-white/10">
                    <input 
                      type="color" 
                      value={theme.buttonColor}
                      onChange={(e) => updateTheme({ buttonColor: e.target.value })}
                      className="absolute inset-0 w-[150%] h-[150%] -translate-x-1/4 -translate-y-1/4 cursor-pointer"
                    />
                  </div>
                  <input 
                    type="text" 
                    value={theme.buttonColor}
                    onChange={(e) => updateTheme({ buttonColor: e.target.value })}
                    className="bg-transparent border-none text-xs text-white uppercase focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Tipografía */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Tipografía</label>
                <div className="grid grid-cols-2 gap-2">
                  {fonts.map((f) => (
                    <button
                      key={f.value}
                      onClick={() => updateTheme({ fontFamily: f.value })}
                      className={cn(
                        "py-3 px-2 rounded-xl text-[10px] font-bold transition-all border",
                        theme.fontFamily === f.value 
                          ? "bg-primary/10 border-primary text-primary" 
                          : "bg-white/5 border-transparent text-white/50 hover:bg-white/10"
                      )}
                      style={{ fontFamily: f.value }}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Secundario */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Color Secundario (Fondo)</label>
                <div className="flex items-center gap-3 bg-[#0f1016] border border-white/5 rounded-2xl px-4 py-2">
                  <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-white/10">
                    <input 
                      type="color" 
                      value={theme.bgColor}
                      onChange={(e) => updateTheme({ bgColor: e.target.value })}
                      className="absolute inset-0 w-[150%] h-[150%] -translate-x-1/4 -translate-y-1/4 cursor-pointer"
                    />
                  </div>
                  <input 
                    type="text" 
                    value={theme.bgColor}
                    onChange={(e) => updateTheme({ bgColor: e.target.value })}
                    className="bg-transparent border-none text-xs text-white uppercase focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Logo */}
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Logo de la Tienda (URL)</label>
                <div className="flex gap-3">
                  <div className="w-14 h-14 bg-[#0f1016] border border-white/5 rounded-2xl flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {theme.logoUrl ? (
                      <img src={theme.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-6 h-6 text-gray-700" />
                    )}
                  </div>
                  <div className="flex-1 flex gap-2">
                    <input 
                      type="text" 
                      value={theme.logoUrl}
                      onChange={(e) => updateTheme({ logoUrl: e.target.value })}
                      placeholder="https://ejemplo.com/mi-logo.png"
                      className="flex-1 bg-[#0f1016] border border-white/5 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-primary/30"
                    />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 bg-white/5 border border-white/10 rounded-2xl text-[9px] font-black uppercase tracking-widest text-white/70 hover:bg-white/10 transition-all whitespace-nowrap"
                    >
                      <Upload className="w-3 h-3" />
                      Subir Local
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                </div>
                <p className="text-[9px] text-gray-600 italic ml-1">Recomendado: 1:1 (Cuadrado) de 512x512px. PNG transparente preferiblemente.</p>
              </div>

              {/* CTA Text */}
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                  Texto de Acción (Botón) <MousePointer2 className="w-3 h-3" />
                </label>
                <input 
                  type="text" 
                  value={theme.ctaText}
                  onChange={(e) => updateTheme({ ctaText: e.target.value })}
                  placeholder="Ver Detalles"
                  className="w-full bg-[#0f1016] border border-white/5 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-primary/30"
                />
              </div>

              {/* Socials */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Instagram URL</label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input 
                    type="text" 
                    value={theme.instagramUrl}
                    onChange={(e) => updateTheme({ instagramUrl: e.target.value })}
                    placeholder="Instagram URL"
                    className="w-full bg-[#0f1016] border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-sm text-white focus:outline-none focus:border-primary/30"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">TikTok URL</label>
                <div className="relative">
                  <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input 
                    type="text" 
                    value={theme.tiktokUrl}
                    onChange={(e) => updateTheme({ tiktokUrl: e.target.value })}
                    placeholder="TikTok URL"
                    className="w-full bg-[#0f1016] border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-sm text-white focus:outline-none focus:border-primary/30"
                  />
                </div>
              </div>

              {/* Banner Content (Hero) */}
              <div className="md:col-span-2 bg-[#0f1016]/50 p-6 rounded-3xl border border-white/[0.03] space-y-6">
                <div className="flex items-center gap-2 text-primary">
                  <ImageIcon className="w-4 h-4" />
                  <h3 className="text-sm font-black uppercase tracking-widest">Banner Principal (Hero)</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                      Título del Banner <Type className="w-3 h-3" />
                    </label>
                    <input 
                      type="text" 
                      value={theme.heroTitle}
                      onChange={(e) => updateTheme({ heroTitle: e.target.value })}
                      placeholder="Ej: Tu Tienda Online"
                      className="w-full bg-[#0f1016] border border-white/5 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-primary/30"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                      Subtítulo del Banner <AlignLeft className="w-3 h-3" />
                    </label>
                    <input 
                      type="text" 
                      value={theme.heroSubtitle}
                      onChange={(e) => updateTheme({ heroSubtitle: e.target.value })}
                      placeholder="Ej: Los mejores productos al alcance de un clic"
                      className="w-full bg-[#0f1016] border border-white/5 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-primary/30"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Imagen de Fondo del Banner</label>
                    <div className="flex gap-3">
                      <div className="w-24 h-14 bg-[#0f1016] border border-white/5 rounded-2xl flex-shrink-0 flex items-center justify-center overflow-hidden">
                        {theme.heroImageUrl ? (
                          <img src={theme.heroImageUrl} alt="Hero" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-gray-700" />
                        )}
                      </div>
                      <div className="flex-1 flex gap-2">
                        <input 
                          type="text" 
                          value={theme.heroImageUrl}
                          onChange={(e) => updateTheme({ heroImageUrl: e.target.value })}
                          placeholder="https://ejemplo.com/mi-banner.jpg"
                          className="flex-1 bg-[#0f1016] border border-white/5 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-primary/30"
                        />
                        <button 
                          onClick={() => heroFileInputRef.current?.click()}
                          className="flex items-center gap-2 px-4 bg-white/5 border border-white/10 rounded-2xl text-[9px] font-black uppercase tracking-widest text-white/70 hover:bg-white/10 transition-all whitespace-nowrap"
                        >
                          <Upload className="w-3 h-3" />
                          Subir
                        </button>
                        <input 
                          type="file" 
                          ref={heroFileInputRef}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) await uploadHeroImage(file);
                          }}
                          accept="image/*"
                          className="hidden"
                        />
                      </div>
                    </div>
                    <p className="text-[9px] text-gray-600 italic ml-1">Recomendado: 1920x600px o similar. Formatos: JPG, PNG, WebP.</p>
                  </div>
                </div>
              </div>

              {/* Footer Content */}
              <div className="md:col-span-2 bg-[#0f1016]/50 p-6 rounded-3xl border border-white/[0.03] space-y-6">
                <div className="flex items-center gap-2 text-primary">
                  <Copyright className="w-4 h-4" />
                  <h3 className="text-sm font-black uppercase tracking-widest">Pie de Página (Footer)</h3>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                    Texto de Copyright <AlignLeft className="w-3 h-3" />
                  </label>
                  <input 
                    type="text" 
                    value={theme.footerText}
                    onChange={(e) => updateTheme({ footerText: e.target.value })}
                    placeholder="Ej: © 2024 Avri. Todos los derechos reservados."
                    className="w-full bg-[#0f1016] border border-white/5 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-primary/30"
                  />
                </div>
              </div>

              {/* Borders */}
              <div className="md:col-span-2 space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Personalidad de Formas (Bordes)</label>
                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{theme.borderRadius}px</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="40" 
                  step="2"
                  value={theme.borderRadius}
                  onChange={(e) => updateTheme({ borderRadius: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-[#0f1016] rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-gray-600 px-1">
                  <span>Cuadrado</span>
                  <span>Equilibrado</span>
                  <span>Redondeado</span>
                </div>
              </div>

              {/* Sync Toggle */}
              <div className="md:col-span-2 bg-[#0f1016] border border-white/5 rounded-[30px] p-6 flex items-center justify-between gap-4 mt-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                    <Send className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white">Sincronizar con WhatsApp</h4>
                    <p className="text-[10px] text-gray-500">Actualizar automáticamente tu foto de perfil de negocio con el logo cargado.</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={theme.syncWhatsapp}
                    onChange={(e) => updateTheme({ syncWhatsapp: e.target.checked })}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white/40 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary peer-checked:after:bg-black"></div>
                </label>
              </div>

            </div>
          </div>
        </div>

        {/* Right Panel - Live Preview */}
        <div className="lg:col-span-5 relative">
          <LivePreview theme={theme} previewProduct={previewProduct} />
        </div>
      </div>
    </div>
  );
};
