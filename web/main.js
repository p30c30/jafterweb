// MAIN.JS - VERSIÓN CON CARRUSEL INTEGRADO
console.log('✅ main.js CARGADO');

// Variables globales para el zoom y arrastre
let currentScale = 1;
let currentImage = null;
let isDragging = false;
let startX, startY;
let translateX = 0, translateY = 0;
let lastX = 0, lastY = 0;
let animationFrameId = null;

// Variables para navegación entre fotos
let currentSeccion = null;
let currentFotoIndex = 0;
let todasLasFotos = [];

// Variables para el carrusel
let carruselActualIndex = 0;
let carruselFotos = [];
let autoPlayInterval;
let datosGlobales = null;

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
        datosGlobales = data; // Guardar datos globalmente
        
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
        
        // CARGAR CARRUSEL DESPUÉS DE LAS SECCIONES
        cargarCarrusel(data);
        
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

// ================== CARRUSEL ÚLTIMAS FOTOS ==================
function cargarCarrusel(data) {
    const container = document.getElementById('ultimas-fotos-carrusel');
    const dotsContainer = document.getElementById('carrusel-dots');
    
    if (!container) {
        console.log('❌ Contenedor del carrusel no encontrado');
        return;
    }
    
    console.log('🔄 Cargando carrusel de últimas fotos...');
    carruselFotos = obtenerFotosParaCarrusel(data);
    mostrarCarruselFotos(carruselFotos, container, dotsContainer);
    
    // Configurar navegación automática
    iniciarAutoPlay();
    configurarInteraccionCarrusel();
}

function obtenerFotosParaCarrusel(data) {
    const todasLasFotos = [];
    
    // Recopilar todas las fotos de todas las secciones
    data.secciones.forEach(seccion => {
        if (seccion.fotos && Array.isArray(seccion.fotos)) {
            seccion.fotos.forEach((foto, index) => {
                todasLasFotos.push({
                    ...foto,
                    seccionId: seccion.id,
                    seccionTitulo: seccion.titulo,
                    indiceEnSeccion: index
                });
            });
        }
    });
    
    console.log(`📸 Encontradas ${todasLasFotos.length} fotos en total`);
    
    // Tomar las últimas 6 fotas (orden inverso)
    const ultimas = todasLasFotos.slice(-6).reverse();
    console.log(`🎠 Mostrando ${ultimas.length} fotos en el carrusel`);
    
    return ultimas;
}

function mostrarCarruselFotos(fotos, container, dotsContainer) {
    container.innerHTML = '';
    dotsContainer.innerHTML = '';
    
    if (fotos.length === 0) {
        container.innerHTML = '<div class="carrusel-item"><p class="no-fotos">No hay fotos recientes</p></div>';
        return;
    }
    
    // Crear items del carrusel
    fotos.forEach((foto, index) => {
        const carruselItem = document.createElement('div');
        carruselItem.className = `carrusel-item ${index === 0 ? 'active' : ''}`;
        carruselItem.innerHTML = `
            <img src="${foto.url}" alt="${foto.texto}" class="carrusel-img">
            <div class="carrusel-info">
                <div class="carrusel-seccion">${foto.seccionTitulo}</div>
                <div class="carrusel-desc">${foto.texto}</div>
            </div>
        `;
        
        carruselItem.addEventListener('click', () => {
            irAFotoEnSeccion(foto.seccionId, foto.indiceEnSeccion);
        });
        
        container.appendChild(carruselItem);
    });
    
    // Crear dots de navegación
    fotos.forEach((_, index) => {
        const dot = document.createElement('button');
        dot.className = `carrusel-dot ${index === 0 ? 'active' : ''}`;
        dot.addEventListener('click', () => {
            moverCarruselA(index);
        });
        dotsContainer.appendChild(dot);
    });
    
    // Configurar botones de navegación
    configurarBotonesCarrusel();
    
    // Actualizar posición inicial
    actualizarCarrusel();
}

function configurarBotonesCarrusel() {
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => moverCarruselA(carruselActualIndex - 1));
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => moverCarruselA(carruselActualIndex + 1));
    }
}

