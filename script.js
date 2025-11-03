// SCRIPT.JS v21 — Carrusel infinito + Modal (tap zoom fiable, drag suave, fullscreen móvil, historial chip OK)
console.log('✅ script.js v21 CARGADO');

// ===== Estado global =====
let currentSeccion = null;
let currentFotoIndex = 0;
let todasLasFotos = [];
let carruselActualIndex = 0;
let carruselFotos = [];
let datosGlobales = null;
let isModalOpen = false;

// Scroll-to-top: referencia global y helper de visibilidad
let scrollTopBtn = null;
function refreshScrollTop() {
  if (!scrollTopBtn) return;
  const y = window.scrollY || document.documentElement.scrollTop || 0;
  // Se muestra al pasar cierto scroll. El CSS lo oculta si hay modal (body.modal-open)
  scrollTopBtn.classList.toggle('visible', y > 300);
}

// Evitar que el navegador restaure el scroll anterior
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

// Helper para subir arriba con seguridad tras pintar la vista
function scrollToTopHard() {
  // doble rAF para esperar a layout/paint
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    });
  });
}

// Refuerzo: vuelve arriba ahora, tras unos ticks y al cargar miniaturas
function forceSectionTop(containerEl) {
  const toTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };

  // ahora y en próximos frames
  toTop();
  requestAnimationFrame(() => toTop());
  setTimeout(toTop, 50);
  setTimeout(toTop, 200);
  setTimeout(toTop, 500);

  // cuando carguen las primeras imágenes
  if (containerEl) {
    const imgs = Array.from(containerEl.querySelectorAll('img')).slice(0, 12);
    imgs.forEach(img => {
      if (!img.complete) {
        const bump = () => toTop();
        img.addEventListener('load', bump, { once: true });
        img.addEventListener('error', bump, { once: true });
      }
    });
  }
}

// Modal: fuente de datos ('seccion' | 'carrusel')
let modalSource = 'seccion';

// History API
let currentView = 'home';
let isHandlingPopstate = false;

// Gestos
let ignoreNextClick = false;     // para gestos (swipe/sheet)
let suppressNextClick = false;   // para evitar click “fantasma” después de tap

// Zoom/drag
let currentScale = 1;
let currentImage = null;
let isDragging = false;
let startX, startY;
let translateX = 0, translateY = 0;
let lastX = 0, lastY = 0;
let animationFrameId = null;
let isPinching = false;
let pinchStartDistance = 0;
let pinchStartScale = 1;

// Zoom por clic
const defaultClickZoom = 2;
const SCALE_EPS = 0.01;

// Teclado
let keydownHandler = null;

// Fullscreen change handler (para limpiar al cerrar)
let fullscreenChangeHandler = null;

// Carrusel infinito/autoplay
let carouselTimer = null;
const carouselAutoDelay = 20000;     // 20s
const carouselUserPauseMs = 60000;   // 60s tras interacción
let pendingAutoplayDelay = carouselAutoDelay;
let carruselInnerRef = null;
let carruselRealLength = 0;
let carruselPosition = 1;
let carruselTransitionHandler = null;

// Inercia del drag (mejora PC)
let velX = 0, velY = 0;
let inertiaId = null;
const dragFriction = 0.92;   // 0.90–0.96 (más bajo = más recorrido)
const dragMaxSpeed = 60;     // px por frame
const edgeResistance = 0.18; // “resorte” en bordes

// ===== Inicio =====
function iniciar() {
const logo = document.getElementById('logoHome');
if (logo) {
logo.addEventListener('click', () => {
if (currentView !== 'home') {
history.pushState({ view: 'home' }, '');
aplicarEstado({ view: 'home' });
}
});
}

crearBotonScrollTop();

setTimeout(() => {
const container = document.getElementById('secciones-container');
if (container) {
cargarDatos(container);
} else {
setTimeout(iniciar, 1000);
}
}, 600);

initMobileRotationHandler();
initHistoryHandler();
}


