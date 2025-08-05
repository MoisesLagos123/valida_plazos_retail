const { chromium } = require('playwright');
const { loginRipley, verifyLogin, logoutRipley, keepSessionAlive, RIPLEY_CONFIG } = require('./login/login_ripley');
require('dotenv').config();

/**
 * Clase principal para scraping de Ripley.cl usando Playwright
 */
class RipleyScraper {
    constructor() {
        this.browser = null;
        this.context = null;
        this.page = null;
        this.isLoggedIn = false;
        this.sessionTimeout = null;
    }

    /**
     * Inicializar el scraper
     * @param {Object} options - Opciones de configuración
     * @returns {Promise<boolean>} - True si la inicialización fue exitosa
     */
    async initialize(options = {}) {
        try {
            console.log('🚀 Inicializando Ripley Scraper con Playwright...');

            // Configuración del browser
            const browserOptions = {
                headless: options.headless !== undefined ? options.headless : false,
                args: [
                    '--disable-blink-features=AutomationControlled',
                    '--disable-features=VizDisplayCompositor',
                    '--disable-ipc-flooding-protection',
                    '--disable-renderer-backgrounding',
                    '--disable-backgrounding-occluded-windows',
                    '--disable-background-timer-throttling',
                    '--no-sandbox',
                    '--disable-setuid-sandbox'
                ]
            };

            this.browser = await chromium.launch(browserOptions);
            
            // Realizar login
            const loginResult = await loginRipley(this.browser);
            
            if (loginResult.success) {
                this.page = loginResult.page;
                this.context = loginResult.context;
                this.isLoggedIn = true;
                
                // Configurar mantenimiento de sesión
                this.setupSessionMaintenance();
                
                console.log('✅ Ripley Scraper inicializado correctamente');
                return true;
            } else {
                console.error('❌ Error en login:', loginResult.error);
                await this.close();
                return false;
            }

        } catch (error) {
            console.error('❌ Error inicializando scraper:', error.message);
            await this.close();
            return false;
        }
    }

    /**
     * Configurar mantenimiento automático de sesión
     */
    setupSessionMaintenance() {
        // Mantener sesión activa cada 5 minutos
        this.sessionTimeout = setInterval(async () => {
            if (this.page && this.isLoggedIn) {
                const isActive = await keepSessionAlive(this.page);
                if (!isActive) {
                    console.log('⚠️ Sesión perdida, intentando reconectar...');
                    await this.reconnect();
                }
            }
        }, 5 * 60 * 1000); // 5 minutos
    }

    /**
     * Reconectar en caso de pérdida de sesión
     * @returns {Promise<boolean>} - True si la reconexión fue exitosa
     */
    async reconnect() {
        try {
            console.log('🔄 Reconectando a Ripley...');
            
            if (this.context) {
                await this.context.close();
            }

            const loginResult = await loginRipley(this.browser);
            
            if (loginResult.success) {
                this.page = loginResult.page;
                this.context = loginResult.context;
                this.isLoggedIn = true;
                console.log('✅ Reconexión exitosa');
                return true;
            } else {
                console.error('❌ Error en reconexión:', loginResult.error);
                this.isLoggedIn = false;
                return false;
            }

        } catch (error) {
            console.error('❌ Error durante reconexión:', error.message);
            this.isLoggedIn = false;
            return false;
        }
    }

