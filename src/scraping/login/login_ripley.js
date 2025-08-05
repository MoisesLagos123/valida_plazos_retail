const puppeteer = require('puppeteer');
require('dotenv').config();

/**
 * Configuración para Ripley.cl
 */
const RIPLEY_CONFIG = {
    baseUrl: process.env.RIPLEY_BASE_URL || 'https://simple.ripley.cl',
    loginUrl: process.env.RIPLEY_LOGIN_URL || 'https://simple.ripley.cl/cuenta/iniciar-sesion',
    username: process.env.RIPLEY_USERNAME,
    password: process.env.RIPLEY_PASSWORD,
    waitTime: parseInt(process.env.RIPLEY_WAIT_TIME) || 3000,
    maxRetries: parseInt(process.env.RIPLEY_MAX_RETRIES) || 3,
    sessionTimeout: parseInt(process.env.RIPLEY_SESSION_TIMEOUT) || 300000,
    userAgent: process.env.RIPLEY_USER_AGENT || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    acceptLanguage: process.env.RIPLEY_ACCEPT_LANGUAGE || 'es-CL,es;q=0.9,en;q=0.8'
};

/**
 * Función para realizar login en Ripley.cl
 * @param {Object} browser - Instancia de Puppeteer browser
 * @returns {Promise<Object>} - Resultado del login con page y status
 */
async function loginRipley(browser = null) {
    let page;
    let shouldCloseBrowser = false;
    
    try {
        // Validar credenciales
        if (!RIPLEY_CONFIG.username || !RIPLEY_CONFIG.password) {
            throw new Error('Credenciales de Ripley no configuradas. Verifica las variables RIPLEY_USERNAME y RIPLEY_PASSWORD en .env');
        }

        // Crear browser si no se proporciona
        if (!browser) {
            browser = await puppeteer.launch({
                headless: false, // Cambiar a true para producción
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu'
                ]
            });
            shouldCloseBrowser = true;
        }

        page = await browser.newPage();

        // Configurar user agent y headers
        await page.setUserAgent(RIPLEY_CONFIG.userAgent);
        await page.setExtraHTTPHeaders({
            'Accept-Language': RIPLEY_CONFIG.acceptLanguage
        });

        // Configurar viewport
        await page.setViewport({ width: 1366, height: 768 });

        console.log('🚀 Iniciando login en Ripley.cl...');

        // Navegar a la página de login
        await page.goto(RIPLEY_CONFIG.loginUrl, { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });

        console.log('📄 Página de login cargada');

        // Esperar a que aparezcan los campos de login
        await page.waitForSelector('input[type="email"], input[name="email"], #email', { timeout: 10000 });
        await page.waitForSelector('input[type="password"], input[name="password"], #password', { timeout: 10000 });

        console.log('🔍 Campos de login encontrados');

        // Llenar el campo de email/usuario
        const emailSelector = await page.$('input[type="email"], input[name="email"], #email');
        if (emailSelector) {
            await emailSelector.click();
            await page.keyboard.type(RIPLEY_CONFIG.username, { delay: 100 });
            console.log('✅ Email ingresado');
        }

        // Esperar un momento
        await page.waitForTimeout(1000);

        // Llenar el campo de contraseña
        const passwordSelector = await page.$('input[type="password"], input[name="password"], #password');
        if (passwordSelector) {
            await passwordSelector.click();
            await page.keyboard.type(RIPLEY_CONFIG.password, { delay: 100 });
            console.log('✅ Contraseña ingresada');
        }

        // Esperar un momento antes de hacer clic en el botón
        await page.waitForTimeout(1000);

        // Buscar y hacer clic en el botón de login
        const loginButton = await page.$('button[type="submit"], input[type="submit"], .btn-login, [data-testid="login-button"]');
        if (loginButton) {
            await loginButton.click();
            console.log('🔐 Botón de login presionado');
        } else {
            // Intentar con otros selectores comunes
            await page.keyboard.press('Enter');
            console.log('🔐 Enter presionado para login');
        }

        // Esperar a que la página se redirija o muestre error
        try {
            await page.waitForNavigation({ 
                waitUntil: 'networkidle2', 
                timeout: 15000 
            });
        } catch (error) {
            console.log('⏳ Esperando cambios en la página...');
            await page.waitForTimeout(RIPLEY_CONFIG.waitTime);
        }

        // Verificar si el login fue exitoso
        const isLoggedIn = await verifyLogin(page);
        
        if (isLoggedIn) {
            console.log('✅ Login exitoso en Ripley.cl');
            return {
                success: true,
                page: page,
                browser: shouldCloseBrowser ? browser : null,
                message: 'Login exitoso'
            };
        } else {
            throw new Error('Login fallido: No se pudo verificar la autenticación');
        }

    } catch (error) {
        console.error('❌ Error durante el login en Ripley:', error.message);
        
        if (page) {
            await page.close();
        }
        
        if (shouldCloseBrowser && browser) {
            await browser.close();
        }

        return {
            success: false,
            error: error.message,
            page: null,
            browser: null
        };
    }
}

