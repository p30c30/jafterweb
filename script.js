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
// evita duplicados
let btn = document.querySelector('.scroll-to-top');
if (!btn) {
btn = document.createElement('button');
btn.className = 'scroll-to-top';
btn.innerHTML = '↑';
btn.setAttribute('aria-label', 'Volver arriba');
document.body.appendChild(btn);
}
btn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });

window.addEventListener('scroll', () => {
const y = window.scrollY;
btn.classList.toggle('visible', y > 300);
});
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
if (!view) { view = document.createElement('div'); view.id = 'seccion-view'; view.className = 'seccion-view'; document.getElementById('content').appendChild(view); }

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

// Asegurar entrar arriba de la página al abrir una sección
document.documentElement.scrollTop = 0;
document.body.scrollTop = 0;
window.scrollTo({ top: 0, left: 0, behavior: 'auto' });

const back = view.querySelector('.back-button'); if (back) back.addEventListener('click', () => goBackOneStep());
const container = document.getElementById('fotos-container');
if (container) {
container.innerHTML = '';
seccion.fotos.forEach((foto, i) => {
if (!foto.miniatura || !foto.texto || !foto.url) return;
const el = document.createElement('div');
el.className = 'foto-item';
el.innerHTML = `<img src="${foto.miniatura}" alt="${foto.texto}" class="foto-miniatura" loading="lazy">`;
el.addEventListener('click', () => { modalSource = 'seccion'; mostrarModal(foto.url, foto.texto, i); });
container.appendChild(el);
});
}

