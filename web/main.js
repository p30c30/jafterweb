// MAIN.JS - VERSIÓN CORREGIDA CON CLIC SUAVE FUNCIONAL
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

// Variables para navegación entre fotos
let currentSeccion = null;
let currentFotoIndex = 0;
let todasLasFotos = [];

// Variables para detección de clics
let clickStartX = 0;
let clickStartY = 0;
let clickStartTime = 0;
const CLICK_MAX_DISTANCE = 5; // píxeles
const CLICK_MAX_DURATION = 200; // milisegundos

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
    
    // Guardar la sección actual para navegación
    currentSeccion = seccion;
    
    // Verificar que la sección tiene fotos
    if (!seccion.fotos || !Array.isArray(seccion.fotos)) {
        console.error('❌ No hay fotos en esta sección:', seccion);
        return;
    }
    
    // Preparar todas las fotos para navegación
    todasLasFotos = seccion.fotos;
    
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
                mostrarModal(foto.url, foto.texto, index);
            });
            
            container.appendChild(fotoElement);
        });
    }
}

// Función para mostrar modal - MEJORADA CON DETECCIÓN DE CLICS
function mostrarModal(imageUrl, title, fotoIndex) {
    const modal = document.getElementById('modal');
    
    // Actualizar índice actual
    currentFotoIndex = fotoIndex;
    
    // Crear estructura del modal con navegación
    modal.innerHTML = `
        <div class="close-modal">×</div>
        <div class="nav-button prev-button">‹</div>
        <div class="nav-button next-button">›</div>
        <div class="modal-content">
            <div class="modal-img-container">
                <img src="" alt="${title}" class="modal-img" id="modal-img">
            </div>
            <div class="modal-info">
                <div class="foto-counter">${currentFotoIndex + 1} / ${todasLasFotos.length}</div>
                <div class="foto-title">${title}</div>
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
    
    // Configurar eventos - VERSIÓN MEJORADA
    function configurarEventos() {
        // Cerrar al hacer clic en la X
        const closeBtn = modal.querySelector('.close-modal');
        if (closeBtn) {
            closeBtn.onclick = closeModal;
        }
        
        // Navegación con botones
        const prevBtn = modal.querySelector('.prev-button');
        const nextBtn = modal.querySelector('.next-button');
        
        if (prevBtn) {
            prevBtn.onclick = () => navegarFoto(-1);
        }
        if (nextBtn) {
            nextBtn.onclick = () => navegarFoto(1);
        }
        
        // CERRAR AL HACER CLIC EN EL FONDO DEL MODAL SOLAMENTE
        modal.addEventListener('click', function(event) {
            // Solo cerrar si se hace clic en el fondo (NO en la imagen, botones, etc.)
            if (event.target === modal) {
                closeModal();
            }
        });
        
        // DETECCIÓN MEJORADA DE CLICS EN LA IMAGEN
        modalImg.addEventListener('mousedown', function(event) {
            // Guardar posición y tiempo inicial para detectar clics
            clickStartX = event.clientX;
            clickStartY = event.clientY;
            clickStartTime = Date.now();
        });
        
        modalImg.addEventListener('mouseup', function(event) {
            // Calcular distancia y tiempo del movimiento
            const distance = Math.sqrt(
                Math.pow(event.clientX - clickStartX, 2) + 
                Math.pow(event.clientY - clickStartY, 2)
            );
            const duration = Date.now() - clickStartTime;
            
            // Si fue un clic (poca distancia y poco tiempo) y NO estamos en modo arrastre
            if (distance <= CLICK_MAX_DISTANCE && 
                duration <= CLICK_MAX_DURATION && 
                !isDragging) {
                
                // Cerrar modal con clic suave (funciona con o sin zoom)
                closeModal();
            }
        });
        
        // Para touch devices
        modalImg.addEventListener('touchstart', function(event) {
            const touch = event.touches[0];
            clickStartX = touch.clientX;
            clickStartY = touch.clientY;
            clickStartTime = Date.now();
        });
        
        modalImg.addEventListener('touchend', function(event) {
            if (!event.changedTouches[0]) return;
            
            const touch = event.changedTouches[0];
            const distance = Math.sqrt(
                Math.pow(touch.clientX - clickStartX, 2) + 
                Math.pow(touch.clientY - clickStartY, 2)
            );
            const duration = Date.now() - clickStartTime;
            
            if (distance <= CLICK_MAX_DISTANCE && 
                duration <= CLICK_MAX_DURATION && 
                !isDragging) {
                closeModal();
            }
        });
        
        // ZOOM MÁS PRECISO CON LA RUEDA
        modal.addEventListener('wheel', function(e) {
            e.preventDefault();
            
            // Determinar dirección del zoom
            const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
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
        
        // Navegación con teclado
        document.addEventListener('keydown', function manejarTeclado(event) {
            switch(event.key) {
                case 'Escape':
                    closeModal();
                    break;
                case 'ArrowLeft':
                    navegarFoto(-1);
                    break;
                case 'ArrowRight':
                    navegarFoto(1);
                    break;
            }
        });
    }
    
    // Función para cerrar modal
    function closeModal() {
        modal.classList.remove('active');
        document.body.classList.remove('modal-open');
        resetZoom();
        
        // Remover event listeners del teclado
        document.removeEventListener('keydown', manejarTeclado);
    }
}

// Navegación entre fotos
function navegarFoto(direccion) {
    if (!todasLasFotos.length) return;
    
    // Calcular nuevo índice con scroll infinito
    let nuevoIndex = currentFotoIndex + direccion;
    
    if (nuevoIndex < 0) {
        nuevoIndex = todasLasFotos.length - 1; // Ir a la última
    } else if (nuevoIndex >= todasLasFotos.length) {
        nuevoIndex = 0; // Volver a la primera
    }
    
    // Actualizar índice
    currentFotoIndex = nuevoIndex;
    const nuevaFoto = todasLasFotos[currentFotoIndex];
    
    // Actualizar modal con nueva foto
    const modal = document.getElementById('modal');
    const modalImg = document.getElementById('modal-img');
    const fotoCounter = modal.querySelector('.foto-counter');
    const fotoTitle = modal.querySelector('.foto-title');
    
    // Resetear zoom antes de cambiar la imagen
    resetZoom();
    
    // Precargar nueva imagen
    const img = new Image();
    img.onload = function() {
        modalImg.src = nuevaFoto.url;
        modalImg.alt = nuevaFoto.texto;
        currentImage = modalImg;
        
        // Actualizar información
        if (fotoCounter) {
            fotoCounter.textContent = `${currentFotoIndex + 1} / ${todasLasFotos.length}`;
        }
        if (fotoTitle) {
            fotoTitle.textContent = nuevaFoto.texto;
        }
    };
    img.onerror = function() {
        modalImg.src = nuevaFoto.url;
        modalImg.alt = nuevaFoto.texto;
        if (fotoCounter) {
            fotoCounter.textContent = `${currentFotoIndex + 1} / ${todasLasFotos.length}`;
        }
        if (fotoTitle) {
            fotoTitle.textContent = nuevaFoto.texto;
        }
    };
    img.src = nuevaFoto.url;
}

// Funciones de arrastre SUAVES
function startDrag(e) {
    // Solo arrastrar si hay zoom
    if (currentScale <= 1) return;
    
    isDragging = true;
    startX = e.clientX - translateX;
    startY = e.clientY - translateY;
    lastX = e.clientX;
    lastY = e.clientY;
    
    if (currentImage) {
        currentImage.style.cursor = 'grabbing';
        currentImage.classList.add('grabbing');
    }
    
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDrag);
    
    e.preventDefault();
    e.stopPropagation();
}

function startDragTouch(e) {
    if (currentScale <= 1) return;
    
    isDragging = true;
    const touch = e.touches[0];
    startX = touch.clientX - translateX;
    startY = touch.clientY - translateY;
    lastX = touch.clientX;
    lastY = touch.clientY;
    
    if (currentImage) {
        currentImage.classList.add('grabbing');
    }
    
    document.addEventListener('touchmove', dragTouch);
    document.addEventListener('touchend', stopDrag);
    
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

function dragTouch(e) {
    if (!isDragging) return;
    
    const touch = e.touches[0];
    
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    
    animationFrameId = requestAnimationFrame(() => {
        const deltaX = touch.clientX - lastX;
        const deltaY = touch.clientY - lastY;
        
        translateX += deltaX * 1.2;
        translateY += deltaY * 1.2;
        
        lastX = touch.clientX;
        lastY = touch.clientY;
        
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
        currentImage.classList.remove('grabbing');
    }
    
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('touchmove', dragTouch);
    document.removeEventListener('mouseup', stopDrag);
    document.removeEventListener('touchend', stopDrag);
}

// Funciones de zoom
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
        currentImage.classList.remove('zoomed', 'grabbing');
        currentImage.style.cursor = 'default';
    }
}

// Función para volver a la galería - CON SCROLL AL INICIO
function volverAGaleria() {
    console.log('🏠 Volviendo a galería...');
    
    // Resetear variables de navegación
    currentSeccion = null;
    currentFotoIndex = 0;
    todasLasFotos = [];
    
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
    
    // SCROLL SUAVE AL INICIO DE LA PÁGINA
    window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
    });
}

// Inicialización
document.addEventListener('DOMContentLoaded', iniciar);
