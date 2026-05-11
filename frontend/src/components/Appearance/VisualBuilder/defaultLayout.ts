 

export const AVRI_LUXURY_LAYOUT: any = {
  id: "root",
  type: "Container",
  props: {
    storeName: "Mi Tienda Luxury",
    primaryColor: "#00E5FF",
    fontFamily: "Inter",
    logoUrl: "",
    backgroundColor: "#ffffff",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    minHeight: "100vh"
  },
  children: [
    {
      id: "hero-section",
      type: "Hero",
      props: {
        title: "Avri Luxury Store",
        subtitle: "La experiencia premium para tu negocio de WhatsApp",
        ctaText: "Ver Catálogo",
        btnBg: "#00E5FF",
        btnColor: "#001946",
        btnRadius: 99,
        backgroundColor: "#001946",
        paddingTop: 120,
        paddingBottom: 120,
        color: "#ffffff"
      }
    },
    {
      id: "spacer-1",
      type: "Spacer",
      props: { height: 40 }
    },
    {
      id: "product-grid-section",
      type: "ProductGrid",
      props: {
        title: "Nuestros Destacados",
        columns: 3,
        paddingTop: 80,
        paddingBottom: 80
      }
    },
    {
      id: "footer-section",
      type: "Footer",
      props: {
        text: "© 2024 Avri Platform. Todos los derechos reservados.",
        backgroundColor: "#f8fafc",
        paddingTop: 60,
        paddingBottom: 60,
        alignItems: "center"
      }
    }
  ]
};
