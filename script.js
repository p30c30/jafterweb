// SCRIPT.JS - VERSIÓN COMPLETA Y CORREGIDA
console.log('✅ script.js CARGADO');

// Variables globales
let currentSeccion = null;
let currentFotoIndex = 0;
let todasLasFotos = [];
let carruselActualIndex = 0;
let carruselFotos = [];
let autoPlayInterval;
let datosGlobales = null;
let isModalOpen = false;

// Variables de zoom
let currentScale = 1;
let currentImage = null;
let isDragging = false;
let startX, startY;
let translateX = 0, translateY = 0;
let lastX = 0, lastY = 0;
let animationFrameId = null;

// Función principal
function iniciar() {
    console.log('🚀 INICIANDO...');
    
    const logo = document.getElementById('logoHome');
    if (logo) {
        logo.addEventListener('click', volverAGaleria);
    }
    
    crearBotonScrollTop();
    
    setTimeout(() => {
        console.log('🔍 Buscando contenedor...');
        const container = document.getElementById('secciones-container');
        
        if (container) {
            console.log('✅ Contenedor EXISTE, cargando datos...');
            cargarDatos(container);
        } else {
            console.error('❌ Contenedor NO EXISTE');
            setTimeout(iniciar, 1000);
        }
    }, 1000);
}

// ================== SCROLL TO TOP ==================
function crearBotonScrollTop() {
    const scrollToTopBtn = document.createElement('button');
    scrollToTopBtn.className = 'scroll-to-top';
    scrollToTopBtn.innerHTML = '↑';
    scrollToTopBtn.setAttribute('aria-label', 'Volver arriba');
    scrollToTopBtn.setAttribute('title', 'Volver arriba');
    
    scrollToTopBtn.addEventListener('click', scrollToTop);
    document.body.appendChild(scrollToTopBtn);
    
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        if (scrollY > 300) {
            scrollToTopBtn.classList.add('visible');
        } else {
            scrollToTopBtn.classList.remove('visible');
        }
    });
}

function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Cargar datos y crear tarjetas
async function cargarDatos(container) {
    try {
        console.log('📥 Cargando data.json...');
        const response = await fetch('data.json?v=' + Date.now());
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        datosGlobales = data;
        
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
        cargarCarrusel(data);
        
    } catch (error) {
        console.error('❌ Error cargando datos:', error);
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
    iniciarAutoPlay();
    configurarInteraccionCarrusel();
}

function obtenerFotosParaCarrusel(data) {
    const todasLasFotos = [];
    
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
    
    fotos.forEach((foto, index) => {
        const carruselItem = document.createElement('div');
        carruselItem.className = `carrusel-item ${index === 0 ? 'active' : ''}`;
        carruselItem.innerHTML = `
            <img src="${foto.url}" alt="${foto.texto}" class="carrusel-img">
            <div class="carrusel-info">
                <div class="carrusel-desc">${foto.texto}</div>
            </div>
        `;
        
        carruselItem.addEventListener('click', () => {
            irAFotoEnSeccion(foto.seccionId, foto.indiceEnSeccion);
        });
        
        container.appendChild(carruselItem);
    });
    
    fotos.forEach((_, index) => {
        const dot = document.createElement('button');
        dot.className = `carrusel-dot ${index === 0 ? 'active' : ''}`;
        dot.addEventListener('click', () => {
            pausarCarrusel();
            moverCarruselA(index);
        });
        dotsContainer.appendChild(dot);
    });
    
    configurarBotonesCarrusel();
    actualizarCarrusel();
}

function configurarBotonesCarrusel() {
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            pausarCarrusel();
            moverCarruselA(carruselActualIndex - 1);
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            pausarCarrusel();
            moverCarruselA(carruselActualIndex + 1);
        });
    }
}

function pausarCarrusel() {
    clearInterval(autoPlayInterval);
    setTimeout(() => {
        iniciarAutoPlay();
    }, 30000);
}

function moverCarruselA(nuevoIndex) {
    if (nuevoIndex < 0) {
        nuevoIndex = carruselFotos.length - 1;
    } else if (nuevoIndex >= carruselFotos.length) {
        nuevoIndex = 0;
    }
    
    carruselActualIndex = nuevoIndex;
    actualizarCarrusel();
}

