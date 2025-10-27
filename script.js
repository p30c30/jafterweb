// Función de debug para verificar elementos
function debugElements() {
    console.log('=== DEBUG ELEMENTOS ===');
    console.log('1. secciones-container:', document.getElementById('secciones-container'));
    console.log('2. home-view:', document.getElementById('home-view'));
    console.log('3. section-cards:', document.getElementById('section-cards'));
    console.log('4. Body content:', document.body.innerHTML.substring(0, 500) + '...');
    console.log('=======================');
}

// Cargar y mostrar las secciones
async function cargarSecciones() {
    try {
        console.log('🔍 INICIANDO CARGA DE SECCIONES...');
        debugElements();
        
        // Esperar un poco más para asegurar que el DOM esté listo
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Buscar el contenedor de múltiples formas
        let container = document.getElementById('secciones-container');
        
        if (!container) {
            console.log('🔄 Buscando alternativas...');
            container = document.querySelector('.section-cards');
        }
        
        if (!container) {
            console.log('🔄 Buscando en home-view...');
            const homeView = document.getElementById('home-view');
            if (homeView) {
                container = homeView.querySelector('#secciones-container') || 
                           homeView.querySelector('.section-cards');
            }
        }
        
        console.log('📦 CONTENEDOR FINAL:', container);
        
        if (!container) {
            console.error('❌ CRÍTICO: No se encontró ningún contenedor');
            debugElements();
            return;
        }
        
        console.log('✅ Contenedor encontrado, cargando data.json...');
        const response = await fetch('data.json');
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ Datos cargados, secciones:', data.secciones?.length);
        
        // LIMPIAR CONTENEDOR - ESTA ES LA LÍNEA QUE FALLA
        container.innerHTML = '';
        console.log('✅ Contenedor limpiado');
        
        if (!data.secciones || data.secciones.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #ff6b6b; padding: 2rem;">No hay secciones disponibles.</p>';
            return;
        }
        
        // Crear tarjetas
        console.log('🎨 Creando tarjetas...');
        data.secciones.forEach(seccion => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <img src="${seccion.preview}" alt="${seccion.titulo}" class="card-image" 
                     onerror="this.src='https://via.placeholder.com/400x300/333/fff?text=Imagen+no+disponible'">
                <div class="card-content">
                    <h3>${seccion.titulo}</h3>
                    <p>${seccion.descripcion}</p>
                </div>
            `;
            card.addEventListener('click', () => {
                console.log('🔄 Navegando a sección:', seccion.id);
                window.location.hash = `seccion/${seccion.id}`;
            });
            container.appendChild(card);
        });
        
        console.log('🎉 SECCIONES CARGADAS CORRECTAMENTE');
        
    } catch (error) {
        console.error('❌ ERROR CRÍTICO cargando secciones:', error);
        debugElements();
    }
}

// Cargar sección desde hash
function cargarSeccionDesdeHash() {
    const hash = window.location.hash;
    console.log('🔗 Hash actual:', hash);
    
    if (!hash || !hash.startsWith('#seccion/')) {
        mostrarVistaPrincipal();
        return;
    }
    
    const seccionId = hash.replace('#seccion/', '');
    console.log('🔍 Cargando sección:', seccionId);
    
    fetch('data.json')
        .then(response => {
            if (!response.ok) throw new Error('Error cargando datos');
            return response.json();
        })
        .then(data => {
            const seccion = data.secciones.find(s => s.id === seccionId);
            if (!seccion) {
                console.error('❌ Sección no encontrada:', seccionId);
                mostrarVistaPrincipal();
                return;
            }
            
            mostrarVistaSeccion(seccion);
        })
        .catch(error => {
            console.error('Error cargando la sección:', error);
            mostrarVistaPrincipal();
        });
}

// Mostrar vista de sección
function mostrarVistaSeccion(seccion) {
    console.log('🖼️ Mostrando sección:', seccion.titulo);
    document.title = `${seccion.titulo} - JAfterPic`;
    
    // Ocultar elementos principales
    const homeView = document.getElementById('home-view');
    if (homeView) homeView.style.display = 'none';
    
    // Crear o mostrar vista de sección
    let seccionView = document.getElementById('seccion-view');
    if (!seccionView) {
        seccionView = document.createElement('div');
        seccionView.id = 'seccion-view';
        seccionView.className = 'seccion-view';
        document.body.appendChild(seccionView);
    }
    
    seccionView.innerHTML = `
        <header class="seccion-header">
            <button onclick="mostrarVistaPrincipal()" class="back-button">← Volver a Galería</button>
            <h1>${seccion.titulo}</h1>
            <p>${seccion.descripcion}</p>
        </header>
        <div class="fotos-grid" id="fotos-container"></div>
    `;
    
    seccionView.style.display = 'block';
    
    // Cargar fotos
    const container = document.getElementById('fotos-container');
    if (container) {
        container.innerHTML = '';
        
        seccion.fotos.forEach(foto => {
            const fotoElement = document.createElement('div');
            fotoElement.className = 'foto-item';
            fotoElement.innerHTML = `
                <img src="${foto.miniatura}" alt="${foto.texto}" class="foto-miniatura"
                     onerror="this.src='https://via.placeholder.com/300x200/333/fff?text=Imagen+no+disponible'">
                <p class="foto-texto">${foto.texto}</p>
            `;
            fotoElement.addEventListener('click', () => {
                window.open(foto.url, '_blank');
            });
            container.appendChild(fotoElement);
        });
    }
}

// Mostrar vista principal
function mostrarVistaPrincipal() {
    console.log('🏠 Mostrando vista principal');
    window.location.hash = '';
    document.title = 'Galería Jafter - Fotografía Inspiradora';
    
    // Mostrar elementos principales
    const homeView = document.getElementById('home-view');
    if (homeView) homeView.style.display = 'block';
    
    // Ocultar vista de sección
    const seccionView = document.getElementById('seccion-view');
    if (seccionView) seccionView.style.display = 'none';
    
    // Recargar secciones
    setTimeout(cargarSecciones, 100);
}

// INICIALIZACIÓN PRINCIPAL
function inicializarApp() {
    console.log('🚀 INICIALIZANDO APLICACIÓN...');
    debugElements();
    
    // Logo click
    const logo = document.getElementById('logoHome');
    if (logo) {
        logo.addEventListener('click', mostrarVistaPrincipal);
    }
    
    // Esperar a que todo esté listo
    setTimeout(() => {
        console.log('⏰ Ejecutando después de delay...');
        if (window.location.hash && window.location.hash.startsWith('#seccion/')) {
            console.log('🔗 Hash detectado al cargar');
            cargarSeccionDesdeHash();
        } else {
            console.log('📄 Cargando vista principal');
            cargarSecciones();
        }
    }, 300);
}

// Manejar cambios en el hash
window.addEventListener('hashchange', function() {
    console.log('🔗 Hash cambiado:', window.location.hash);
    if (window.location.hash && window.location.hash.startsWith('#seccion/')) {
        cargarSeccionDesdeHash();
    } else {
        mostrarVistaPrincipal();
    }
});

// EJECUCIÓN PRINCIPAL - MÚLTIPLES ESTRATEGIAS
console.log('📄 Script.js cargado, esperando DOM...');

// Estrategia 1: DOMContentLoaded
document.addEventListener('DOMContentLoaded', inicializarApp);

// Estrategia 2: Si ya está cargado
if (document.readyState === 'interactive' || document.readyState === 'complete') {
    console.log('⚡ DOM ya está listo, ejecutando inmediatamente');
    setTimeout(inicializarApp, 100);
}

// Estrategia 3: Como último recurso
window.addEventListener('load', function() {
    console.log('📦 Window loaded, verificando si ya se inicializó...');
    setTimeout(inicializarApp, 500);
});
