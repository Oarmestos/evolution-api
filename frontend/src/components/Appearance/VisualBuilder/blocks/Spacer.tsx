import type { ComponentConfig } from "@puckeditor/core";
import type { PuckConfigProps } from "../types";

export const Spacer: ComponentConfig<PuckConfigProps["Spacer"]> = {
  fields: {
    height: { type: "number" },
  },
  defaultProps: {
    height: 40,
  },
  render: ({ height }) => <div style={{ height: `${height}px` }} />,
};
