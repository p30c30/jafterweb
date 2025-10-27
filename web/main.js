// MAIN.JS - VERSIÓN CON CIERRE CON CLIC EN LA IMAGEN
console.log('✅ main.js CARGADO');

// Variables globales para el zoom y arrastre
let currentScale = 1;
let currentImage = null;
let isDragging = false;
let startX, startY;
let translateX = 0, translateY = 0;

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

// Cargar datos y crear tarjetas
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

// Mostrar sección específica
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

// Función para mostrar modal - CON CIERRE CON CLIC EN LA IMAGEN
function mostrarModal(imageUrl, title) {
    const modal = document.getElementById('modal');
    
    // Crear estructura del modal
    modal.innerHTML = `
        <div class="close-modal">×</div>
        <div class="modal-content">
            <div class="modal-img-container">
                <img src="" alt="${title}" class="modal-img" id="modal-img">
            </div>
        </div>
    `;
    
    const modalImg = document.getElementById('modal-img');
    
    // Precargar imagen
    const img = new Image();
    img.onload = function() {
        modalImg.src = imageUrl;
        modalImg.alt = title;
        currentImage = modalImg;
        
        // Resetear zoom y posición
        resetZoom();
        
        modal.classList.add('active');
        document.body.classList.add('modal-open');
        
        // Configurar eventos
        configurarEventos();
    };
    img.onerror = function() {
        modalImg.src = imageUrl;
        modalImg.alt = title;
        modal.classList.add('active');
        document.body.classList.add('modal-open');
        configurarEventos();
    };
    img.src = imageUrl;
    
    // Configurar eventos
    function configurarEventos() {
        // Cerrar al hacer clic en la X
        const closeBtn = modal.querySelector('.close-modal');
        if (closeBtn) {
            closeBtn.onclick = closeModal;
        }
        
        // CERRAR AL HACER CLIC EN CUALQUIER PARTE DEL MODAL (fondo O imagen)
        modal.addEventListener('click', function(event) {
            // Cerrar si se hace clic en el fondo del modal O en la imagen
            if (event.target === modal || event.target === modalImg) {
                closeModal();
            }
        });
        
        // Zoom con rueda del ratón
        modal.addEventListener('wheel', function(e) {
            e.preventDefault();
            
            if (e.deltaY < 0) {
                // Zoom in (rueda hacia arriba)
                currentScale = Math.min(currentScale + 0.2, 5);
            } else {
                // Zoom out (rueda hacia abajo)
                currentScale = Math.max(currentScale - 0.2, 0.5);
            }
            
            aplicarZoom();
        }, { passive: false });
        
        // Doble clic en la imagen para resetear zoom (sin cerrar)
        modalImg.addEventListener('dblclick', function(e) {
            e.stopPropagation(); // Evitar que el doble clic cierre el modal
            resetZoom();
        });
        
        // ARRASTRE - Solo cuando hay zoom
        modalImg.addEventListener('mousedown', startDrag);
        modalImg.addEventListener('touchstart', startDragTouch);
        
        // Cerrar con ESC
        document.addEventListener('keydown', function closeOnEsc(event) {
            if (event.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', closeOnEsc);
            }
        });
    }
    
    // Función para cerrar modal
    function closeModal() {
        modal.classList.remove('active');
        document.body.classList.remove('modal-open');
        resetZoom();
    }
}

// Funciones de arrastre
function startDrag(e) {
    if (currentScale <= 1) return; // Solo arrastrar cuando hay zoom
    
    isDragging = true;
    startX = e.clientX - translateX;
    startY = e.clientY - translateY;
    
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDrag);
    
    e.stopPropagation(); // Evitar que el arrastre active el cierre
}

function startDragTouch(e) {
    if (currentScale <= 1) return; // Solo arrastrar cuando hay zoom
    
    isDragging = true;
    const touch = e.touches[0];
    startX = touch.clientX - translateX;
    startY = touch.clientY - translateY;
    
    document.addEventListener('touchmove', dragTouch);
    document.addEventListener('touchend', stopDrag);
    
    e.stopPropagation(); // Evitar que el arrastre active el cierre
}

function drag(e) {
    if (!isDragging) return;
    e.preventDefault();
    
    translateX = e.clientX - startX;
    translateY = e.clientY - startY;
    
    aplicarZoom();
}

function dragTouch(e) {
    if (!isDragging) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    translateX = touch.clientX - startX;
    translateY = touch.clientY - startY;
    
    aplicarZoom();
}

function stopDrag() {
    isDragging = false;
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('touchmove', dragTouch);
}

// Funciones de zoom
function aplicarZoom() {
    if (currentImage) {
        // Aplicar transformación combinada (zoom + traslación)
        currentImage.style.transform = `scale(${currentScale}) translate(${translateX}px, ${translateY}px)`;
        currentImage.style.transformOrigin = 'center center';
        
        // Cambiar cursor solo cuando hay zoom para permitir arrastre
        if (currentScale > 1) {
            currentImage.classList.add('zoomed');
        } else {
            currentImage.classList.remove('zoomed');
            // Resetear posición cuando no hay zoom
            translateX = 0;
            translateY = 0;
        }
    }
}

function resetZoom() {
    currentScale = 1;
    translateX = 0;
    translateY = 0;
    if (currentImage) {
        currentImage.style.transform = 'none';
        currentImage.classList.remove('zoomed');
    }
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
        resetZoom();
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', iniciar);
