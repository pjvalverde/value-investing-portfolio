// Configuración de la aplicación
export const CONFIG = {
  // URL base del backend
  BACKEND_URL: 'https://value-investing-5b425882ff1a.herokuapp.com',
  
  // Configuración de la API
  API: {
    TIMEOUT: 30000, // 30 segundos
    RETRIES: 3,      // Número de reintentos
  },
  
  // Configuración de la interfaz de usuario
  UI: {
    THEME: 'light', // 'light' o 'dark'
    LANGUAGE: 'es',  // 'es' o 'en'
  },
};
