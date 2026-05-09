import type { ComponentConfig } from "@puckeditor/core";
import type { PuckConfigProps } from "../types";
import { commonStyleFields, getStyleProps } from "../styles";

export const Heading: ComponentConfig<PuckConfigProps["Heading"]> = {
  fields: {
    text: { type: "text" },
    level: {
      type: "radio",
      options: [
        { label: "H1", value: 1 },
        { label: "H2", value: 2 },
        { label: "H3", value: 3 },
        { label: "H4", value: 4 },
      ] as any,
    },
    styles: { 
      type: "object", 
      objectFields: commonStyleFields 
    } as any,
  },
  defaultProps: {
    text: "Título",
    level: 2,
  },
  render: ({ text, level, styles }) => {
    const fontClasses = {
      1: 'text-6xl font-black uppercase tracking-tighter',
      2: 'text-4xl font-black uppercase tracking-tighter',
      3: 'text-2xl font-bold uppercase tracking-tight',
      4: 'text-xl font-bold uppercase',
    };

    const styleProps = getStyleProps(styles);

    if (level === 1) return <h1 style={styleProps} className={fontClasses[1]}>{text}</h1>;
    if (level === 3) return <h3 style={styleProps} className={fontClasses[3]}>{text}</h3>;
    if (level === 4) return <h4 style={styleProps} className={fontClasses[4]}>{text}</h4>;
    return <h2 style={styleProps} className={fontClasses[2]}>{text}</h2>;
  },
};