    /**
     * Buscar productos en Ripley
     * @param {string} searchTerm - Término de búsqueda
     * @param {Object} options - Opciones de búsqueda
     * @returns {Promise<Array>} - Array de productos encontrados
     */
    async searchProducts(searchTerm, options = {}) {
        if (!this.isLoggedIn || !this.page) {
            throw new Error('Scraper no inicializado o sesión perdida');
        }

        try {
            console.log(`🔍 Buscando productos: "${searchTerm}"`);

            // Navegar a la página de búsqueda
            const searchUrl = `${RIPLEY_CONFIG.baseUrl}/buscar?q=${encodeURIComponent(searchTerm)}`;
            await this.page.goto(searchUrl, { waitUntil: 'networkidle' });

            // Esperar a que carguen los productos con múltiples selectores
            const productSelectors = [
                '.product-item', 
                '.catalog-product-item', 
                '[data-testid="product"]',
                '.product-card',
                '.item-product'
            ];

            let productsFound = false;
            for (const selector of productSelectors) {
                try {
                    await this.page.waitForSelector(selector, { timeout: 5000 });
                    productsFound = true;
                    console.log(`✅ Productos encontrados con selector: ${selector}`);
                    break;
                } catch (e) {
                    continue;
                }
            }

            if (!productsFound) {
                console.log('⚠️ No se encontraron productos con los selectores esperados');
                return [];
            }

            // Extraer información de productos
            const products = await this.page.evaluate((options, selectors) => {
                const results = [];
                
                // Probar cada selector hasta encontrar productos
                for (const selector of selectors) {
                    const productElements = document.querySelectorAll(selector);
                    
                    if (productElements.length > 0) {
                        productElements.forEach((element, index) => {
                            try {
                                // Múltiples selectores para título
                                const titleSelectors = ['h3', '.product-title', '[data-testid="product-title"]', '.title', '.name'];
                                let titleElement = null;
                                for (const titleSel of titleSelectors) {
                                    titleElement = element.querySelector(titleSel);
                                    if (titleElement) break;
                                }

                                // Múltiples selectores para precio
                                const priceSelectors = ['.price', '.product-price', '[data-testid="price"]', '.cost', '.amount'];
                                let priceElement = null;
                                for (const priceSel of priceSelectors) {
                                    priceElement = element.querySelector(priceSel);
                                    if (priceElement) break;
                                }

                                const linkElement = element.querySelector('a');
                                const imageElement = element.querySelector('img');

                                const product = {
                                    id: index + 1,
                                    title: titleElement ? titleElement.textContent.trim() : 'Sin título',
                                    price: priceElement ? priceElement.textContent.trim() : 'Sin precio',
                                    link: linkElement ? linkElement.href : null,
                                    image: imageElement ? imageElement.src : null,
                                    scraped_at: new Date().toISOString(),
                                    selector_used: selector
                                };

                                if (product.title !== 'Sin título') {
                                    results.push(product);
                                }
                            } catch (error) {
                                console.error('Error procesando producto:', error);
                            }
                        });
                        
                        if (results.length > 0) {
                            break; // Salir del loop si encontramos productos
                        }
                    }
                }

                return results.slice(0, options.limit || 20);
            }, options, productSelectors);

            console.log(`✅ Encontrados ${products.length} productos`);
            return products;

        } catch (error) {
            console.error('❌ Error buscando productos:', error.message);
            throw error;
        }
    }

