// Configuración inicial
const CONFIG = {
    animationDuration: 300,
    fadeInDelay: 100,
    scrollOffset: 80,
    mobileBreakpoint: 768,
    transitionDuration: 300
};

// Función para crear las secciones de la galería
function createGallerySections() {
    const gallery = document.getElementById('gallery');
    if (!gallery || !window.portfolioData) return;

    const categories = {
        furniture: { title: 'Mobiliario', icon: '🪑' },
        kitchen: { title: 'Cocina', icon: '🍳' },
        bathroom: { title: 'Baño', icon: '🚿' },
        decoration: { title: 'Decoración', icon: '✨' },
        lighting: { title: 'Iluminación', icon: '💡' }
    };

    let html = '';
    for (const [key, category] of Object.entries(categories)) {
        const items = window.portfolioData[key] || [];
        if (items.length === 0) continue;

        html += `
            <section class="gallery-category" id="${key}">
                <div class="category-header">
                    <span class="category-icon">${category.icon}</span>
                    <h2 class="category-title">${category.title}</h2>
                </div>
                <div class="gallery-grid">
        `;

        items.forEach(item => {
            html += `
                <div class="gallery-item" data-category="${key}">
                    <div class="item-image">
                        <img src="${item.image}" alt="${item.title}" loading="lazy">
                        <div class="item-overlay">
                            <h3 class="item-title">${item.title}</h3>
                            <p class="item-description">${item.description}</p>
                        </div>
                    </div>
                </div>
            `;
        });

        html += `
                </div>
            </section>
        `;
    }

    gallery.innerHTML = html;
}

// Función para crear el contenido de inspiración
function createInspirationContent() {
    const inspiration = document.getElementById('inspiration');
    if (!inspiration) return;

    const inspirationData = [
        {
            title: 'Minimalismo Nórdico',
            description: 'Espacios luminosos con líneas limpias y funcionalidad',
            image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800',
            tags: ['Escandinavo', 'Minimalista', 'Luminoso']
        },
        {
            title: 'Estilo Industrial',
            description: 'Combinación de materiales crudos y acabados modernos',
            image: 'https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=800',
            tags: ['Industrial', 'Urbano', 'Moderno']
        },
        {
            title: 'Diseño Contemporáneo',
            description: 'Elegancia y sofisticación en cada detalle',
            image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800',
            tags: ['Contemporáneo', 'Elegante', 'Sofisticado']
        }
    ];

    let html = '<div class="inspiration-grid">';
    inspirationData.forEach(item => {
        html += `
            <div class="inspiration-card">
                <div class="inspiration-image">
                    <img src="${item.image}" alt="${item.title}" loading="lazy">
                </div>
                <div class="inspiration-content">
                    <h3>${item.title}</h3>
                    <p>${item.description}</p>
                    <div class="inspiration-tags">
        `;
        item.tags.forEach(tag => {
            html += `<span class="tag">${tag}</span>`;
        });
        html += `
                    </div>
                </div>
            </div>
        `;
    });
    html += '</div>';

    inspiration.innerHTML = html;
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    createGallerySections();
    createInspirationContent();

    // Navegación suave
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(anchor.getAttribute('href'));
            if (target) {
                const offsetTop = target.offsetTop - CONFIG.scrollOffset;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Animación de aparición de elementos
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.gallery-item, .inspiration-card').forEach(item => {
        observer.observe(item);
    });

    // Menú móvil
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('nav ul');
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }
});
