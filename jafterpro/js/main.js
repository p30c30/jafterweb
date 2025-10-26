// Configuración global
const CONFIG = {
    animationDuration: 500,
    fadeInDelay: 100,
    scrollOffset: 80,
    mobileBreakpoint: 768,
    transitionDuration: 300
};

// Referencias principales
const gallery = document.getElementById('gallery');
const mainContent = document.getElementById('main-content');
const volverBtn = document.getElementById('volver');

// Estado de la aplicación
let currentSection = null;

// Función para crear tarjetas en la portada
function crearTarjetasPortada() {
    const contenedor = document.getElementById('portada-grid');
    if (!contenedor) return;
    
    contenedor.innerHTML = '';
    
    // Obtener las secciones de window.galeriaData
    const secciones = window.galeriaData?.secciones || [];
    
    secciones.forEach(seccion => {
        const tarjeta = document.createElement('div');
        tarjeta.className = 'tarjeta-seccion';
        tarjeta.innerHTML = `
            <img src="${seccion.preview}" alt="${seccion.titulo}">
            <div class="tarjeta-info">
                <h3>${seccion.titulo}</h3>
                <p>${seccion.descripcion}</p>
            </div>
        `;
        
        tarjeta.addEventListener('click', () => {
            abrirSeccion(seccion);
        });
        
        contenedor.appendChild(tarjeta);
    });
}

// Función para abrir una sección y mostrar su galería
function abrirSeccion(seccion) {
    currentSection = seccion;
    
    // Ocultar portada
    const portada = document.getElementById('portada');
    if (portada) portada.style.display = 'none';
    
    // Ocultar sección inspiradora
    const inspiradora = document.getElementById('seccion-inspiradora');
    if (inspiradora) inspiradora.style.display = 'none';
    
    // Mostrar galería y botón volver
    if (gallery) gallery.style.display = 'block';
    if (volverBtn) volverBtn.style.display = 'block';
    
    // Crear galería de fotos
    crearGaleria(seccion);
    
    // Scroll al inicio
    window.scrollTo(0, 0);
}

// Función para crear la galería de fotos de una sección
function crearGaleria(seccion) {
    if (!gallery) return;
    
    gallery.innerHTML = `
        <div class="galeria-header">
            <h2>${seccion.titulo}</h2>
            <p>${seccion.descripcion}</p>
        </div>
        <div class="galeria-grid" id="galeria-fotos"></div>
    `;
    
    const galeriaFotos = document.getElementById('galeria-fotos');
    if (!galeriaFotos) return;
    
    seccion.fotos.forEach(foto => {
        const item = document.createElement('div');
        item.className = 'galeria-item';
        item.innerHTML = `
            <img src="${foto.miniatura}" alt="${foto.texto}">
            <div class="galeria-overlay">
                <p>${foto.texto}</p>
            </div>
        `;
        
        item.addEventListener('click', () => {
            abrirModal(foto, seccion.fotos);
        });
        
        galeriaFotos.appendChild(item);
    });
}

// Función para abrir modal con la imagen grande
function abrirModal(foto, todasLasFotos) {
    // Crear modal si no existe
    let modal = document.getElementById('modal-foto');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-foto';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-contenido">
                <span class="modal-cerrar">&times;</span>
                <img src="" alt="" id="modal-imagen">
                <div class="modal-nav">
                    <button class="modal-prev">&lt;</button>
                    <button class="modal-next">&gt;</button>
                </div>
                <p class="modal-texto"></p>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Eventos del modal
        modal.querySelector('.modal-cerrar').addEventListener('click', cerrarModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) cerrarModal();
        });
    }
    
    // Mostrar imagen en el modal
    const modalImagen = document.getElementById('modal-imagen');
    const modalTexto = modal.querySelector('.modal-texto');
    
    modalImagen.src = foto.url;
    modalImagen.alt = foto.texto;
    modalTexto.textContent = foto.texto;
    
    modal.style.display = 'flex';
}

// Función para cerrar el modal
function cerrarModal() {
    const modal = document.getElementById('modal-foto');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Función para volver a la portada
function volverPortada() {
    // Mostrar portada
    const portada = document.getElementById('portada');
    if (portada) portada.style.display = 'block';
    
    // Mostrar sección inspiradora
    const inspiradora = document.getElementById('seccion-inspiradora');
    if (inspiradora) inspiradora.style.display = 'block';
    
    // Ocultar galería y botón volver
    if (gallery) gallery.style.display = 'none';
    if (volverBtn) volverBtn.style.display = 'none';
    
    // Limpiar galería
    if (gallery) gallery.innerHTML = '';
    
    currentSection = null;
    
    // Scroll al inicio
    window.scrollTo(0, 0);
}

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', () => {
    // Crear tarjetas de la portada
    crearTarjetasPortada();
    
    // Configurar botón volver
    if (volverBtn) {
        volverBtn.addEventListener('click', volverPortada);
        volverBtn.style.display = 'none';
    }
    
    // Ocultar galería inicialmente
    if (gallery) {
        gallery.style.display = 'none';
    }
    
    // Asegurar que la portada y sección inspiradora estén visibles
    const portada = document.getElementById('portada');
    if (portada) portada.style.display = 'block';
    
    const inspiradora = document.getElementById('seccion-inspiradora');
    if (inspiradora) inspiradora.style.display = 'block';
    
    console.log('Aplicación inicializada correctamente');
    console.log('Secciones cargadas:', window.galeriaData?.secciones?.length || 0);
});