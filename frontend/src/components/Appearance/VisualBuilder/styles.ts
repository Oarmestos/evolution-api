import type { CommonStyles } from "./types";

export const commonStyleFields = {
  padding: {
    type: "object",
    objectFields: {
      top: { type: "number" },
      bottom: { type: "number" },
      left: { type: "number" },
      right: { type: "number" },
    },
  },
  margin: {
    type: "object",
    objectFields: {
      top: { type: "number" },
      bottom: { type: "number" },
    },
  },
  textAlign: {
    type: "select",
    options: [
      { label: "Izquierda", value: "left" },
      { label: "Centro", value: "center" },
      { label: "Derecha", value: "right" },
    ],
  },
  textColor: { type: "text" },
  backgroundColor: { type: "text" },
  borderRadius: { type: "number" },
} as const;

export const getStyleProps = (styles?: CommonStyles) => ({
  paddingTop: `${styles?.padding?.top ?? 0}px`,
  paddingBottom: `${styles?.padding?.bottom ?? 0}px`,
  paddingLeft: `${styles?.padding?.left ?? 0}px`,
  paddingRight: `${styles?.padding?.right ?? 0}px`,
  marginTop: `${styles?.margin?.top ?? 0}px`,
  marginBottom: `${styles?.margin?.bottom ?? 0}px`,
  textAlign: styles?.textAlign ?? 'inherit',
  color: styles?.textColor ?? 'inherit',
  backgroundColor: styles?.backgroundColor ?? 'transparent',
  borderRadius: `${styles?.borderRadius ?? 0}px`,
} as React.CSSProperties);
