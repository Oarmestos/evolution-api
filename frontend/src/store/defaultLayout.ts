export const AVRI_LUXURY_LAYOUT = {
  id: 'root',
  type: 'Container',
  props: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    minHeight: '100vh',
    backgroundColor: '#ffffff'
  },
  children: [
    {
      id: 'default-hero',
      type: 'Container',
      props: {
        backgroundColor: '#001946',
        padding: '120px 40px',
        borderRadius: '0px',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '24px',
        color: '#ffffff',
        width: '100%'
      },
      children: [
        {
          id: 'hero-h1',
          type: 'Heading',
          props: { text: 'AVRI LUXURY STORE', fontSize: '64px', fontWeight: '900', textAlign: 'center' }
        },
        {
          id: 'hero-p',
          type: 'Text',
          props: { text: 'La experiencia premium para tu negocio de WhatsApp', fontSize: '18px', textAlign: 'center', opacity: '0.8' }
        },
        {
          id: 'hero-btn',
          type: 'Button',
          props: { 
            text: 'VER CATÁLOGO', 
            backgroundColor: '#00E5FF', 
            color: '#001946',
            padding: '16px 40px',
            borderRadius: '99px',
            fontWeight: '900'
          }
        }
      ]
    },
    {
      id: 'default-products',
      type: 'Container',
      props: {
        padding: '80px 40px',
        width: '100%',
        flexDirection: 'column',
        gap: '40px'
      },
      children: [
        {
          id: 'products-h2',
          type: 'Heading',
          props: { text: 'NUESTROS PRODUCTOS', fontSize: '32px', fontWeight: '900', textAlign: 'center', color: '#001946' }
        },
        {
          id: 'products-grid',
          type: 'ProductGrid',
          props: { columns: 3 }
        }
      ]
    },
    {
      id: 'default-footer',
      type: 'Container',
      props: {
        backgroundColor: '#f8fafc',
        padding: '60px 40px',
        width: '100%',
        alignItems: 'center'
      },
      children: [
        {
          id: 'footer-text',
          type: 'Text',
          props: { text: '© 2024 Avri Store. Todos los derechos reservados.', fontSize: '12px', color: '#64748b' }
        }
      ]
    }
  ]
};
