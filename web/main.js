// MAIN.JS - VERSIÓN MEJORADA CON AJUSTE AUTOMÁTICO DE IMAGEN
console.log('✅ main.js CARGADO');

// Función principal
function iniciar() {
    console.log('🚀 INICIANDO...');
    
    // Configurar logo para volver al inicio
    const logo = document.getElementById('logoHome');
    if (logo) {
        logo.addEventListener('click', volverAGaleria);
    }
    
    setTimeout(() => {
        console.log('🔍 Buscando contenedor...');
        const container = document.getElementById('secciones-container');
        console.log('Contenedor:', container);
        
        if (container) {
            console.log('✅ Contenedor EXISTE, cargando datos...');
            cargarDatos(container);
        } else {
            console.error('❌ Contenedor NO EXISTE');
            setTimeout(iniciar, 1000);
        }
    }, 1000);
}

// Cargar datos y crear tarjetas - VERSIÓN CORREGIDA
async function cargarDatos(container) {
    try {
        console.log('📥 Cargando data.json...');
        const response = await fetch('data.json');
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        
        // VERIFICACIÓN CRÍTICA
        if (!data || !data.secciones || !Array.isArray(data.secciones)) {
            throw new Error('Estructura de datos inválida en data.json');
        }
        
        console.log('🎨 Creando', data.secciones.length, 'tarjetas...');
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
                console.log('🔄 Navegando a sección:', seccion.id);
                mostrarSeccion(seccion);
            });
            
            container.appendChild(card);
        });
        
        console.log('🎉 ÉXITO: Secciones cargadas');
        
    } catch (error) {
        console.error('❌ Error cargando datos:', error);
        
        // Mostrar mensaje de error al usuario
        container.innerHTML = `
            <div class="error-message">
                <h3>Error al cargar los datos</h3>
                <p>${error.message}</p>
                <button onclick="location.reload()">Reintentar</button>
            </div>
        `;
    }
}

// Mostrar sección específica - VERSIÓN SEGURA
function mostrarSeccion(seccion) {
    console.log('🖼️ Mostrando sección:', seccion.titulo);
    
    // Verificar que la sección tiene fotos
    if (!seccion.fotos || !Array.isArray(seccion.fotos)) {
        console.error('❌ No hay fotos en esta sección:', seccion);
        return;
    }
    
    // Ocultar vista principal
    const homeView = document.getElementById('home-view');
    if (homeView) homeView.style.display = 'none';
    
    const inspirationSection = document.getElementById('inspiration-section');
    if (inspirationSection) inspirationSection.style.display = 'none';
    
    // Crear vista de sección
    let seccionView = document.getElementById('seccion-view');
    if (!seccionView) {
        seccionView = document.createElement('div');
        seccionView.id = 'seccion-view';
        seccionView.className = 'seccion-view';
        document.getElementById('content').appendChild(seccionView);
    }
    
    seccionView.innerHTML = `
        <header class="seccion-header">
            <button class="back-button" title="Volver">←</button>
            <h1>${seccion.titulo}</h1>
            <p>${seccion.descripcion}</p>
        </header>
        <div class="fotos-grid" id="fotos-container"></div>
    `;
    
    seccionView.style.display = 'block';
    
    // Configurar botón de volver
    const backButton = seccionView.querySelector('.back-button');
    if (backButton) {
        backButton.addEventListener('click', volverAGaleria);
    }
    
    // Cargar fotos
    const container = document.getElementById('fotos-container');
    if (container) {
        container.innerHTML = '';
        
        seccion.fotos.forEach(foto => {
            // Verificar que cada foto tiene los campos necesarios
            if (!foto.miniatura || !foto.texto || !foto.url) {
                console.warn('Foto incompleta:', foto);
                return;
            }
            
            const fotoElement = document.createElement('div');
            fotoElement.className = 'foto-item';
            fotoElement.innerHTML = `
                <img src="${foto.miniatura}" alt="${foto.texto}" class="foto-miniatura">
                <p class="foto-texto">${foto.texto}</p>
            `;
            
            // Abrir en modal en misma ventana
            fotoElement.addEventListener('click', () => {
                mostrarModal(foto.url, foto.texto);
            });
            
            container.appendChild(fotoElement);
        });
    }
}

// Función para mostrar modal - VERSIÓN MEJORADA CON AJUSTE AUTOMÁTICO
function mostrarModal(imageUrl, title) {
    const modal = document.getElementById('modal');
    const modalImg = document.getElementById('modal-img');
    
    // Precargar imagen para conocer sus dimensiones
    const img = new Image();
    img.onload = function() {
        modalImg.src = imageUrl;
        modalImg.alt = title;
        
        // Detectar si la imagen es muy grande para la pantalla
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        // Si la imagen es más grande que la ventana en cualquier dimensión
        if (img.width > windowWidth * 0.9 || img.height > windowHeight * 0.9) {
            modalImg.classList.add('large-image');
        } else {
            modalImg.classList.remove('large-image');
        }
        
        modal.classList.add('active');
        document.body.classList.add('modal-open');
    };
    img.onerror = function() {
        // Si hay error cargando la imagen, mostrar igual
        modalImg.src = imageUrl;
        modalImg.alt = title;
        modal.classList.add('active');
        document.body.classList.add('modal-open');
    };
    img.src = imageUrl;
    
    // Configurar cerrar modal
    const closeModal = () => {
        modal.classList.remove('active');
        document.body.classList.remove('modal-open');
        modalImg.classList.remove('large-image');
    };
    
    // Cerrar al hacer clic en la X
    const closeBtn = modal.querySelector('.close-modal');
    if (closeBtn) {
        closeBtn.onclick = closeModal;
    }
    
    // CERRAR AL HACER CLIC EN CUALQUIER PARTE DEL MODAL (fondo o imagen)
    modal.onclick = function(event) {
        // Cerrar si se hace clic en el fondo (modal) o en la imagen
        if (event.target === modal || event.target === modalImg) {
            closeModal();
        }
    };
    
    // Cerrar con ESC
    document.addEventListener('keydown', function closeOnEsc(event) {
        if (event.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', closeOnEsc);
        }
    });
}

// Función para volver a la galería
function volverAGaleria() {
    console.log('🏠 Volviendo a galería...');
    
    // Mostrar elementos principales
    const homeView = document.getElementById('home-view');
    if (homeView) homeView.style.display = 'block';
    
    const inspirationSection = document.getElementById('inspiration-section');
    if (inspirationSection) inspirationSection.style.display = 'block';
    
    // Ocultar vista de sección
    const seccionView = document.getElementById('seccion-view');
    if (seccionView) seccionView.style.display = 'none';
    
    // Cerrar modal si está abierto
    const modal = document.getElementById('modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.classList.remove('modal-open');
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', iniciar);
