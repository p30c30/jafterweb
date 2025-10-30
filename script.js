// SCRIPT MEJORADO - MANTIENE SIMPLICIDAD PERO CON NUEVAS FUNCIONALIDADES
let currentSection = '';
let currentPhotos = [];
let currentIndex = 0;
let isModalOpen = false;

function iniciar() {
    console.log('🚀 INICIANDO GALERÍA...');

    // Esperar a que el DOM esté listo
    setTimeout(() => {
        console.log('🔍 Buscando contenedores...');
        const container = document.getElementById('secciones-container');
        const galleryContainer = document.getElementById('gallery');
        
        console.log('Contenedor principal:', container);
        console.log('Contenedor galería:', galleryContainer);

        if (container && galleryContainer) {
            console.log('✅ Contenedores EXISTEN, cargando datos...');
            cargarDatos(container);
            initScrollToTop();
            initMobileRotationHandler();
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
    
    // Ocultar home y mostrar vista de sección
    document.getElementById('home-view').style.display = 'none';
    document.getElementById('seccion-view').style.display = 'block';
    
    // Actualizar header de sección
    document.querySelector('.seccion-header h1').textContent = seccion.titulo;
    document.querySelector('.seccion-header p').textContent = seccion.descripcion;
    
    const galleryContainer = document.getElementById('gallery');
    galleryContainer.innerHTML = '<div class="loading">Cargando fotos...</div>';
    
    // Crear grid de fotos con ratios reales
    setTimeout(async () => {
        const grid = document.createElement('div');
        grid.className = 'fotos-grid';
        
        // Crear miniaturas para cada foto
        for (let i = 0; i < seccion.fotos.length; i++) {
            const thumb = await crearMiniatura(seccion.fotos[i], i);
            grid.appendChild(thumb);
        }
        
        galleryContainer.innerHTML = '';
        galleryContainer.appendChild(grid);
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        console.log('✅ Galería cargada:', seccion.fotos.length, 'fotos');
    }, 100);
}

// Crear miniatura con ratio real
async function crearMiniatura(foto, index) {
    const item = document.createElement('div');
    item.className = 'foto-item';
    
    // Calcular ratio real de la imagen
    try {
        const ratio = await calcularRatio(foto.miniatura);
        item.style.aspectRatio = ratio;
    } catch (error) {
        item.style.aspectRatio = '4/3'; // Ratio por defecto
    }
    
    const img = document.createElement('img');
    img.src = foto.miniatura;
    img.alt = foto.texto || 'Foto de galería';
    img.className = 'foto-miniatura';
    img.loading = 'lazy';
    
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

// Calcular ratio de aspecto real
function calcularRatio(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = function() {
            const ratio = this.naturalWidth / this.naturalHeight;
            resolve(ratio);
        };
        img.onerror = () => reject('Error cargando imagen');
        img.src = url;
    });
}

// MODAL - Funciones simples
function abrirModal(index) {
    console.log('🖼️ Abriendo modal para foto:', index);
    
    currentIndex = index;
    isModalOpen = true;
    
    const foto = currentPhotos[currentIndex];
    if (!foto) return;
    
    // Actualizar contenido del modal - SOLO TEXTO, NO TÍTULO
    document.getElementById('modalImage').src = foto.url;
    document.getElementById('photoText').textContent = foto.texto || '';
    document.getElementById('photoCounter').textContent = `${currentIndex + 1} / ${currentPhotos.length}`;
    
    // OCULTAR el título de sección en el modal
    const modalTitle = document.getElementById('modalTitle');
    if (modalTitle) {
        modalTitle.style.display = 'none';
    }
    
    // Mostrar modal
    const modal = document.getElementById('modal');
    modal.style.display = 'flex';
    document.body.classList.add('modal-open');
    
    // Animación de entrada
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);
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
    document.getElementById('modalImage').src = foto.url;
    document.getElementById('photoText').textContent = foto.texto || '';
    document.getElementById('photoCounter').textContent = `${currentIndex + 1} / ${currentPhotos.length}`;
}

// BOTÓN SCROLL TO TOP - Simple
function initScrollToTop() {
    const scrollBtn = document.createElement('button');
    scrollBtn.innerHTML = '↑';
    scrollBtn.className = 'scroll-to-top';
    scrollBtn.title = 'Volver al inicio';
    
    // Mostrar/ocultar al hacer scroll
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            scrollBtn.classList.add('visible');
        } else {
            scrollBtn.classList.remove('visible');
        }
    });
    
    // Scroll suave al hacer click
    scrollBtn.onclick = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };
    
    document.body.appendChild(scrollBtn);
}

// MANEJO DE ROTACIÓN EN MÓVILES - Simple
function initMobileRotationHandler() {
    let esVertical = window.innerHeight > window.innerWidth;
    
    window.addEventListener('resize', () => {
        const nuevaOrientacion = window.innerHeight > window.innerWidth;
        
        // Si cambió la orientación y el modal está abierto
        if (esVertical !== nuevaOrientacion && isModalOpen) {
            // Scroll automático para ver el contador
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

// BOTÓN VOLVER - Simple
function configurarBotones() {
    // Botón volver
    const backBtn = document.querySelector('.back-button');
    if (backBtn) {
        backBtn.onclick = () => {
            document.getElementById('seccion-view').style.display = 'none';
            document.getElementById('home-view').style.display = 'block';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };
    }
    
    // Logo click para ir al home
    const logo = document.querySelector('.logo');
    if (logo) {
        logo.onclick = () => {
            document.getElementById('seccion-view').style.display = 'none';
            document.getElementById('home-view').style.display = 'block';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };
    }
    
    // Configurar eventos del modal
    const modalCerrar = document.querySelector('.modal-close');
    const modalPrev = document.querySelector('.modal-prev');
    const modalNext = document.querySelector('.modal-next');
    const modal = document.getElementById('modal');
    
    if (modalCerrar) modalCerrar.onclick = cerrarModal;
    if (modalPrev) modalPrev.onclick = () => navegarFotos('prev');
    if (modalNext) modalNext.onclick = () => navegarFotos('next');
    
    // Cerrar modal al hacer click fuera
    if (modal) {
        modal.onclick = (e) => {
            if (e.target === modal) {
                cerrarModal();
            }
        };
    }
    
    // Navegación con teclado
    document.addEventListener('keydown', (e) => {
        if (isModalOpen) {
            if (e.key === 'Escape') cerrarModal();
            if (e.key === 'ArrowLeft') navegarFotos('prev');
            if (e.key === 'ArrowRight') navegarFotos('next');
        }
    });
}

// INICIAR CUANDO EL DOM ESTÉ LISTO
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        iniciar();
        configurarBotones();
    });
} else {
    iniciar();
    configurarBotones();
}

console.log('✅ Script cargado - Esperando DOM...');
