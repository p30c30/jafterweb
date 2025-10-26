// ===== CONFIGURACIÓN =====
const CONFIG = {
    animationDuration: 300,
    fadeInDelay: 50,
    scrollOffset: 100,
    mobileBreakpoint: 768,
    transitionDuration: 300
};

// ===== VARIABLES GLOBALES =====
let gallery = document.querySelector('.gallery');
let mainContent = document.querySelector('.main-content');
let volverBtn = document.querySelector('.volver');
let currentSection = null;

// ===== FUNCIÓN: Crear tarjetas visuales en la portada =====
function crearTarjetasPortada() {
    const contenedor = document.createElement('div');
    contenedor.className = 'portada-secciones';
    mainContent.innerHTML = '';
    
    const secciones = window.galeriaData.secciones;
    
    secciones.forEach(seccion => {
        const tarjeta = document.createElement('div');
        tarjeta.className = 'tarjeta-seccion';
        tarjeta.innerHTML = `
            <div class="tarjeta-imagen">
                <img src="${seccion.preview}" alt="${seccion.titulo}">
            </div>
            <div class="tarjeta-info">
                <h2>${seccion.titulo}</h2>
                <p>${seccion.descripcion}</p>
            </div>
        `;
        
        tarjeta.addEventListener('click', () => {
            abrirSeccion(seccion);
        });
        
        contenedor.appendChild(tarjeta);
    });
    
    mainContent.appendChild(contenedor);
    
    // Añadir frase y sección inspiradora al final
    if (window.galeriaData.fraseInspiradora) {
        const seccionInspiradora = document.createElement('div');
        seccionInspiradora.className = 'seccion-inspiradora';
        seccionInspiradora.innerHTML = `
            <div class="frase-inspiradora">
                <p>${window.galeriaData.fraseInspiradora.texto}</p>
                <span class="frase-autor">— ${window.galeriaData.fraseInspiradora.autor}</span>
            </div>
        `;
        mainContent.appendChild(seccionInspiradora);
    }
}

// ===== FUNCIÓN: Abrir una sección específica =====
function abrirSeccion(seccion) {
    currentSection = seccion;
    const portada = document.querySelector('.portada-secciones');
    const inspiradora = document.querySelector('.seccion-inspiradora');
    
    if (portada) portada.style.display = 'none';
    if (inspiradora) inspiradora.style.display = 'none';
    
    gallery.innerHTML = '';
    gallery.style.display = 'grid';
    volverBtn.style.display = 'block';
    
    // Crear título de sección
    const tituloSeccion = document.createElement('div');
    tituloSeccion.className = 'titulo-seccion';
    tituloSeccion.innerHTML = `<h1>${seccion.titulo}</h1>`;
    gallery.appendChild(tituloSeccion);
    
    crearGaleria(seccion);
}

// ===== FUNCIÓN: Crear galería de fotos =====
function crearGaleria(seccion) {
    const galeriaFotos = document.createElement('div');
    galeriaFotos.className = 'galeria-fotos';
    
    seccion.fotos.forEach((foto, index) => {
        const item = document.createElement('div');
        item.className = 'foto-item';
        item.innerHTML = `
            <img src="${foto.miniatura}" alt="${foto.texto}">
        `;
        
        item.addEventListener('click', () => {
            abrirModal(foto, seccion.fotos);
        });
        
        galeriaFotos.appendChild(item);
    });
    
    gallery.appendChild(galeriaFotos);
}

// ===== FUNCIÓN: Abrir modal con imagen grande =====
function abrirModal(foto, todasLasFotos) {
    const modal = document.createElement('div');
    modal.className = 'modal-foto';
    modal.innerHTML = `
        <div class="modal-contenido">
            <button class="modal-cerrar">&times;</button>
            <img src="${foto.url}" alt="${foto.texto}">
            <p class="modal-texto">${foto.texto}</p>
        </div>
    `;
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target.classList.contains('modal-cerrar')) {
            modal.remove();
        }
    });
    
    document.body.appendChild(modal);
}

// ===== FUNCIÓN: Volver a la portada =====
function volverPortada() {
    currentSection = null;
    gallery.innerHTML = '';
    gallery.style.display = 'none';
    volverBtn.style.display = 'none';
    
    const portada = document.querySelector('.portada-secciones');
    const inspiradora = document.querySelector('.seccion-inspiradora');
    
    if (portada) portada.style.display = 'grid';
    if (inspiradora) inspiradora.style.display = 'block';
}

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
    crearTarjetasPortada();
    volverBtn.addEventListener('click', volverPortada);
});