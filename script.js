// ===================================================================
// ==        SCRIPT36.JS - VERSIÓN COMPLETA (v38.9)               ==
// ===================================================================
console.log('✅ script.js v42.2 CARGADO');

// ===== Estado global =====
let currentSeccion = null, currentFotoIndex = 0, todasLasFotos = [], carruselActualIndex = 0, carruselFotos = [], datosGlobales = null, isModalOpen = false;
let scrollTopBtn = null, modalSource = 'seccion', currentView = 'home', isHandlingPopstate = false, ignoreNextClick = false;
let currentScale = 1, currentImage = null, isDragging = false, startX, startY, translateX = 0, translateY = 0, lastX = 0, lastY = 0;
let animationFrameId = null, isPinching = false, pinchStartDistance = 0, pinchStartScale = 1;
const defaultClickZoom = 2;
let keydownHandler = null, fullscreenChangeHandler = null, carouselTimer = null;
let fsBtnResizeHandler = null, fsLayoutRaf = 0;
const carouselAutoDelay = 20000, carouselUserPauseMs = 60000;
let pendingAutoplayDelay = carouselAutoDelay, carruselInnerRef = null, carruselRealLength = 0, carruselPosition = 1, carruselTransitionHandler = null;
let velX = 0, velY = 0, inertiaId = null;
// === Auto‑layout fullscreen button (estado) ===
let fsBtnResizeHandler = null, fsLayoutRaf = 0, imgTransformEndHandler = null;
const dragFriction = 0.92, dragMaxSpeed = 60, edgeResistance = 0.18;
let __scrollLockY = 0, isBodyLocked = false;
let modalFromHomeCarousel = false;
let __pushedModal = false;

// ===== Helpers =====
// Animaciones Pausa y resetea todas las animaciones de portada
function pauseAndResetAllCardVideos() {
const vids = document.querySelectorAll('.section-cards video.card-anim');
vids.forEach(v => {
try { v.pause(); } catch(_) {}
try { v.currentTime = 0; } catch(_) {}
v._oneShotPlaying = false;
const c = v.closest('.card');
if (c) c.classList.remove('is-over');
});
window.__cardPlayingVideo = null;
}
/* === Animaciones por sección (id o título slug) === */
const CARD_ANIM_MAP = {
artisticas: '/assets/anim/artisticas.mp4',
calles: '/assets/anim/calles.mp4',
naturaleza: '/assets/anim/naturaleza.mp4',
paisaje: '/assets/anim/paisaje.mp4',
spotting: '/assets/anim/spotting.mp4',
virgen: '/assets/anim/virgen.mp4'
};

function slugify(s = '') {
return String(s)
.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
.toLowerCase().replace(/[^a-z0-9]+/g, '-')
.replace(/(^-|-$)/g, '');
}

