import type { ComponentConfig } from "@puckeditor/core";
import type { PuckConfigProps } from "../types";
import { commonStyleFields, getStyleProps } from "../styles";

export const Footer: ComponentConfig<PuckConfigProps["Footer"]> = {
  fields: {
    text: { type: "text" },
    styles: { 
      type: "object", 
      objectFields: commonStyleFields 
    } as any,
  },
  defaultProps: {
    text: "© 2024 Avri. Todos los derechos reservados.",
    styles: { padding: { top: 48, bottom: 48, left: 32, right: 32 }, textAlign: 'center' },
  },
  render: ({ text, styles }) => (
    <footer style={getStyleProps(styles)} className="bg-puck-surface border-t border-puck-outline-variant">
      <div className="max-w-6xl mx-auto">
        <p className="text-[10px] font-black uppercase tracking-[0.5em] opacity-30">
          {text}
        </p>
      </div>
    </footer>
  ),
};
