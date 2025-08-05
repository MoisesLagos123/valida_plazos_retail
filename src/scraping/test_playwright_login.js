const { chromium } = require('playwright');
require('dotenv').config();

/**
 * Configuración para Ripley.cl usando Playwright
 */
const RIPLEY_CONFIG = {
    baseUrl: process.env.RIPLEY_BASE_URL || 'https://simple.ripley.cl',
    loginUrl: process.env.RIPLEY_LOGIN_URL || 'https://simple.ripley.cl/cuenta/iniciar-sesion',
    username: process.env.RIPLEY_USERNAME,
    password: process.env.RIPLEY_PASSWORD,
    waitTime: parseInt(process.env.RIPLEY_WAIT_TIME) || 3000,
    maxRetries: parseInt(process.env.RIPLEY_MAX_RETRIES) || 3,
    userAgent: process.env.RIPLEY_USER_AGENT || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};

/**
 * Función para realizar login en Ripley.cl con Playwright
 * @param {Object} options - Opciones de configuración
 * @returns {Promise<Object>} - Resultado del login
 */
async function testLoginPlaywright(options = {}) {
    let browser = null;
    let context = null;
    let page = null;

    try {
        console.log('🚀 Iniciando prueba de login con Playwright...');

        // Validar credenciales
        if (!RIPLEY_CONFIG.username || !RIPLEY_CONFIG.password) {
            throw new Error('Credenciales no configuradas. Verifica RIPLEY_USERNAME y RIPLEY_PASSWORD en .env');
        }

        // Configuración del browser con anti-detección
        browser = await chromium.launch({
            headless: options.headless !== undefined ? options.headless : false,
            args: [
                '--disable-blink-features=AutomationControlled',
                '--disable-features=VizDisplayCompositor',
                '--disable-ipc-flooding-protection',
                '--disable-renderer-backgrounding',
                '--disable-backgrounding-occluded-windows',
                '--disable-background-timer-throttling'
            ]
        });

        // Crear contexto con configuración anti-detección
        context = await browser.newContext({
            userAgent: RIPLEY_CONFIG.userAgent,
            viewport: { width: 1366, height: 768 },
            locale: 'es-CL',
            acceptDownloads: false,
            ignoreHTTPSErrors: true,
            extraHTTPHeaders: {
                'Accept-Language': 'es-CL,es;q=0.9,en;q=0.8',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            }
        });

        // Crear página
        page = await context.newPage();

        // Remover propiedades de automatización
        await page.addInitScript(() => {
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
        });

        console.log('🌐 Navegando a la página de login...');

        // Navegar a la página de login
        const response = await page.goto(RIPLEY_CONFIG.loginUrl, { 
            waitUntil: 'networkidle',
            timeout: 30000 
        });

        console.log(`📄 Respuesta HTTP: ${response.status()}`);

        // Verificar si Cloudflare está bloqueando
        const title = await page.title();
        console.log(`📝 Título de la página: ${title}`);

        if (title.includes('Just a moment') || title.includes('Cloudflare')) {
            console.log('⚠️ Cloudflare detectado, esperando...');
            await page.waitForTimeout(5000);
        }

        // Tomar screenshot para debug
        await page.screenshot({ 
            path: 'debug_login_page.png', 
            fullPage: true 
        });
        console.log('📸 Screenshot guardado: debug_login_page.png');

        // Buscar campos de login con múltiples selectores
        console.log('🔍 Buscando campos de login...');

        const emailSelectors = [
            'input[type="email"]',
            'input[name="email"]',
            'input[name="username"]',
            'input[placeholder*="correo"]',
            'input[placeholder*="email"]',
            '#email',
            '#username',
            '.email-input',
            '.username-input'
        ];

        const passwordSelectors = [
            'input[type="password"]',
            'input[name="password"]',
            'input[placeholder*="contraseña"]',
            'input[placeholder*="password"]',
            '#password',
            '.password-input'
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
                    className: input.className,
                    outerHTML: input.outerHTML.substring(0, 200)
                }))
            );
            
            console.log('📋 Inputs encontrados:', JSON.stringify(allInputs, null, 2));

            if (!emailField) {
                throw new Error('Campo de email no encontrado');
            }
            if (!passwordField) {
                throw new Error('Campo de contraseña no encontrado');
            }
        }

        // Simular comportamiento humano antes de llenar
        console.log('🤖 Simulando comportamiento humano...');
        await page.mouse.move(100, 100);
        await page.waitForTimeout(500 + Math.random() * 1000);
        await page.mouse.move(300, 400, { steps: 10 });
        await page.waitForTimeout(300 + Math.random() * 500);

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
        console.log('🚀 Buscando botón de login...');
        
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
            // Intentar con Enter
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
            // Continuar incluso si no hay navegación
            console.log('⚠️ Sin navegación detectada, verificando manualmente...');
        }

        // Tomar screenshot después del login
        await page.screenshot({ 
            path: 'debug_after_login.png', 
            fullPage: true 
        });
        console.log('📸 Screenshot post-login guardado: debug_after_login.png');

        // Verificar si el login fue exitoso
        const currentUrl = page.url();
        console.log('🔍 URL actual:', currentUrl);

        const pageContent = await page.textContent('body');
        const hasLoginError = pageContent.includes('credenciales') || 
                             pageContent.includes('error') || 
                             pageContent.includes('incorrecto') ||
                             currentUrl.includes('login') ||
                             currentUrl.includes('iniciar-sesion');

        const isLoginSuccessful = !hasLoginError && !currentUrl.includes('login');

        // Buscar indicadores de éxito
        const successIndicators = [
            '.user-menu',
            '.account-menu', 
            '.mi-cuenta',
            'a[href*="mi-cuenta"]',
            '.user-profile',
            '.logout',
            '.cerrar-sesion'
        ];

        let foundSuccessIndicator = false;
        for (const indicator of successIndicators) {
            try {
                await page.waitForSelector(indicator, { timeout: 3000 });
                foundSuccessIndicator = true;
                console.log(`✅ Indicador de éxito encontrado: ${indicator}`);
                break;
            } catch (e) {
                continue;
            }
        }

        const loginSuccess = isLoginSuccessful || foundSuccessIndicator;

        if (loginSuccess) {
            console.log('🎉 ¡Login exitoso con Playwright!');
            return {
                success: true,
                method: 'playwright',
                page: page,
                context: context,
                browser: browser,
                url: currentUrl,
                message: 'Login exitoso'
            };
        } else {
            console.log('❌ Login falló o no se pudo verificar');
            return {
                success: false,
                method: 'playwright',
                error: 'Login falló o no se pudo verificar',
                url: currentUrl,
                hasError: hasLoginError
            };
        }

    } catch (error) {
        console.error('❌ Error durante la prueba de login:', error.message);
        
        if (page) {
            await page.screenshot({ 
                path: 'debug_error_playwright.png', 
                fullPage: true 
            });
            console.log('📸 Screenshot de error guardado: debug_error_playwright.png');
        }

        return {
            success: false,
            method: 'playwright',
            error: error.message,
            page: null,
            context: null,
            browser: null
        };
    }
}