currentView = 'seccion';
if (opts.push && !isHandlingPopstate) history.pushState({ view: 'seccion', seccionId: seccion.id }, '');
}
// ===== Modal (Parte 2/2) =====
function mostrarModal(imageUrl, title, fotoIndex, opts = { push: true, source: null }) {
  const modal = document.getElementById('modal');
  currentFotoIndex = fotoIndex; isModalOpen = true;

  const list = modalSource === 'carrusel' ? carruselFotos : todasLasFotos;
  const item = list[currentFotoIndex] || { url: imageUrl, texto: title };
  const sectionId = modalSource === 'carrusel' ? item.seccionId : (currentSeccion ? currentSeccion.id : '');
  const sectionTitle = modalSource === 'carrusel' ? (item.seccionTitulo || 'Ver sección') : (currentSeccion ? currentSeccion.titulo : 'Ver sección');

  modal.innerHTML = `
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
    modal.classList.add('active'); document.body.classList.add('modal-open');
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

    if (closeBtn) closeBtn.onclick = goBackOneStep;
    if (prevBtn)  prevBtn.onclick  = () => navegarFoto(-1);
    if (nextBtn)  nextBtn.onclick  = () => navegarFoto(1);
    if (fsBtn)    fsBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleFullscreen(); });

    // CHIP: sustituye el estado 'modal' por la sección (Atrás → portada a la primera)
    if (chip && chip.dataset.seccionId) {
      chip.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const sid = chip.dataset.seccionId;
        const sec = datosGlobales?.secciones?.find(s => s.id === sid);
        if (!sec) return;
        history.replaceState({ view: 'seccion', seccionId: sid }, '');
        closeModal();                       // no toca historial
        mostrarSeccion(sec, { push: false });
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      });
    }

    // Overlay = cerrar
    modal.addEventListener('click', function (event) {
      if (event.target === modal) {
        if (ignoreNextClick) { ignoreNextClick = false; return; }
        goBackOneStep();
      }
    });

    // TAP/Clic: toggle zoom 100% ↔ defaultClickZoom (móvil y PC)
    let tapStartX = 0, tapStartY = 0, tapStartT = 0;
    modalImg.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        tapStartX = e.touches[0].clientX;
        tapStartY = e.touches[0].clientY;
        tapStartT = Date.now();
      }
    }, { passive: true });

    modalImg.addEventListener('touchend', (e) => {
      if (ignoreNextClick) { ignoreNextClick = false; return; }
      if (e.changedTouches.length === 1) {
        const dx = e.changedTouches[0].clientX - tapStartX;
        const dy = e.changedTouches[0].clientY - tapStartY;
        const dt = Date.now() - tapStartT;
        if (Math.hypot(dx, dy) < 12 && dt < 250) {
          doClickToggle();
          ignoreNextClick = true; setTimeout(() => { ignoreNextClick = false; }, 250);
        }
      }
    }, { passive: true });

    modalImg.addEventListener('click', function (event) {
      if (ignoreNextClick) { ignoreNextClick = false; event.stopPropagation(); return; }
      doClickToggle(); event.stopPropagation();
    });

    modalImg.addEventListener('dblclick', (e) => e.preventDefault());

    // Rueda (desktop)
    modal.addEventListener('wheel', function (e) {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      const newScale = currentScale * zoomFactor;
      if (newScale >= 1 && newScale <= 5) { currentScale = newScale; aplicarZoom(); }
    }, { passive: false });

    // Arrastre con zoom
    modalImg.addEventListener('mousedown', startDrag);
    modalImg.addEventListener('touchstart', onTouchStartImg, { passive: false });

    // Swipe horizontal para cambiar foto (con candado)
    attachSwipeToModal(modal);

    // Bottom sheet y scroll lock
    attachBottomSheet(modal);

    // Fullscreen state (limpieza en closeModal)
    if (fullscreenChangeHandler) {
      document.removeEventListener('fullscreenchange', fullscreenChangeHandler);
      fullscreenChangeHandler = null;
    }
    fullscreenChangeHandler = () => {
      const active = !!document.fullscreenElement;
      modal.classList.toggle('fs-active', active);
      const b = modal.querySelector('.fullscreen-toggle');
      if (b) b.classList.toggle('is-active', active);
    };
    document.addEventListener('fullscreenchange', fullscreenChangeHandler);

    // Teclado
    keydownHandler = function (ev) {
      switch (ev.key) {
        case 'Escape':     goBackOneStep(); break;
        case 'ArrowLeft':  navegarFoto(-1); break;
        case 'ArrowRight': navegarFoto(1);  break;
      }
    };
    document.addEventListener('keydown', keydownHandler);

    function doClickToggle() {
      if (currentScale > 1) {
        currentScale = 1; translateX = 0; translateY = 0;
      } else {
        currentScale = defaultClickZoom; // 2x
      }
      aplicarZoom();
    }
  } // ← fin configurarEventosModal
}   // ← fin mostrarModal

// Precarga vecinos en modal para paso instantáneo
function precacheAround(index) {
  const list = getModalList() || []; if (!list.length) return;
  const n = list.length;
  [ (index + 1) % n, (index - 1 + n) % n ].forEach(i => { const im = new Image(); im.src = list[i].url; });
}

// ===== Pinch / Drag =====
function onTouchStartImg(e) {
  if (e.touches.length === 2) {
    isPinching = true;
    pinchStartDistance = getTouchesDistance(e.touches[0], e.touches[1]);
    pinchStartScale = currentScale;
    if (currentImage) currentImage.style.transition = 'none';
    document.addEventListener('touchmove', onTouchMoveImg, { passive: false });
    document.addEventListener('touchend', onTouchEndImg);
    e.preventDefault(); e.stopPropagation(); return;
  }
}
function onTouchMoveImg(e) {
  if (isPinching && e.touches.length === 2) {
    e.preventDefault();
    const newDistance = getTouchesDistance(e.touches[0], e.touches[1]);
    let newScale = pinchStartScale * (newDistance / pinchStartDistance);
    newScale = Math.max(1, Math.min(5, newScale));
    currentScale = newScale; aplicarZoom(true);
  }
}
function onTouchEndImg(e) {
  if (isPinching && e.touches.length < 2) {
    isPinching = false;
    if (currentImage) currentImage.style.transition = '';
    ignoreNextClick = true; setTimeout(() => { ignoreNextClick = false; }, 250);
    document.removeEventListener('touchmove', onTouchMoveImg);
    document.removeEventListener('touchend', onTouchEndImg);
  }
}
function getTouchesDistance(t1, t2) { const dx = t2.clientX - t1.clientX, dy = t2.clientY - t1.clientY; return Math.hypot(dx, dy); }

// ===== Drag mejorado con inercia =====
function startDrag(e) {
  if (currentScale <= 1) return;
  isDragging = true;
  if (inertiaId) { cancelAnimationFrame(inertiaId); inertiaId = null; }
  startX = e.clientX - translateX; startY = e.clientY - translateY;
  lastX = e.clientX; lastY = e.clientY;
  currentImage?.classList.add('grabbing'); currentImage.style.cursor = 'grabbing';
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', stopDrag);
  e.preventDefault(); e.stopPropagation();
}
function startDragTouch(e) {
  if (currentScale <= 1) return;
  isDragging = true;
  if (inertiaId) { cancelAnimationFrame(inertiaId); inertiaId = null; }
  const t = e.touches[0];
  startX = t.clientX - translateX; startY = t.clientY - translateY;
  lastX = t.clientX; lastY = t.clientY;
  currentImage?.classList.add('grabbing');
  document.addEventListener('touchmove', dragTouch, { passive: false });
  document.addEventListener('touchend', stopDrag);
  e.preventDefault(); e.stopPropagation();
}
function drag(e) {
  if (!isDragging) return;
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  animationFrameId = requestAnimationFrame(() => {
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    velX = Math.max(-dragMaxSpeed, Math.min(dragMaxSpeed, dx));
    velY = Math.max(-dragMaxSpeed, Math.min(dragMaxSpeed, dy));
    translateX += velX; translateY += velY; aplicarZoom(true);
  });
}
function dragTouch(e) {
  if (!isDragging) return;
  const t = e.touches[0];
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  animationFrameId = requestAnimationFrame(() => {
    const dx = t.clientX - lastX, dy = t.clientY - lastY;
    lastX = t.clientX; lastY = t.clientY;
    velX = Math.max(-dragMaxSpeed, Math.min(dragMaxSpeed, dx));
    velY = Math.max(-dragMaxSpeed, Math.min(dragMaxSpeed, dy));
    translateX += velX; translateY += velY; aplicarZoom(true);
  });
  e.preventDefault();
}
function stopDrag() {
  if (!isDragging) return;
  isDragging = false;
  if (animationFrameId) { cancelAnimationFrame(animationFrameId); animationFrameId = null; }
  if (currentImage && currentScale > 1) {
    currentImage.style.cursor = 'move';
    currentImage.classList.remove('grabbing');
    startInertia();
  }
  document.removeEventListener('mousemove', drag);
  document.removeEventListener('touchmove', dragTouch);
  document.removeEventListener('mouseup', stopDrag);
  document.removeEventListener('touchend', stopDrag);
}

// Inercia con fricción y “resorte” en bordes
function startInertia() {
  if (inertiaId) cancelAnimationFrame(inertiaId);
  function step() {
    translateX += velX; translateY += velY;
    const { maxX, maxY } = getPanBounds();
    if (Math.abs(translateX) > maxX) velX -= (translateX - Math.sign(translateX)*maxX) * edgeResistance;
    if (Math.abs(translateY) > maxY) velY -= (translateY - Math.sign(translateY)*maxY) * edgeResistance;
    velX *= dragFriction; velY *= dragFriction;
    if (Math.abs(velX) < 0.1 && Math.abs(velY) < 0.1) { clampPan(); aplicarZoom(true); inertiaId = null; return; }
    aplicarZoom(true);
    inertiaId = requestAnimationFrame(step);
  }
  inertiaId = requestAnimationFrame(step);
}

function getPanBounds() {
  if (!currentImage) return { maxX: 0, maxY: 0 };
  const container = currentImage.closest('.modal-img-container'); if (!container) return { maxX: 0, maxY: 0 };
  const cw = container.clientWidth, ch = container.clientHeight;
  const iw = currentImage.clientWidth, ih = currentImage.clientHeight;
  const scaledW = iw * currentScale, scaledH = ih * currentScale;
  return { maxX: Math.max(0, (scaledW - cw) / 2), maxY: Math.max(0, (scaledH - ch) / 2) };
}
function clampPan() {
  const { maxX, maxY } = getPanBounds();
  if (Math.abs(translateX) > maxX) translateX = Math.sign(translateX) * maxX;
  if (Math.abs(translateY) > maxY) translateY = Math.sign(translateY) * maxY;
}

// Aplicar zoom (orden: scale → translate3d)
function aplicarZoom(noTransition = false) {
  if (!currentImage) return;
  if (noTransition) currentImage.style.transition = 'none';
  else if (!isPinching) currentImage.style.transition = 'transform 0.2s ease';

  clampPan();
  currentImage.style.transform = `scale(${currentScale}) translate3d(${translateX}px, ${translateY}px, 0)`;
  currentImage.style.transformOrigin = 'center center';

  const modalEl = document.getElementById('modal');
  if (currentScale > 1) {
    currentImage.classList.add('zoomed');
    currentImage.style.cursor = isDragging ? 'grabbing' : 'move';
    modalEl?.classList.add('is-zoomed');
  } else {
    currentImage.classList.remove('zoomed');
    currentImage.style.cursor = 'default';
    translateX = 0; translateY = 0;
    modalEl?.classList.remove('is-zoomed');
    currentImage.style.transform = `scale(1) translate3d(0px, 0px, 0)`;
  }
}

function resetZoom() {
  currentScale = 1; translateX = 0; translateY = 0; isDragging = false; lastX = 0; lastY = 0; isPinching = false;
  if (animationFrameId) { cancelAnimationFrame(animationFrameId); animationFrameId = null; }
  if (inertiaId) { cancelAnimationFrame(inertiaId); inertiaId = null; }
  if (currentImage) {
    currentImage.style.transition = '';
    currentImage.style.transform = 'scale(1) translate3d(0px, 0px, 0)';
    currentImage.classList.remove('zoomed', 'grabbing');
    currentImage.style.cursor = 'default';
  }
  const modalEl = document.getElementById('modal');
  if (modalEl) modalEl.classList.remove('is-zoomed');
}

// Helper lista actual en modal
function getModalList() { return modalSource === 'carrusel' ? carruselFotos : todasLasFotos; }

// Navegar fotos dentro del modal
function navegarFoto(direccion) {
  const list = getModalList(); if (!list?.length) return;
  let idx = currentFotoIndex + direccion;
  if (idx < 0) idx = list.length - 1; else if (idx >= list.length) idx = 0;
  currentFotoIndex = idx;
  const nueva = list[currentFotoIndex];

  const modal = document.getElementById('modal');
  const modalImg = document.getElementById('modal-img');
  const contador = modal.querySelector('.foto-counter');
  const titulo = modal.querySelector('.foto-title');
  const chip = modal.querySelector('.section-chip');

  resetZoom();

  const im = new Image();
  im.onload = function () {
    modalImg.src = nueva.url; modalImg.alt = nueva.texto; currentImage = modalImg;
    if (contador) contador.textContent = `${currentFotoIndex + 1} / ${list.length}`;
    if (titulo) titulo.textContent = nueva.texto;

    if (chip) {
      if (modalSource === 'carrusel') {
        chip.dataset.seccionId = nueva.seccionId || '';
        chip.querySelector('.chip-name').textContent = nueva.seccionTitulo || 'Ver sección';
        chip.disabled = !nueva.seccionId;
      } else if (currentSeccion) {
        chip.dataset.seccionId = currentSeccion.id;
        chip.querySelector('.chip-name').textContent = currentSeccion.titulo;
        chip.disabled = false;
      }
    }

    if (!isHandlingPopstate && history.state?.view === 'modal') {
      const state = { view: 'modal', source: modalSource, fotoIndex: currentFotoIndex };
      if (modalSource === 'seccion' && currentSeccion) state.seccionId = currentSeccion.id;
      history.replaceState(state, '');
    }

    precacheAround(currentFotoIndex);
  };
  im.onerror = function () { modalImg.src = nueva.url; modalImg.alt = nueva.texto; currentImage = modalImg; };
  im.src = nueva.url;
}

// Swipe horizontal en modal (candado anti-doble disparo)
function attachSwipeToModal(modal) {
  const container = modal.querySelector('.modal-img-container'); if (!container) return;
  let sx = 0, sy = 0, st = 0, blockVertical = false, swipeLock = false;

  function onStart(e) {
    if (currentScale > 1) return;
    const t = e.touches[0];
    sx = t.clientX; sy = t.clientY; st = Date.now();
    blockVertical = false; modal.classList.add('is-gesturing');
  }
  function onMove(e) {
    if (currentScale > 1) return;
    const t = e.touches[0]; const dx = t.clientX - sx; const dy = t.clientY - sy;
    if (!blockVertical && Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 10) { blockVertical = true; modal.classList.remove('is-gesturing'); }
  }
  function onEnd(e) {
    modal.classList.remove('is-gesturing');
    if (currentScale > 1 || blockVertical || swipeLock) return;
    const t = e.changedTouches[0]; const dx = t.clientX - sx; const dt = Date.now() - st;
    const threshold = 60; const fast = Math.abs(dx) / dt > 0.5;
    if (Math.abs(dx) > threshold || fast) {
      swipeLock = true; ignoreNextClick = true;
      dx < 0 ? navegarFoto(1) : navegarFoto(-1);
      setTimeout(() => { swipeLock = false; }, 300);
      setTimeout(() => { ignoreNextClick = false; }, 300);
    }
  }
  container.addEventListener('touchstart', onStart, { passive: true });
  container.addEventListener('touchmove', onMove, { passive: true });
  container.addEventListener('touchend', onEnd, { passive: true });
}

// Bottom sheet y bloqueo de scroll en body
function attachBottomSheet(modal) {
  const isMobile = window.matchMedia('(max-width: 1024px)').matches;
  if (!isMobile) return;

  const imgContainer = modal.querySelector('.modal-img-container');
  const info = modal.querySelector('.modal-info');
  const handle = modal.querySelector('.info-handle');
  if (!imgContainer || !info || !handle) return;

  lockBodyScroll();

  modal.addEventListener('touchmove', (e) => { if (e.target === modal) e.preventDefault(); }, { passive: false });
  modal.addEventListener('wheel', (e) => { if (e.target === modal) e.preventDefault(); }, { passive: false });

  stopScrollBounce(info);

  function stopScrollBounce(el) {
    el.addEventListener('wheel', (e) => {
      const atTop = el.scrollTop <= 0;
      const atBottom = Math.ceil(el.scrollTop + el.clientHeight) >= el.scrollHeight;
      if ((e.deltaY < 0 && atTop) || (e.deltaY > 0 && atBottom)) e.preventDefault();
    }, { passive: false });

    let tsY = 0;
    el.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1) return;
      tsY = e.touches[0].clientY;
    }, { passive: true });

    el.addEventListener('touchmove', (e) => {
      if (e.touches.length !== 1) return;
      const dy = e.touches[0].clientY - tsY;
      const atTop = el.scrollTop <= 0;
      const atBottom = Math.ceil(el.scrollTop + el.clientHeight) >= el.scrollHeight;
      if ((dy > 0 && atTop) || (dy < 0 && atBottom)) e.preventDefault();
    }, { passive: false });
  }

  function getCollapsed() { return window.matchMedia('(orientation: landscape)').matches ? '20dvh' : '26dvh'; }
  function getExpanded()  { return '60dvh'; }
  function setInfoHeight(v){ modal.style.setProperty('--info-height', v); }

  setInfoHeight(getCollapsed());

  let startY = 0, deltaY = 0;
  imgContainer.addEventListener('touchstart', (e) => {
    if (currentScale > 1) return;
    const t = e.touches[0]; startY = t.clientY; deltaY = 0;
    modal.classList.add('is-gesturing');
  }, { passive: true });

  imgContainer.addEventListener('touchmove', (e) => {
    if (currentScale > 1) return;
    const t = e.touches[0]; deltaY = t.clientY - startY;
  }, { passive: true });

  imgContainer.addEventListener('touchend', () => {
    modal.classList.remove('is-gesturing');
    if (currentScale > 1) return;
    if (Math.abs(deltaY) > 40) {
      ignoreNextClick = true;
      if (deltaY < 0) setInfoHeight(getExpanded()); else setInfoHeight(getCollapsed());
      setTimeout(() => { ignoreNextClick = false; }, 250);
    }
  }, { passive: true });

  let dragging = false, dragStartY = 0, startHeightPx = 0;
  function vhToPx(v) { const m = String(v).match(/([\d.]+)d?vh/); const n = m ? parseFloat(m[1]) : 0; return (n / 100) * window.innerHeight; }
  function pxToVh(px) { return (px / window.innerHeight) * 100; }

  handle.addEventListener('touchstart', (e) => {
    const t = e.touches[0]; dragging = true; dragStartY = t.clientY; startHeightPx = vhToPx(getComputedStyle(modal).getPropertyValue('--info-height'));
    modal.classList.add('is-gesturing'); e.preventDefault();
  }, { passive: false });

  handle.addEventListener('touchmove', (e) => {
    if (!dragging) return;
    const t = e.touches[0]; const dy = t.clientY - dragStartY; let newHeightPx = startHeightPx - dy;
    const minPx = vhToPx(getCollapsed()), maxPx = vhToPx(getExpanded());
    newHeightPx = Math.max(minPx, Math.min(maxPx, newHeightPx));
    const newVh = pxToVh(newHeightPx).toFixed(2) + 'dvh';
    setInfoHeight(newVh); e.preventDefault();
  }, { passive: false });

  handle.addEventListener('touchend', () => {
    if (!dragging) return;
    dragging = false; modal.classList.remove('is-gesturing');
    const curPx = vhToPx(getComputedStyle(modal).getPropertyValue('--info-height'));
    const midPx = (vhToPx(getCollapsed()) + vhToPx(getExpanded())) / 2;
    setInfoHeight(curPx >= midPx ? getExpanded() : getCollapsed());
    ignoreNextClick = true; setTimeout(() => { ignoreNextClick = false; }, 250);
  });

  window.addEventListener('resize', () => {
    if (!isModalOpen) return;
    const curPx = vhToPx(getComputedStyle(modal).getPropertyValue('--info-height'));
    const collapsedPx = vhToPx(getCollapsed()); const expandedPx = vhToPx(getExpanded());
    const target = Math.abs(curPx - expandedPx) < Math.abs(curPx - collapsedPx) ? getExpanded() : getCollapsed();
    setInfoHeight(target);
  });
}

function toggleFullscreen() {
  const modal = document.getElementById('modal');
  const btn = modal?.querySelector('.fullscreen-toggle');

  const restorePanel = () => {
    modal.classList.remove('fs-active', 'is-gesturing', 'is-zoomed');
    currentScale = 1; translateX = 0; translateY = 0;
    const info = modal.querySelector('.modal-info');
    if (info) info.style.display = '';
    modal.style.removeProperty('--info-height');
    aplicarZoom(true);
  };

  if (!document.fullscreenElement) {
    if (modal?.requestFullscreen) {
      modal.requestFullscreen({ navigationUI: 'hide' }).catch(() => {
        modal.classList.add('fs-active');
        if (btn) btn.classList.add('is-active');
      });
    } else {
      modal.classList.add('fs-active');
      if (btn) btn.classList.add('is-active');
    }
  } else {
    if (document.exitFullscreen) document.exitFullscreen();
    restorePanel();
    if (btn) btn.classList.remove('is-active');
  }
}

// ===== Rotación =====
function initMobileRotationHandler() {
  let last = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
  window.addEventListener('resize', () => {
    const now = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
    if (last !== now && isModalOpen) {
      // No cerrar el modal; con dvh se adapta solo
    }
    last = now;
  });
}

// ===== Body scroll lock helpers =====
let __scrollLockY = 0;
function lockBodyScroll() {
  __scrollLockY = window.scrollY || document.documentElement.scrollTop || 0;
  document.body.style.position = 'fixed';
  document.body.style.top = `-${__scrollLockY}px`;
  document.body.style.left = '0';
  document.body.style.right = '0';
  document.body.style.width = '100%';
  document.body.classList.add('modal-open');
}
function unlockBodyScroll() {
  document.body.classList.remove('modal-open');
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.left = '';
  document.body.style.right = '';
  document.body.style.width = '';
  window.scrollTo(0, __scrollLockY || 0);
}

// ===== Cerrar modal / volver =====
function closeModal() {
  const modal = document.getElementById('modal');
  if (!modal) return;

  modal.classList.remove('active', 'is-zoomed', 'is-gesturing', 'fs-active');
  document.body.classList.remove('modal-open');
  isModalOpen = false;

  ignoreNextClick = false;
  resetZoom();

  if (keydownHandler) { document.removeEventListener('keydown', keydownHandler); keydownHandler = null; }
  if (fullscreenChangeHandler) { document.removeEventListener('fullscreenchange', fullscreenChangeHandler); fullscreenChangeHandler = null; }

  unlockBodyScroll();

  if (carruselInnerRef) startCarouselAutoplay(carouselAutoDelay);
}

function volverAGaleriaInternal() {
  currentSeccion = null;
  currentFotoIndex = 0;
  todasLasFotos = [];
  isModalOpen = false;

  const home = document.getElementById('home-view'); if (home) home.style.display = 'block';
  const insp = document.getElementById('inspiration-section'); if (insp) insp.style.display = 'block';
  const view = document.getElementById('seccion-view'); if (view) view.style.display = 'none';

  const modal = document.getElementById('modal');
  if (modal) {
    modal.classList.remove('active', 'is-zoomed', 'is-gesturing', 'fs-active');
    document.body.classList.remove('modal-open');
    resetZoom();
    if (fullscreenChangeHandler) { document.removeEventListener('fullscreenchange', fullscreenChangeHandler); fullscreenChangeHandler = null; }
  }

  unlockBodyScroll();

  window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  currentView = 'home';
}
