// Cargar y mostrar las secciones
async function cargarSecciones() {
    try {
        console.log('🔍 Cargando secciones...');
        const response = await fetch('data.json');
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ Datos cargados:', data);
        
        const container = document.getElementById('secciones-container');
        if (!container) {
            console.error('❌ No se encontró el contenedor de secciones');
            return;
        }
        
        container.innerHTML = '';
        
        if (!data.secciones || data.secciones.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #ff6b6b; padding: 2rem;">No hay secciones disponibles.</p>';
            return;
        }
        
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
                // Usar hash routing en lugar de seccion.html
                window.location.hash = `seccion/${seccion.id}`;
                cargarSeccionDesdeHash();
            });
            container.appendChild(card);
        });
        
        console.log('🎉 Secciones cargadas correctamente');
    } catch (error) {
        console.error('❌ Error cargando secciones:', error);
        const container = document.getElementById('secciones-container');
        if (container) {
            container.innerHTML = '<p style="text-align: center; color: #ff6b6b; padding: 2rem;">Error cargando las secciones. Por favor, recarga la página.</p>';
        }
    }
}

// Cargar sección desde hash
function cargarSeccionDesdeHash() {
    const hash = window.location.hash;
    if (!hash || !hash.startsWith('#seccion/')) {
        mostrarVistaPrincipal();
        return;
    }
    
    const seccionId = hash.replace('#seccion/', '');
    console.log('🔍 Cargando sección desde hash:', seccionId);
    
    fetch('data.json')
        .then(response => {
            if (!response.ok) throw new Error('Error cargando datos');
            return response.json();
        })
        .then(data => {
            const seccion = data.secciones.find(s => s.id === seccionId);
            if (!seccion) {
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
    document.title = `${seccion.titulo} - JAfterPic`;
    
    // Ocultar vista principal
    const homeView = document.getElementById('home-view');
    const gallerySections = document.getElementById('gallery-sections');
    
    if (homeView) homeView.style.display = 'none';
    
    // Crear o mostrar vista de sección
    let seccionView = document.getElementById('seccion-view');
    if (!seccionView) {
        seccionView = document.createElement('div');
        seccionView.id = 'seccion-view';
        seccionView.className = 'seccion-view';
        document.getElementById('content').appendChild(seccionView);
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

// Mostrar vista principal
function mostrarVistaPrincipal() {
    window.location.hash = '';
    document.title = 'Galería Jafter - Fotografía Inspiradora';
    
    const homeView = document.getElementById('home-view');
    const seccionView = document.getElementById('seccion-view');
    
    if (homeView) homeView.style.display = 'block';
    if (seccionView) seccionView.style.display = 'none';
}

// Logo click para ir al inicio
document.addEventListener('DOMContentLoaded', function() {
    const logo = document.getElementById('logoHome');
    if (logo) {
        logo.addEventListener('click', function() {
            mostrarVistaPrincipal();
        });
    }
    
    // Verificar hash al cargar
    cargarSeccionDesdeHash();
    
    // También cargar secciones para la vista principal
    if (!window.location.hash || !window.location.hash.startsWith('#seccion/')) {
        cargarSecciones();
    }
});