// ===== Scroll to top =====
function crearBotonScrollTop() {
  // Evita duplicados y guarda referencia global
  scrollTopBtn = document.querySelector('.scroll-to-top');
  if (!scrollTopBtn) {
    scrollTopBtn = document.createElement('button');
    scrollTopBtn.className = 'scroll-to-top';
    scrollTopBtn.innerHTML = '↑';
    scrollTopBtn.setAttribute('aria-label', 'Volver arriba');
    document.body.appendChild(scrollTopBtn);
  }

  // Acción
  scrollTopBtn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  // Listeners (siguen estando)
  window.addEventListener('scroll',  refreshScrollTop, { passive: true });
  window.addEventListener('resize',  refreshScrollTop, { passive: true });
  window.addEventListener('load',    refreshScrollTop, { once: true });

  // Estado inicial
  refreshScrollTop();
}

// ===== History API =====
function initHistoryHandler() {
if (!history.state) history.replaceState({ view: 'home' }, '');
window.addEventListener('popstate', (e) => {
const state = e.state || { view: 'home' };
aplicarEstado(state);
});
}
function aplicarEstado(state) {
  isHandlingPopstate = true;

  if (state.view !== 'modal' && isModalOpen) closeModal();

  if (state.view === 'home') {
    volverAGaleriaInternal();

  } else if (state.view === 'seccion') {
    if (datosGlobales) {
      const sec = datosGlobales.secciones.find(s => s.id === state.seccionId);
      sec ? mostrarSeccion(sec, { push: false }) : volverAGaleriaInternal();
    } else {
      volverAGaleriaInternal();
    }

  } else if (state.view === 'modal') {
    if (state.source === 'carrusel') {
      if (!carruselFotos?.length && datosGlobales) {
        carruselFotos = obtenerFotosParaCarrusel(datosGlobales);
      }
      const f = carruselFotos[state.fotoIndex];
      if (f) {
        modalSource = 'carrusel';
        mostrarModal(f.url, f.texto, state.fotoIndex, { push: false });
      } else {
        volverAGaleriaInternal();
      }
    } else {
      if (datosGlobales) {
        const sec = datosGlobales.secciones.find(s => s.id === state.seccionId);
        if (sec) {
          mostrarSeccion(sec, { push: false });
          const foto = sec.fotos[state.fotoIndex] || sec.fotos[0];
          if (foto) {
            modalSource = 'seccion';
            mostrarModal(foto.url, foto.texto, state.fotoIndex, { push: false });
          }
        } else {
          volverAGaleriaInternal();
        }
      } else {
        volverAGaleriaInternal();
      }
    }
  }

  isHandlingPopstate = false;
}
function goBackOneStep() {
if (history.state && history.state.view !== 'home') history.back();
else { aplicarEstado({ view: 'home' }); history.replaceState({ view: 'home' }, ''); }
}

// ===== Datos =====
async function cargarDatos(container) {
try {
const res = await fetch('data.json?v=' + Date.now());
if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
const data = await res.json();
datosGlobales = data;
if (!data?.secciones?.length) throw new Error('Estructura de datos inválida');

container.innerHTML = '';
data.secciones.forEach(seccion => {
const card = document.createElement('div');
card.className = 'card';
card.innerHTML = `
       <img src="${seccion.preview}" alt="${seccion.titulo}" class="card-image">
       <div class="card-content">
         <h3>${seccion.titulo}</h3>
         <p>${seccion.descripcion}</p>
       </div>`;
card.addEventListener('click', () => mostrarSeccion(seccion));
container.appendChild(card);
});

cargarCarrusel(data);
} catch (e) {
console.error('Error cargando datos:', e);
container.innerHTML = `<div class="error-message"><h3>Error al cargar</h3><p>${e.message}</p><button onclick="location.reload()">Reintentar</button></div>`;
}
}

// ===== Carrusel últimas 20 =====
function cargarCarrusel(data) {
const inner = document.getElementById('ultimas-fotos-carrusel');
const dots = document.getElementById('carrusel-dots');
if (!inner) return;

carruselFotos = obtenerFotosParaCarrusel(data);
mostrarCarruselFotos(carruselFotos, inner, dots);
iniciarAutoPlay();
configurarInteraccionCarrusel();
}

function obtenerFotosParaCarrusel(data) {
const planas = [];
data.secciones.forEach(sec => {
if (Array.isArray(sec.fotos)) {
sec.fotos.forEach((foto, i) => planas.push({ ...foto, seccionId: sec.id, seccionTitulo: sec.titulo, indiceEnSeccion: i }));
}
});
return planas.slice(-20).reverse();
}

