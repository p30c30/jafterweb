// MAIN.JS - VERSIÓN CON NAVEGACIÓN ENTRE FOTOS
console.log('✅ main.js CARGADO');

// Variables globales para el zoom, arrastre y navegación
let currentScale = 1;
let currentImage = null;
let isDragging = false;
let startX, startY;
let translateX = 0, translateY = 0;
let dragStartTime = 0;
let lastX = 0, lastY = 0;
let animationFrameId = null;

// Variables para navegación
let currentSeccion = null;
let currentFotoIndex = 0;
let totalFotos = 0;

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
    
    // Guardar la sección actual para la navegación
    currentSeccion = seccion;
    
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
        
        seccion.fotos.forEach((foto, index) => {
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
                mostrarModal(seccion, index);
            });
            
            container.appendChild(fotoElement);
        });
    }
}

// Función para mostrar modal - CON NAVEGACIÓN
function mostrarModal(seccion, fotoIndex) {
    const modal = document.getElementById('modal');
    
    // Guardar información de navegación
    currentSeccion = seccion;
    currentFotoIndex = fotoIndex;
    totalFotos = seccion.fotos.length;
    
    // Crear estructura del modal CON FLECHAS
    modal.innerHTML = `
        <div class="close-modal">×</div>
        <div class="nav-arrow prev">‹</div>
        <div class="nav-arrow next">›</div>
        <div class="photo-counter">${fotoIndex + 1} / ${totalFotos}</div>
        <div class="modal-content">
            <div class="modal-img-container">
                <img src="" alt="" class="modal-img" id="modal-img">
            </div>
        </div>
    `;
    
    const modalImg = document.getElementById('modal-img');
    
    // Cargar la imagen actual
    cargarImagenActual();
    
    // Configurar eventos
    function configurarEventos() {
        // Cerrar al hacer clic en la X
        const closeBtn = modal.querySelector('.close-modal');
        if (closeBtn) {
            closeBtn.onclick = closeModal;
        }
        
        // Navegación con flechas
        const prevArrow = modal.querySelector('.nav-arrow.prev');
        const nextArrow = modal.querySelector('.nav-arrow.next');
        
        if (prevArrow) {
            prevArrow.addEventListener('click', (e) => {
                e.stopPropagation();
                fotoAnterior();
            });
        }
        
        if (nextArrow) {
            nextArrow.addEventListener('click', (e) => {
                e.stopPropagation();
                fotoSiguiente();
            });
        }
        
        // Navegación con teclado
        document.addEventListener('keydown', function navegarConTeclado(event) {
            if (event.key === 'ArrowLeft') {
                fotoAnterior();
            } else if (event.key === 'ArrowRight') {
                fotoSiguiente();
            } else if (event.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', navegarConTeclado);
            }
        });
        
        // CERRAR AL HACER CLIC EN EL FONDO DEL MODAL
        modal.addEventListener('click', function(event) {
            if (event.target === modal) {
                closeModal();
            }
        });
        
        // PREVENIR que el clic en la imagen se propague al modal
        modalImg.addEventListener('click', function(event) {
            event.stopPropagation();
        });
        
        // ZOOM con rueda del ratón
        modal.addEventListener('wheel', function(e) {
            e.preventDefault();
            
            const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
            const newScale = currentScale * zoomFactor;
            
            if (newScale >= 0.1 && newScale <= 5) {
                currentScale = newScale;
                aplicarZoom();
            }
        }, { passive: false });
        
        // ARRASTRE - Solo cuando hay zoom
        modalImg.addEventListener('mousedown', startDrag);
        modalImg.addEventListener('touchstart', startDragTouch);
    }
    
    function cargarImagenActual() {
        const fotoActual = currentSeccion.fotos[currentFotoIndex];
        
        // Precargar imagen
        const img = new Image();
        img.onload = function() {
            modalImg.src = fotoActual.url;
            modalImg.alt = fotoActual.texto;
            currentImage = modalImg;
            
            // Resetear zoom y posición
            resetZoom();
            
            modal.classList.add('active');
            document.body.classList.add('modal-open');
            
            // Actualizar contador
            const counter = modal.querySelector('.photo-counter');
            if (counter) {
                counter.textContent = `${currentFotoIndex + 1} / ${totalFotos}`;
            }
            
            // Configurar eventos
            configurarEventos();
        };
        img.onerror = function() {
            modalImg.src = fotoActual.url;
            modalImg.alt = fotoActual.texto;
            modal.classList.add('active');
            document.body.classList.add('modal-open');
            configurarEventos();
        };
        img.src = fotoActual.url;
    }
    
    function fotoAnterior() {
        // Carrusel infinito: si es la primera, va a la última
        currentFotoIndex = currentFotoIndex === 0 ? totalFotos - 1 : currentFotoIndex - 1;
        cargarImagenActual();
    }
    
    function fotoSiguiente() {
        // Carrusel infinito: si es la última, va a la primera
        currentFotoIndex = currentFotoIndex === totalFotos - 1 ? 0 : currentFotoIndex + 1;
        cargarImagenActual();
    }
    
    // Función para cerrar modal
    function closeModal() {
        modal.classList.remove('active');
        document.body.classList.remove('modal-open');
        resetZoom();
    }
}

// ... (el resto de las funciones se mantienen IGUAL: startDrag, drag, stopDrag, aplicarZoom, resetZoom, volverAGaleria)

// Funciones de arrastre SUAVES (se mantienen igual)
function startDrag(e) {
    if (currentScale <= 1) return;
    
    isDragging = true;
    dragStartTime = Date.now();
    startX = e.clientX - translateX;
    startY = e.clientY - translateY;
    lastX = e.clientX;
    lastY = e.clientY;
    
    if (currentImage) {
        currentImage.style.cursor = 'grabbing';
    }
    
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDrag);
    
    e.preventDefault();
    e.stopPropagation();
}

function drag(e) {
    if (!isDragging) return;
    
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    
    animationFrameId = requestAnimationFrame(() => {
        const deltaX = e.clientX - lastX;
        const deltaY = e.clientY - lastY;
        
        translateX += deltaX * 1.2;
        translateY += deltaY * 1.2;
        
        lastX = e.clientX;
        lastY = e.clientY;
        
        aplicarZoom();
    });
}

function stopDrag() {
    if (!isDragging) return;
    
    isDragging = false;
    
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    
    if (currentImage && currentScale > 1) {
        currentImage.style.cursor = 'move';
    }
    
    document.removeEventListener('mousemove', drag);
}

// Funciones de zoom (se mantienen igual)
function aplicarZoom() {
    if (currentImage) {
        currentImage.style.transform = `scale(${currentScale}) translate(${translateX}px, ${translateY}px)`;
        currentImage.style.transformOrigin = 'center center';
        
        if (currentScale > 1) {
            currentImage.classList.add('zoomed');
            currentImage.style.cursor = isDragging ? 'grabbing' : 'move';
        } else {
            currentImage.classList.remove('zoomed');
            currentImage.style.cursor = 'default';
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

// Función para volver a la galería (se mantiene igual)
function volverAGaleria() {
    console.log('🏠 Volviendo a galería...');
    
    const homeView = document.getElementById('home-view');
    if (homeView) homeView.style.display = 'block';
    
    const inspirationSection = document.getElementById('inspiration-section');
    if (inspirationSection) inspirationSection.style.display = 'block';
    
    const seccionView = document.getElementById('seccion-view');
    if (seccionView) seccionView.style.display = 'none';
    
    const modal = document.getElementById('modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.classList.remove('modal-open');
        resetZoom();
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', iniciar);