function actualizarCarrusel() {
    const carruselInner = document.querySelector('.carrusel-inner');
    const dots = document.querySelectorAll('.carrusel-dot');
    
    if (carruselInner) {
        carruselInner.style.transform = `translateX(-${carruselActualIndex * 100}%)`;
    }
    
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === carruselActualIndex);
    });
}

function iniciarAutoPlay() {
    autoPlayInterval = setInterval(() => {
        moverCarruselA(carruselActualIndex + 1);
    }, 20000);
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
        mostrarSeccion(seccion);
        setTimeout(() => {
            const foto = seccion.fotos[fotoIndex];
            if (foto) {
                mostrarModal(foto.url, foto.texto, fotoIndex);
            }
        }, 400);
    }
}

// ================== MOSTRAR SECCIÓN ==================
function mostrarSeccion(seccion) {
    console.log('🖼️ Mostrando sección:', seccion.titulo);
    
    currentSeccion = seccion;
    
    if (!seccion.fotos || !Array.isArray(seccion.fotos)) {
        console.error('❌ No hay fotos en esta sección:', seccion);
        return;
    }
    
    todasLasFotos = seccion.fotos;
    
    const homeView = document.getElementById('home-view');
    if (homeView) homeView.style.display = 'none';
    
    const inspirationSection = document.getElementById('inspiration-section');
    if (inspirationSection) inspirationSection.style.display = 'none';
    
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
        <div class="seccion-title-container">
            <h1>${seccion.titulo}</h1>
        </div>
    </header>
    <div class="fotos-grid" id="fotos-container"></div>
`;
    
    seccionView.style.display = 'block';
    
    const backButton = seccionView.querySelector('.back-button');
    if (backButton) {
        backButton.addEventListener('click', volverAGaleria);
    }
    
    const container = document.getElementById('fotos-container');
    if (container) {
        container.innerHTML = '';
        
        seccion.fotos.forEach((foto, index) => {
            if (!foto.miniatura || !foto.texto || !foto.url) {
                console.warn('Foto incompleta:', foto);
                return;
            }
            
            const fotoElement = document.createElement('div');
            fotoElement.className = 'foto-item';
            fotoElement.style.animationDelay = `${index * 0.1}s`;
            
            fotoElement.innerHTML = `
                <img src="${foto.miniatura}" alt="${foto.texto}" class="foto-miniatura" loading="lazy">
                    
             `;
            
            fotoElement.addEventListener('click', () => {
                mostrarModal(foto.url, foto.texto, index);
            });
            
            container.appendChild(fotoElement);
        });
        
        console.log(`🎨 Cargadas ${seccion.fotos.length} fotos`);
    }
}

// ================== MODAL CON ZOOM COMPLETO ==================
function mostrarModal(imageUrl, title, fotoIndex) {
    const modal = document.getElementById('modal');
    currentFotoIndex = fotoIndex;
    isModalOpen = true;
    
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
    
    const img = new Image();
    img.onload = function() {
        modalImg.src = imageUrl;
        modalImg.alt = title;
        currentImage = modalImg;
        
        resetZoom();
        
        modal.classList.add('active');
        document.body.classList.add('modal-open');
        
        configurarEventosModal();
    };
    img.onerror = function() {
        modalImg.src = imageUrl;
        modalImg.alt = title;
        currentImage = modalImg;
        resetZoom();
        modal.classList.add('active');
        document.body.classList.add('modal-open');
        configurarEventosModal();
    };
    img.src = imageUrl;
    
    function configurarEventosModal() {
        const closeBtn = modal.querySelector('.close-modal');
        const prevBtn = modal.querySelector('.prev-button');
        const nextBtn = modal.querySelector('.next-button');
        
        if (closeBtn) closeBtn.onclick = closeModal;
        if (prevBtn) prevBtn.onclick = () => navegarFoto(-1);
        if (nextBtn) nextBtn.onclick = () => navegarFoto(1);
        
        // CLICK FUERA DEL MODAL = CERRAR
        modal.addEventListener('click', function(event) {
            if (event.target === modal) {
                closeModal();
            }
        });
        
        // CLICK EN IMAGEN = CERRAR (solo sin zoom)
        let clickCount = 0;
        let clickTimer = null;
        
        modalImg.addEventListener('click', function(event) {
            clickCount++;
            
            if (clickCount === 1) {
                clickTimer = setTimeout(() => {
                    // Un solo clic - cerrar solo si no hay zoom
                    if (currentScale <= 1) {
                        closeModal();
                    }
                    clickCount = 0;
                }, 300);
            } else if (clickCount === 2) {
                // Doble clic - toggle zoom 100% ↔ 200%
                clearTimeout(clickTimer);
                toggleZoomDobleClic();
                clickCount = 0;
            }
            
            event.stopPropagation();
        });
        
        // ZOOM CON RUEDA DEL RATÓN
        modal.addEventListener('wheel', function(e) {
            e.preventDefault();
            
            const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
            const newScale = currentScale * zoomFactor;
            
            if (newScale >= 0.5 && newScale <= 5) {
                currentScale = newScale;
                aplicarZoom();
            }
        }, { passive: false });
        
        // ARRASTRE CON ZOOM
        modalImg.addEventListener('mousedown', startDrag);
        modalImg.addEventListener('touchstart', startDragTouch);
        
        // TECLADO
        document.addEventListener('keydown', function manejarTeclado(event) {
            switch(event.key) {
                case 'Escape': closeModal(); break;
                case 'ArrowLeft': navegarFoto(-1); break;
                case 'ArrowRight': navegarFoto(1); break;
            }
        });
    }
    
    function toggleZoomDobleClic() {
        if (currentScale === 1) {
            // Si está en 100%, ir a 200%
            currentScale = 2;
            console.log('🔍 Zoom a 200% por doble clic');
        } else {
            // Si está en cualquier zoom, volver a 100%
            currentScale = 1;
            translateX = 0;
            translateY = 0;
            console.log('🔍 Volviendo a 100% por doble clic');
        }
        aplicarZoom();
    }
        
}

// ================== SISTEMA DE ZOOM Y ARRASTRE ==================
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

// ================== NAVEGACIÓN ENTRE FOTOS ==================
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
    
    // Resetear zoom antes de cambiar imagen
    resetZoom();
    
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
        currentImage = modalImg;
        if (fotoCounter) {
            fotoCounter.textContent = `${currentFotoIndex + 1} / ${todasLasFotos.length}`;
        }
        if (fotoTitle) {
            fotoTitle.textContent = nuevaFoto.texto;
        }
    };
    img.src = nuevaFoto.url;
}

// ================== MANEJO DE ROTACIÓN EN MÓVILES - MEJORADO ==================
function initMobileRotationHandler() {
    let esVertical = window.innerHeight > window.innerWidth;
    let ultimaOrientacion = esVertical;
    
    window.addEventListener('resize', () => {
        const nuevaOrientacion = window.innerHeight > window.innerWidth;
        
        // Si cambió la orientación Y el modal está abierto
        if (ultimaOrientacion !== nuevaOrientacion && isModalOpen) {
            console.log('📱 Cambio de orientación detectado con modal abierto');
            
            // CERRAR MODAL automáticamente al girar pantalla
            setTimeout(() => {
                const modal = document.getElementById('modal');
                if (modal && modal.classList.contains('active')) {
                    console.log('🔄 Cerrando modal por cambio de orientación');
                    closeModal();
                }
            }, 100);
        }
        
        ultimaOrientacion = nuevaOrientacion;
    });
}

// Y actualizar la función closeModal para que sea global:
function closeModal() {
    const modal = document.getElementById('modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.classList.remove('modal-open');
        isModalOpen = false;
        resetZoom();
        console.log('✅ Modal cerrado');
    }
}

// ================== FUNCIÓN VOLVER A GALERÍA ==================
function volverAGaleria() {
    console.log('🏠 Volviendo a galería...');
    
    currentSeccion = null;
    currentFotoIndex = 0;
    todasLasFotos = [];
    isModalOpen = false;
    
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
document.addEventListener('DOMContentLoaded', function() {
    iniciar();
    initMobileRotationHandler();
});
