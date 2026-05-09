import type { ComponentConfig } from "@puckeditor/core";
import type { PuckConfigProps } from "../types";
import { commonStyleFields, getStyleProps } from "../styles";
import { Layout, Grid, X } from "lucide-react";

export const Container: ComponentConfig<PuckConfigProps["Container"]> = {
  fields: {
    // --- LAYOUT GROUP ---
    layoutType: {
      type: "radio",
      label: "Layout Mode",
      options: [
        { label: "Flexbox", value: "flex" },
        { label: "Grid", value: "grid" },
      ],
    } as any,
    gridColumns: {
      type: "number",
      label: "Columns",
      min: 1,
      max: 12,
    } as any,
    justifyContent: {
      type: "select",
      label: "Justify Content",
      options: [
        { label: "Start", value: "start" },
        { label: "Center", value: "center" },
        { label: "End", value: "end" },
        { label: "Space Between", value: "between" },
      ],
    } as any,
    gap: { type: "number", label: "Gap (px)" },

    // --- CONTENT SLOT ---
    content: { type: "slot" },

    // --- STYLE GROUP ---
    styles: { 
      type: "object", 
      label: "Visual Style",
      objectFields: commonStyleFields 
    } as any,
  },
  defaultProps: {
    layoutType: "flex",
    gridColumns: 1,
    gap: 20,
    justifyContent: "center",
    content: {}, // Fix Error: missing property content
  },
  render: ({ layoutType, gridColumns, gap, justifyContent, styles, content: Content }) => {
    return (
      <div 
        className="relative min-h-[150px] transition-all duration-300 group/container"
        style={{ 
          ...getStyleProps(styles),
          display: layoutType === 'grid' ? 'grid' : 'flex',
          gridTemplateColumns: layoutType === 'grid' ? `repeat(${gridColumns}, minmax(0, 1fr))` : undefined,
          flexDirection: layoutType === 'flex' ? 'row' : undefined,
          flexWrap: 'wrap',
          justifyContent: layoutType === 'flex' ? {
            start: 'flex-start',
            center: 'center',
            end: 'flex-end',
            between: 'space-between'
          }[justifyContent || 'center'] : undefined,
          gap: `${gap}px`,
        }}
      >
        <div className="w-full z-10">
          <Content />
        </div>

        {/* Empty State Placeholder (WordPress style) */}
        {/* We use a CSS-only approach to show/hide the placeholder based on emptiness if possible, 
            or just show it as a helper that fades out when hovered or has content. */}
        <div className="absolute inset-4 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center bg-gray-50/50 pointer-events-none group-hover/container:border-[#00E5FF]/30 transition-all z-0 opacity-100 group-focus-within/container:opacity-20">
           <div className="flex flex-col items-center gap-6 p-8">
              <h4 className="text-gray-400 font-bold uppercase tracking-widest text-[11px]">Choose a Container Layout</h4>
              <div className="flex gap-10">
                 <div className="flex flex-col items-center gap-3">
                    <div className={`w-16 h-16 rounded-xl border-2 flex items-center justify-center transition-all ${layoutType === 'flex' ? 'bg-[#00E5FF]/10 border-[#00E5FF] text-[#00E5FF]' : 'bg-white border-gray-200 text-gray-400'}`}>
                       <Layout className="w-8 h-8" />
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-wider ${layoutType === 'flex' ? 'text-[#00E5FF]' : 'text-gray-400'}`}>Flexbox</span>
                 </div>
                 <div className="flex flex-col items-center gap-3">
                    <div className={`w-16 h-16 rounded-xl border-2 flex items-center justify-center transition-all ${layoutType === 'grid' ? 'bg-[#00E5FF]/10 border-[#00E5FF] text-[#00E5FF]' : 'bg-white border-gray-200 text-gray-400'}`}>
                       <Grid className="w-8 h-8" />
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-wider ${layoutType === 'grid' ? 'text-[#00E5FF]' : 'text-gray-400'}`}>Grid</span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    );
  },
};