    /**
     * Obtener detalles de un producto específico
     * @param {string} productUrl - URL del producto
     * @returns {Promise<Object>} - Detalles del producto
     */
    async getProductDetails(productUrl) {
        if (!this.isLoggedIn || !this.page) {
            throw new Error('Scraper no inicializado o sesión perdida');
        }

        try {
            console.log(`📄 Obteniendo detalles del producto: ${productUrl}`);

            await this.page.goto(productUrl, { waitUntil: 'networkidle' });

            // Extraer detalles del producto con selectores robustos
            const productDetails = await this.page.evaluate(() => {
                const getTextContent = (selectors) => {
                    if (typeof selectors === 'string') selectors = [selectors];
                    for (const selector of selectors) {
                        const element = document.querySelector(selector);
                        if (element) return element.textContent.trim();
                    }
                    return null;
                };

                const getAttribute = (selectors, attribute) => {
                    if (typeof selectors === 'string') selectors = [selectors];
                    for (const selector of selectors) {
                        const element = document.querySelector(selector);
                        if (element) return element.getAttribute(attribute);
                    }
                    return null;
                };

                const getAllTextContent = (selectors) => {
                    if (typeof selectors === 'string') selectors = [selectors];
                    for (const selector of selectors) {
                        const elements = document.querySelectorAll(selector);
                        if (elements.length > 0) {
                            return Array.from(elements).map(el => el.textContent.trim());
                        }
                    }
                    return [];
                };

                return {
                    title: getTextContent(['h1', '.product-title', '[data-testid="product-title"]', '.title']),
                    price: getTextContent(['.price', '.product-price', '[data-testid="price"]', '.cost', '.amount']),
                    originalPrice: getTextContent(['.original-price', '.old-price', '.was-price']),
                    discount: getTextContent(['.discount', '.offer-percentage', '.save-amount']),
                    description: getTextContent(['.product-description', '.description', '.details']),
                    brand: getTextContent(['.brand', '.product-brand', '.manufacturer']),
                    sku: getTextContent(['.sku', '.product-sku', '.model']) || getAttribute(['[data-sku]'], 'data-sku'),
                    availability: getTextContent(['.availability', '.stock-status', '.in-stock']),
                    rating: getTextContent(['.rating', '.product-rating', '.stars']),
                    images: Array.from(document.querySelectorAll('.product-image img, .gallery img, .carousel img')).map(img => img.src),
                    specifications: getAllTextContent(['.specifications li', '.product-specs li', '.features li']),
                    scraped_at: new Date().toISOString(),
                    url: window.location.href
                };
            });

            console.log(`✅ Detalles obtenidos para: ${productDetails.title}`);
            return productDetails;

        } catch (error) {
            console.error('❌ Error obteniendo detalles del producto:', error.message);
            throw error;
        }
    }

    /**
     * Obtener órdenes/compras del usuario
     * @param {Object} options - Opciones de búsqueda
     * @returns {Promise<Array>} - Array de órdenes
     */
    async getOrders(options = {}) {
        if (!this.isLoggedIn || !this.page) {
            throw new Error('Scraper no inicializado o sesión perdida');
        }

        try {
            console.log('📋 Obteniendo órdenes de compra...');

            // Navegar a la página de órdenes
            const ordersUrl = process.env.RIPLEY_ORDERS_URL || 'https://simple.ripley.cl/mi-cuenta/mis-compras';
            await this.page.goto(ordersUrl, { waitUntil: 'networkidle' });

            // Esperar a que carguen las órdenes con múltiples selectores
            const orderSelectors = [
                '.order-item', 
                '.purchase-item', 
                '[data-testid="order"]',
                '.order-card',
                '.purchase-card'
            ];

            let ordersFound = false;
            for (const selector of orderSelectors) {
                try {
                    await this.page.waitForSelector(selector, { timeout: 5000 });
                    ordersFound = true;
                    console.log(`✅ Órdenes encontradas con selector: ${selector}`);
                    break;
                } catch (e) {
                    continue;
                }
            }

            if (!ordersFound) {
                console.log('⚠️ No se encontraron órdenes con los selectores esperados');
                return [];
            }

            // Extraer información de órdenes
            const orders = await this.page.evaluate((options, selectors) => {
                const results = [];
                
                for (const selector of selectors) {
                    const orderElements = document.querySelectorAll(selector);
                    
                    if (orderElements.length > 0) {
                        orderElements.forEach((element, index) => {
                            try {
                                const getElementText = (selectors) => {
                                    for (const sel of selectors) {
                                        const el = element.querySelector(sel);
                                        if (el) return el.textContent.trim();
                                    }
                                    return null;
                                };

                                const orderNumber = getElementText(['.order-number', '.purchase-number', '.order-id']);
                                const date = getElementText(['.order-date', '.purchase-date', '.date']);
                                const status = getElementText(['.order-status', '.purchase-status', '.status']);
                                const total = getElementText(['.order-total', '.purchase-total', '.total', '.amount']);

                                const order = {
                                    id: index + 1,
                                    orderNumber: orderNumber || `ORDER-${index + 1}`,
                                    date: date || 'Sin fecha',
                                    status: status || 'Sin estado',
                                    total: total || 'Sin total',
                                    scraped_at: new Date().toISOString(),
                                    selector_used: selector
                                };

                                results.push(order);
                            } catch (error) {
                                console.error('Error procesando orden:', error);
                            }
                        });
                        
                        if (results.length > 0) {
                            break; // Salir del loop si encontramos órdenes
                        }
                    }
                }

                return results.slice(0, options.limit || 50);
            }, options, orderSelectors);

            console.log(`✅ Encontradas ${orders.length} órdenes`);
            return orders;

        } catch (error) {
            console.error('❌ Error obteniendo órdenes:', error.message);
            throw error;
        }
    }

