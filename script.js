// SCRIPT MEJORADO - CON ZOOM ORIGINAL Y INFO QUE DESAPARECE
let currentSection = '';
let currentPhotos = [];
let currentIndex = 0;
let isModalOpen = false;

function iniciar() {
    console.log('🚀 INICIANDO GALERÍA...');

    setTimeout(() => {
        console.log('🔍 Buscando contenedores...');
        const container = document.getElementById('secciones-container');
        const galleryContainer = document.getElementById('gallery');
        
        if (container && galleryContainer) {
            console.log('✅ Contenedores EXISTEN, cargando datos...');
            cargarDatos(container);
            initScrollToTop();
            initMobileRotationHandler();
            configurarBotones();
        } else {
            console.error('❌ Contenedores NO EXISTEN');
            setTimeout(iniciar, 1000);
        }
    }, 1000);
}

async function cargarDatos(container) {
    try {
        console.log('📥 Cargando data.json...');
        const response = await fetch('data.json');
        const data = await response.json();

        console.log('🎨 Creando tarjetas de secciones...');
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
            
            card.onclick = () => {
                mostrarSeccion(seccion, data.secciones);
            };
            
            container.appendChild(card);
        });

        console.log('🎉 ÉXITO: Secciones cargadas');

    } catch (error) {
        console.error('❌ Error cargando datos:', error);
    }
}

async function mostrarSeccion(seccion, todasSecciones) {
    console.log('📂 Mostrando sección:', seccion.titulo);
    
    currentSection = seccion.id;
    currentPhotos = seccion.fotos;
    
    document.getElementById('home-view').style.display = 'none';
    document.getElementById('seccion-view').style.display = 'block';
    
    document.querySelector('.seccion-header h1').textContent = seccion.titulo;
    document.querySelector('.seccion-header p').textContent = seccion.descripcion;
    
    const galleryContainer = document.getElementById('gallery');
    galleryContainer.innerHTML = '<div class="loading">Cargando fotos...</div>';
    
    setTimeout(async () => {
        const grid = document.createElement('div');
        grid.className = 'fotos-grid';
        
        for (let i = 0; i < seccion.fotos.length; i++) {
            const thumb = await crearMiniatura(seccion.fotos[i], i);
            grid.appendChild(thumb);
        }
        
        galleryContainer.innerHTML = '';
        galleryContainer.appendChild(grid);
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        console.log('✅ Galería cargada:', seccion.fotos.length, 'fotos');
    }, 100);
}

// Crear miniatura con altura natural
async function crearMiniatura(foto, index) {
    const item = document.createElement('div');
    item.className = 'foto-item';
    
    const img = document.createElement('img');
    img.src = foto.miniatura;
    img.alt = foto.texto || 'Foto de galería';
    img.className = 'foto-miniatura';
    img.loading = 'lazy';
    
    // ESPERAR a que la imagen cargue para saber sus dimensiones reales
    await new Promise((resolve) => {
        img.onload = function() {
            console.log(`🖼️ Imagen cargada: ${this.naturalWidth}x${this.naturalHeight}`);
            resolve();
        };
        img.onerror = resolve; // Si hay error, continuar igual
    });
    
    item.appendChild(img);
    
    // Agregar texto si existe
    if (foto.texto) {
        const textoDiv = document.createElement('div');
        textoDiv.className = 'foto-texto';
        textoDiv.textContent = foto.texto;
        item.appendChild(textoDiv);
    }
    
    // Al hacer click, abrir modal
    item.onclick = () => {
        abrirModal(index);
    };
    
    return item;
}

// MODAL - MANTIENE ZOOM ORIGINAL
function abrirModal(index) {
    console.log('🖼️ Abriendo modal para foto:', index);
    
    currentIndex = index;
    isModalOpen = true;
    
    const foto = currentPhotos[currentIndex];
    if (!foto) return;
    
    const modalImage = document.getElementById('modalImage');
    modalImage.src = foto.url;
    
    // LIMPIAR TEXTO - REMOVER SPOTTING
    let textoLimpio = foto.texto || '';
    textoLimpio = textoLimpio.replace(/spotting/gi, '').trim();
    document.getElementById('photoText').textContent = textoLimpio;
    
    document.getElementById('photoCounter').textContent = `${currentIndex + 1} / ${currentPhotos.length}`;
    
    // OCULTAR TÍTULO DE SECCIÓN
    const modalTitle = document.querySelector('.modal-title');
    if (modalTitle) {
        modalTitle.style.display = 'none';
        modalTitle.textContent = '';
    }
    
    // Reset clase zoomed
    modalImage.classList.remove('zoomed');
    
    // Configurar detección de zoom automática
    configurarDeteccionZoom();
    
    const modal = document.getElementById('modal');
    modal.style.display = 'flex';
    document.body.classList.add('modal-open');
    
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);
}

