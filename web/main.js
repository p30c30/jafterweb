// MAIN.JS - VERSIÓN MEJORADA CON ZOOM Y ARRASTRE
console.log('✅ main.js CARGADO');

// Variables globales para el zoom y arrastre
let currentScale = 1;
let isDragging = false;
let startX, startY, scrollLeft, scrollTop;
let currentImage = null;

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

// Función para mostrar modal con zoom y arrastre
function mostrarModal(imageUrl, title) {
    const modal = document.getElementById('modal');
    
    // Crear estructura del modal con controles de zoom
    modal.innerHTML = `
        <div class="close-modal">×</div>
        <div class="zoom-controls">
            <button class="zoom-btn zoom-out">-</button>
            <button class="zoom-btn zoom-reset">100%</button>
            <button class="zoom-btn zoom-in">+</button>
        </div>
        <div class="zoom-hint">Haz clic para zoom • Arrastra para mover</div>
        <div class="modal-content">
            <div class="modal-img-container">
                <img src="" alt="${title}" class="modal-img" id="modal-img">
            </div>
        </div>
    `;
    
    const modalImg = document.getElementById('modal-img');
    const modalContainer = modal.querySelector('.modal-img-container');
    
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
        
        // Configurar eventos de zoom y arrastre
        configurarZoomYArrastre(modalImg, modalContainer);
    };
    img.onerror = function() {
        modalImg.src = imageUrl;
        modalImg.alt = title;
        modal.classList.add('active');
        document.body.classList.add('modal-open');
        configurarZoomYArrastre(modalImg, modalContainer);
    };
    img.src = imageUrl;
    
    // Configurar cerrar modal
    const closeModal = () => {
        modal.classList.remove('active');
        document.body.classList.remove('modal-open');
        resetZoom();
    };
    
    // Cerrar al hacer clic en la X
    const closeBtn = modal.querySelector('.close-modal');
    if (closeBtn) {
        closeBtn.onclick = closeModal;
    }
    
    // Cerrar al hacer clic en el fondo del modal
    modal.onclick = function(event) {
        if (event.target === modal) {
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

// Configurar zoom y arrastre
function configurarZoomYArrastre(modalImg, modalContainer) {
    // Controles de zoom
    const zoomInBtn = document.querySelector('.zoom-in');
    const zoomOutBtn = document.querySelector('.zoom-out');
    const zoomResetBtn = document.querySelector('.zoom-reset');
    
    // Zoom in
    zoomInBtn.addEventListener('click', () => {
        currentScale += 0.5;
        aplicarZoom();
    });
    
    // Zoom out
    zoomOutBtn.addEventListener('click', () => {
        if (currentScale > 0.5) {
            currentScale -= 0.5;
            aplicarZoom();
        }
    });
    
    // Reset zoom
    zoomResetBtn.addEventListener('click', resetZoom);
    
    // Zoom con rueda del mouse
    modalContainer.addEventListener('wheel', (e) => {
        e.preventDefault();
        if (e.deltaY < 0) {
            // Zoom in
            currentScale += 0.2;
        } else {
            // Zoom out
            if (currentScale > 0.5) {
                currentScale -= 0.2;
            }
        }
        aplicarZoom();
    });
    
    // Zoom al hacer doble clic
    modalImg.addEventListener('dblclick', () => {
        if (currentScale === 1) {
            currentScale = 2;
        } else {
            currentScale = 1;
        }
        aplicarZoom();
    });
    
    // Arrastre
    modalContainer.addEventListener('mousedown', startDrag);
    modalContainer.addEventListener('touchstart', startDragTouch);
    
    // Prevenir arrastre de la imagen
    modalImg.addEventListener('dragstart', (e) => {
        e.preventDefault();
    });
}

// Funciones de zoom
function aplicarZoom() {
    if (currentImage) {
        currentImage.style.transform = `scale(${currentScale})`;
        currentImage.style.transformOrigin = 'center center';
        
        // Actualizar cursor
        if (currentScale > 1) {
            currentImage.classList.add('zoomed');
            currentImage.classList.remove('zoomable');
        } else {
            currentImage.classList.add('zoomable');
            currentImage.classList.remove('zoomed');
        }
        
        // Actualizar texto del botón reset
        const zoomResetBtn = document.querySelector('.zoom-reset');
        if (zoomResetBtn) {
            zoomResetBtn.textContent = Math.round(currentScale * 100) + '%';
        }
    }
}

function resetZoom() {
    currentScale = 1;
    aplicarZoom();
    
    // Resetear posición de arrastre
    if (currentImage) {
        currentImage.style.transform = `scale(1) translate(0px, 0px)`;
    }
}

// Funciones de arrastre
function startDrag(e) {
    if (currentScale <= 1) return;
    
    isDragging = true;
    startX = e.pageX - currentImage.offsetLeft;
    startY = e.pageY - currentImage.offsetTop;
    
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDrag);
    
    currentImage.style.cursor = 'grabbing';
}

function startDragTouch(e) {
    if (currentScale <= 1) return;
    
    isDragging = true;
    const touch = e.touches[0];
    startX = touch.pageX - currentImage.offsetLeft;
    startY = touch.pageY - currentImage.offsetTop;
    
    document.addEventListener('touchmove', dragTouch);
    document.addEventListener('touchend', stopDrag);
}

function drag(e) {
    if (!isDragging) return;
    e.preventDefault();
    
    const x = e.pageX - startX;
    const y = e.pageY - startY;
    
    currentImage.style.left = x + 'px';
    currentImage.style.top = y + 'px';
    currentImage.style.position = 'relative';
}

function dragTouch(e) {
    if (!isDragging) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const x = touch.pageX - startX;
    const y = touch.pageY - startY;
    
    currentImage.style.left = x + 'px';
    currentImage.style.top = y + 'px';
    currentImage.style.position = 'relative';
}

function stopDrag() {
    isDragging = false;
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('touchmove', dragTouch);
    
    if (currentImage) {
        currentImage.style.cursor = currentScale > 1 ? 'grab' : 'zoom-in';
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