function mostrarCarruselFotos(fotos, container, dotsContainer) {
container.innerHTML = '';
if (dotsContainer) dotsContainer.innerHTML = '';
if (!fotos.length) {
container.innerHTML = '<div class="carrusel-item"><p class="no-fotos">No hay fotos recientes</p></div>';
return;
}
fotos.forEach(f => {
const item = document.createElement('div');
item.className = 'carrusel-item';
item.innerHTML = `
     <img src="${f.url}" alt="${f.texto}" class="carrusel-img">
     <div class="carrusel-info"><div class="carrusel-desc">${f.texto}</div></div>`;
container.appendChild(item);
});

if (dotsContainer) {
fotos.forEach((_, idx) => {
const dot = document.createElement('button');
dot.className = `carrusel-dot ${idx === 0 ? 'active' : ''}`;
dot.addEventListener('click', () => { pausarCarrusel(); moverCarruselA(idx, { delayAfterMs: carouselUserPauseMs }); });
dotsContainer.appendChild(dot);
});
}

setupCarruselInfinito(container);
configurarBotonesCarrusel();

container.addEventListener('click', () => abrirModalDesdeCarrusel(carruselActualIndex));
actualizarCarrusel();
}

function setupCarruselInfinito(inner) {
carruselInnerRef = inner;
const slides = Array.from(inner.querySelectorAll('.carrusel-item'));
carruselRealLength = slides.length; if (!carruselRealLength) return;

inner.querySelectorAll('.carrusel-item.clone').forEach(n => n.remove());

const firstClone = slides[0].cloneNode(true);
const lastClone  = slides[slides.length - 1].cloneNode(true);
firstClone.classList.add('clone'); lastClone.classList.add('clone');
inner.appendChild(firstClone);
inner.insertBefore(lastClone, inner.firstChild);

carruselActualIndex = 0;
carruselPosition = 1;
inner.style.transition = 'none';
inner.style.transform = `translateX(-${carruselPosition * 100}%)`;
void inner.offsetHeight;
inner.style.transition = 'transform 0.5s ease-in-out';

if (carruselTransitionHandler) inner.removeEventListener('transitionend', carruselTransitionHandler);
carruselTransitionHandler = function (e) {
if (e.target !== inner) return;
if (carruselPosition === 0) {
inner.style.transition = 'none';
carruselPosition = carruselRealLength;
inner.style.transform = `translateX(-${carruselPosition * 100}%)`;
void inner.offsetHeight; inner.style.transition = 'transform 0.5s ease-in-out';
} else if (carruselPosition === carruselRealLength + 1) {
inner.style.transition = 'none';
carruselPosition = 1;
inner.style.transform = `translateX(-${carruselPosition * 100}%)`;
void inner.offsetHeight; inner.style.transition = 'transform 0.5s ease-in-out';
}
startCarouselAutoplay(pendingAutoplayDelay);
};
inner.addEventListener('transitionend', carruselTransitionHandler);
}

function actualizarCarrusel() {
document.querySelectorAll('.carrusel-dot').forEach((d, i) => d.classList.toggle('active', i === carruselActualIndex));
}
function moverCarruselA(nuevoIndex, opts = {}) {
const inner = carruselInnerRef || document.querySelector('.carrusel-inner'); if (!inner || !carruselRealLength) return;
pendingAutoplayDelay = opts.delayAfterMs ?? carouselAutoDelay;
if (nuevoIndex < 0) nuevoIndex = carruselRealLength - 1;
if (nuevoIndex >= carruselRealLength) nuevoIndex = 0;

const stepDir = opts.stepDirection;
if (stepDir === -1 && carruselPosition === 1 && nuevoIndex === carruselRealLength - 1) carruselPosition = 0;
else if (stepDir === 1 && carruselPosition === carruselRealLength && nuevoIndex === 0) carruselPosition = carruselRealLength + 1;
else carruselPosition = nuevoIndex + 1;

carruselActualIndex = nuevoIndex;
inner.style.transition = 'transform 0.5s ease-in-out';
inner.style.transform = `translateX(-${carruselPosition * 100}%)`;
actualizarCarrusel();
}
function startCarouselAutoplay(delay = carouselAutoDelay) {
clearTimeout(carouselTimer);
carouselTimer = setTimeout(() => moverCarruselA(carruselActualIndex + 1, { delayAfterMs: carouselAutoDelay, stepDirection: 1 }), delay);
}
function stopCarouselAutoplay() { clearTimeout(carouselTimer); carouselTimer = null; }
function iniciarAutoPlay() { startCarouselAutoplay(carouselAutoDelay); }
function pausarCarrusel() { startCarouselAutoplay(carouselUserPauseMs); }

