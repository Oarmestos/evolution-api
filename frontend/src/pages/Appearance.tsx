import React, { useEffect, useRef } from 'react';
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
  CheckCircle2,
  Send,
  MoreVertical,
  ArrowLeft,
  User,
  Image as ImageIcon,
  Type,
  AlignLeft,
  Copyright
} from 'lucide-react';
import { useThemeConfigStore } from '../store/useThemeConfigStore';
import { useInstanceStore } from '../store/useInstanceStore';
import { cn } from '../utils/cn';

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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const heroFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchTheme();
  }, [fetchTheme, activeInstance]);

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
          <div className="sticky top-8 space-y-6">
            <div className="flex items-center gap-2 text-primary">
              <Smartphone className="w-4 h-4" />
              <h3 className="text-sm font-black uppercase tracking-widest">Vista Previa Live</h3>
            </div>

            {/* Smartphone Mockup */}
            <div className="relative mx-auto w-[320px] h-[640px] bg-black rounded-[60px] border-[8px] border-[#1e1e1e] shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden">
              {/* WhatsApp UI */}
              <div className="flex flex-col h-full bg-[#e5ddd5] dark:bg-[#0b141a] font-sans" style={{ fontFamily: theme.fontFamily }}>
                
                {/* Header WA */}
                <div className="bg-[#075e54] dark:bg-[#202c33] p-4 pt-10 flex items-center gap-3 text-white">
                  <ArrowLeft className="w-4 h-4" />
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden border border-white/10">
                    {theme.logoUrl ? (
                      <img src={theme.logoUrl} alt="Store" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-6 h-6" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm truncate">{theme.storeName || 'Mi Tienda'}</span>
                      <CheckCircle2 className="w-3 h-3 text-[#25d366] fill-[#25d366] bg-white rounded-full p-[1px]" />
                    </div>
                    <div className="text-[10px] text-white/70">verificado</div>
                  </div>
                  <MoreVertical className="w-4 h-4 text-white/70" />
                </div>

                {/* Chat Area */}
                <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                  
                  {/* Incoming Welcome Message */}
                  <div className="max-w-[85%] bg-white dark:bg-[#202c33] rounded-2xl rounded-tl-none p-3 shadow-sm relative">
                    <p className="text-xs text-black dark:text-white/90">
                      ¡Hola! Bienvenid@ a nuestra tienda. 🛍️
                    </p>
                    <span className="block text-[8px] text-gray-400 text-right mt-1">10:45 AM</span>
                  </div>

                  {/* Product Card Card */}
                  <div 
                    className="max-w-[90%] mx-auto bg-white dark:bg-[#111b21] shadow-xl overflow-hidden"
                    style={{ borderRadius: `${theme.borderRadius}px`, backgroundColor: theme.bgColor }}
                  >
                    <div className="aspect-square bg-gray-100 dark:bg-[#2a3942] flex items-center justify-center relative">
                      {theme.logoUrl ? (
                        <img src={theme.logoUrl} alt="Product" className="w-1/2 h-1/2 object-contain opacity-50" />
                      ) : (
                        <ImageIcon className="w-12 h-12 text-gray-300" />
                      )}
                      <div className="absolute top-2 right-2 bg-primary text-black text-[10px] font-black px-2 py-1 rounded-full">NUEVO</div>
                    </div>
                    <div className="p-4 space-y-2">
                      <h4 className="font-bold text-sm text-black dark:text-white">Producto Destacado</h4>
                      <p className="text-[10px] text-primary font-black">$120</p>
                      <button 
                        className="w-full py-2.5 text-[10px] font-black uppercase tracking-widest transition-all"
                        style={{ backgroundColor: theme.buttonColor, color: theme.buttonColor === '#000000' || theme.buttonColor === '#000' ? 'white' : 'black', borderRadius: `${theme.borderRadius / 2}px` }}
                      >
                        {theme.ctaText}
                      </button>
                    </div>
                  </div>

                  {/* User Outgoing Response */}
                  <div className="flex justify-end">
                    <div className="max-w-[85%] bg-[#dcf8c6] dark:bg-[#005c4b] rounded-2xl rounded-tr-none p-3 shadow-sm relative">
                      <p className="text-xs text-black dark:text-white/90">
                        Quiero ver el catálogo completo por favor.
                      </p>
                      <span className="block text-[8px] text-[#00000073] dark:text-white/50 text-right mt-1 flex items-center justify-end gap-0.5">
                        10:46 AM <Check className="w-2.5 h-2.5 text-blue-500" />
                      </span>
                    </div>
                  </div>

                </div>

                {/* Input Bar */}
                <div className="bg-[#f0f2f5] dark:bg-[#202c33] p-3 flex items-center gap-3">
                  <div className="flex-1 bg-white dark:bg-[#2a3942] rounded-full px-4 py-2 text-[10px] text-gray-400 border dark:border-none">
                    Escribe un mensaje...
                  </div>
                  <div className="w-9 h-9 rounded-full bg-[#00a884] flex items-center justify-center text-white">
                    <Send className="w-4 h-4 fill-white translate-x-0.5" />
                  </div>
                </div>

              </div>
            </div>

            {/* Note */}
            <div className="text-center space-y-2 px-8">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Nota Importante</p>
              <p className="text-[9px] text-gray-600 leading-relaxed italic">
                Este es una simulación visual. Los colores finales pueden variar levemente dependiendo de la versión de WhatsApp del cliente.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