function refreshScrollTop() {
if (!scrollTopBtn) return;
const y = window.scrollY || document.documentElement.scrollTop || 0;
scrollTopBtn.classList.toggle('visible', y > 300);
}
if ('scrollRestoration' in history) { history.scrollRestoration = 'manual'; }
function scrollToTopHard() {
requestAnimationFrame(() => {
requestAnimationFrame(() => {
window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
document.documentElement.scrollTop = 0;
document.body.scrollTop = 0;
});
});
}
function forceSectionTop(containerEl) {
const toTop = () => {
window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
document.documentElement.scrollTop = 0;
document.body.scrollTop = 0;
};
toTop();
requestAnimationFrame(() => toTop());
setTimeout(toTop, 50);
setTimeout(toTop, 200);
setTimeout(toTop, 500);
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
function exitFullscreenSafe() {
const d = document;
try {
if (d.fullscreenElement && d.exitFullscreen) return d.exitFullscreen();
if (d.webkitFullscreenElement && d.webkitExitFullscreen) return d.webkitExitFullscreen();
} catch (e) {}
}

// Botón scroll-to-top
function crearBotonScrollTop() {
scrollTopBtn = document.querySelector('.scroll-to-top');
if (!scrollTopBtn) {
scrollTopBtn = document.createElement('button');
scrollTopBtn.className = 'scroll-to-top';
scrollTopBtn.innerHTML = '↑';
scrollTopBtn.setAttribute('aria-label', 'Volver arriba');
document.body.appendChild(scrollTopBtn);
}
scrollTopBtn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
window.addEventListener('scroll', refreshScrollTop, { passive: true });
window.addEventListener('resize', refreshScrollTop, { passive: true });
window.addEventListener('load', refreshScrollTop, { once: true });
refreshScrollTop();
}

// Historial SPA
function initHistoryHandler() {
if (!history.state) history.replaceState({ view: 'home' }, '');
window.addEventListener('popstate', (e) => {
const state = e.state || { view: 'home' };
aplicarEstado(state);
});
}

// Redes responsivas: mover al footer en móvil (≤768px)
function initResponsiveSocialBar() {
const mq = window.matchMedia('(max-width: 768px)');
const header = document.querySelector('.site-header');
const footer = document.querySelector('.site-footer');
const social = document.querySelector('.header-social');
if (!header || !footer || !social) return;

function ensureFooterSlot() {
let slot = footer.querySelector('.footer-social');
if (!slot) {
slot = document.createElement('div');
slot.className = 'footer-social';
const copy = footer.querySelector('.site-copy');
// Coloca las redes encima de la línea de copyright
if (copy && copy.parentNode) footer.insertBefore(slot, copy);
else footer.appendChild(slot);
}
return slot;
}

function relocate() {
if (mq.matches) {
const slot = ensureFooterSlot();
if (social.parentElement !== slot) slot.appendChild(social);
} else {
if (social.parentElement !== header) header.appendChild(social);
}
}

relocate();
if (mq.addEventListener) mq.addEventListener('change', relocate);
else if (mq.addListener) mq.addListener(relocate); // Safari antiguo
else window.addEventListener('resize', relocate);
}

// ===== Inicio =====
function iniciar() {
initHeaderNavUI();
const logo = document.getElementById('logoHome');
if (logo) {
logo.addEventListener('click', (e) => {
if (logo.tagName.toLowerCase() === 'a') {
const hasModifier = e && (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0);
if (!hasModifier) e.preventDefault();
}
if (currentView !== 'home') {
history.pushState({ view: 'home' }, '');
aplicarEstado({ view: 'home' });
} else {
window.scrollTo({ top: 0, behavior: 'smooth' });
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
initResponsiveSocialBar();
}

// ===== Estado / navegación SPA =====
function aplicarEstado(state) {
isHandlingPopstate = true;

if (state.view !== 'modal' && isModalOpen) {
closeModal();
if (state.view === 'home' && modalFromHomeCarousel) {
modalFromHomeCarousel = false;
currentView = 'home';
isHandlingPopstate = false;
return;
}
}

if (state.view === 'home') {
if (currentView !== 'home') {
volverAGaleriaInternal();                 // ya limpia activo y cierra panel
} else {
// Estabas en Home: asegúrate de limpiar activo y cerrar panel igualmente
if (typeof updateHeaderNavActive === 'function') updateHeaderNavActive(null);
if (typeof closeNavPanel === 'function')        closeNavPanel();
}
isHandlingPopstate = false;
return;
} else if (state.view === 'seccion') {
if (datosGlobales) {
const sec = datosGlobales.secciones.find(s => s.id === state.seccionId);
sec ? mostrarSeccion(sec, { push: false }) : volverAGaleriaInternal();
} else { volverAGaleriaInternal(); }
} else if (state.view === 'modal') {
if (state.source === 'carrusel') {
if (!carruselFotos?.length && datosGlobales) { carruselFotos = obtenerFotosParaCarrusel(datosGlobales); }
const f = carruselFotos[state.fotoIndex];
if (f) { modalSource = 'carrusel'; mostrarModal(f.url, f.texto, state.fotoIndex, { push: false }); }
else { volverAGaleriaInternal(); }
} else {
if (datosGlobales) {
const sec = datosGlobales.secciones.find(s => s.id === state.seccionId);
if (sec) {
mostrarSeccion(sec, { push: false });
const foto = sec.fotos[state.fotoIndex] || sec.fotos[0];
if (foto) { modalSource = 'seccion'; mostrarModal(foto.url, foto.texto, state.fotoIndex, { push: false }); }
} else { volverAGaleriaInternal(); }
} else { volverAGaleriaInternal(); }
}
}

isHandlingPopstate = false;
}

function goBackOneStep() {
try {
const st = history.state || {};

if (isModalOpen) {
exitFullscreenSafe();
if (modalSource === 'carrusel') {
closeModal();
if (history.state?.view !== 'home') history.replaceState({ view: 'home' }, '');
} else {
const seccionId = currentSeccion?.id;
closeModal();
if (seccionId) history.replaceState({ view: 'seccion', seccionId }, '');
}
return;
}

if (currentView === 'seccion') {
if (st.view === 'seccion' && history.length > 1) {
history.back();
setTimeout(() => {
if (currentView !== 'home') {
aplicarEstado({ view: 'home' });
history.replaceState({ view: 'home' }, '');
}
}, 150);
} else {
aplicarEstado({ view: 'home' });
history.replaceState({ view: 'home' }, '');
}
return;
}

aplicarEstado({ view: 'home' });
history.replaceState({ view: 'home' }, '');
} catch (e) {
console.warn('goBackOneStep fallback', e);
if (isModalOpen) closeModal(); else { aplicarEstado({ view: 'home' }); history.replaceState({ view: 'home' }, ''); }
}
}

// ===== Datos y vistas =====
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
card.innerHTML = `<img src="${seccion.preview}" alt="${seccion.titulo}" class="card-image"><div class="card-content"><h3>${seccion.titulo}</h3><p>${seccion.descripcion}</p></div>`;
card.addEventListener('click', () => mostrarSeccion(seccion));
container.appendChild(card);
});

cargarCarrusel(data);
buildHeaderNav(data);
updateHeaderNavActive(null); // en Home no marcamos sección
} catch (e) {
console.error('Error cargando datos:', e);
container.innerHTML = `<div class="error-message"><h3>Error al cargar</h3><p>${e.message}</p><button onclick="location.reload()">Reintentar</button></div>`;
}

}

function mostrarSeccion(seccion, opts = { push: true }) {
if (typeof pauseAndResetAllCardVideos === 'function') pauseAndResetAllCardVideos();
currentSeccion = seccion; modalSource = 'seccion';
updateHeaderNavActive?.(seccion.id);
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
   <div class="fotos-grid" id="fotos-container"></div>
 `;
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

const img = document.createElement('img');
img.src = foto.miniatura;
img.alt = foto.texto || '';
img.className = 'foto-miniatura';
img.loading = 'lazy';

const caption = document.createElement('div');
caption.className = 'thumb-caption';
const span = document.createElement('span');
span.textContent = foto.texto || '';
caption.appendChild(span);

el.appendChild(img);
el.appendChild(caption);

el.addEventListener('click', () => {
modalSource = 'seccion';
mostrarModal(foto.url, foto.texto, i);
});

fotosContainer.appendChild(el);
});

if (typeof forceSectionTop === 'function') forceSectionTop(fotosContainer);
if (typeof refreshScrollTop === 'function') refreshScrollTop();
}

currentView = 'seccion';
if (opts.push && !isHandlingPopstate) {
history.pushState({ view: 'seccion', seccionId: seccion.id }, '');
}
}

// ==============BARRA DE SECCIONES======== Construye la barra y el panel con las secciones (sin "Inicio")
function buildHeaderNav(data) {
const navDesk   = document.querySelector('.site-nav');
const panelList = document.querySelector('#nav-panel .nav-panel__list');
if (!data?.secciones || !navDesk || !panelList) return;

// Limpia y crea enlaces
navDesk.innerHTML = '';
panelList.innerHTML = '';

data.secciones.forEach(sec => {
if (!sec?.id || !sec?.titulo) return;

const aDesk = document.createElement('a');
aDesk.className = 'nav-link';
aDesk.textContent = sec.titulo;
aDesk.href = '#';
aDesk.dataset.seccionId = sec.id;
navDesk.appendChild(aDesk);

const aMob = aDesk.cloneNode(true);
panelList.appendChild(aMob);
});

// Delegación de click (escritorio + panel)
const handleClick = (e) => {
const a = e.target.closest('a.nav-link');
if (!a) return;
e.preventDefault();
closeNavPanel?.(); // por si venía del panel
  
const id = a.dataset.seccionId;
const sec = datosGlobales?.secciones?.find(s => s.id === id);
if (sec) {
mostrarSeccion(sec);
updateHeaderNavActive?.(id);
}
};
navDesk.addEventListener('click', handleClick);
panelList.addEventListener('click', handleClick);
}

// Marca activo el enlace (en Home se limpia)
function updateHeaderNavActive(seccionIdOrNull) {
const links = document.querySelectorAll('.site-nav .nav-link, #nav-panel .nav-link');
links.forEach(a => a.removeAttribute('aria-current'));
if (!seccionIdOrNull) return;
document.querySelectorAll(`.nav-link[data-seccion-id="${seccionIdOrNull}"]`)
.forEach(a => a.setAttribute('aria-current', 'page'));
}

// UI del panel hamburguesa (abre/cierra)
function initHeaderNavUI() {
const trigger = document.querySelector('.nav-trigger');
const panel   = document.getElementById('nav-panel');
if (!trigger || !panel) return;

const open = () => {
panel.classList.add('is-open');
panel.setAttribute('aria-hidden', 'false');
trigger.setAttribute('aria-expanded', 'true');
setTimeout(() => panel.querySelector('.nav-link')?.focus(), 10);
};
const close = () => {
panel.classList.remove('is-open');
panel.setAttribute('aria-hidden', 'true');
trigger.setAttribute('aria-expanded', 'false');
};
window.closeNavPanel = close;

trigger.addEventListener('click', () => {
panel.classList.contains('is-open') ? close() : open();
});
panel.addEventListener('click', (e) => {
if (e.target.matches('[data-close], .nav-panel__backdrop')) close();
});
document.addEventListener('keydown', (e) => {
if (e.key === 'Escape' && panel.classList.contains('is-open')) close();
});
}


// ===== Carrusel portada =====
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
item.innerHTML = `<img src="${f.url}" alt="${f.texto}" class="carrusel-img"><div class="carrusel-info"><div class="carrusel-desc">${f.texto}</div></div>`;
container.appendChild(item);
});
if (dotsContainer) {
fotos.forEach((_, idx) => {
const dot = document.createElement('button');
dot.className = `carrusel-dot ${idx === 0 ? 'active' : ''}`;
dot.addEventListener('click', () => {
pausarCarrusel();
moverCarruselA(idx, { delayAfterMs: carouselUserPauseMs });
});
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
carruselRealLength = slides.length;
if (!carruselRealLength) return;

inner.querySelectorAll('.carrusel-item.clone').forEach(n => n.remove());
const firstClone = slides[0].cloneNode(true);
const lastClone = slides[slides.length - 1].cloneNode(true);
firstClone.classList.add('clone'); lastClone.classList.add('clone');
inner.appendChild(firstClone); inner.insertBefore(lastClone, inner.firstChild);

carruselActualIndex = 0; carruselPosition = 1;
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
const inner = carruselInnerRef || document.querySelector('.carrusel-inner');
if (!inner || !carruselRealLength) return;
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
const prevBtn = document.querySelector('.prev-btn'); const nextBtn = document.querySelector('.next-btn');
if (prevBtn) prevBtn.onclick = () => { pausarCarrusel(); moverCarruselA(carruselActualIndex - 1, { delayAfterMs: carouselUserPauseMs, stepDirection: -1 }); };
if (nextBtn) nextBtn.onclick = () => { pausarCarrusel(); moverCarruselA(carruselActualIndex + 1, { delayAfterMs: carouselUserPauseMs, stepDirection: 1 }); };
}
function configurarInteraccionCarrusel() {
const carrusel = document.querySelector('.carrusel'); const inner = document.querySelector('.carrusel-inner'); if (!carrusel || !inner) return;
carrusel.addEventListener('mouseenter', () => stopCarouselAutoplay());
carrusel.addEventListener('mouseleave', () => startCarouselAutoplay(carouselAutoDelay));
let startX = 0, isDraggingLocal = false, dx = 0;
function onStart(e) { isDraggingLocal = true; dx = 0; startX = (e.touches ? e.touches[0].clientX : e.clientX); inner.style.transition = 'none'; stopCarouselAutoplay(); }
function onMove(e) { if (!isDraggingLocal) return; const x = (e.touches ? e.touches[0].clientX : e.clientX); dx = x - startX; const base = -(carruselPosition * carrusel.offsetWidth); inner.style.transform = `translateX(${base + dx}px)`; }
function onEnd() { if (!isDraggingLocal) return; isDraggingLocal = false; inner.style.transition = 'transform 0.35s ease'; const width = carrusel.offsetWidth; if (Math.abs(dx) > width * 0.2) { moverCarruselA(carruselActualIndex + (dx < 0 ? 1 : -1), { delayAfterMs: carouselUserPauseMs, stepDirection: (dx < 0 ? 1 : -1) }); startCarouselAutoplay(carouselUserPauseMs); } else { inner.style.transform = `translateX(-${carruselPosition * 100}%)`; startCarouselAutoplay(carouselAutoDelay); } dx = 0; }
inner.addEventListener('touchstart', onStart, { passive: true });
inner.addEventListener('touchmove', onMove, { passive: true });
inner.addEventListener('touchend', onEnd, { passive: true });
inner.addEventListener('mousedown', onStart); window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onEnd);
}
function abrirModalDesdeCarrusel(index = carruselActualIndex) {
if (!carruselFotos?.length) return;
modalSource = 'carrusel';
modalFromHomeCarousel = true;
stopCarouselAutoplay();
const f = carruselFotos[index];
mostrarModal(f.url, f.texto, index, { push: true, source: 'carrusel' });
}

// ===== Modal =====
function mostrarModal(imageUrl, title, fotoIndex, opts = { push: true, source: null }) {
if (typeof pauseAndResetAllCardVideos === 'function') pauseAndResetAllCardVideos();
const modal = document.getElementById('modal');
currentFotoIndex = fotoIndex; isModalOpen = true;

const list = getModalList();
const item = list[currentFotoIndex] || { url: imageUrl, texto: title };
const sectionId = modalSource === 'carrusel' ? item.seccionId : (currentSeccion ? currentSeccion.id : '');
const sectionTitle = modalSource === 'carrusel' ? (item.seccionTitulo || 'Ver sección') : (currentSeccion ? currentSeccion.titulo : 'Ver sección');
const chipPrefix = (modalSource === 'carrusel') ? 'Ir a' : 'Volver a';

modal.innerHTML = `
   <div class="modal-hotspot top"></div>
   <div class="modal-hotspot left"></div>
   <div class="modal-hotspot right"></div>
   <div class="modal-hotspot bottom"></div>
   <div id="modal-content-wrapper">
     <div class="close-modal" title="Cerrar">×</div>
     <div class="nav-button prev-button" title="Anterior">‹</div>
     <div class="nav-button next-button" title="Siguiente">›</div>
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
     </div>
     <div class="modal-info">
       <div class="info-handle" aria-hidden="true"></div>
 
       <!-- <div class="foto-counter">${currentFotoIndex + 1} / ${list.length}</div> -->
       <div class="foto-title">${title}</div>
       <button type="button" class="section-chip" ${sectionId ? `data-seccion-id="${sectionId}"` : 'disabled'} aria-label="${chipPrefix} ${sectionTitle || ''}">
         <span class="chip-label">${chipPrefix}</span>
         <span class="chip-name">${sectionTitle || ''}</span>
         <span class="chip-arrow">→</span>
       </button>
     </div>
   </div>`;

const modalImg = document.getElementById('modal-img');

const onImageLoad = function () {
modal.style.display = '';
modalImg.src = imageUrl; currentImage = modalImg;
resetZoom();
modal.classList.add('active');
document.body.classList.add('modal-open');

configurarEventosModal();
bindFsBtnAutoLayout(true);
scheduleFsBtnLayout();
precacheAround(currentFotoIndex);

if (typeof window.triggerUiAfterPhotoChange === 'function') {
window.triggerUiAfterPhotoChange();
}
};

const img = new Image();
img.onload = onImageLoad;
img.onerror = onImageLoad;
img.src = imageUrl;

currentView = 'modal';
if (opts.push && !isHandlingPopstate) {
const state = { view: 'modal', source: modalSource, fotoIndex: currentFotoIndex };
if (modalSource === 'seccion' && currentSeccion) state.seccionId = currentSeccion.id;
history.pushState(state, '');
__pushedModal = true;
} else {
__pushedModal = false;
}

function configurarEventosModal() {
const closeBtn = modal.querySelector('.close-modal');
const prevBtn = modal.querySelector('.prev-button');
const nextBtn = modal.querySelector('.next-button');
const infoPanel = modal.querySelector('.modal-info');
const fsBtn = modal.querySelector('.fullscreen-toggle');
const chip = modal.querySelector('.section-chip');

const hotspotTop = modal.querySelector('.modal-hotspot.top');
const hotspotLeft = modal.querySelector('.modal-hotspot.left');
const hotspotRight = modal.querySelector('.modal-hotspot.right');
const hotspotBottom = modal.querySelector('.modal-hotspot.bottom');

const isMobileViewport = window.matchMedia('(max-width: 1024px)').matches;

if (hotspotLeft) hotspotLeft.addEventListener('click', () => navegarFoto(-1));
if (hotspotRight) hotspotRight.addEventListener('click', () => navegarFoto(1));

if (closeBtn) {
closeBtn.addEventListener('click', (e) => {
e.stopPropagation();
exitFullscreenSafe();

if (modalSource === 'carrusel') {
closeModal();
if (history.state?.view !== 'home') history.replaceState({ view: 'home' }, '');
return;
}

const seccionId = currentSeccion?.id;
closeModal();
if (seccionId) history.replaceState({ view: 'seccion', seccionId }, '');
});
}

modal.addEventListener('click', function (event) {
if (event.target !== modal) return;
if (ignoreNextClick) { ignoreNextClick = false; return; }

exitFullscreenSafe();

if (modalSource === 'carrusel') {
closeModal();
if (history.state?.view !== 'home') history.replaceState({ view: 'home' }, '');
return;
}

const seccionId = currentSeccion?.id;
closeModal();
if (seccionId) history.replaceState({ view: 'seccion', seccionId }, '');
});

if (prevBtn) prevBtn.addEventListener('click', (e) => { e.stopPropagation(); navegarFoto(-1); });
if (nextBtn) nextBtn.addEventListener('click', (e) => { e.stopPropagation(); navegarFoto(1); });

if (fsBtn) fsBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleFullscreen(); });

if (chip) {
chip.addEventListener('click', (e) => {
e.preventDefault(); e.stopPropagation();
const sid = chip.dataset.seccionId;
if (!sid) { goBackOneStep(); return; }
const sec = datosGlobales?.secciones?.find(s => s.id === sid);
if (!sec) return;

if (modalSource === 'carrusel') {
history.replaceState({ view: 'home' }, '');
closeModal();
mostrarSeccion(sec, { push: true });
} else {
closeModal();
}
});
}

// Tap rápido → toggle zoom
let tapStartX = 0, tapStartY = 0, tapStartT = 0;
modalImg.addEventListener('touchstart', (e) => {
if (e.touches.length === 1) { tapStartX = e.touches[0].clientX; tapStartY = e.touches[0].clientY; tapStartT = Date.now(); }
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

// Click → toggle zoom
modalImg.addEventListener('click', function (event) {
if (ignoreNextClick) { ignoreNextClick = false; event.stopPropagation(); return; }
doClickToggle();
event.stopPropagation();
});
modalImg.addEventListener('dblclick', (e) => e.preventDefault());

// Zoom rueda
modal.addEventListener('wheel', function (e) {
e.preventDefault();
const ZOOM_MIN = 1, ZOOM_MAX = 5;
const BASE_SENS = 0.0015;
let sens = BASE_SENS;
if (e.deltaMode === 1) sens = 0.02;
else if (e.deltaMode === 2) sens = 0.1;
const factor = Math.exp(-e.deltaY * sens);
let newScale = currentScale * factor;
newScale = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, newScale));
if (Math.abs(newScale - currentScale) > 0.0001) { currentScale = newScale; aplicarZoom(); }
}, { passive: false });

// Drag/Pan y pinch
modalImg.addEventListener('mousedown', startDrag);
modalImg.addEventListener('touchstart', onTouchStartImg, { passive: false });

// Gestos adicionales
attachSwipeToModal(modal);
attachBottomSheet(modal);

// Fullscreen state
if (fullscreenChangeHandler) {
  document.removeEventListener('fullscreenchange', fullscreenChangeHandler);
  fullscreenChangeHandler = null;
}
fullscreenChangeHandler = () => {
  const active = !!document.fullscreenElement;
  modal.classList.toggle('fs-active', active);
  const b = modal.querySelector('.fullscreen-toggle');
  if (b) b.classList.toggle('is-active', active);
  // Reposiciona al cambiar FS
  scheduleFsBtnLayout();
};
document.addEventListener('fullscreenchange', fullscreenChangeHandler);

// Teclado
keydownHandler = function (ev) {
switch (ev.key) {
case 'Escape':
exitFullscreenSafe();
if (modalSource === 'carrusel') {
closeModal();
if (history.state?.view !== 'home') history.replaceState({ view: 'home' }, '');
} else {
const seccionId = currentSeccion?.id;
closeModal();
if (seccionId) history.replaceState({ view: 'seccion', seccionId }, '');
}
break;
case 'ArrowLeft': navegarFoto(-1); break;
case 'ArrowRight': navegarFoto(1); break;
}
};
document.addEventListener('keydown', keydownHandler);

// Click-zoom
function doClickToggle() {
if (currentScale > 1) { currentScale = 1; translateX = 0; translateY = 0; }
else {
if (isMobileViewport) {
currentScale = defaultClickZoom;
} else {
let scale = 1.25;
if (currentImage) {
const container = currentImage.closest('.modal-img-container');
if (container) {
const cw = container.clientWidth, ch = container.clientHeight;
const iw = currentImage.clientWidth, ih = currentImage.clientHeight;
const base = Math.max(cw / iw, ch / ih) * 0.97;
scale = 1 + (base - 1) * 5;
scale = Math.min(3.0, Math.max(1.2, scale));
}
}
currentScale = scale;
}
}
aplicarZoom();
}

if (!isMobileViewport) {
const AUTO_HIDE_MS = 3000; let autoHideId = null;
function show(el) { if (el) { el.classList.add('visible'); el.style.pointerEvents = 'auto'; } }
function hide(el) { if (el) { el.classList.remove('visible'); el.style.pointerEvents = ''; } }
function hideAll() { [closeBtn, prevBtn, nextBtn, infoPanel, fsBtn].forEach(hide); }
function resetTimer() { clearTimeout(autoHideId); autoHideId = setTimeout(hideAll, AUTO_HIDE_MS); }
function showAllAndArmTimer() { [closeBtn, prevBtn, nextBtn, infoPanel, fsBtn].forEach(show); resetTimer(); }
function showCloseAndArmTimer() { show(closeBtn); resetTimer(); }
window.triggerUiAfterPhotoChange = () => showAllAndArmTimer();
modal.addEventListener('mousemove', () => { showCloseAndArmTimer(); });
if (hotspotTop) hotspotTop.addEventListener('mouseenter', () => { show(closeBtn); resetTimer(); });
if (hotspotLeft) hotspotLeft.addEventListener('mouseenter', () => { show(prevBtn); resetTimer(); });
if (hotspotRight) hotspotRight.addEventListener('mouseenter', () => { show(nextBtn); resetTimer(); });
if (hotspotBottom) hotspotBottom.addEventListener('mouseenter', () => { show(infoPanel); if (fsBtn) show(fsBtn); resetTimer(); });
[closeBtn, prevBtn, nextBtn, infoPanel, fsBtn].forEach(el => {
if (!el) return;
el.addEventListener('mouseenter', () => { show(el); clearTimeout(autoHideId); });
el.addEventListener('mouseleave', () => { resetTimer(); });
});
} else {
try { delete window.triggerUiAfterPhotoChange; } catch (e) { window.triggerUiAfterPhotoChange = undefined; }
}
}
}

// ===== Precarga y gestos =====
function precacheAround(index) {
const list = getModalList() || [];
if (!list.length) return;
const n = list.length;
[ (index + 1) % n, (index - 1 + n) % n ].forEach((i) => {
const im = new Image();
im.src = list[i].url;
});
}
function onTouchStartImg(e) {
if (e.touches.length === 2) {
isPinching = true; pinchStartDistance = getTouchesDistance(e.touches[0], e.touches[1]); pinchStartScale = currentScale;
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
function startDrag(e) {
if (currentScale <= 1) return;
isDragging = true;
if (inertiaId) { cancelAnimationFrame(inertiaId); inertiaId = null; }
startX = e.clientX - translateX; startY = e.clientY - translateY; lastX = e.clientX; lastY = e.clientY;
currentImage?.classList.add('grabbing'); currentImage.style.cursor = 'grabbing';
document.addEventListener('mousemove', drag);
document.addEventListener('mouseup', stopDrag);
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
translateX += velX; translateY += velY;
aplicarZoom(true);
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
translateX += velX; translateY += velY;
aplicarZoom(true);
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
function startInertia() {
if (inertiaId) cancelAnimationFrame(inertiaId);
function step() {
translateX += velX; translateY += velY;
const { maxX, maxY } = getPanBounds();
if (Math.abs(translateX) > maxX) velX -= (translateX - Math.sign(translateX)*maxX) * edgeResistance;
if (Math.abs(translateY) > maxY) velY -= (translateY - Math.sign(translateY)*maxY) * edgeResistance;
velX *= dragFriction; velY *= dragFriction;
if (Math.abs(velX) < 0.1 && Math.abs(velY) < 0.1) {
clampPan(); aplicarZoom(true); inertiaId = null; return;
}
aplicarZoom(true); inertiaId = requestAnimationFrame(step);
}
inertiaId = requestAnimationFrame(step);
}
function getPanBounds() {
if (!currentImage) return { maxX: 0, maxY: 0 };
const container = currentImage.closest('.modal-img-container');
if (!container) return { maxX: 0, maxY: 0 };
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
    currentImage.style.cursor = 'move';
    modalEl?.classList.add('is-zoomed');
  } else {
    currentImage.classList.remove('zoomed');
    currentImage.style.cursor = 'default';
    translateX = 0;
    translateY = 0;
    modalEl?.classList.remove('is-zoomed');
    currentImage.style.transform = `scale(1) translate3d(0px, 0px, 0)`;
  }

  // Reposiciona ahora…
  scheduleFsBtnLayout();

  // …y otra vez al terminar la animación de click‑zoom (transform 0.2s)
  if (!noTransition && !isPinching) {
    hookImgTransformEndOnce();
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
const modalEl = document.getElementById('modal'); if (modalEl) modalEl.classList.remove('is-zoomed');
}
function getModalList() { return modalSource === 'carrusel' ? carruselFotos : todasLasFotos; }
function navegarFoto(direccion) {
  const list = getModalList();
  if (!list?.length) return;

  let idx = currentFotoIndex + direccion;
  if (idx < 0) idx = list.length - 1;
  else if (idx >= list.length) idx = 0;
  currentFotoIndex = idx;

  const nueva = list[currentFotoIndex];
  const modal = document.getElementById('modal');
  if (!modal) return;

  const modalImg = modal.querySelector('#modal-img');
  const contador = modal.querySelector('.foto-counter');
  const titulo = modal.querySelector('.foto-title');
  const chip = modal.querySelector('.section-chip');

  resetZoom();

  const im = new Image();
  im.onload = function () {
    modalImg.src = nueva.url;
    modalImg.alt = nueva.texto;
    currentImage = modalImg;

    if (contador) contador.textContent = `${currentFotoIndex + 1} / ${list.length}`;
    if (titulo) titulo.textContent = nueva.texto;

    if (chip) {
      let seccionId = '';
      let sectionName = '';

      if (modalSource === 'carrusel') {
        seccionId = nueva.seccionId || '';
        sectionName = nueva.seccionTitulo || '';
        chip.disabled = !seccionId;
        chip.dataset.seccionId = seccionId;
      } else if (currentSeccion) {
        seccionId = currentSeccion.id;
        sectionName = currentSeccion.titulo || '';
        chip.disabled = false;
        chip.dataset.seccionId = seccionId;
      }

      const prefix = (modalSource === 'carrusel') ? 'Ir a' : 'Volver a';
      const chipLabelEl = chip.querySelector('.chip-label');
      const chipNameEl  = chip.querySelector('.chip-name');

      if (chipLabelEl) chipLabelEl.textContent = prefix;
      if (chipNameEl)  chipNameEl.textContent = sectionName;

      chip.setAttribute('aria-label', `${prefix} ${sectionName}`.trim());
    }

    if (!isHandlingPopstate && history.state?.view === 'modal') {
      const state = { view: 'modal', source: modalSource, fotoIndex: currentFotoIndex };
      if (modalSource === 'seccion' && currentSeccion) state.seccionId = currentSeccion.id;
      history.replaceState(state, '');
    }

    precacheAround(currentFotoIndex);
    if (typeof window.triggerUiAfterPhotoChange === 'function') {
      window.triggerUiAfterPhotoChange();
    }

    // Reposiciona el botón pegado a la imagen (desktop)
    scheduleFsBtnLayout();
  };

  im.onerror = function () {
    modalImg.src = nueva.url;
    modalImg.alt = nueva.texto;
    currentImage = modalImg;

    // En caso de error de carga, también reposicionamos
    scheduleFsBtnLayout();
  };

  im.src = nueva.url;
}

// ===== Móvil: bottom sheet / scroll lock =====
function attachSwipeToModal(modal) {
const container = modal.querySelector('.modal-img-container'); if (!container) return;
let sx = 0, sy = 0, st = 0, blockVertical = false, swipeLock = false;
function onStart(e) { if (currentScale > 1) return; const t = e.touches[0]; sx = t.clientX; sy = t.clientY; st = Date.now(); blockVertical = false; modal.classList.add('is-gesturing'); }
function onMove(e) { if (currentScale > 1) return; const t = e.touches[0]; const dx = t.clientX - sx; const dy = t.clientY - sy; if (!blockVertical && Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 10) { blockVertical = true; modal.classList.remove('is-gesturing'); } }
function onEnd(e) { modal.classList.remove('is-gesturing'); if (currentScale > 1 || blockVertical || swipeLock) return; const t = e.changedTouches[0]; const dx = t.clientX - sx; const dt = Date.now() - st; const threshold = 60; const fast = Math.abs(dx) / dt > 0.5; if (Math.abs(dx) > threshold || fast) { swipeLock = true; ignoreNextClick = true; dx < 0 ? navegarFoto(1) : navegarFoto(-1); setTimeout(() => { swipeLock = false; }, 300); setTimeout(() => { ignoreNextClick = false; }, 300); } }
container.addEventListener('touchstart', onStart, { passive: true });
container.addEventListener('touchmove', onMove, { passive: true });
container.addEventListener('touchend', onEnd, { passive: true });
}
function attachBottomSheet(modal) {
const isMobile = window.matchMedia('(max-width: 1024px)').matches;
if (!isMobile) return;

const imgContainer = modal.querySelector('.modal-img-container');
const info        = modal.querySelector('.modal-info');
const dragHandle  = modal.querySelector('.info-handle'); // <— renombrado
if (!imgContainer || !info || !dragHandle) return;

lockBodyScroll();

modal.addEventListener('touchmove', (e) => { if (e.target === modal) e.preventDefault(); }, { passive: false });
modal.addEventListener('wheel', (e) => { if (e.target === modal) e.preventDefault(); }, { passive: false });

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
stopScrollBounce(info);

function getCollapsed() { return window.matchMedia('(orientation: landscape)').matches ? '20dvh' : '26dvh'; }
function getExpanded()  { return '60dvh'; }
function setInfoHeight(v) { modal.style.setProperty('--info-height', v); }
setInfoHeight(getCollapsed());

let startY = 0, deltaY = 0;
imgContainer.addEventListener('touchstart', (e) => {
if (currentScale > 1) return;
const t = e.touches[0];
startY = t.clientY; deltaY = 0;
modal.classList.add('is-gesturing');
}, { passive: true });
imgContainer.addEventListener('touchmove', (e) => {
if (currentScale > 1) return;
const t = e.touches[0];
deltaY = t.clientY - startY;
}, { passive: true });
imgContainer.addEventListener('touchend', () => {
modal.classList.remove('is-gesturing');
if (currentScale > 1) return;
if (Math.abs(deltaY) > 40) {
ignoreNextClick = true;
if (deltaY < 0) setInfoHeight(getExpanded());
else setInfoHeight(getCollapsed());
setTimeout(() => { ignoreNextClick = false; }, 250);
}
}, { passive: true });

// Draggable del handle
let dragging = false, dragStartY = 0, startHeightPx = 0;
function vhToPx(v) {
const m = String(v).match(/([\d.]+)d?vh/);
const n = m ? parseFloat(m[1]) : 0;
return (n / 100) * window.innerHeight;
}
function pxToVh(px) { return (px / window.innerHeight) * 100; }
const vhToPxCollapsed = () => vhToPx(getCollapsed());
const vhToPxExpanded  = () => vhToPx(getExpanded());
const pxToVhStr       = (px) => (pxToVh(px).toFixed(2) + 'dvh');

dragHandle.addEventListener('touchstart', (e) => {
const t = e.touches[0];
dragging = true; dragStartY = t.clientY;
startHeightPx = vhToPxCollapsed();
modal.classList.add('is-gesturing');
e.preventDefault();
}, { passive: false });

dragHandle.addEventListener('touchmove', (e) => {
if (!dragging) return;
const t = e.touches[0];
const dy = t.clientY - dragStartY;
let newHeightPx = startHeightPx - dy;
const minPx = vhToPxCollapsed(), maxPx = vhToPxExpanded();
newHeightPx = Math.max(minPx, Math.min(maxPx, newHeightPx));
setInfoHeight(pxToVhStr(newHeightPx));
e.preventDefault();
}, { passive: false });

dragHandle.addEventListener('touchend', () => {
if (!dragging) return;
dragging = false;
modal.classList.remove('is-gesturing');
const curPx = vhToPx(getComputedStyle(modal).getPropertyValue('--info-height'));
const midPx = (vhToPxCollapsed() + vhToPxExpanded()) / 2;
setInfoHeight(curPx >= midPx ? getExpanded() : getCollapsed());
ignoreNextClick = true; setTimeout(() => { ignoreNextClick = false; }, 250);
});

window.addEventListener('resize', () => {
if (!isModalOpen) return;
const curPx = vhToPx(getComputedStyle(modal).getPropertyValue('--info-height'));
const collapsedPx = vhToPxCollapsed();
const expandedPx = vhToPxExpanded();
const target = Math.abs(curPx - expandedPx) < Math.abs(curPx - collapsedPx) ? getExpanded() : getCollapsed();
setInfoHeight(target);
});
}

// ===== Fullscreen / scroll lock =====
function toggleFullscreen() {
const modal = document.getElementById('modal');
const btn = modal?.querySelector('.fullscreen-toggle');
const restorePanel = () => {
modal.classList.remove('fs-active', 'is-gesturing', 'is-zoomed');
currentScale = 1; translateX = 0; translateY = 0;
const info = modal.querySelector('.modal-info'); if (info) info.style.display = '';
modal.style.removeProperty('--info-height');
aplicarZoom(true);
};
if (!document.fullscreenElement) {
if (modal?.requestFullscreen) {
modal.requestFullscreen({ navigationUI: 'hide' }).catch(() => { modal.classList.add('fs-active'); if (btn) btn.classList.add('is-active'); });
} else {
modal.classList.add('fs-active'); if (btn) btn.classList.add('is-active');
}
} else {
if (document.exitFullscreen) document.exitFullscreen();
restorePanel(); if (btn) btn.classList.remove('is-active');
}
}
// === Fullscreen button auto-layout (desktop) ===
function positionFullscreenToggle() {
try {
const isDesktop = window.matchMedia('(min-width: 1025px)').matches;
const modal = document.getElementById('modal');
if (!modal) return;
const btn = modal.querySelector('.fullscreen-toggle');
const img = modal.querySelector('#modal-img');
if (!btn || !img) return;
// Móvil o modal no activo: resetea al CSS
if (!isDesktop || !modal.classList.contains('active')) {
  btn.style.left = ''; btn.style.top = '';
  btn.style.right = ''; btn.style.bottom = '';
  return;
}

const rect = img.getBoundingClientRect();
if (!rect.width || !rect.height) return;

const offset = 12;                   // separación respecto a la imagen
const vw = window.innerWidth, vh = window.innerHeight;
const bw = btn.offsetWidth || 40, bh = btn.offsetHeight || 40;

// Pegado justo fuera del borde inferior-derecho de la imagen
let left = rect.right + offset;
let top  = rect.bottom - bh - offset;

// Asegurar accesibilidad: clampa dentro de la ventana
const margin = 8;
left = Math.min(Math.max(margin, left), vw - bw - margin);
top  = Math.min(Math.max(margin, top), vh - bh - margin);

btn.style.position = 'fixed';
btn.style.left = `${left}px`;
btn.style.top = `${top}px`;
btn.style.right = 'auto';
btn.style.bottom = 'auto';
btn.style.zIndex = '1100';
} catch (_) {}
}

function scheduleFsBtnLayout() {
if (fsLayoutRaf) return;
fsLayoutRaf = requestAnimationFrame(() => {
fsLayoutRaf = 0;
positionFullscreenToggle();
});
}

function bindFsBtnAutoLayout(enable = true) {
if (enable) {
if (fsBtnResizeHandler) return;
fsBtnResizeHandler = () => scheduleFsBtnLayout();
window.addEventListener('resize', fsBtnResizeHandler, { passive: true });
scheduleFsBtnLayout();
} else {
if (!fsBtnResizeHandler) return;
window.removeEventListener('resize', fsBtnResizeHandler);
fsBtnResizeHandler = null;
if (fsLayoutRaf) { cancelAnimationFrame(fsLayoutRaf); fsLayoutRaf = 0; }
}
}

// === Fullscreen button auto-layout (desktop) ===
function positionFullscreenToggle() {
  try {
    const isDesktop = window.matchMedia('(min-width: 1025px)').matches;
    const modal = document.getElementById('modal');
    if (!modal) return;
    const btn = modal.querySelector('.fullscreen-toggle');
    const img = modal.querySelector('#modal-img');
    if (!btn || !img) return;

    // En móvil o si el modal no está activo, delega al CSS
    if (!isDesktop || !modal.classList.contains('active')) {
      btn.style.left = '';
      btn.style.top = '';
      btn.style.right = '';
      btn.style.bottom = '';
      return;
    }

    const rect = img.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const offset = 12;
    const vw = window.innerWidth, vh = window.innerHeight;
    const bw = btn.offsetWidth || 40, bh = btn.offsetHeight || 40;

    // Pegado por fuera del borde inferior-derecho de la imagen
    let left = rect.right + offset;
    let top  = rect.bottom - bh - offset;

    // Clamp dentro de viewport (por si la imagen va hasta el borde)
    const margin = 8;
    left = Math.min(Math.max(margin, left), vw - bw - margin);
    top  = Math.min(Math.max(margin, top), vh - bh - margin);

    btn.style.position = 'fixed';
    btn.style.left = `${left}px`;
    btn.style.top  = `${top}px`;
    btn.style.right = 'auto';
    btn.style.bottom = 'auto';
    btn.style.zIndex = '1100';
  } catch (_) {}
}

function scheduleFsBtnLayout() {
  if (fsLayoutRaf) return;
  fsLayoutRaf = requestAnimationFrame(() => {
    fsLayoutRaf = 0;
    positionFullscreenToggle();
  });
}

function bindFsBtnAutoLayout(enable = true) {
  if (enable) {
    if (fsBtnResizeHandler) return;
    fsBtnResizeHandler = () => scheduleFsBtnLayout();
    window.addEventListener('resize', fsBtnResizeHandler, { passive: true });
    scheduleFsBtnLayout();
  } else {
    if (!fsBtnResizeHandler) return;
    window.removeEventListener('resize', fsBtnResizeHandler);
    fsBtnResizeHandler = null;
    if (fsLayoutRaf) { cancelAnimationFrame(fsLayoutRaf); fsLayoutRaf = 0; }
  }
}

// Reposiciona una vez al terminar la transición de transform (click-zoom)
function hookImgTransformEndOnce() {
  const img = currentImage || document.getElementById('modal-img');
  if (!img) return;

  if (imgTransformEndHandler) {
    img.removeEventListener('transitionend', imgTransformEndHandler);
    imgTransformEndHandler = null;
  }

  imgTransformEndHandler = (ev) => {
    if (ev.propertyName === 'transform') {
      scheduleFsBtnLayout();
      img.removeEventListener('transitionend', imgTransformEndHandler);
      imgTransformEndHandler = null;
    }
  };
  img.addEventListener('transitionend', imgTransformEndHandler);
}


function initMobileRotationHandler() {
let last = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
window.addEventListener('resize', () => {
const now = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
if (last !== now && isModalOpen) {}
last = now;
});
}
function lockBodyScroll() {
__scrollLockY = window.scrollY || document.documentElement.scrollTop || 0;
isBodyLocked = true;
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
if (isBodyLocked) { window.scrollTo(0, __scrollLockY || 0); }
isBodyLocked = false;
}
function closeModal() {
  const modal = document.getElementById('modal');
  if (!modal) return;

  exitFullscreenSafe();

  // Desactiva el auto-layout del botón fullscreen
  bindFsBtnAutoLayout(false);

  modal.style.display = 'none';
  modal.classList.remove('active', 'is-zoomed', 'is-gesturing', 'fs-active');
  document.body.classList.remove('modal-open');
  isModalOpen = false; ignoreNextClick = false; resetZoom();

  if (keydownHandler) {
    document.removeEventListener('keydown', keydownHandler);
    keydownHandler = null;
  }
  if (fullscreenChangeHandler) {
    document.removeEventListener('fullscreenchange', fullscreenChangeHandler);
    fullscreenChangeHandler = null;
  }

  modal.innerHTML = '';
  unlockBodyScroll();

  if (carruselInnerRef) startCarouselAutoplay(carouselAutoDelay);
  refreshScrollTop();

  if (currentView === 'modal')
    currentView = (modalSource === 'carrusel') ? 'home' : (modalSource === 'seccion' ? 'seccion' : 'home');

  modalFromHomeCarousel = false;
  __pushedModal = false;

  if (window.triggerUiAfterPhotoChange) {
    try { delete window.triggerUiAfterPhotoChange; }
    catch (e) { window.triggerUiAfterPhotoChange = undefined; }
  }
}

function volverAGaleriaInternal() {
currentSeccion = null; currentFotoIndex = 0; todasLasFotos = []; isModalOpen = false;
const home = document.getElementById('home-view'); if (home) home.style.display = 'block';
const insp = document.getElementById('inspiration-section'); if (insp) insp.style.display = 'block';
const view = document.getElementById('seccion-view'); if (view) view.style.display = 'none';
const modal = document.getElementById('modal');
if (modal) {
modal.innerHTML = '';
modal.classList.remove('active', 'is-zoomed', 'is-gesturing', 'fs-active');
document.body.classList.remove('modal-open'); resetZoom();
if (fullscreenChangeHandler) { document.removeEventListener('fullscreenchange', fullscreenChangeHandler); fullscreenChangeHandler = null; }
}
unlockBodyScroll();
window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
currentView = 'home';
if (typeof updateHeaderNavActive === 'function') updateHeaderNavActive(null);
if (typeof closeNavPanel === 'function') closeNavPanel();
refreshScrollTop();
}

// ========= VIDEO EN TARJETA =========
// Multi-tarjeta (hover loop en desktop, one‑shot en móvil/TV)
// TV: sin hover. Móvil: play en touchend. Bloqueo de click solo el sintético.
// + primado por gesto + reintentos + solo un vídeo a la vez + primado global.
(function initCardAnims_AllCards() {
const mqHover  = window.matchMedia('(hover:hover)');
const mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
if (mqReduce.matches) return;

const isHoverDeviceRaw = mqHover.matches;
const isTVUA = /TV|Tizen|Web0S|WebOS|Smart-?TV|BRAVIA|AFT|Shield|AppleTV/i.test(navigator.userAgent);
const useHoverBranch = isHoverDeviceRaw && !isTVUA;
const isOperaDesktop = useHoverBranch && /\bOPR\/|Opera/i.test(navigator.userAgent) && !/Mobile|Android|TV/i.test(navigator.userAgent);

const FALLBACK = ['virgen.mp4','spotting.mp4','calles.mp4','paisaje.mp4','naturaleza.mp4','artisticas.mp4'];

function getAnimSrcForCard(card, idx) {
const ds = card.dataset?.animSrc;
if (ds) return ds;
const title = card.querySelector('.card-content h3')?.textContent || '';
const id = slugify(title);
if (CARD_ANIM_MAP[id]) return CARD_ANIM_MAP[id];
const f = FALLBACK[idx] || FALLBACK[FALLBACK.length - 1];
return '/assets/anim/' + f;
}

function mountOnCard(card, idx) {
if (!card || card.querySelector('video.card-anim')) return false;

const src = getAnimSrcForCard(card, idx);
if (!src) return false;

const video = document.createElement('video');
video.className = 'card-anim';
video.muted = true;         video.setAttribute('muted','');
video.playsInline = true;   video.setAttribute('playsinline','');
video.setAttribute('webkit-playsinline','');
video.loop = useHoverBranch;
video.preload = (useHoverBranch && !isOperaDesktop) ? 'metadata' : 'auto';

try { video.setAttribute('disablepictureinpicture',''); video.disablePictureInPicture = true; } catch(_) {}
try { video.disableRemotePlayback = true; video.setAttribute('controlsList','nodownload noplaybackrate noremoteplayback nofullscreen'); } catch(_) {}

const poster = card.querySelector('img')?.src || '';
if (poster) video.poster = poster;

const sourceEl = document.createElement('source');
sourceEl.src = src; sourceEl.type = 'video/mp4';
video.appendChild(sourceEl);
card.appendChild(video);

// Primado inicial
const prime = () => {
video.play().then(() => { video.pause(); try { video.currentTime = 0; } catch(_) {} }).catch(()=>{});
};
if (video.readyState >= 2) prime(); else video.addEventListener('canplay', prime, { once:true });

// Primado por gesto
const primeOnGesture = () => {
if (video._userPrimed) return;
video._userPrimed = true;
video.play().then(() => { video.pause(); try { video.currentTime = 0; } catch(_) {} })
.catch(() => { video._userPrimed = false; });
};
card.addEventListener('touchstart', primeOnGesture, { passive: true });
card.addEventListener('pointerdown', primeOnGesture, { passive: true });

// Solo un vídeo activo
window.__cardPlayingVideo ??= null;
function claimPlayback() {
if (window.__cardPlayingVideo && window.__cardPlayingVideo !== video) {
try { window.__cardPlayingVideo.pause(); } catch(_) {}
// Libera el estado one-shot del anterior
window.__cardPlayingVideo._oneShotPlaying = false;
const prevCard = window.__cardPlayingVideo.closest('.card');
if (prevCard) prevCard.classList.remove('is-over');
}
window.__cardPlayingVideo = video;
}

// Helpers
const startLoopHover = () => {
try { video.currentTime = 0; } catch(_) {}
claimPlayback();
card.classList.add('is-over');
video.loop = true;
video.play().catch(() => {
primeOnGesture();
setTimeout(() => video.play().catch(()=>{}), 0);
});
};
const stopHover = () => {
video.pause();
card.classList.remove('is-over');
try { video.currentTime = 0; } catch(_) {}
};

const playOnce = () => {
if (video._oneShotPlaying) return;
video._oneShotPlaying = true;
video.loop = false; video.removeAttribute('loop');
try { video.currentTime = 0; } catch(_) {}
claimPlayback();
card.classList.add('is-over');

const finish = () => {
video.pause();
video._oneShotPlaying = false;
card.classList.remove('is-over');
try { video.currentTime = 0; } catch(_) {}
video.removeEventListener('ended', finish);
};

video.play().then(() => {
if (isFinite(video.duration) && video.duration > 0) {
video.addEventListener('ended', finish, { once:true });
} else {
setTimeout(finish, 3500);
}
}).catch(() => {
primeOnGesture();
setTimeout(() => {
video.play().then(() => {
if (isFinite(video.duration) && video.duration > 0) {
video.addEventListener('ended', finish, { once:true });
} else {
setTimeout(finish, 3500);
}
}).catch(() => setTimeout(finish, 1200));
}, 0);
});
};

// Si el vídeo se pausa por cualquier motivo, libera el estado one-shot
video.addEventListener('pause', () => { if (!video.loop) video._oneShotPlaying = false; });
video.addEventListener('emptied', () => { video._oneShotPlaying = false; });
video.addEventListener('error',   () => { video._oneShotPlaying = false; });

if (useHoverBranch) {
// Desktop/hover
const onEnter = () => startLoopHover();
const onLeave = () => stopHover();
card.addEventListener('pointerenter', onEnter);
card.addEventListener('pointerleave', onLeave);
card.addEventListener('mouseenter', onEnter);
card.addEventListener('mouseleave', onLeave);
document.addEventListener('visibilitychange', () => { if (document.hidden) stopHover(); });
} else {
// Móvil / TV
const LONG_MS = 550;
let pressTimer = null;

// Click sintético: ventanas cortas por tarjeta
let suppressUntil = 0;
function blockClickNext(ms = 180) {
suppressUntil = performance.now() + ms;
setTimeout(() => {
if (performance.now() >= suppressUntil) suppressUntil = 0;
}, ms + 60);
}

// Long‑press TV
card.addEventListener('pointerdown', (e) => {
const isTvPointer = isTVUA && (e.pointerType === 'mouse' || e.pointerType === 'pen' || e.pointerType === 'touch' || e.pointerType === 'unknown');
if (isTvPointer) {
if (pressTimer) clearTimeout(pressTimer);
pressTimer = setTimeout(() => {
blockClickNext(220);
primeOnGesture();
playOnce();
}, LONG_MS);
}
});
const clearPress = () => { if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; } };
card.addEventListener('pointerup', clearPress);
card.addEventListener('pointercancel', clearPress);
card.addEventListener('pointerleave', clearPress);

// TV teclado
if (isTVUA) {
if (!card.hasAttribute('tabindex')) card.setAttribute('tabindex','0');
card.addEventListener('keydown', (e) => {
if (e.key === 'Enter' || e.code === 'Enter' || e.key === ' ' || e.code === 'Space') {
e.preventDefault(); e.stopPropagation();
blockClickNext(220);
primeOnGesture();
playOnce();
}
});
}

// Móvil: arrastras un poco y sueltas => play en touchend
let sx = 0, sy = 0, moved = false, willPlayOnRelease = false;
card.addEventListener('touchstart', (e) => {
const t = e.touches[0];
sx = t.clientX; sy = t.clientY;
moved = false; willPlayOnRelease = false;
}, { passive: true });

card.addEventListener('touchmove', (e) => {
const t = e.touches[0];
const dx = Math.abs(t.clientX - sx);
const dy = Math.abs(t.clientY - sy);
if (!moved && (dx > 8 || dy > 8)) {
moved = true; willPlayOnRelease = true;
}
}, { passive: true });

card.addEventListener('touchend', () => {
if (willPlayOnRelease) {
primeOnGesture();
blockClickNext(220);
setTimeout(() => playOnce(), 0);
willPlayOnRelease = false;
}
}, { passive: true });

card.addEventListener('touchcancel', () => { moved = false; willPlayOnRelease = false; suppressUntil = 0; }, { passive: true });

card.addEventListener('click', (e) => {
if (performance.now() < suppressUntil) {
e.preventDefault(); e.stopPropagation();
suppressUntil = 0;
}
// Si NO está suprimido, el click navega a la sección (tu handler existente)
}, true);

// Si cambias de pestaña/app, libera estado
document.addEventListener('visibilitychange', () => {
if (document.hidden) {
video.pause();
video._oneShotPlaying = false;
card.classList.remove('is-over');
try { video.currentTime = 0; } catch(_) {}
}
});
}

return true;
}

function mountOnAllCards() {
const cards = document.querySelectorAll('.section-cards .card');
let mounted = 0;
cards.forEach((card, idx) => { if (mountOnCard(card, idx)) mounted++; });
return mounted;
}

window.addEventListener('load', () => {
mountOnAllCards();
const t0 = Date.now();
const timer = setInterval(() => {
const done = mountOnAllCards();
if (done || (Date.now() - t0) > 4000) clearInterval(timer);
}, 300);
});

const container = document.querySelector('.section-cards');
if (container && 'MutationObserver' in window) {
const mo = new MutationObserver(() => mountOnAllCards());
mo.observe(container, { childList: true, subtree: true });
}

// PRIMADO GLOBAL: primera interacción autoriza todos los vídeos
(function primeAllCardVideosOnce() {
if (window.__cardVideosPrimedGlobally) return;
window.__cardVideosPrimedGlobally = true;
const handler = () => {
const vids = document.querySelectorAll('.section-cards video.card-anim');
vids.forEach(v => {
try {
v.muted = true; v.setAttribute('muted','');
v.setAttribute('playsinline',''); v.setAttribute('webkit-playsinline','');
v.play().then(() => { v.pause(); try { v.currentTime = 0; } catch(_) {} }).catch(()=>{});
} catch(_) {}
});
['pointerdown','touchstart','keydown','click'].forEach(ev => {
window.removeEventListener(ev, handler, true);
});
};
['pointerdown','touchstart','keydown','click'].forEach(ev => {
window.addEventListener(ev, handler, { once: true, capture: true, passive: true });
});
})();
})();


// ===== Boot =====
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', iniciar, { once: true }); }
else { iniciar(); }
