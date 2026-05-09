import type { Config } from "@puckeditor/core";
import type { PuckConfigProps, RootProps } from "./types";

// Import blocks
import { Container } from "./blocks/Container";
import { Hero } from "./blocks/Hero";
import { ProductGrid } from "./blocks/ProductGrid";
import { Footer } from "./blocks/Footer";
import { Heading } from "./blocks/Heading";
import { Text } from "./blocks/Text";
import { Spacer } from "./blocks/Spacer";

export const config: Config<PuckConfigProps, RootProps> = {
  root: {
    fields: {
      storeName: { type: "text" },
      primaryColor: { type: "text" },
      fontFamily: {
        type: "select",
        options: [
          { label: "Inter", value: "Inter" },
          { label: "Outfit", value: "Outfit" },
          { label: "Roboto", value: "Roboto" },
          { label: "Montserrat", value: "Montserrat" },
        ],
      },
      logoUrl: { type: "text" },
    },
    defaultProps: {
      storeName: "Mi Tienda",
      primaryColor: "#00E5FF",
      fontFamily: "Inter",
      logoUrl: "",
    },
    render: ({ children, primaryColor, fontFamily }) => {
      return (
        <div style={{ '--primary-color': primaryColor, fontFamily } as React.CSSProperties}>
          {children}
        </div>
      );
    },
  },
  categories: {
    Layout: { components: ["Container", "Spacer", "Footer"] },
    Básicos: { components: ["Heading", "Text", "Hero"] },
    Tienda: { components: ["ProductGrid"] },
  },
  components: {
    Container,
    Spacer,
    Heading,
    Text,
    Hero,
    ProductGrid,
    Footer,
  },
};
