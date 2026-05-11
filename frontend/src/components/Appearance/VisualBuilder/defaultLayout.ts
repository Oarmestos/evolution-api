 

export const AVRI_LUXURY_LAYOUT: any = {
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
      id: "hero-section",
      type: "Container",
      props: {
        backgroundColor: "#ffffff",
        paddingTop: "120px",
        paddingBottom: "120px",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "24px"
      },
      children: [
        {
          id: "hero-title",
          type: "Heading",
          props: { text: "Avri Luxury Store", fontSize: "64px", fontWeight: "900", textAlign: "center", color: "#001946" }
        },
        {
          id: "hero-subtitle",
          type: "Text",
          props: { text: "La experiencia premium para tu negocio de WhatsApp", fontSize: "18px", textAlign: "center", color: "#001946", opacity: 0.7 }
        },
        {
          id: "hero-cta",
          type: "Button",
          props: { 
            text: "Ver Catálogo", 
            backgroundColor: "#00E5FF", 
            color: "#001946",
            borderRadius: "99px",
            paddingTop: "16px",
            paddingBottom: "16px",
            paddingLeft: "40px",
            paddingRight: "40px",
            fontWeight: "900"
          }
        }
      ]
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
        paddingTop: "80px",
        paddingBottom: "80px"
      }
    },
    {
      id: "footer-section",
      type: "Container",
      props: {
        backgroundColor: "#f8fafc",
        paddingTop: "60px",
        paddingBottom: "60px",
        alignItems: "center"
      },
      children: [
        {
          id: "footer-text",
          type: "Text",
          props: { text: "© 2024 Avri Platform. Todos los derechos reservados.", fontSize: "12px", color: "#64748b" }
        }
      ]
    }
  ]
};
