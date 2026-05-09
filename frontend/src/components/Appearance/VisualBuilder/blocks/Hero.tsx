import type { ComponentConfig } from "@puckeditor/core";
import { ArrowRight } from 'lucide-react';
import type { PuckConfigProps } from "../types";
import { commonStyleFields, getStyleProps } from "../styles";

export const Hero: ComponentConfig<PuckConfigProps["Hero"]> = {
  fields: {
    title: { type: "text" },
    subtitle: { type: "textarea" },
    ctaText: { type: "text" },
    bgType: {
      type: "select",
      options: [
        { label: "Color", value: "color" },
        { label: "Imagen", value: "image" },
        { label: "Luxury (Glow)", value: "luxury" },
      ] as any,
    },
    styles: { 
      type: "object", 
      objectFields: commonStyleFields 
    } as any,
  },
  defaultProps: {
    title: "Tu Tienda Online",
    subtitle: "Los mejores productos al alcance de un clic",
    ctaText: "Comprar Ahora",
    bgType: "luxury",
    styles: { textAlign: 'center', padding: { top: 100, bottom: 100, left: 20, right: 20 } },
  },
  render: ({ title, subtitle, ctaText, bgType, styles }) => {
    const isLuxury = bgType === 'luxury';
    return (
      <section 
        style={getStyleProps(styles)}
        className={`relative overflow-hidden flex items-center min-h-[400px] ${
          isLuxury ? 'bg-gradient-to-br from-[#001946] via-[#00327d] to-[#54118a] text-white' : ''
        }`}
      >
        {isLuxury && (
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[10%] left-[5%] w-[300px] h-[300px] bg-[#7b41b3]/30 rounded-full filter blur-[80px] opacity-70 animate-pulse" />
            <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] bg-[#0047ab]/40 rounded-full filter blur-[100px] opacity-60" />
          </div>
        )}
        <div className="max-w-4xl mx-auto w-full relative z-10">
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-6 leading-tight">
            {title}
          </h1>
          <p className="text-xl opacity-80 mb-10 max-w-2xl mx-auto font-bold italic">
            {subtitle}
          </p>
          <button className="mx-auto px-10 py-4 bg-puck-primary-container text-puck-naviblue font-black uppercase tracking-widest text-xs rounded-full flex items-center gap-4 transition-all shadow-xl">
            {ctaText}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    );
  },
};
