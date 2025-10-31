// SCRIPT.JS - VERSIÓN COMPLETA CON ZOOM Y CARRUSEL
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
    
    crearNavegacion();
    mejorarCargaImagenes();
    mejorarModal();
    
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
            
            // Añadir subtítulo después de cargar
            const h1 = document.querySelector('.home-view h1');
            if (h1 && !document.querySelector('.hero-subtitle')) {
                const subtitle = document.createElement('p');
                subtitle.className = 'hero-subtitle';
                subtitle.textContent = 'Descubre la belleza en cada instante capturado';
                h1.parentNode.insertBefore(subtitle, h1.nextSibling);
            }
        } else {
            console.error('❌ Contenedor NO EXISTE');
            setTimeout(iniciar, 1000);
        }
    }, 1000);
}

// ================== MEJORAS DE NAVEGACIÓN ==================
function crearNavegacion() {
    const header = document.querySelector('.site-header');
    if (!header) return;
    
    const navHTML = `
        <nav class="main-nav">
            <ul class="nav-list">
                <li><a href="#inicio" class="nav-link active">Inicio</a></li>
                <li><a href="#colecciones" class="nav-link">Colecciones</a></li>
                <li><a href="#ultimas-fotos" class="nav-link">Últimas Fotos</a></li>
                <li><a href="#inspiracion" class="nav-link">Inspiración</a></li>
            </ul>
        </nav>
        <button class="menu-toggle" id="menuToggle">
            <span></span>
            <span></span>
            <span></span>
        </button>
    `;
    
    header.innerHTML += navHTML;
    
    // Configurar eventos de navegación
    configurarNavegacion();
}

function configurarNavegacion() {
    // Navegación suave
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            scrollToSection(targetId);
            
            // Actualizar navegación activa
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Cerrar menú móvil si está abierto
            const mainNav = document.querySelector('.main-nav');
            const menuToggle = document.getElementById('menuToggle');
            if (mainNav && menuToggle) {
                mainNav.classList.remove('active');
                menuToggle.classList.remove('active');
            }
        });
    });
    
    // Menú móvil
    const menuToggle = document.getElementById('menuToggle');
    const mainNav = document.querySelector('.main-nav');
    
    if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', () => {
            mainNav.classList.toggle('active');
            menuToggle.classList.toggle('active');
        });
    }
}

function scrollToSection(sectionId) {
    const sections = {
        'inicio': () => window.scrollTo({ top: 0, behavior: 'smooth' }),
        'colecciones': () => {
            const element = document.getElementById('secciones-container');
            if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        },
        'ultimas-fotos': () => {
            const element = document.querySelector('.ultimas-fotos-section');
            if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        },
        'inspiracion': () => {
            const element = document.getElementById('inspiration-section');
            if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };
    
    if (sections[sectionId]) {
        sections[sectionId]();
    }
}

// ================== MEJORAS EN LA CARGA ==================
function mejorarCargaImagenes() {
    // Precargar imágenes importantes
    const imagenesPrecargar = [
        'https://images2.imgbox.com/a7/ae/imIfzK4c_o.jpg'
    ];
    
    imagenesPrecargar.forEach(src => {
        const img = new Image();
        img.src = src;
    });
    
    // Mejorar lazy loading
    if ('IntersectionObserver' in window) {
        const lazyImages = document.querySelectorAll('img[loading="lazy"]');
        
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        lazyImages.forEach(img => imageObserver.observe(img));
    }
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
            pausar
