document.addEventListener('DOMContentLoaded', function() {
    let currentSection = '';
    let currentPhotos = [];
    let currentIndex = 0;
    let isModalOpen = false;
    
    const galleryContainer = document.getElementById('gallery');
    const modal = document.getElementById('modal');
    const modalImage = document.getElementById('modalImage');
    const modalTitle = document.getElementById('modalTitle');
    const photoText = document.getElementById('photoText');
    const photoCounter = document.getElementById('photoCounter');
    const modalClose = document.querySelector('.modal-close');
    const modalPrev = document.querySelector('.modal-prev');
    const modalNext = document.querySelector('.modal-next');
    
    // Inicializar todas las funciones
    initScrollToTop();
    initMobileRotationHandler();
    
    // Cargar y mostrar secciones
    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            displaySections(data.secciones);
            initUltimasFotosCarousel(data.secciones);
        })
        .catch(error => console.error('Error loading JSON:', error));
    
    // Mostrar secciones en la navegación
    function displaySections(secciones) {
        const nav = document.querySelector('nav ul');
        nav.innerHTML = '';
        
        secciones.forEach(seccion => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = '#';
            a.textContent = seccion.titulo;
            a.setAttribute('data-section', seccion.id);
            
            a.addEventListener('click', (e) => {
                e.preventDefault();
                showSection(seccion.id, secciones);
                // Actualizar navegación activa
                document.querySelectorAll('nav a').forEach(link => link.classList.remove('active'));
                a.classList.add('active');
            });
            
            li.appendChild(a);
            nav.appendChild(li);
        });
        
        // Mostrar primera sección por defecto
        if (secciones.length > 0) {
            showSection(secciones[0].id, secciones);
            document.querySelector('nav a').classList.add('active');
        }
    }
    
    // Mostrar sección específica
    async function showSection(sectionId, secciones) {
        currentSection = sectionId;
        const seccion = secciones.find(s => s.id === sectionId);
        
        if (!seccion) return;
        
        // Mostrar vista de sección y ocultar home
        document.getElementById('home-view').style.display = 'none';
        document.getElementById('seccion-view').style.display = 'block';
        
        // Actualizar header de sección
        document.querySelector('.seccion-header h1').textContent = seccion.titulo;
        document.querySelector('.seccion-header p').textContent = seccion.descripcion;
        
        galleryContainer.innerHTML = '<div class="loading">Cargando...</div>';
        currentPhotos = seccion.fotos;
        
        // Crear grid de miniaturas
        const grid = document.createElement('div');
        grid.className = 'fotos-grid';
        
        // Crear miniaturas con ratios reales
        const thumbnailsPromises = seccion.fotos.map(async (photo, index) => {
            return await createThumbnail(photo, index, sectionId);
        });
        
        const thumbnails = await Promise.all(thumbnailsPromises);
        thumbnails.forEach(thumb => grid.appendChild(thumb));
        
        galleryContainer.innerHTML = '';
        galleryContainer.appendChild(grid);
        
        // Scroll to top al cambiar sección
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    // Crear miniatura con ratio real
    async function createThumbnail(photo, index, sectionId) {
        const thumb = document.createElement('div');
        thumb.className = 'foto-item';
        
        try {
            const ratio = await calculateAspectRatio(photo.miniatura);
            thumb.style.aspectRatio = ratio;
        } catch (error) {
            thumb.style.aspectRatio = '4/3'; // Ratio por defecto
        }
        
        const img = document.createElement('img');
        img.src = photo.miniatura;
        img.alt = photo.texto || 'Foto de galería';
        img.className = 'foto-miniatura';
        img.loading = 'lazy';
        
        // Precargar imagen para mejor experiencia
        img.onload = () => {
            thumb.classList.add('loaded');
        };
        
        thumb.appendChild(img);
        
        // Agregar texto si existe
        if (photo.texto) {
            const textDiv = document.createElement('div');
            textDiv.className = 'foto-texto';
            textDiv.textContent = photo.texto;
            thumb.appendChild(textDiv);
        }
        
        thumb.addEventListener('click', () => openModal(sectionId, index));
        
        return thumb;
    }
    
    // Calcular ratio de aspecto real
    function calculateAspectRatio(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = function() {
                const ratio = this.naturalWidth / this.naturalHeight;
                resolve(ratio);
            };
            img.onerror = () => reject(new Error('No se pudo cargar la imagen'));
            img.src = url;
        });
    }
    
    // Abrir modal
    function openModal(sectionId, index) {
        currentSection = sectionId;
        currentIndex = index;
        isModalOpen = true;
        
        const photo = currentPhotos[currentIndex];
        if (!photo) return;
        
        // Mostrar modal
        modal.style.display = 'flex';
        document.body.classList.add('modal-open');
        
        // Cargar imagen
        modalImage.src = photo.url;
        modalImage.alt = photo.texto || '';
        photoText.textContent = photo.texto || '';
        photoCounter.textContent = `${currentIndex + 1} / ${currentPhotos.length}`;
        
        // Añadir clase active después de un delay para la animación
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);
        
        // Enfocar el modal para navegación por teclado
        modal.focus();
    }
    
    // Cerrar modal
    function closeModal() {
        isModalOpen = false;
        modal.classList.remove('active');
        
        setTimeout(() => {
            modal.style.display = 'none';
            document.body.classList.remove('modal-open');
        }, 300);
    }
    
    // Navegación entre fotos
    function navigatePhotos(direction) {
        if (direction === 'prev') {
            currentIndex = currentIndex > 0 ? currentIndex - 1 : currentPhotos.length - 1;
        } else {
            currentIndex = currentIndex < currentPhotos.length - 1 ? currentIndex + 1 : 0;
        }
        
        const photo = currentPhotos[currentIndex];
        modalImage.src = photo.url;
        modalImage.alt = photo.texto || '';
        photoText.textContent = photo.texto || '';
        photoCounter.textContent = `${currentIndex + 1} / ${currentPhotos.length}`;
    }
    
    // Event listeners para controles del modal
    modalClose.addEventListener('click', closeModal);
    modalPrev.addEventListener('click', (e) => {
        e.stopPropagation();
        navigatePhotos('prev');
    });
    modalNext.addEventListener('click', (e) => {
        e.stopPropagation();
        navigatePhotos('next');
    });
    
    // Navegación con teclado
    document.addEventListener('keydown', (e) => {
        if (isModalOpen) {
            switch(e.key) {
                case 'Escape':
                    closeModal();
                    break;
                case 'ArrowLeft':
                    navigatePhotos('prev');
                    break;
                case 'ArrowRight':
                    navigatePhotos('next');
                    break;
            }
        }
    });
    
    // Cerrar modal al hacer click fuera de la imagen
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // Botón scroll to top
    function initScrollToTop() {
        const scrollBtn = document.createElement('button');
        scrollBtn.innerHTML = '↑';
        scrollBtn.className = 'scroll-to-top';
        scrollBtn.setAttribute('aria-label', 'Volver al inicio');
        scrollBtn.setAttribute('title', 'Volver al inicio');
        document.body.appendChild(scrollBtn);
        
        // Mostrar/ocultar botón al hacer scroll
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                scrollBtn.classList.add('visible');
            } else {
                scrollBtn.classList.remove('visible');
            }
        });
        
        // Scroll suave al hacer click
        scrollBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
    
    // Manejar rotación en móviles
    function initMobileRotationHandler() {
        let portrait = window.innerHeight > window.innerWidth;
        
        window.addEventListener('resize', () => {
            const newPortrait = window.innerHeight > window.innerWidth;
            
            // Si hay cambio de orientación y el modal está abierto
            if (portrait !== newPortrait && isModalOpen) {
                // Pequeño scroll hacia arriba para posicionar sobre el contador
                setTimeout(() => {
                    const counterElement = document.querySelector('.foto-counter');
                    if (counterElement) {
                        counterElement.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center'
                        });
                    }
                }, 200);
            }
            
            portrait = newPortrait;
        });
    }
    
    // Carrusel de últimas fotos
    function initUltimasFotosCarousel(secciones) {
        const carruselInner = document.querySelector('.carrusel-inner');
        const prevBtn = document.querySelector('.prev-btn');
        const nextBtn = document.querySelector('.next-btn');
        const dotsContainer = document.querySelector('.carrusel-dots');
        
        if (!carruselInner) return;
        
        // Obtener todas las fotos de todas las secciones
        let allPhotos = [];
        secciones.forEach(seccion => {
            seccion.fotos.forEach(foto => {
                allPhotos.push({
                    ...foto,
                    section: seccion.id
                });
            });
        });
        
        // Tomar las últimas 5 fotos
        const ultimasFotos = allPhotos.slice(-5);
        
        // Crear items del carrusel
        carruselInner.innerHTML = '';
        ultimasFotos.forEach((foto, index) => {
            const item = document.createElement('div');
            item.className = 'carrusel-item';
            item.innerHTML = `
                <img src="${foto.miniatura}" alt="${foto.texto}" class="carrusel-img">
                <div class="carrusel-info">
                    <div class="carrusel-desc">${foto.texto}</div>
                </div>
            `;
            
            item.addEventListener('click', () => {
                // Encontrar la sección y índice de esta foto
                const seccion = secciones.find(s => s.id === foto.section);
                if (seccion) {
                    const fotoIndex = seccion.fotos.findIndex(f => f.miniatura === foto.miniatura);
                    showSection(foto.section, secciones);
                    setTimeout(() => openModal(foto.section, fotoIndex), 500);
                }
            });
            
            carruselInner.appendChild(item);
        });
        
        // Configurar navegación del carrusel
        let currentSlide = 0;
        
        function updateCarousel() {
            carruselInner.style.transform = `translateX(-${currentSlide * 100}%)`;
            updateDots();
        }
        
        function updateDots() {
            const dots = document.querySelectorAll('.carrusel-dot');
            dots.forEach((dot, index) => {
                dot.classList.toggle('active', index === currentSlide);
            });
        }
        
        // Crear dots
        dotsContainer.innerHTML = '';
        ultimasFotos.forEach((_, index) => {
            const dot = document.createElement('button');
            dot.className = `carrusel-dot ${index === 0 ? 'active' : ''}`;
            dot.addEventListener('click', () => {
                currentSlide = index;
                updateCarousel();
            });
            dotsContainer.appendChild(dot);
        });
        
        // Event listeners para botones
        prevBtn.addEventListener('click', () => {
            currentSlide = currentSlide > 0 ? currentSlide - 1 : ultimasFotos.length - 1;
            updateCarousel();
        });
        
        nextBtn.addEventListener('click', () => {
            currentSlide = currentSlide < ultimasFotos.length - 1 ? currentSlide + 1 : 0;
            updateCarousel();
        });
        
        // Auto-avance cada 5 segundos
        setInterval(() => {
            currentSlide = currentSlide < ultimasFotos.length - 1 ? currentSlide + 1 : 0;
            updateCarousel();
        }, 5000);
    }
    
    // Botón de volver
    document.querySelector('.back-button').addEventListener('click', function() {
        document.getElementById('seccion-view').style.display = 'none';
        document.getElementById('home-view').style.display = 'block';
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    
    // Logo click para ir al home
    document.querySelector('.logo').addEventListener('click', function() {
        document.getElementById('seccion-view').style.display = 'none';
        document.getElementById('home-view').style.display = 'block';
        
        // Remover clase active de navegación
        document.querySelectorAll('nav a').forEach(link => link.classList.remove('active'));
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    
    // Manejar errores de carga de imágenes
    function handleImageErrors() {
        document.addEventListener('error', function(e) {
            if (e.target.tagName === 'IMG') {
                console.warn('Error cargando imagen:', e.target.src);
                e.target.style.opacity = '0.3';
            }
        }, true);
    }
    
    // Inicializar funciones adicionales
    handleImageErrors();
});