// DETECTAR ZOOM AUTOMÁTICAMENTE (sin cambiar tu sistema actual)
function configurarDeteccionZoom() {
    const modalImage = document.getElementById('modalImage');
    
    if (!modalImage) return;
    
    // Observar cambios en el transform para detectar zoom
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                const transform = modalImage.style.transform;
                const tieneZoom = transform && transform !== 'scale(1)' && transform !== '' && transform !== 'none';
                
                if (tieneZoom && !modalImage.classList.contains('zoomed')) {
                    modalImage.classList.add('zoomed');
                    console.log('🔍 Zoom detectado - info oculta');
                } else if (!tieneZoom && modalImage.classList.contains('zoomed')) {
                    modalImage.classList.remove('zoomed');
                    console.log('🔍 Sin zoom - info visible');
                }
            }
        });
    });
    
    observer.observe(modalImage, {
        attributes: true,
        attributeFilter: ['style']
    });
}

function cerrarModal() {
    console.log('❌ Cerrando modal');
    
    isModalOpen = false;
    const modal = document.getElementById('modal');
    modal.classList.remove('active');
    
    setTimeout(() => {
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
    }, 300);
}

function navegarFotos(direccion) {
    if (direccion === 'prev') {
        currentIndex = currentIndex > 0 ? currentIndex - 1 : currentPhotos.length - 1;
    } else {
        currentIndex = currentIndex < currentPhotos.length - 1 ? currentIndex + 1 : 0;
    }
    
    const foto = currentPhotos[currentIndex];
    const modalImage = document.getElementById('modalImage');
    modalImage.src = foto.url;
    
    // LIMPIAR TEXTO - REMOVER SPOTTING
    let textoLimpio = foto.texto || '';
    textoLimpio = textoLimpio.replace(/spotting/gi, '').trim();
    document.getElementById('photoText').textContent = textoLimpio;
    
    document.getElementById('photoCounter').textContent = `${currentIndex + 1} / ${currentPhotos.length}`;
    
    // Reset zoom al cambiar foto
    modalImage.classList.remove('zoomed');
}

// BOTÓN SCROLL TO TOP
function initScrollToTop() {
    const scrollBtn = document.createElement('button');
    scrollBtn.innerHTML = '↑';
    scrollBtn.className = 'scroll-to-top';
    scrollBtn.title = 'Volver al inicio';
    
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            scrollBtn.classList.add('visible');
        } else {
            scrollBtn.classList.remove('visible');
        }
    });
    
    scrollBtn.onclick = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };
    
    document.body.appendChild(scrollBtn);
}

// MANEJO DE ROTACIÓN EN MÓVILES
function initMobileRotationHandler() {
    let esVertical = window.innerHeight > window.innerWidth;
    
    window.addEventListener('resize', () => {
        const nuevaOrientacion = window.innerHeight > window.innerWidth;
        
        if (esVertical !== nuevaOrientacion && isModalOpen) {
            setTimeout(() => {
                const contador = document.querySelector('.foto-counter');
                if (contador) {
                    contador.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });
                }
            }, 200);
        }
        
        esVertical = nuevaOrientacion;
    });
}

// BOTÓN VOLVER
function configurarBotones() {
    const backBtn = document.querySelector('.back-button');
    if (backBtn) {
        backBtn.onclick = () => {
            document.getElementById('seccion-view').style.display = 'none';
            document.getElementById('home-view').style.display = 'block';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };
    }
    
    const logo = document.querySelector('.logo');
    if (logo) {
        logo.onclick = () => {
            document.getElementById('seccion-view').style.display = 'none';
            document.getElementById('home-view').style.display = 'block';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };
    }
    
    const modalCerrar = document.querySelector('.modal-close');
    const modalPrev = document.querySelector('.modal-prev');
    const modalNext = document.querySelector('.modal-next');
    const modal = document.getElementById('modal');
    
    if (modalCerrar) modalCerrar.onclick = cerrarModal;
    if (modalPrev) modalPrev.onclick = () => navegarFotos('prev');
    if (modalNext) modalNext.onclick = () => navegarFotos('next');
    
    if (modal) {
        modal.onclick = (e) => {
            if (e.target === modal) {
                cerrarModal();
            }
        };
    }
    
    document.addEventListener('keydown', (e) => {
        if (isModalOpen) {
            if (e.key === 'Escape') cerrarModal();
            if (e.key === 'ArrowLeft') navegarFotos('prev');
            if (e.key === 'ArrowRight') navegarFotos('next');
        }
    });
}

// INICIAR
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        iniciar();
    });
} else {
    iniciar();
}

console.log('✅ Script cargado - Esperando DOM...');