/**
 * Función de limpieza
 */
async function cleanup(result) {
    try {
        if (result.page) await result.page.close();
        if (result.context) await result.context.close();
        if (result.browser) await result.browser.close();
        console.log('🧹 Recursos limpiados');
    } catch (error) {
        console.error('Error en limpieza:', error.message);
    }
}

/**
 * Función principal para ejecutar la prueba
 */
async function main() {
    console.log('🧪 Iniciando prueba de login con Playwright...\n');

    const result = await testLoginPlaywright({ headless: false });
    
    console.log('\n📊 Resultado de la prueba:');
    console.log(`✅ Éxito: ${result.success}`);
    console.log(`🔧 Método: ${result.method}`);
    
    if (result.success) {
        console.log(`🌐 URL final: ${result.url}`);
        console.log('🎯 El login con Playwright funciona correctamente');
        
        // Esperar un poco para ver el resultado
        if (result.page) {
            console.log('\n⏳ Esperando 10 segundos para observar el resultado...');
            await new Promise(resolve => setTimeout(resolve, 10000));
        }
    } else {
        console.log(`❌ Error: ${result.error}`);
        console.log('🔍 Revisa los screenshots debug_*.png para más información');
    }

    await cleanup(result);
    
    return result;
}

// Ejecutar solo si el archivo se ejecuta directamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    testLoginPlaywright,
    cleanup,
    RIPLEY_CONFIG
};