function configurarBotonesCarrusel() {
const prevBtn = document.querySelector('.prev-btn');
const nextBtn = document.querySelector('.next-btn');
if (prevBtn) prevBtn.onclick = () => { pausarCarrusel(); moverCarruselA(carruselActualIndex - 1, { delayAfterMs: carouselUserPauseMs, stepDirection: -1 }); };
if (nextBtn) nextBtn.onclick = () => { pausarCarrusel(); moverCarruselA(carruselActualIndex + 1, { delayAfterMs: carouselUserPauseMs, stepDirection: 1 }); };
}
function configurarInteraccionCarrusel() {
const carrusel = document.querySelector('.carrusel');
const inner = document.querySelector('.carrusel-inner');
if (!carrusel || !inner) return;

carrusel.addEventListener('mouseenter', () => stopCarouselAutoplay());
carrusel.addEventListener('mouseleave', () => startCarouselAutoplay(carouselAutoDelay));

let startX = 0, isDraggingLocal = false, dx = 0;
function onStart(e) { isDraggingLocal = true; dx = 0; startX = (e.touches ? e.touches[0].clientX : e.clientX); inner.style.transition = 'none'; stopCarouselAutoplay(); }
function onMove(e) {
if (!isDraggingLocal) return;
const x = (e.touches ? e.touches[0].clientX : e.clientX);
dx = x - startX;
const base = -(carruselPosition * carrusel.offsetWidth);
inner.style.transform = `translateX(${base + dx}px)`;
}
function onEnd() {
if (!isDraggingLocal) return;
isDraggingLocal = false;
inner.style.transition = 'transform 0.35s ease';
const width = carrusel.offsetWidth;
if (Math.abs(dx) > width * 0.2) {
moverCarruselA(carruselActualIndex + (dx < 0 ? 1 : -1), { delayAfterMs: carouselUserPauseMs, stepDirection: (dx < 0 ? 1 : -1) });
startCarouselAutoplay(carouselUserPauseMs);
} else {
inner.style.transform = `translateX(-${carruselPosition * 100}%)`;
startCarouselAutoplay(carouselAutoDelay);
}
dx = 0;
}

inner.addEventListener('touchstart', onStart, { passive: true });
inner.addEventListener('touchmove', onMove, { passive: true });
inner.addEventListener('touchend', onEnd, { passive: true });
inner.addEventListener('mousedown', onStart);
window.addEventListener('mousemove', onMove);
window.addEventListener('mouseup', onEnd);
}
function abrirModalDesdeCarrusel(index = carruselActualIndex) {
if (!carruselFotos?.length) return;
modalSource = 'carrusel';
const f = carruselFotos[index];
mostrarModal(f.url, f.texto, index, { push: true, source: 'carrusel' });
}

// ===== Sección =====
function mostrarSeccion(seccion, opts = { push: true }) {
  currentSeccion = seccion;
  modalSource = 'seccion';
  if (!Array.isArray(seccion.fotos)) return;

  todasLasFotos = seccion.fotos;

  const home = document.getElementById('home-view'); if (home) home.style.display = 'none';
  const insp = document.getElementById('inspiration-section'); if (insp) insp.style.display = 'none';

  let view = document.getElementById('seccion-view');
  if (!view) {
    view = document.createElement('div');
    view.id = 'seccion-view';
    view.className = 'seccion-view';
    document.getElementById('content').appendChild(view);
  }

  view.innerHTML = `
   <header class="seccion-header">
     <button class="back-button" title="Volver">←</button>
     <div class="seccion-title-container">
       <h1>${seccion.titulo}</h1>
       <p class="seccion-descripcion">${seccion.descripcion}</p>
     </div>
   </header>
   <div class="fotos-grid" id="fotos-container"></div>`;

 view.style.display = 'block';

const back = view.querySelector('.back-button');
if (back) back.addEventListener('click', () => goBackOneStep());

const fotosContainer = document.getElementById('fotos-container');
if (fotosContainer) {
  fotosContainer.innerHTML = '';
  seccion.fotos.forEach((foto, i) => {
    if (!foto.miniatura || !foto.texto || !foto.url) return;
    const el = document.createElement('div');
    el.className = 'foto-item';
    el.innerHTML = `<img src="${foto.miniatura}" alt="${foto.texto}" class="foto-miniatura" loading="lazy">`;
    el.addEventListener('click', () => {
      modalSource = 'seccion';
      mostrarModal(foto.url, foto.texto, i);
    });
    fotosContainer.appendChild(el);
  });

  // Subir SIEMPRE arriba al entrar y reforzar tras cargar miniaturas
  if (typeof forceSectionTop === 'function') forceSectionTop(fotosContainer);
  if (typeof refreshScrollTop === 'function') refreshScrollTop();
}
  currentView = 'seccion';
  if (opts.push && !isHandlingPopstate) {
    history.pushState({ view: 'seccion', seccionId: seccion.id }, '');
  }
}
// ===== Modal (Parte 2/2) =====

