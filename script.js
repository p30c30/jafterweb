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
    
    const modalImage = document.getElementById('modal-img'); // ID CORREGIDO
    
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

// SISTEMA DEFINITIVO DE ZOOM CON ARRASTRE
function configurarDeteccionZoom() {
    console.log('🎯 Configurando sistema definitivo de zoom con arrastre...');
    
    const modalImage = document.getElementById('modal-img');
    if (!modalImage) return;
    
    const modal = document.getElementById('modal');
    let escala = 1;
    let posX = 0;
    let posY = 0;
    let arrastrando = false;
    let ultimoX, ultimoY;
    
    // FUNCIÓN PARA APLICAR TRANSFORM Y CONTROLAR INFO
    function aplicarTransform() {
        modalImage.style.transform = `scale(${escala}) translate(${posX}px, ${posY}px)`;
        
        // Mostrar/ocultar info basado en zoom
        if (escala > 1.1) {
            modalImage.classList.add('zoomed');
            modalImage.style.cursor = 'grab';
        } else {
            modalImage.classList.remove('zoomed');
            modalImage.style.cursor = 'default';
            // Reset posición cuando no hay zoom
            posX = 0;
            posY = 0;
        }
        
        console.log('🔍 Escala actual:', escala.toFixed(2));
    }
    
    // RUEDA DEL MOUSE PARA ZOOM (sin Ctrl)
    modal.addEventListener('wheel', function(e) {
        e.preventDefault();
        
        // Zoom in/out con rueda DIRECTAMENTE (sin Ctrl)
        const factor = e.deltaY > 0 ? 0.9 : 1.1;
        const nuevaEscala = escala * factor;
        
        // Límites de zoom (0.5x a 3x)
        if (nuevaEscala >= 0.5 && nuevaEscala <= 3) {
            escala = nuevaEscala;
            aplicarTransform();
        }
    }, { passive: false });
    
    // DOBLE CLIC: 100% → 200%, cualquier zoom → 100%
    modalImage.ondblclick = function(e) {
        e.stopPropagation();
        
        if (escala === 1) {
            // Si está en 100%, ir a 200%
            escala = 2;
            console.log('🔍 Zoom a 200% por doble clic');
        } else {
            // Si está en cualquier otro zoom, volver a 100%
            escala = 1;
            console.log('🔍 Volviendo a 100% por doble clic');
        }
        
        aplicarTransform();
    };
    
    // SISTEMA DE ARRASTRE CON ZOOM
    modalImage.onmousedown = function(e) {
        if (escala > 1.1) {
            arrastrando = true;
            ultimoX = e.clientX;
            ultimoY = e.clientY;
            modalImage.style.cursor = 'grabbing';
        }
    };
    
    modal.addEventListener('mousemove', function(e) {
        if (arrastrando) {
            const deltaX = e.clientX - ultimoX;
            const deltaY = e.clientY - ultimoY;
            
            posX += deltaX / escala;
            posY += deltaY / escala;
            
            ultimoX = e.clientX;
            ultimoY = e.clientY;
            
            aplicarTransform();
        }
    });
    
    modal.addEventListener('mouseup', function() {
        arrastrando = false;
        if (escala > 1.1) {
            modalImage.style.cursor = 'grab';
        }
    });
    
    // CLICK SIMPLE MANTIENE COMPORTAMIENTO ORIGINAL (CERRAR MODAL)
    modalImage.onclick = function(e) {
        e.stopPropagation();
        if (escala <= 1.1 && !arrastrando) { // Solo cerrar si no hay zoom y no se estaba arrastrando
            cerrarModal();
        }
    };
    
    // CLICK FUERA DEL MODAL MANTIENE COMPORTAMIENTO ORIGINAL (CERRAR MODAL)
    modal.onclick = function(e) {
        if (e.target === modal) {
            cerrarModal();
        }
    };
    
    // TECLA ESC MANTIENE COMPORTAMIENTO ORIGINAL (CERRAR MODAL)
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && isModalOpen) {
            cerrarModal();
        }
    });
    
    // RESET AL CAMBIAR FOTO
    const originalNavegarFotos = navegarFotos;
    navegarFotos = function(direccion) {
        escala = 1; // Reset a escala normal
        posX = 0;   // Reset posición
        posY = 0;   // Reset posición
        aplicarTransform();
        originalNavegarFotos(direccion);
    };
    
    // Aplicar transform inicial
    aplicarTransform();
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