function moverCarruselA(nuevoIndex) {
    // Scroll infinito
    if (nuevoIndex < 0) {
        nuevoIndex = carruselFotos.length - 1;
    } else if (nuevoIndex >= carruselFotos.length) {
        nuevoIndex = 0;
    }
    
    carruselActualIndex = nuevoIndex;
    actualizarCarrusel();
    resetAutoPlay();
}

function actualizarCarrusel() {
    const carruselInner = document.querySelector('.carrusel-inner');
    const dots = document.querySelectorAll('.carrusel-dot');
    
    if (carruselInner) {
        carruselInner.style.transform = `translateX(-${carruselActualIndex * 100}%)`;
    }
    
    // Actualizar dots activos
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === carruselActualIndex);
    });
}

// Auto-play del carrusel
function iniciarAutoPlay() {
    autoPlayInterval = setInterval(() => {
        moverCarruselA(carruselActualIndex + 1);
    }, 5000); // Cambia cada 5 segundos
}

function resetAutoPlay() {
    clearInterval(autoPlayInterval);
    iniciarAutoPlay();
}

function configurarInteraccionCarrusel() {
    const carrusel = document.querySelector('.carrusel');
    if (carrusel) {
        carrusel.addEventListener('mouseenter', () => {
            clearInterval(autoPlayInterval);
        });
        
        carrusel.addEventListener('mouseleave', () => {
            iniciarAutoPlay();
        });
    }
}

function irAFotoEnSeccion(seccionId, fotoIndex) {
    if (!datosGlobales) return;
    
    const seccion = datosGlobales.secciones.find(s => s.id === seccionId);
    if (seccion) {
        // Mostrar la sección
        mostrarSeccion(seccion);
        
        // Abrir el modal después de un pequeño delay
        setTimeout(() => {
            const foto = seccion.fotos[fotoIndex];
            if (foto) {
                mostrarModal(foto.url, foto.texto, fotoIndex);
            }
        }, 400);
    }
}

// ================== FUNCIONES EXISTENTES (SE MANTIENEN IGUAL) ==================

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

// Función para mostrar modal - VERSIÓN SIMPLIFICADA
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
    
    // Configurar eventos - VERSIÓN SIMPLIFICADA
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
        
        // CERRAR AL HACER CLIC EN EL FONDO DEL MODAL
        modal.addEventListener('click', function(event) {
            if (event.target === modal) {
                closeModal();
            }
        });
        
        // CLIC EN LA IMAGEN - Cierra SIEMPRE con doble clic o clic rápido
        let clickCount = 0;
        let clickTimer = null;
        
        modalImg.addEventListener('click', function(event) {
            clickCount++;
            
            if (clickCount === 1) {
                // Primer clic - esperar para ver si es doble clic
                clickTimer = setTimeout(() => {
                    // Si pasó el tiempo y es un solo clic, cerrar SOLO si no hay zoom
                    if (currentScale <= 1) {
                        closeModal();
                    }
                    clickCount = 0;
                }, 300);
            } else if (clickCount === 2) {
                // Doble clic - cerrar SIEMPRE (con o sin zoom)
                clearTimeout(clickTimer);
                closeModal();
                clickCount = 0;
            }
            
            event.stopPropagation();
        });
        
        // ZOOM CON RUEDA DEL RATÓN
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
    
    let nuevoIndex = currentFotoIndex + direccion;
    
    if (nuevoIndex < 0) {
        nuevoIndex = todasLasFotos.length - 1;
    } else if (nuevoIndex >= todasLasFotos.length) {
        nuevoIndex = 0;
    }
    
    currentFotoIndex = nuevoIndex;
    const nuevaFoto = todasLasFotos[currentFotoIndex];
    
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

// Funciones de arrastre
function startDrag(e) {
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

// Función para volver a la galería
function volverAGaleria() {
    console.log('🏠 Volviendo a galería...');
    
    currentSeccion = null;
    currentFotoIndex = 0;
    todasLasFotos = [];
    
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
    
    window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
    });
}

// Inicialización
document.addEventListener('DOMContentLoaded', iniciar);
