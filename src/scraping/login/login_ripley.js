const { chromium } = require('playwright');
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
 * Configuración anti-detección para Playwright
 */
async function createStealthContext(browser) {
    const context = await browser.newContext({
        userAgent: RIPLEY_CONFIG.userAgent,
        viewport: { width: 1366, height: 768 },
        locale: 'es-CL',
        acceptDownloads: false,
        ignoreHTTPSErrors: true,
        extraHTTPHeaders: {
            'Accept-Language': RIPLEY_CONFIG.acceptLanguage,
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none'
        }
    });

    // Añadir scripts anti-detección
    await context.addInitScript(() => {
        // Remover webdriver property
        Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined
        });
        
        // Simular plugins del navegador
        Object.defineProperty(navigator, 'plugins', {
            get: () => [1, 2, 3, 4, 5]
        });
        
        // Simular idiomas
        Object.defineProperty(navigator, 'languages', {
            get: () => ['es-CL', 'es', 'en']
        });

        // Simular memoria del dispositivo
        Object.defineProperty(navigator, 'deviceMemory', {
            get: () => 8
        });

        // Simular hardware concurrency
        Object.defineProperty(navigator, 'hardwareConcurrency', {
            get: () => 4
        });
    });

    return context;
}

/**
 * Función para encontrar dinámicamente los campos de login
 * @param {Object} page - Página de Playwright
 * @returns {Promise<Object>} - Selectores encontrados
 */
async function findLoginFields(page) {
    const emailSelectors = [
        'input[type="email"]',
        'input[name="email"]',
        'input[name="username"]',
        'input[placeholder*="correo"]',
        'input[placeholder*="email"]',
        '#email',
        '#username',
        '.email-input',
        '.username-input',
        'input[data-testid*="email"]',
        'input[data-testid*="username"]'
    ];

    const passwordSelectors = [
        'input[type="password"]',
        'input[name="password"]',
        'input[placeholder*="contraseña"]',
        'input[placeholder*="password"]',
        '#password',
        '.password-input',
        'input[data-testid*="password"]'
    ];

    let emailField = null;
    let passwordField = null;

    // Buscar campo de email
    for (const selector of emailSelectors) {
        try {
            await page.waitForSelector(selector, { timeout: 2000 });
            emailField = selector;
            console.log(`✅ Campo de email encontrado: ${selector}`);
            break;
        } catch (e) {
            continue;
        }
    }

    // Buscar campo de contraseña
    for (const selector of passwordSelectors) {
        try {
            await page.waitForSelector(selector, { timeout: 2000 });
            passwordField = selector;
            console.log(`✅ Campo de contraseña encontrado: ${selector}`);
            break;
        } catch (e) {
            continue;
        }
    }

    // Debug: Mostrar todos los inputs si no se encuentran
    if (!emailField || !passwordField) {
        console.log('🔍 Analizando todos los campos de input disponibles...');
        
        const allInputs = await page.$$eval('input', inputs => 
            inputs.map(input => ({
                type: input.type,
                name: input.name,
                id: input.id,
                placeholder: input.placeholder,
                className: input.className
            }))
        );
        
        console.log('📋 Inputs encontrados:', JSON.stringify(allInputs, null, 2));
    }

    return { emailField, passwordField };
}

/**
 * Función para realizar login en Ripley.cl con Playwright
 * @param {Object} browser - Instancia de Playwright browser (opcional)
 * @returns {Promise<Object>} - Resultado del login con page y status
 */