// --- NUEVO: Variables globales para la UI inmersiva ---
let immersiveUITimer = null; // Temporizador para ocultar la UI

function mostrarModal(imageUrl, title, fotoIndex, opts = { push: true, source: null }) {
  const modal = document.getElementById('modal');
  currentFotoIndex = fotoIndex; isModalOpen = true;

  const list = modalSource === 'carrusel' ? carruselFotos : todasLasFotos;
  const item = list[currentFotoIndex] || { url: imageUrl, texto: title };
  const sectionId = modalSource === 'carrusel' ? item.seccionId : (currentSeccion ? currentSeccion.id : '');
  const sectionTitle = modalSource === 'carrusel' ? (item.seccionTitulo || 'Ver sección') : (currentSeccion ? currentSeccion.titulo : 'Ver sección');

  // --- NUEVO: Añadimos las zonas calientes al HTML del modal ---
  modal.innerHTML = `
    <div class="modal-hotspot left"></div>
    <div class="modal-hotspot right"></div>
    <div class="close-modal">×</div>
    <div class="nav-button prev-button">‹</div>
    <div class="nav-button next-button">›</div>
    <div class="modal-content">
      <div class="modal-img-container">
        <img src="" alt="${title}" class="modal-img" id="modal-img">
        <button class="fullscreen-toggle" type="button" aria-label="Pantalla completa" title="Pantalla completa">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <g class="ico-enter"><path d="M9 3H4v5M15 3h5v5M9 21H4v-5M15 21h5v-5"/></g>
            <g class="ico-exit"><path d="M10 14H6v4M14 14h4v4M10 10H6V6M14 10h4V6"/></g>
          </svg>
        </button>
      </div>
      <div class="modal-info">
        <div class="info-handle" aria-hidden="true"></div>
        <div class="foto-counter">${currentFotoIndex + 1} / ${list.length}</div>
        <div class="foto-title">${title}</div>
        <button type="button" class="section-chip" ${sectionId ? `data-seccion-id="${sectionId}"` : 'disabled'}>
          <span class="chip-label">Ver sección:</span>
          <span class="chip-name">${sectionTitle || ''}</span>
          <span class="chip-arrow">→</span>
        </button>
      </div>
    </div>`;

  const modalImg = document.getElementById('modal-img');

  const img = new Image();
  img.onload = function () {
    modalImg.src = imageUrl; modalImg.alt = title; currentImage = modalImg;
    resetZoom();
    
    // Mostramos el modal y activamos la UI inmersiva
    modal.classList.add('active'); 
    document.body.classList.add('modal-open');
    showUIAndSetTimer(); // <-- NUEVA LLAMADA

    configurarEventosModal();
    precacheAround(currentFotoIndex);
  };
  img.onerror = function () {
    modalImg.src = imageUrl; modalImg.alt = title; currentImage = modalImg;
    resetZoom();
    modal.classList.add('active'); document.body.classList.add('modal-open');
    configurarEventosModal();
  };
  img.src = imageUrl;

  currentView = 'modal';
  if (opts.push && !isHandlingPopstate) {
    const state = { view: 'modal', source: modalSource, fotoIndex: currentFotoIndex };
    if (modalSource === 'seccion' && currentSeccion) state.seccionId = currentSeccion.id;
    history.pushState(state, '');
  }

  function configurarEventosModal() {
    const prevBtn = modal.querySelector('.prev-button');
    const nextBtn = modal.querySelector('.next-button');
    const closeBtn = modal.querySelector('.close-modal');
    const fsBtn   = modal.querySelector('.fullscreen-toggle');
    const chip    = modal.querySelector('.section-chip');
    
    // --- NUEVO: Listeners para las zonas calientes ---
    const hotspotLeft = modal.querySelector('.modal-hotspot.left');
    const hotspotRight = modal.querySelector('.modal-hotspot.right');

    if (closeBtn) closeBtn.onclick = goBackOneStep;
    if (prevBtn)  prevBtn.onclick  = () => navegarFoto(-1);
    if (nextBtn)  nextBtn.onclick  = () => navegarFoto(1);
    
    // --- NUEVO: El clic en las zonas calientes también navega ---
    if (hotspotLeft) hotspotLeft.onclick = () => navegarFoto(-1);
    if (hotspotRight) hotspotRight.onclick = () => navegarFoto(1);

    if (fsBtn) fsBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleFullscreen(); });

    // Tu lógica del chip se mantiene intacta
    if (chip && chip.dataset.seccionId) {
      // ... tu código del chip aquí ...
    }

    // Tu lógica de cerrar al hacer clic en el overlay se mantiene
    modal.addEventListener('click', function (event) {
      if (event.target === modal) {
        if (ignoreNextClick) { ignoreNextClick = false; return; }
        goBackOneStep();
      }
    });
    
    // --- NUEVO: Listener para el movimiento del ratón que resetea el temporizador ---
    modal.addEventListener('mousemove', showUIAndSetTimer);

    // El resto de tus eventos (tap/zoom, rueda, drag, swipe, etc.) se mantienen intactos
    // ... tu código de `modalImg.addEventListener('touchstart', ...)`
    // ... tu código de `modal.addEventListener('wheel', ...)`
    // ... etc.

    // Teclado
    keydownHandler = function (ev) {
      // --- NUEVO: El teclado también resetea la UI ---
      showUIAndSetTimer(); 
      switch (ev.key) {
        case 'Escape':     goBackOneStep(); break;
        case 'ArrowLeft':  navegarFoto(-1); break;
        case 'ArrowRight': navegarFoto(1);  break;
      }
    };
    document.addEventListener('keydown', keydownHandler);

    // El resto de esta función (`configurarEventosModal`) no necesita cambios.
    // ...
  }
}

