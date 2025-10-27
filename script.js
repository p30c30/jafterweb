// Cargar y mostrar las secciones
async function cargarSecciones() {
    try {
        console.log('🔍 Buscando contenedor de secciones...');
        
        // Buscar el contenedor de múltiples formas
        let container = document.getElementById('section-cards');
        
        if (!container) {
            console.log('🔄 Contenedor no encontrado, buscando alternativas...');
            // Buscar por clase
            container = document.querySelector('.section-cards');
        }
        
        if (!container) {
            console.log('🔄 Buscando en home-view...');
            const homeView = document.getElementById('home-view');
            if (homeView) {
                container = homeView.querySelector('#section-cards') || homeView.querySelector('.section-cards');
            }
        }
        
        console.log('📦 Contenedor:', container);
        
        if (!container) {
            console.error('❌ No se pudo encontrar ningún contenedor para las secciones');
            // Crear un contenedor si no existe
            const homeView = document.getElementById('home-view');
            if (homeView) {
                container = document.createElement('div');
                container.id = 'section-cards';
                container.className = 'section-cards';
                homeView.appendChild(container);
                console.log('✅ Contenedor creado:', container);
            } else {
                return;
            }
        }
        
        const response = await fetch('data.json');
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ Datos cargados, secciones:', data.secciones?.length);
        
        // Limpiar contenedor
        container.innerHTML = '';
        
        if (!data.secciones || data.secciones.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #ff6b6b; padding: 2rem;">No hay secciones disponibles.</p>';
            return;
        }
        
        // Crear tarjetas
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
        
        console.log('🎉 Secciones cargadas correctamente');
        
    } catch (error) {
        console.error('❌ Error cargando secciones:', error);
        const container = document.getElementById('section-cards') || document.querySelector('.section-cards');
        if (container) {
            container.innerHTML = '<p style="text-align: center; color: #ff6b6b; padding: 2rem;">Error cargando las secciones. Por favor, recarga la página.</p>';
        }
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
    
    // Recargar secciones si es necesario
    cargarSecciones();
}

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM completamente cargado');
    
    // Logo click
    const logo = document.getElementById('logoHome');
    if (logo) {
        logo.addEventListener('click', mostrarVistaPrincipal);
    }
    
    // Pequeño delay para asegurar que todo esté listo
    setTimeout(() => {
        if (window.location.hash && window.location.hash.startsWith('#seccion/')) {
            console.log('🔗 Hash detectado al cargar');
            cargarSeccionDesdeHash();
        } else {
            console.log('📄 Cargando vista principal');
            cargarSecciones();
        }
    }, 100);
});

// Manejar cambios en el hash
window.addEventListener('hashchange', function() {
    console.log('🔗 Hash cambiado:', window.location.hash);
    if (window.location.hash && window.location.hash.startsWith('#seccion/')) {
        cargarSeccionDesdeHash();
    } else {
        mostrarVistaPrincipal();
    }
});