async function loginRipley(browser = null) {
    let context;
    let page;
    let shouldCloseBrowser = false;
    
    try {
        // Validar credenciales
        if (!RIPLEY_CONFIG.username || !RIPLEY_CONFIG.password) {
            throw new Error('Credenciales de Ripley no configuradas. Verifica las variables RIPLEY_USERNAME y RIPLEY_PASSWORD en .env');
        }

        // Crear browser si no se proporciona
        if (!browser) {
            browser = await chromium.launch({
                headless: false, // Cambiar a true para producción
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
            });
            shouldCloseBrowser = true;
        }

        // Crear contexto con configuración anti-detección
        context = await createStealthContext(browser);
        page = await context.newPage();

        console.log('🚀 Iniciando login en Ripley.cl...');

        // Navegar a la página de login
        const response = await page.goto(RIPLEY_CONFIG.loginUrl, { 
            waitUntil: 'networkidle',
            timeout: 30000 
        });

        console.log(`📄 Página de login cargada - Status: ${response.status()}`);

        // Verificar si Cloudflare está bloqueando
        const title = await page.title();
        console.log(`📝 Título de la página: ${title}`);

        if (title.includes('Just a moment') || title.includes('Cloudflare')) {
            console.log('⚠️ Cloudflare detectado, esperando...');
            await page.waitForTimeout(5000);
        }

        // Encontrar campos dinámicamente
        const { emailField, passwordField } = await findLoginFields(page);

        if (!emailField) {
            throw new Error('Campo de email no encontrado');
        }
        if (!passwordField) {
            throw new Error('Campo de contraseña no encontrado');
        }

        // Simular comportamiento humano
        console.log('🤖 Simulando comportamiento humano...');
        await page.mouse.move(100, 100);
        await page.waitForTimeout(500 + Math.random() * 1000);
        await page.mouse.move(300, 400, { steps: 10 });

        // Llenar campo de email
        console.log('📧 Llenando campo de email...');
        await page.click(emailField);
        await page.waitForTimeout(200);
        await page.fill(emailField, RIPLEY_CONFIG.username);
        
        // Esperar un momento
        await page.waitForTimeout(800 + Math.random() * 500);

        // Llenar campo de contraseña
        console.log('🔐 Llenando campo de contraseña...');
        await page.click(passwordField);
        await page.waitForTimeout(200);
        await page.fill(passwordField, RIPLEY_CONFIG.password);

        // Esperar antes de enviar
        await page.waitForTimeout(1000 + Math.random() * 1000);

        // Buscar y hacer clic en el botón de login
        const submitSelectors = [
            'button[type="submit"]',
            'input[type="submit"]',
            'button:has-text("Iniciar")',
            'button:has-text("Ingresar")',
            'button:has-text("Entrar")',
            '.btn-login',
            '.login-button',
            '.submit-button'
        ];

        let submitButton = null;
        for (const selector of submitSelectors) {
            try {
                await page.waitForSelector(selector, { timeout: 2000 });
                submitButton = selector;
                console.log(`✅ Botón de login encontrado: ${selector}`);
                break;
            } catch (e) {
                continue;
            }
        }

        if (submitButton) {
            await page.click(submitButton);
        } else {
            console.log('⌨️ Usando Enter para enviar formulario...');
            await page.press(passwordField, 'Enter');
        }

        console.log('⏳ Esperando respuesta del login...');

        // Esperar navegación o cambios en la página
        try {
            await Promise.race([
                page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 }),
                page.waitForTimeout(15000)
            ]);
        } catch (e) {
            console.log('⚠️ Sin navegación detectada, verificando manualmente...');
        }

        // Verificar si el login fue exitoso
        const isLoggedIn = await verifyLogin(page);
        
        if (isLoggedIn) {
            console.log('✅ Login exitoso en Ripley.cl');
            return {
                success: true,
                page: page,
                context: context,
                browser: shouldCloseBrowser ? browser : null,
                message: 'Login exitoso'
            };
        } else {
            throw new Error('Login fallido: No se pudo verificar la autenticación');
        }

    } catch (error) {
        console.error('❌ Error durante el login en Ripley:', error.message);
        
        if (page) {
            await page.screenshot({ 
                path: 'debug_login_error.png', 
                fullPage: true 
            });
            console.log('📸 Screenshot de error guardado: debug_login_error.png');
        }

        if (context) {
            await context.close();
        }
        
        if (shouldCloseBrowser && browser) {
            await browser.close();
        }

        return {
            success: false,
            error: error.message,
            page: null,
            context: null,
            browser: null
        };
    }
}

/**
 * Verificar si el login fue exitoso
 * @param {Object} page - Página de Playwright
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
            'a[href*="mi-cuenta"]',
            '.logout',
            '.cerrar-sesion'
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
        const pageContent = await page.textContent('body');
        const hasLoginError = pageContent.includes('credenciales') || 
                             pageContent.includes('error') || 
                             pageContent.includes('incorrecto');

        if (hasLoginError) {
            console.log('❌ Error de login detectado en el contenido');
            return false;
        }

        return false;

    } catch (error) {
        console.error('❌ Error verificando login:', error.message);
        return false;
    }
}

/**
 * Cerrar sesión en Ripley
 * @param {Object} page - Página de Playwright
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
            '.salir',
            'button:has-text("Cerrar sesión")',
            'a:has-text("Cerrar sesión")'
        ];

        for (const selector of logoutSelectors) {
            try {
                await page.click(selector);
                await page.waitForTimeout(2000);
                console.log('✅ Logout exitoso');
                return true;
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
 * @param {Object} page - Página de Playwright
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