// --- AÑADE ESTA NUEVA FUNCIÓN debajo de `mostrarModal` ---
function showUIAndSetTimer() {
  const modal = document.getElementById('modal');
  if (!modal || !isModalOpen) return;

  // 1. Muestra la UI quitando la clase
  if (modal.classList.contains('immersive-ui')) {
    modal.classList.remove('immersive-ui');
  }

  // 2. Limpia cualquier temporizador anterior
  clearTimeout(immersiveUITimer);

  // 3. Establece un nuevo temporizador para ocultar la UI
  immersiveUITimer = setTimeout(() => {
    // Solo oculta si no estamos haciendo zoom o arrastrando
    if (!modal.classList.contains('is-zoomed') && !modal.classList.contains('is-gesturing')) {
      modal.classList.add('immersive-ui');
    }
  }, 2500); // 2.5 segundos de inactividad
}

// --- MODIFICA TU FUNCIÓN `navegarFoto` para que también resetee la UI ---
function navegarFoto(direccion) {
  // Tu código actual para cambiar de foto...
  // ...

  // --- NUEVO: Al final de la función, después de actualizar todo ---
  showUIAndSetTimer(); // Resetea la UI para que sea visible al cambiar de foto.
  
  // Tu código de precarga...
  precacheAround(currentFotoIndex);
}

// --- MODIFICA TU FUNCIÓN `closeModal` para que limpie el temporizador ---
function closeModal() {
  const modal = document.getElementById('modal');
  if (!modal) return;

  // --- NUEVO: Limpia el temporizador al cerrar ---
  clearTimeout(immersiveUITimer);

  // El resto de tu función `closeModal` se mantiene...
  modal.classList.remove('active', 'is-zoomed', 'is-gesturing', 'fs-active', 'immersive-ui');
  // ...
}
