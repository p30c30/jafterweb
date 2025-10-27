// Versión ultra-simple y robusta
function inicializarAplicacion() {
    console.log('🚀 INICIANDO APLICACIÓN...');
    
    // Esperar a que todo esté definitivamente listo
    setTimeout(() => {
        console.log('⏰ Ejecutando después de espera...');
        cargarSecciones();
    }, 500);
}

async function cargarSecciones() {
    try {
        console.log('🔍 Buscando secciones-container...');
        
        // Buscar el contenedor
        const container = document.getElementById('secciones-container');
        console.log('Contenedor:', container);
        
        if (!container) {
            console.error('❌ Contenedor no encontrado');
            // Intentar nuevamente en 1 segundo
            setTimeout(cargarSecciones, 1000);
            return;
        }
        
        console.log('✅ Contenedor encontrado, cargando datos...');
        
        const response = await fetch('data.json');
        const data = await response.json();
        
        console.log('📊 Secciones encontradas:', data.secciones.length);
        
        // Limpiar y crear contenido
        container.innerHTML = '';
        
        data.secciones.forEach(seccion => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <img src="${seccion.preview}" alt="${seccion.titulo}" class="card-image">
                <div class="card-content">
                    <h3>${seccion.titulo}</h3>
                    <p>${seccion.descripcion}</p>
                </div>
            `;
            card.addEventListener('click', () => {
                window.location.hash = `seccion/${seccion.id}`;
                cargarSeccionDesdeHash();
            });
            container.appendChild(card);
        });
        
        console.log('🎉 Secciones cargadas correctamente');
        
    } catch (error) {
        console.error('Error:', error);
    }
}

function cargarSeccionDesdeHash() {
    const hash = window.location.hash;
    if (!hash.startsWith('#seccion/')) return;
    
    const seccionId = hash.replace('#seccion/', '');
    
    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            const seccion = data.secciones.find(s => s.id === seccionId);
            if (seccion) mostrarVistaSeccion(seccion);
        });
}

function mostrarVistaSeccion(seccion) {
    // Ocultar home
    const homeView = document.getElementById('home-view');
    if (homeView) homeView.style.display = 'none';
    
    // Mostrar sección
    let seccionView = document.getElementById('seccion-view');
    if (!seccionView) {
        seccionView = document.createElement('div');
        seccionView.id = 'seccion-view';
        document.body.appendChild(seccionView);
    }
    
    seccionView.innerHTML = `
        <header style="text-align: center; padding: 2rem; background: rgba(0,0,0,0.7);">
            <button onclick="mostrarVistaPrincipal()" style="background: #FDB813; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">← Volver</button>
            <h1>${seccion.titulo}</h1>
            <p>${seccion.descripcion}</p>
        </header>
        <div class="fotos-grid" id="fotos-container"></div>
    `;
    
    // Cargar fotos
    const container = document.getElementById('fotos-container');
    container.innerHTML = '';
    
    seccion.fotos.forEach(foto => {
        const fotoElement = document.createElement('div');
        fotoElement.className = 'foto-item';
        fotoElement.innerHTML = `
            <img src="${foto.miniatura}" alt="${foto.texto}" class="foto-miniatura">
            <p>${foto.texto}</p>
        `;
        fotoElement.addEventListener('click', () => {
            window.open(foto.url, '_blank');
        });
        container.appendChild(fotoElement);
    });
}

function mostrarVistaPrincipal() {
    window.location.hash = '';
    
    const homeView = document.getElementById('home-view');
    if (homeView) homeView.style.display = 'block';
    
    const seccionView = document.getElementById('seccion-view');
    if (seccionView) seccionView.style.display = 'none';
}

// Logo click
document.addEventListener('DOMContentLoaded', function() {
    const logo = document.getElementById('logoHome');
    if (logo) {
        logo.addEventListener('click', mostrarVistaPrincipal);
    }
    
    // Inicializar
    inicializarAplicacion();
});

// Hash change
window.addEventListener('hashchange', function() {
    if (window.location.hash.startsWith('#seccion/')) {
        cargarSeccionDesdeHash();
    } else {
        mostrarVistaPrincipal();
    }
});
