import type { Data } from "@puckeditor/core";
import type { PuckConfigProps, RootProps } from "./types";

export const AVRI_LUXURY_LAYOUT: Data<PuckConfigProps, RootProps> = {
  root: {
    props: {
      storeName: "Mi Tienda Luxury",
      primaryColor: "#00E5FF",
      fontFamily: "Inter",
      logoUrl: "",
    }
  },
  content: [
    {
      type: "Hero",
      props: {
        title: "Avri Luxury Store",
        subtitle: "La experiencia premium para tu negocio de WhatsApp",
        ctaText: "Ver Catálogo",
        bgType: "luxury",
        styles: {
          textAlign: "center",
          padding: { top: 120, bottom: 120, left: 20, right: 20 }
        },
        id: "hero-1"
      }
    },
    {
      type: "Spacer",
      props: {
        height: 40,
        id: "spacer-1"
      }
    },
    {
      type: "Container",
      props: {
        columns: 3,
        gap: 30,
        content: [],
        styles: {
          padding: { top: 40, bottom: 40, left: 20, right: 20 }
        },
        id: "container-1"
      }
    },
    {
      type: "ProductGrid",
      props: {
        title: "Nuestros Destacados",
        columns: 3,
        styles: {
          padding: { top: 80, bottom: 80, left: 20, right: 20 }
        },
        id: "product-grid-1"
      }
    },
    {
      type: "Footer",
      props: {
        text: "© 2024 Avri Platform. Todos los derechos reservados.",
        styles: {
          padding: { top: 60, bottom: 60, left: 20, right: 20 },
          textAlign: "center"
        },
        id: "footer-1"
      }
    }
  ]
};
