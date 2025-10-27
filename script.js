// Función para esperar a que un elemento exista
function waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        
        function checkElement() {
            const element = document.getElementById(selector);
            if (element) {
                resolve(element);
            } else if (Date.now() - startTime >= timeout) {
                reject(new Error(`Elemento ${selector} no encontrado después de ${timeout}ms`));
            } else {
                setTimeout(checkElement, 100);
            }
        }
        
        checkElement();
    });
}

// Cargar y mostrar las secciones
async function cargarSecciones() {
    try {
        console.log('🔍 Cargando secciones...');
        
        // Esperar a que el contenedor exista
        let container = await waitForElement('section-cards');
        console.log('✅ Contenedor encontrado:', container);
        
        const response = await fetch('data.json');
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ Datos cargados:', data);
        
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
                window.location.hash = `seccion/${seccion.id}`;
            });
            container.appendChild(card);
        });
        
        console.log('🎉 Secciones cargadas correctamente');
    } catch (error) {
        console.error('❌ Error cargando secciones:', error);
        // Intentar encontrar el contenedor de otra forma
        const container = document.getElementById('section-cards');
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
    if (homeView) homeView.style.display = 'none';
    
    // Ocultar secciones
    const sectionCards = document.getElementById('section-cards');
    if (sectionCards) sectionCards.style.display = 'none';
    
    // Ocultar sección inspiradora
    const inspirationSection = document.getElementById('inspiration-section');
    if (inspirationSection) inspirationSection.style.display = 'none';
    
    // Crear o mostrar vista de sección
    let seccionView = document.getElementById('seccion-view');
    if (!seccionView) {
        seccionView = document.createElement('div');
        seccionView.id = 'seccion-view';
        seccionView.className = 'seccion-view';
        const content = document.getElementById('content');
        if (content) {
            content.appendChild(seccionView);
        } else {
            document.body.appendChild(seccionView);
        }
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
    window.location.hash = '';
    document.title = 'Galería Jafter - Fotografía Inspiradora';
    
    // Mostrar elementos principales
    const homeView = document.getElementById('home-view');
    if (homeView) homeView.style.display = 'block';
    
    const sectionCards = document.getElementById('section-cards');
    if (sectionCards) sectionCards.style.display = 'grid';
    
    const inspirationSection = document.getElementById('inspiration-section');
    if (inspirationSection) inspirationSection.style.display = 'block';
    
    // Ocultar vista de sección
    const seccionView = document.getElementById('seccion-view');
    if (seccionView) seccionView.style.display = 'none';
}

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM cargado, inicializando...');
    
    // Logo click
    const logo = document.getElementById('logoHome');
    if (logo) {
        logo.addEventListener('click', function() {
            mostrarVistaPrincipal();
        });
    }
    
    // Verificar hash al cargar
    if (window.location.hash && window.location.hash.startsWith('#seccion/')) {
        cargarSeccionDesdeHash();
    } else {
        // Cargar secciones principal
        cargarSecciones();
    }
});

// Manejar cambios en el hash
window.addEventListener('hashchange', function() {
    if (window.location.hash && window.location.hash.startsWith('#seccion/')) {
        cargarSeccionDesdeHash();
    } else {
        mostrarVistaPrincipal();
    }
});
