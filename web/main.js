// MAIN.JS - VERSIÓN CON ARRASTRE SUAVE Y CLIC FUNCIONAL
console.log('✅ main.js CARGADO');

// Variables globales para el zoom y arrastre
let currentScale = 1;
let currentImage = null;
let isDragging = false;
let startX, startY;
let translateX = 0, translateY = 0;
let dragStartTime = 0;
let lastX = 0, lastY = 0;
let animationFrameId = null;

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

// Función para mostrar modal - CON ARRASTRE SUAVE
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
        
        // CERRAR AL HACER CLIC EN EL FONDO SOLAMENTE
        modal.addEventListener('click', function(event) {
            // Solo cerrar si se hace clic en el fondo (NO en la imagen)
            if (event.target === modal) {
                closeModal();
            }
        });
        
        // CLIC EN LA IMAGEN - Siempre cierra (con o sin zoom)
        modalImg.addEventListener('click', function(event) {
            // Solo cerrar si no fue un arrastre (clic rápido)
            const clickDuration = Date.now() - dragStartTime;
            if (clickDuration < 200 && !isDragging) {
                closeModal();
            }
        });
        
        // ZOOM MÁS PRECISO CON LA RUEDA
        modal.addEventListener('wheel', function(e) {
            e.preventDefault();
            
            // Determinar dirección del zoom
            const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9; // 10% de zoom in/out
            const newScale = currentScale * zoomFactor;
            
            // Limitar el zoom entre 10% y 500%
            if (newScale >= 0.1 && newScale <= 5) {
                currentScale = newScale;
                aplicarZoom();
            }
        }, { passive: false });
        
        // ARRASTRE SUAVE - Solo cuando hay zoom
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

// Funciones de arrastre SUAVES
function startDrag(e) {
    if (currentScale <= 1) return; // Solo arrastrar cuando hay zoom
    
    isDragging = true;
    dragStartTime = Date.now();
    startX = e.clientX - translateX;
    startY = e.clientY - translateY;
    lastX = e.clientX;
    lastY = e.clientY;
    
    // Cambiar cursor a "agarrando"
    if (currentImage) {
        currentImage.style.cursor = 'grabbing';
    }
    
    // Usar requestAnimationFrame para animación suave
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDrag);
    
    e.preventDefault();
    e.stopPropagation();
}

function startDragTouch(e) {
    if (currentScale <= 1) return; // Solo arrastrar cuando hay zoom
    
    isDragging = true;
    dragStartTime = Date.now();
    const touch = e.touches[0];
    startX = touch.clientX - translateX;
    startY = touch.clientY - translateY;
    lastX = touch.clientX;
    lastY = touch.clientY;
    
    document.addEventListener('touchmove', dragTouch);
    document.addEventListener('touchend', stopDrag);
    
    e.preventDefault();
    e.stopPropagation();
}

function drag(e) {
    if (!isDragging) return;
    
    // Cancelar frame anterior si existe
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    
    // Usar requestAnimationFrame para animación suave
    animationFrameId = requestAnimationFrame(() => {
        const deltaX = e.clientX - lastX;
        const deltaY = e.clientY - lastY;
        
        // Aplicar movimiento suavizado
        translateX += deltaX * 1.2; // Factor de suavizado
        translateY += deltaY * 1.2;
        
        lastX = e.clientX;
        lastY = e.clientY;
        
        aplicarZoom();
    });
}

function dragTouch(e) {
    if (!isDragging) return;
    
    const touch = e.touches[0];
    
    // Cancelar frame anterior si existe
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    
    // Usar requestAnimationFrame para animación suave
    animationFrameId = requestAnimationFrame(() => {
        const deltaX = touch.clientX - lastX;
        const deltaY = touch.clientY - lastY;
        
        // Aplicar movimiento suavizado
        translateX += deltaX * 1.2; // Factor de suavizado
        translateY += deltaY * 1.2;
        
        lastX = touch.clientX;
        lastY = touch.clientY;
        
        aplicarZoom();
    });
}

function stopDrag() {
    if (!isDragging) return;
    
    isDragging = false;
    
    // Cancelar cualquier animación pendiente
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    
    // Restaurar cursor a "mover" cuando se suelta
    if (currentImage && currentScale > 1) {
        currentImage.style.cursor = 'move';
    }
    
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('touchmove', dragTouch);
}

// Funciones de zoom
function aplicarZoom() {
    if (currentImage) {
        // Aplicar transformación combinada (zoom + traslación)
        currentImage.style.transform = `scale(${currentScale}) translate(${translateX}px, ${translateY}px)`;
        currentImage.style.transformOrigin = 'center center';
        
        // Cambiar cursor según el estado
        if (currentScale > 1) {
            currentImage.classList.add('zoomed');
            currentImage.style.cursor = isDragging ? 'grabbing' : 'move';
        } else {
            currentImage.classList.remove('zoomed');
            currentImage.style.cursor = 'default';
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
    isDragging = false;
    lastX = 0;
    lastY = 0;
    
    // Cancelar cualquier animación pendiente
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    
    if (currentImage) {
        currentImage.style.transform = 'none';
        currentImage.classList.remove('zoomed');
        currentImage.style.cursor = 'default';
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
