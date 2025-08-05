# Valida Plazos Retail v1.1.0

Sistema para validación de plazos en el sector retail desarrollado con Node.js, Express y **Playwright** para scraping automatizado.

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js >= 16.0.0
- npm o yarn

### Instalación

1. Clona el repositorio:
```bash
git clone https://github.com/MoisesLagos123/valida_plazos_retail.git
cd valida_plazos_retail
```

2. Instala las dependencias:
```bash
npm install
```

3. Instala los navegadores de Playwright:
```bash
npm run playwright:install
```

4. Configura las variables de entorno:
```bash
# El archivo .env ya está configurado con credenciales de Ripley.cl
# Verifica que contenga las variables necesarias
```

5. Ejecuta una prueba rápida:
```bash
npm run test:playwright
```

## 📁 Estructura del Proyecto

```
valida_plazos_retail/
├── src/
│   ├── controllers/           # Controladores de la aplicación
│   ├── models/               # Modelos de datos
│   ├── routes/               # Definición de rutas
│   ├── middleware/           # Middlewares personalizados
│   ├── utils/                # Funciones utilitarias
│   ├── scraping/             # 🆕 Módulos de scraping con Playwright
│   │   ├── login/            # Sistema de autenticación
│   │   │   └── login_ripley.js
│   │   ├── scraping_ripley.js     # Clase principal de scraping
│   │   ├── ejemplos_ripley.js     # Ejemplos de uso
│   │   └── test_playwright_login.js # Pruebas de login
│   └── index.js              # Punto de entrada de la aplicación
├── tests/                    # Pruebas unitarias e integración
├── .env                     # Variables de entorno con credenciales
├── .env.example             # Ejemplo de variables de entorno
├── .gitignore              # Archivos ignorados por Git
├── package.json            # Configuración del proyecto
├── README.md               # Este archivo
└── GUIA_INSTALACION.md     # 🆕 Guía detallada de instalación
```

## 🛠️ Scripts Disponibles

### Scraping y Automatización:
- `npm run test:playwright` - Prueba de login con Playwright
- `npm run scraping:ripley` - Ejecutar ejemplos completos de scraping
- `npm run scraping:test` - Ejemplo básico de scraping
- `npm run scraping:quick` - Búsqueda rápida de productos

### Servidor y Desarrollo:
- `npm start` - Inicia el servidor en modo producción
- `npm run dev` - Inicia el servidor en modo desarrollo con nodemon
- `npm test` - Ejecuta las pruebas
- `npm run test:watch` - Ejecuta las pruebas en modo watch

## 🕷️ Funcionalidades de Scraping

### 🏪 **Ripley.cl Automatizado:**
- ✅ **Login automático** con credenciales configuradas
- ✅ **Búsqueda de productos** con términos personalizados
- ✅ **Extracción de detalles** de productos específicos
- ✅ **Obtención de órdenes** de compra del usuario
- ✅ **Validación de plazos** de entrega automática
- ✅ **Screenshots** automáticos para debugging

### 🛡️ **Características Anti-Detección:**
- ✅ **Playwright** con configuración stealth
- ✅ **Headers HTTP realistas** y user agents naturales
- ✅ **Comportamiento humano simulado** (mouse, delays)
- ✅ **Detección automática de Cloudflare**
- ✅ **Selectores dinámicos** que se adaptan a cambios HTML

## 📋 Ejemplos de Uso

### Búsqueda Rápida:
```javascript
const { quickScrape } = require('./src/scraping/scraping_ripley');

// Buscar productos
const productos = await quickScrape('search', 'notebook', { limit: 5 });
console.log(productos);
```

### Uso Avanzado:
```javascript
const { RipleyScraper } = require('./src/scraping/scraping_ripley');

const scraper = new RipleyScraper();
await scraper.initialize();

// Buscar productos
const productos = await scraper.searchProducts('smartphone');

// Obtener órdenes y validar plazos
const ordenes = await scraper.getOrders();
const ordenesExcedidas = ordenes.filter(o => /* lógica de plazos */);

await scraper.close();
```

### Validación Automática de Plazos:
```javascript
const { validarPlazosEntrega } = require('./src/scraping/ejemplos_ripley');

// Ejecutar validación completa
await validarPlazosEntrega();
```

## 🎯 Casos de Uso Principales

### **Para E-commerce:**
- Monitoreo de precios de competencia
- Análisis de catálogo de productos
- Seguimiento de disponibilidad de stock

### **Para Logística:**
- **Validación automática de plazos** de entrega
- Monitoreo de estado de órdenes en tiempo real
- Alertas de órdenes con retrasos

### **Para Análisis de Mercado:**
- Extracción masiva de datos de productos
- Comparación de precios y características
- Generación de reportes automatizados

## 🛡️ Variables de Entorno

El archivo `.env` incluye configuración completa:

```env
# Configuración de Ripley.cl
RIPLEY_USERNAME=devscrap2025@gmail.com
RIPLEY_PASSWORD=Dev20252025.
RIPLEY_BASE_URL=https://simple.ripley.cl
RIPLEY_WAIT_TIME=3000

# Configuración del servidor
PORT=3000
NODE_ENV=development

# Base de datos (opcional)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=valida_plazos_retail
```

## 🔧 Tecnologías

### **Backend:**
- **Node.js** - Runtime de JavaScript
- **Express.js** - Framework web
- **CORS** - Habilitación de CORS
- **Moment.js** - Manejo de fechas

### **Scraping y Automatización:**
- **Playwright** - Automatización de navegadores (reemplaza Puppeteer)
- **Chromium** - Motor de navegador
- **Anti-detección** - Bypass de Cloudflare y sistemas de protección

### **Desarrollo:**
- **Jest** - Framework de testing
- **Nodemon** - Desarrollo con hot reload
- **Dotenv** - Gestión de variables de entorno

## 📊 Estado del Proyecto

- ✅ Configuración inicial completada
- ✅ Estructura de carpetas organizada
- ✅ Servidor básico con Express funcionando
- ✅ **Sistema de scraping con Playwright implementado**
- ✅ **Login automático en Ripley.cl funcionando**
- ✅ **Validación de plazos de entrega implementada**
- ✅ Sistema anti-detección robusto
- ✅ Screenshots automáticos para debugging
- 🔄 Expansión a otros retailers en desarrollo...

## 🚧 Próximas Funcionalidades

- [ ] Soporte para múltiples retailers (Falabella, La Polar, etc.)
- [ ] API REST para integración externa
- [ ] Dashboard web de monitoreo en tiempo real
- [ ] Notificaciones automáticas por email/Slack
- [ ] Base de datos para almacenamiento histórico
- [ ] Exportación de reportes a Excel/CSV
- [ ] Sistema de alertas configurables

## ⚠️ Consideraciones Importantes

### **Uso Responsable:**
- El scraping debe realizarse respetando los términos de servicio
- Implementar delays apropiados entre requests
- No sobrecargar los servidores objetivo

### **Seguridad:**
- Las credenciales están en `.env` (no compartir)
- Usar en entornos controlados
- Monitorear logs para detectar bloqueos

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 👥 Autor

- **MoisesLagos123** - [GitHub](https://github.com/MoisesLagos123)

## 📞 Soporte

Para problemas o consultas:
1. Revisa la [Guía de Instalación](GUIA_INSTALACION.md)
2. Ejecuta `npm run test:playwright` para diagnóstico
3. Verifica los screenshots de debugging generados
4. Consulta los logs de consola para errores específicos

---

**🎉 ¡Sistema completamente actualizado y listo para usar con Playwright!**

Ejecuta: `npm run scraping:ripley` para comenzar.