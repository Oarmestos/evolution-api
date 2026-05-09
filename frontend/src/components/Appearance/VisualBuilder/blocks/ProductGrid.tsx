import type { ComponentConfig } from "@puckeditor/core";
import type { PuckConfigProps } from "../types";
import { commonStyleFields, getStyleProps } from "../styles";

export const ProductGrid: ComponentConfig<PuckConfigProps["ProductGrid"]> = {
  fields: {
    title: { type: "text" },
    columns: { type: "number" },
    styles: { 
      type: "object", 
      objectFields: commonStyleFields 
    } as any,
  },
  defaultProps: {
    title: "Nuestros Productos",
    columns: 3,
    styles: { padding: { top: 64, bottom: 64, left: 32, right: 32 } },
  },
  render: ({ title, columns, styles }) => (
    <section style={getStyleProps(styles)} className="bg-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-black uppercase tracking-tighter mb-12 border-b-2 border-puck-surface-variant pb-6">
          {title}
        </h2>
        <div className="grid gap-8" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, i) => (
            <div key={i} className="flex flex-col gap-4 animate-pulse">
              <div className="aspect-square bg-puck-surface-variant rounded-3xl" />
              <div className="h-4 bg-puck-surface-variant rounded w-3/4" />
              <div className="h-4 bg-puck-surface-variant rounded w-1/4" />
            </div>
          ))}
        </div>
      </div>
    </section>
  ),
};