/**
 * Verificar si el login fue exitoso
 * @param {Object} page - Página de Puppeteer
 * @returns {Promise<boolean>} - True si está logueado
 */
async function verifyLogin(page) {
    try {
        // Verificar URL actual
        const currentUrl = page.url();
        console.log('🔍 URL actual:', currentUrl);

        // Buscar indicadores de login exitoso
        const loginIndicators = [
            '.user-menu', 
            '.account-menu',
            '[data-testid="user-menu"]',
            '.mi-cuenta',
            '.user-profile',
            'a[href*="mi-cuenta"]'
        ];

        // Verificar si algún indicador está presente
        for (const selector of loginIndicators) {
            try {
                await page.waitForSelector(selector, { timeout: 3000 });
                console.log('✅ Indicador de login encontrado:', selector);
                return true;
            } catch (e) {
                // Continuar con el siguiente selector
            }
        }

        // Verificar si ya no estamos en la página de login
        if (!currentUrl.includes('iniciar-sesion') && !currentUrl.includes('login')) {
            console.log('✅ Redirigido fuera de la página de login');
            return true;
        }

        // Verificar si hay mensajes de error
        const errorSelectors = ['.error', '.alert-danger', '.login-error', '[data-testid="error"]'];
        for (const selector of errorSelectors) {
            try {
                const errorElement = await page.$(selector);
                if (errorElement) {
                    const errorText = await page.evaluate(el => el.textContent, errorElement);
                    console.log('❌ Error de login detectado:', errorText);
                    return false;
                }
            } catch (e) {
                // Continuar
            }
        }

        return false;

    } catch (error) {
        console.error('❌ Error verificando login:', error.message);
        return false;
    }
}

/**
 * Cerrar sesión en Ripley
 * @param {Object} page - Página de Puppeteer
 * @returns {Promise<boolean>} - True si el logout fue exitoso
 */
async function logoutRipley(page) {
    try {
        console.log('🚪 Cerrando sesión en Ripley...');

        // Buscar y hacer clic en el botón de logout
        const logoutSelectors = [
            'a[href*="cerrar-sesion"]',
            '.logout',
            '[data-testid="logout"]',
            '.salir'
        ];

        for (const selector of logoutSelectors) {
            try {
                const logoutButton = await page.$(selector);
                if (logoutButton) {
                    await logoutButton.click();
                    await page.waitForTimeout(2000);
                    console.log('✅ Logout exitoso');
                    return true;
                }
            } catch (e) {
                // Continuar con el siguiente selector
            }
        }

        return false;

    } catch (error) {
        console.error('❌ Error durante logout:', error.message);
        return false;
    }
}

/**
 * Mantener la sesión activa
 * @param {Object} page - Página de Puppeteer
 * @returns {Promise<boolean>} - True si la sesión está activa
 */
async function keepSessionAlive(page) {
    try {
        // Hacer una acción mínima para mantener la sesión
        await page.evaluate(() => {
            // Scroll pequeño para simular actividad
            window.scrollBy(0, 10);
            window.scrollBy(0, -10);
        });
        
        return await verifyLogin(page);
    } catch (error) {
        console.error('❌ Error manteniendo sesión:', error.message);
        return false;
    }
}

module.exports = {
    loginRipley,
    verifyLogin,
    logoutRipley,
    keepSessionAlive,
    RIPLEY_CONFIG
};