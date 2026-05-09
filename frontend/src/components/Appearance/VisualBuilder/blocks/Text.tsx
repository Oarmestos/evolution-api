import type { ComponentConfig } from "@puckeditor/core";
import type { PuckConfigProps } from "../types";
import { commonStyleFields, getStyleProps } from "../styles";

export const Text: ComponentConfig<PuckConfigProps["Text"]> = {
  fields: {
    text: { type: "textarea" },
    size: {
      type: "select",
      options: [
        { label: "Extra Small", value: "xs" },
        { label: "Small", value: "sm" },
        { label: "Base", value: "base" },
        { label: "Large", value: "lg" },
        { label: "XL", value: "xl" },
        { label: "2XL", value: "2xl" },
      ] as any,
    },
    styles: { 
      type: "object", 
      objectFields: commonStyleFields 
    } as any,
  },
  defaultProps: {
    text: "Escribe algo aquí...",
    size: "base",
  },
  render: ({ text, size, styles }) => {
    const sizeClasses = {
      xs: 'text-xs',
      sm: 'text-sm',
      base: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl',
      '2xl': 'text-2xl',
    };
    return (
      <p style={getStyleProps(styles)} className={sizeClasses[size]}>
        {text}
      </p>
    );
  },
};