    /**
     * Tomar screenshot de la página actual
     * @param {string} filename - Nombre del archivo (opcional)
     * @returns {Promise<string>} - Path del screenshot
     */
    async takeScreenshot(filename = null) {
        if (!this.page) {
            throw new Error('Página no disponible');
        }

        try {
            const screenshotPath = filename || `ripley_screenshot_${Date.now()}.png`;
            await this.page.screenshot({ 
                path: screenshotPath, 
                fullPage: true 
            });
            
            console.log(`📸 Screenshot guardado: ${screenshotPath}`);
            return screenshotPath;

        } catch (error) {
            console.error('❌ Error tomando screenshot:', error.message);
            throw error;
        }
    }

    /**
     * Verificar estado de la sesión
     * @returns {Promise<boolean>} - True si la sesión está activa
     */
    async checkSessionStatus() {
        if (!this.page) {
            return false;
        }

        try {
            const isActive = await verifyLogin(this.page);
            this.isLoggedIn = isActive;
            return isActive;
        } catch (error) {
            console.error('❌ Error verificando sesión:', error.message);
            this.isLoggedIn = false;
            return false;
        }
    }

    /**
     * Cerrar el scraper y limpiar recursos
     * @returns {Promise<void>}
     */
    async close() {
        try {
            console.log('🔄 Cerrando Ripley Scraper...');

            // Limpiar timeout de sesión
            if (this.sessionTimeout) {
                clearInterval(this.sessionTimeout);
                this.sessionTimeout = null;
            }

            // Cerrar sesión si está logueado
            if (this.page && this.isLoggedIn) {
                await logoutRipley(this.page);
            }

            // Cerrar contexto
            if (this.context) {
                await this.context.close();
                this.context = null;
            }

            // Cerrar browser
            if (this.browser) {
                await this.browser.close();
                this.browser = null;
            }

            this.page = null;
            this.isLoggedIn = false;
            console.log('✅ Ripley Scraper cerrado correctamente');

        } catch (error) {
            console.error('❌ Error cerrando scraper:', error.message);
        }
    }
}

/**
 * Función de conveniencia para uso rápido
 * @param {string} action - Acción a realizar ('search', 'product', 'orders')
 * @param {*} params - Parámetros específicos de la acción
 * @param {Object} options - Opciones generales
 * @returns {Promise<*>} - Resultado de la acción
 */
async function quickScrape(action, params, options = {}) {
    const scraper = new RipleyScraper();
    
    try {
        const initialized = await scraper.initialize(options);
        if (!initialized) {
            throw new Error('No se pudo inicializar el scraper');
        }

        let result;
        switch (action) {
            case 'search':
                result = await scraper.searchProducts(params, options);
                break;
            case 'product':
                result = await scraper.getProductDetails(params);
                break;
            case 'orders':
                result = await scraper.getOrders(options);
                break;
            default:
                throw new Error(`Acción no reconocida: ${action}`);
        }

        return result;

    } finally {
        await scraper.close();
    }
}

module.exports = {
    RipleyScraper,
    quickScrape
};