const { RipleyScraper, quickScrape } = require('./scraping_ripley');

/**
 * Ejemplos de uso del sistema de scraping de Ripley
 */

// Ejemplo 1: Uso básico con quickScrape
async function ejemploBasico() {
    console.log('=== EJEMPLO BÁSICO ===');
    
    try {
        // Buscar productos rápidamente
        const productos = await quickScrape('search', 'notebook', { limit: 5 });
        console.log('Productos encontrados:', productos);
        
    } catch (error) {
        console.error('Error en ejemplo básico:', error.message);
    }
}

// Ejemplo 2: Uso avanzado con la clase RipleyScraper
async function ejemploAvanzado() {
    console.log('=== EJEMPLO AVANZADO ===');
    
    const scraper = new RipleyScraper();
    
    try {
        // Inicializar scraper
        const inicializado = await scraper.initialize({ headless: false });
        if (!inicializado) {
            throw new Error('No se pudo inicializar el scraper');
        }

        // Buscar productos
        console.log('1. Buscando productos...');
        const productos = await scraper.searchProducts('smartphone', { limit: 3 });
        console.log(`Encontrados ${productos.length} productos`);

        // Obtener detalles del primer producto si existe
        if (productos.length > 0 && productos[0].link) {
            console.log('2. Obteniendo detalles del primer producto...');
            const detalles = await scraper.getProductDetails(productos[0].link);
            console.log('Detalles del producto:', detalles);
        }

        // Obtener órdenes de compra
        console.log('3. Obteniendo órdenes de compra...');
        const ordenes = await scraper.getOrders({ limit: 5 });
        console.log(`Encontradas ${ordenes.length} órdenes`);

        // Tomar screenshot
        console.log('4. Tomando screenshot...');
        const screenshot = await scraper.takeScreenshot('ejemplo_ripley.png');
        console.log('Screenshot guardado:', screenshot);

    } catch (error) {
        console.error('Error en ejemplo avanzado:', error.message);
    } finally {
        // Siempre cerrar el scraper
        await scraper.close();
    }
}

// Ejemplo 3: Monitoreo de productos específicos
async function ejemploMonitoreo() {
    console.log('=== EJEMPLO MONITOREO ===');
    
    const scraper = new RipleyScraper();
    
    try {
        await scraper.initialize();

        // Lista de productos a monitorear
        const productosAMonitorear = [
            'iPhone 15',
            'Samsung Galaxy S24',
            'MacBook Pro'
        ];

        const resultados = [];

        for (const producto of productosAMonitorear) {
            console.log(`Monitoreando: ${producto}`);
            
            const productos = await scraper.searchProducts(producto, { limit: 3 });
            
            if (productos.length > 0) {
                const detalles = await scraper.getProductDetails(productos[0].link);
                
                resultados.push({
                    busqueda: producto,
                    encontrado: detalles.title,
                    precio: detalles.price,
                    disponibilidad: detalles.availability,
                    timestamp: new Date().toISOString()
                });
            }

            // Esperar entre búsquedas para no sobrecargar el servidor
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        console.log('Resultados del monitoreo:', resultados);

    } catch (error) {
        console.error('Error en monitoreo:', error.message);
    } finally {
        await scraper.close();
    }
}

// Ejemplo 4: Función para validar plazos de entrega
async function validarPlazosEntrega() {
    console.log('=== VALIDACIÓN DE PLAZOS ===');
    
    const scraper = new RipleyScraper();
    
    try {
        await scraper.initialize();

        // Obtener órdenes recientes
        const ordenes = await scraper.getOrders({ limit: 10 });
        
        const ordenesConPlazos = [];

        for (const orden of ordenes) {
            console.log(`Analizando orden: ${orden.orderNumber}`);
            
            // Aquí podrías agregar lógica específica para validar plazos
            // basándose en el estado de la orden y la fecha
            const fechaOrden = new Date(orden.date);
            const ahora = new Date();
            const diasTranscurridos = Math.floor((ahora - fechaOrden) / (1000 * 60 * 60 * 24));
            
            ordenesConPlazos.push({
                ...orden,
                diasTranscurridos,
                plazoExcedido: diasTranscurridos > 30, // Ejemplo: 30 días máximo
                urgencia: diasTranscurridos > 45 ? 'alta' : diasTranscurridos > 30 ? 'media' : 'baja'
            });
        }

        console.log('Análisis de plazos:', ordenesConPlazos);

        // Filtrar órdenes que exceden el plazo
        const ordenesExcedidas = ordenesConPlazos.filter(orden => orden.plazoExcedido);
        
        if (ordenesExcedidas.length > 0) {
            console.log(`⚠️ ALERTA: ${ordenesExcedidas.length} órdenes han excedido el plazo`);
            ordenesExcedidas.forEach(orden => {
                console.log(`- Orden ${orden.orderNumber}: ${orden.diasTranscurridos} días`);
            });
        } else {
            console.log('✅ Todas las órdenes están dentro del plazo');
        }

    } catch (error) {
        console.error('Error validando plazos:', error.message);
    } finally {
        await scraper.close();
    }
}

// Función principal para ejecutar ejemplos
async function main() {
    console.log('🚀 Iniciando ejemplos de Ripley Scraper\n');

    // Ejecutar ejemplos uno por uno
    // Descomenta el que quieras probar:

    // await ejemploBasico();
    // await ejemploAvanzado();
    // await ejemploMonitoreo();
    await validarPlazosEntrega();

    console.log('\n✅ Ejemplos completados');
}

// Manejo de errores globales
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

// Ejecutar solo si el archivo se ejecuta directamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    ejemploBasico,
    ejemploAvanzado,
    ejemploMonitoreo,
    validarPlazosEntrega
};