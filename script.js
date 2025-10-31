// SCRIPT.JS - VERSIÓN COMPLETA (mobile: pinch zoom, back nativo, bottom sheet)
console.log('✅ script.js CARGADO');

// Variables globales
let currentSeccion = null;
let currentFotoIndex = 0;
let todasLasFotos = [];
let carruselActualIndex = 0;
let carruselFotos = [];
let autoPlayInterval;
let datosGlobales = null;
let isModalOpen = false;

// Estado de navegación (History API)
let currentView = 'home'; // 'home' | 'seccion' | 'modal'
let isHandlingPopstate = false;

// Evitar clic fantasma tras gestos
let ignoreNextClick = false;

// Variables de zoom
let currentScale = 1;
let currentImage = null;
let isDragging = false;
let startX, startY;
let translateX = 0, translateY = 0;
let lastX = 0, lastY = 0;
let animationFrameId = null;

// Pinch
let isPinching = false;
let pinchStartDistance = 0;
let pinchStartScale = 1;

// Keydown handler para poder limpiarlo al cerrar
let keydownHandler = null;

// Función principal
function iniciar() {
  console.log('🚀 INICIANDO...');
  
  const logo = document.getElementById('logoHome');
  if (logo) {
    logo.addEventListener('click', () => {
      // Navega a home manteniendo el historial coherente
      if (currentView !== 'home') {
        history.pushState({ view: 'home' }, '');
        aplicarEstado({ view: 'home' });
      }
    });
  }
  
  crearBotonScrollTop();
  
  setTimeout(() => {
    console.log('🔍 Buscando contenedor...');
    const container = document.getElementById('secciones-container');
    
    if (container) {
      console.log('✅ Contenedor EXISTE, cargando datos...');
      cargarDatos(container);
    } else {
      console.error('❌ Contenedor NO EXISTE');
      setTimeout(iniciar, 1000);
    }
  }, 1000);
  
  initMobileRotationHandler();
  initHistoryHandler();
}

// ================== SCROLL TO TOP ==================
function crearBotonScrollTop() {
  const scrollToTopBtn = document.createElement('button');
  scrollToTopBtn.className = 'scroll-to-top';
  scrollToTopBtn.innerHTML = '↑';
  scrollToTopBtn.setAttribute('aria-label', 'Volver arriba');
  scrollToTopBtn.setAttribute('title', 'Volver arriba');
  
  scrollToTopBtn.addEventListener('click', scrollToTop);
  document.body.appendChild(scrollToTopBtn);
  
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    if (scrollY > 300) {
      scrollToTopBtn.classList.add('visible');
    } else {
      scrollToTopBtn.classList.remove('visible');
    }
  });
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ================== HISTORY API ==================
function initHistoryHandler() {
  if (!history.state) {
    history.replaceState({ view: 'home' }, '');
  }
  window.addEventListener('popstate', (e) => {
    const state = e.state || { view: 'home' };
    aplicarEstado(state);
  });
}

function aplicarEstado(state) {
  isHandlingPopstate = true;

  // Cierra modal si corresponde
  if (state.view !== 'modal' && isModalOpen) {
    closeModal();
  }

  if (state.view === 'home') {
    volverAGaleriaInternal();
  } else if (state.view === 'seccion') {
    if (datosGlobales) {
      const sec = datosGlobales.secciones.find(s => s.id === state.seccionId);
      if (sec) {
        mostrarSeccion(sec, { push: false });
      } else {
        volverAGaleriaInternal();
      }
    } else {
      volverAGaleriaInternal();
    }
  } else if (state.view === 'modal') {
    if (datosGlobales) {
      const sec = datosGlobales.secciones.find(s => s.id === state.seccionId);
      if (sec) {
        mostrarSeccion(sec, { push: false });
        const foto = sec.fotos[state.fotoIndex] || sec.fotos[0];
        if (foto) {
          mostrarModal(foto.url, foto.texto, state.fotoIndex, { push: false });
        }
      } else {
        volverAGaleriaInternal();
      }
    } else {
      volverAGaleriaInternal();
    }
  }

  isHandlingPopstate = false;
}

function goBackOneStep() {
  // Si estamos en modal o sección, retrocede; si ya estás en home, no salgas del sitio
  if (history.state && history.state.view !== 'home') {
    history.back();
  } else {
    // Estado base: asegura home en UI
    aplicarEstado({ view: 'home' });
    history.replaceState({ view: 'home' }, '');
  }
}

// ================== Cargar datos y crear tarjetas ==================
async function cargarDatos(container) {
  try {
    console.log('📥 Cargando data.json...');
    const response = await fetch('data.json?v=' + Date.now());
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    datosGlobales = data;
    
    if (!data || !data.secciones || !Array.isArray(data.secciones)) {
      throw new Error('Estructura de datos inválida en data.json');
    }
    
    console.log('🎨 Creando', data.secciones.length, 'tarjetas...');
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
      
      card.addEventListener('click', () => {
        console.log('🔄 Navegando a sección:', seccion.id);
        mostrarSeccion(seccion);
      });
      
      container.appendChild(card);
    });
    
    console.log('🎉 ÉXITO: Secciones cargadas');
    cargarCarrusel(data);
    
  } catch (error) {
    console.error('❌ Error cargando datos:', error);
    container.innerHTML = `
      <div class="error-message">
        <h3>Error al cargar los datos</h3>
        <p>${error.message}</p>
        <button onclick="location.reload()">Reintentar</button>
      </div>
    `;
  }
}

// ================== CARRUSEL ÚLTIMAS FOTOS ==================
function cargarCarrusel(data) {
  const container = document.getElementById('ultimas-fotos-carrusel');
  const dotsContainer = document.getElementById('carrusel-dots');
  
  if (!container) {
    console.log('❌ Contenedor del carrusel no encontrado');
    return;
  }
  
  console.log('🔄 Cargando carrusel de últimas fotos...');
  carruselFotos = obtenerFotosParaCarrusel(data);
  mostrarCarruselFotos(carruselFotos, container, dotsContainer);
  iniciarAutoPlay();
  configurarInteraccionCarrusel();
}

function obtenerFotosParaCarrusel(data) {
  const todasLasFotosLocal = [];
  
  data.secciones.forEach(seccion => {
    if (seccion.fotos && Array.isArray(seccion.fotos)) {
      seccion.fotos.forEach((foto, index) => {
        todasLasFotosLocal.push({
          ...foto,
          seccionId: seccion.id,
          seccionTitulo: seccion.titulo,
          indiceEnSeccion: index
        });
      });
    }
  });
  
  console.log(`📸 Encontradas ${todasLasFotosLocal.length} fotos en total`);
  const ultimas = todasLasFotosLocal.slice(-6).reverse();
  console.log(`🎠 Mostrando ${ultimas.length} fotos en el carrusel`);
  
  return ultimas;
}

function mostrarCarruselFotos(fotos, container, dotsContainer) {
  container.innerHTML = '';
  dotsContainer.innerHTML = '';
  
  if (fotos.length === 0) {
    container.innerHTML = '<div class="carrusel-item"><p class="no-fotos">No hay fotos recientes</p></div>';
    return;
  }
  
  fotos.forEach((foto, index) => {
    const carruselItem = document.createElement('div');
    carruselItem.className = `carrusel-item ${index === 0 ? 'active' : ''}`;
    carruselItem.innerHTML = `
      <img src="${foto.url}" alt="${foto.texto}" class="carrusel-img">
      <div class="carrusel-info">
        <div class="carrusel-desc">${foto.texto}</div>
      </div>
    `;
    
    carruselItem.addEventListener('click', () => {
      irAFotoEnSeccion(foto.seccionId, foto.indiceEnSeccion);
    });
    
    container.appendChild(carruselItem);
  });
  
  fotos.forEach((_, index) => {
    const dot = document.createElement('button');
    dot.className = `carrusel-dot ${index === 0 ? 'active' : ''}`;
    dot.addEventListener('click', () => {
      pausarCarrusel();
      moverCarruselA(index);
    });
    dotsContainer.appendChild(dot);
  });
  
  configurarBotonesCarrusel();
  actualizarCarrusel();
}

function configurarBotonesCarrusel() {
  const prevBtn = document.querySelector('.prev-btn');
  const nextBtn = document.querySelector('.next-btn');
  
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      pausarCarrusel();
      moverCarruselA(carruselActualIndex - 1);
    });
  }
  
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      pausarCarrusel();
      moverCarruselA(carruselActualIndex + 1);
    });
  }
}

function pausarCarrusel() {
  clearInterval(autoPlayInterval);
  setTimeout(() => { iniciarAutoPlay(); }, 30000);
}

function moverCarruselA(nuevoIndex) {
  if (nuevoIndex < 0) {
    nuevoIndex = carruselFotos.length - 1;
  } else if (nuevoIndex >= carruselFotos.length) {
    nuevoIndex = 0;
  }
  carruselActualIndex = nuevoIndex;
  actualizarCarrusel();
}

function actualizarCarrusel() {
  const carruselInner = document.querySelector('.carrusel-inner');
  const dots = document.querySelectorAll('.carrusel-dot');
  
  if (carruselInner) {
    carruselInner.style.transform = `translateX(-${carruselActualIndex * 100}%)`;
  }
  
  dots.forEach((dot, index) => {
    dot.classList.toggle('active', index === carruselActualIndex);
  });
}

function iniciarAutoPlay() {
  autoPlayInterval = setInterval(() => {
    moverCarruselA(carruselActualIndex + 1);
  }, 20000);
}

function configurarInteraccionCarrusel() {
  const carrusel = document.querySelector('.carrusel');
  if (carrusel) {
    carrusel.addEventListener('mouseenter', () => { clearInterval(autoPlayInterval); });
    carrusel.addEventListener('mouseleave', () => { iniciarAutoPlay(); });
  }
}

function irAFotoEnSeccion(seccionId, fotoIndex) {
  if (!datosGlobales) return;
  
  const seccion = datosGlobales.secciones.find(s => s.id === seccionId);
  if (seccion) {
    mostrarSeccion(seccion);
    setTimeout(() => {
      const foto = seccion.fotos[fotoIndex];
      if (foto) {
        mostrarModal(foto.url, foto.texto, fotoIndex);
      }
    }, 400);
  }
}

// ================== MOSTRAR SECCIÓN ==================
function mostrarSeccion(seccion, opts = { push: true }) {
  console.log('🖼️ Mostrando sección:', seccion.titulo);
  
  currentSeccion = seccion;
  
  if (!seccion.fotos || !Array.isArray(seccion.fotos)) {
    console.error('❌ No hay fotos en esta sección:', seccion);
    return;
  }
  
  todasLasFotos = seccion.fotos;
  
  const homeView = document.getElementById('home-view');
  if (homeView) homeView.style.display = 'none';
  
  const inspirationSection = document.getElementById('inspiration-section');
  if (inspirationSection) inspirationSection.style.display = 'none';
  
  let seccionView = document.getElementById('seccion-view');
  if (!seccionView) {
    seccionView = document.createElement('div');
    seccionView.id = 'seccion-view';
    seccionView.className = 'seccion-view';
    document.getElementById('content').appendChild(seccionView);
  }
  
  seccionView.innerHTML = `
    <header class="seccion-header">
      <button class="back-button" title="Volver">←</button>
      <div class="seccion-title-container">
        <h1>${seccion.titulo}</h1>
        <p class="seccion-descripcion">${seccion.descripcion}</p>
      </div>
    </header>
    <div class="fotos-grid" id="fotos-container"></div>
  `;
  
  seccionView.style.display = 'block';
  
  const backButton = seccionView.querySelector('.back-button');
  if (backButton) {
    backButton.addEventListener('click', () => {
      goBackOneStep();
    });
  }
  
  const container = document.getElementById('fotos-container');
  if (container) {
    container.innerHTML = '';
    
    seccion.fotos.forEach((foto, index) => {
      if (!foto.miniatura || !foto.texto || !foto.url) {
        console.warn('Foto incompleta:', foto);
        return;
      }
      
      const fotoElement = document.createElement('div');
      fotoElement.className = 'foto-item';
      fotoElement.style.animationDelay = `${index * 0.1}s`;
      
      fotoElement.innerHTML = `
        <img src="${foto.miniatura}" alt="${foto.texto}" class="foto-miniatura" loading="lazy">
      `;
      
      fotoElement.addEventListener('click', () => {
        mostrarModal(foto.url, foto.texto, index);
      });
      
      container.appendChild(fotoElement);
    });
    
    console.log(`🎨 Cargadas ${seccion.fotos.length} fotos`);
  }

  currentView = 'seccion';
  if (opts.push && !isHandlingPopstate) {
    history.pushState({ view: 'seccion', seccionId: seccion.id }, '');
  }
}

// ================== MODAL CON ZOOM + SWIPE + BOTTOM SHEET ==================
function mostrarModal(imageUrl, title, fotoIndex, opts = { push: true }) {
  const modal = document.getElementById('modal');
  currentFotoIndex = fotoIndex;
  isModalOpen = true;
  
  modal.innerHTML = `
    <div class="close-modal">×</div>
    <div class="nav-button prev-button">‹</div>
    <div class="nav-button next-button">›</div>
    <div class="modal-content">
      <div class="modal-img-container">
        <img src="" alt="${title}" class="modal-img" id="modal-img">
      </div>
      <div class="modal-info">
        <div class="info-handle" aria-hidden="true"></div>
        <div class="foto-counter">${currentFotoIndex + 1} / ${todasLasFotos.length}</div>
        <div class="foto-title">${title}</div>
      </div>
    </div>
  `;
  
  const modalImg = document.getElementById('modal-img');
  
  const img = new Image();
  img.onload = function() {
    modalImg.src = imageUrl;
    modalImg.alt = title;
    currentImage = modalImg;
    
    resetZoom();
    
    modal.classList.add('active');
    document.body.classList.add('modal-open');

    configurarEventosModal();
  };
  img.onerror = function() {
    modalImg.src = imageUrl;
    modalImg.alt = title;
    currentImage = modalImg;
    resetZoom();
    modal.classList.add('active');
    document.body.classList.add('modal-open');
    configurarEventosModal();
  };
  img.src = imageUrl;

  currentView = 'modal';
  if (opts.push && !isHandlingPopstate && currentSeccion) {
    history.pushState({ view: 'modal', seccionId: currentSeccion.id, fotoIndex: currentFotoIndex }, '');
  }

  function configurarEventosModal() {
    const prevBtn = modal.querySelector('.prev-button');
    const nextBtn = modal.querySelector('.next-button');

    const closeBtn = modal.querySelector('.close-modal');
    if (closeBtn) closeBtn.onclick = goBackOneStep;
    if (prevBtn) prevBtn.onclick = () => navegarFoto(-1);
    if (nextBtn) nextBtn.onclick = () => navegarFoto(1);

    // CLICK EN OVERLAY = CERRAR (no dentro de contenido)
    modal.addEventListener('click', function(event) {
      if (event.target === modal) {
        if (ignoreNextClick) {
          ignoreNextClick = false;
          return;
        }
        goBackOneStep();
      }
    });

    // CLICK EN IMAGEN = cerrar si no hay zoom; doble click = toggle zoom
    let clickCount = 0;
    let clickTimer = null;

    modalImg.addEventListener('click', function(event) {
      if (ignoreNextClick) {
        ignoreNextClick = false;
        event.stopPropagation();
        return;
      }
      clickCount++;
      if (clickCount === 1) {
        clickTimer = setTimeout(() => {
          if (currentScale <= 1) {
            goBackOneStep();
          }
          clickCount = 0;
        }, 300);
      } else if (clickCount === 2) {
        clearTimeout(clickTimer);
        toggleZoomDobleClic();
        clickCount = 0;
      }
      event.stopPropagation();
    });

    // Zoom con rueda del ratón (desktop)
    modal.addEventListener('wheel', function(e) {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      const newScale = currentScale * zoomFactor;
      if (newScale >= 1 && newScale <= 5) {
        currentScale = newScale;
        aplicarZoom();
      }
    }, { passive: false });

    // Arrastre con zoom (desktop)
    modalImg.addEventListener('mousedown', startDrag);

    // Touch: pinch y drag (móvil)
    modalImg.addEventListener('touchstart', onTouchStartImg, { passive: false });

    // Swipe horizontal para navegar
    attachSwipeToModal(modal);

    // Bottom sheet (gesto vertical para subir/bajar el panel)
    attachBottomSheet(modal);

    // Teclado (Escape, flechas)
    keydownHandler = function(event) {
      switch(event.key) {
        case 'Escape': goBackOneStep(); break;
        case 'ArrowLeft': navegarFoto(-1); break;
        case 'ArrowRight': navegarFoto(1); break;
      }
    };
    document.addEventListener('keydown', keydownHandler);
  }

  function toggleZoomDobleClic() {
    // Si hay zoom, vuelve a 100%; si no, amplia a 200%
    if (currentScale > 1) {
      currentScale = 1;
      translateX = 0;
      translateY = 0;
    } else {
      currentScale = 2;
    }
    aplicarZoom();
  }
}

// ================== TOUCH: PINCH + DRAG ==================
function onTouchStartImg(e) {
  if (e.touches.length === 2) {
    // Pinch start
    isPinching = true;
    pinchStartDistance = getTouchesDistance(e.touches[0], e.touches[1]);
    pinchStartScale = currentScale;
    if (currentImage) currentImage.style.transition = 'none';
    document.addEventListener('touchmove', onTouchMoveImg, { passive: false });
    document.addEventListener('touchend', onTouchEndImg);
    e.preventDefault();
    e.stopPropagation();
    return;
  }

  if (e.touches.length === 1 && currentScale > 1) {
    // Drag con zoom
    startDragTouch(e);
  }
}

function onTouchMoveImg(e) {
  if (isPinching && e.touches.length === 2) {
    e.preventDefault(); // evita zoom del navegador
    const newDistance = getTouchesDistance(e.touches[0], e.touches[1]);
    let newScale = pinchStartScale * (newDistance / pinchStartDistance);
    newScale = Math.max(1, Math.min(5, newScale));
    currentScale = newScale;
    aplicarZoom(true); // sin transición
  }
}

function onTouchEndImg(e) {
  if (isPinching && e.touches.length < 2) {
    isPinching = false;
    if (currentImage) currentImage.style.transition = ''; // restablece transición
    ignoreNextClick = true;
    setTimeout(() => { ignoreNextClick = false; }, 250);
    document.removeEventListener('touchmove', onTouchMoveImg);
    document.removeEventListener('touchend', onTouchEndImg);
  }
}

function getTouchesDistance(t1, t2) {
  const dx = t2.clientX - t1.clientX;
  const dy = t2.clientY - t1.clientY;
  return Math.hypot(dx, dy);
}

// ================== SISTEMA DE ZOOM Y ARRASTRE ==================
function startDrag(e) {
  if (currentScale <= 1) return;
  
  isDragging = true;
  startX = e.clientX - translateX;
  startY = e.clientY - translateY;
  lastX = e.clientX;
  lastY = e.clientY;
  
  if (currentImage) {
    currentImage.style.cursor = 'grabbing';
    currentImage.classList.add('grabbing');
  }
  
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', stopDrag);
  
  e.preventDefault();
  e.stopPropagation();
}

function startDragTouch(e) {
  if (currentScale <= 1) return;
  
  isDragging = true;
  const touch = e.touches[0];
  startX = touch.clientX - translateX;
  startY = touch.clientY - translateY;
  lastX = touch.clientX;
  lastY = touch.clientY;
  
  if (currentImage) {
    currentImage.classList.add('grabbing');
  }
  
  document.addEventListener('touchmove', dragTouch, { passive: false });
  document.addEventListener('touchend', stopDrag);
  
  e.preventDefault();
  e.stopPropagation();
}

function drag(e) {
  if (!isDragging) return;
  
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  
  animationFrameId = requestAnimationFrame(() => {
    const deltaX = e.clientX - lastX;
    const deltaY = e.clientY - lastY;
    
    translateX += deltaX * 1.2;
    translateY += deltaY * 1.2;
    
    lastX = e.clientX;
    lastY = e.clientY;
    
    aplicarZoom(true);
  });
}

function dragTouch(e) {
  if (!isDragging) return;
  
  const touch = e.touches[0];
  
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  
  animationFrameId = requestAnimationFrame(() => {
    const deltaX = touch.clientX - lastX;
    const deltaY = touch.clientY - lastY;
    
    translateX += deltaX * 1.2;
    translateY += deltaY * 1.2;
    
    lastX = touch.clientX;
    lastY = touch.clientY;
    
    aplicarZoom(true);
  });

  e.preventDefault();
}

function stopDrag() {
  if (!isDragging) return;
  
  isDragging = false;
  
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  
  if (currentImage && currentScale > 1) {
    currentImage.style.cursor = 'move';
    currentImage.classList.remove('grabbing');
  }
  
  document.removeEventListener('mousemove', drag);
  document.removeEventListener('touchmove', dragTouch);
  document.removeEventListener('mouseup', stopDrag);
  document.removeEventListener('touchend', stopDrag);
}

function aplicarZoom(noTransition = false) {
  if (currentImage) {
    if (noTransition) {
      currentImage.style.transition = 'none';
    } else if (!isPinching) {
      currentImage.style.transition = 'transform 0.2s ease';
    }

    // Importante: translate primero, luego scale
    currentImage.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentScale})`;
    currentImage.style.transformOrigin = 'center center';
    
    const modalEl = document.getElementById('modal');

    if (currentScale > 1) {
      currentImage.classList.add('zoomed');
      currentImage.style.cursor = isDragging ? 'grabbing' : 'move';
      if (modalEl) modalEl.classList.add('is-zoomed');
    } else {
      currentImage.classList.remove('zoomed');
      currentImage.style.cursor = 'default';
      translateX = 0;
      translateY = 0;
      if (modalEl) modalEl.classList.remove('is-zoomed');
      currentImage.style.transform = `translate(0px, 0px) scale(1)`;
    }
  }
}

function resetZoom() {
  currentScale = 1;
  translateX = 0;
  translateY = 0;
  isDragging = false;
  lastX = 0;
  lastY = 0;
  isPinching = false;
  
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  
  if (currentImage) {
    currentImage.style.transition = '';
    currentImage.style.transform = 'translate(0px, 0px) scale(1)';
    currentImage.classList.remove('zoomed', 'grabbing');
    currentImage.style.cursor = 'default';
  }

  const modalEl = document.getElementById('modal');
  if (modalEl) {
    modalEl.classList.remove('is-zoomed');
  }
}

// ================== NAVEGACIÓN ENTRE FOTOS ==================
function navegarFoto(direccion) {
  if (!todasLasFotos.length) return;
  
  let nuevoIndex = currentFotoIndex + direccion;
  
  if (nuevoIndex < 0) {
    nuevoIndex = todasLasFotos.length - 1;
  } else if (nuevoIndex >= todasLasFotos.length) {
    nuevoIndex = 0;
  }
  
  currentFotoIndex = nuevoIndex;
  const nuevaFoto = todasLasFotos[currentFotoIndex];
  
  const modal = document.getElementById('modal');
  const modalImg = document.getElementById('modal-img');
  const fotoCounter = modal.querySelector('.foto-counter');
  const fotoTitle = modal.querySelector('.foto-title');
  
  resetZoom();
  
  const img = new Image();
  img.onload = function() {
    modalImg.src = nuevaFoto.url;
    modalImg.alt = nuevaFoto.texto;
    currentImage = modalImg;
    
    if (fotoCounter) {
      fotoCounter.textContent = `${currentFotoIndex + 1} / ${todasLasFotos.length}`;
    }
    if (fotoTitle) {
      fotoTitle.textContent = nuevaFoto.texto;
    }

    // Actualiza estado modal en el historial (sin añadir más pasos)
    if (!isHandlingPopstate && history.state && history.state.view === 'modal' && currentSeccion) {
      history.replaceState({ view: 'modal', seccionId: currentSeccion.id, fotoIndex: currentFotoIndex }, '');
    }
  };
  img.onerror = function() {
    modalImg.src = nuevaFoto.url;
    modalImg.alt = nuevaFoto.texto;
    currentImage = modalImg;
    if (fotoCounter) {
      fotoCounter.textContent = `${currentFotoIndex + 1} / ${todasLasFotos.length}`;
    }
    if (fotoTitle) {
      fotoTitle.textContent = nuevaFoto.texto;
    }
  };
  img.src = nuevaFoto.url;
}

// ================== SWIPE HORIZONTAL PARA NAVEGAR ==================
function attachSwipeToModal(modal) {
  const container = modal.querySelector('.modal-img-container');
  if (!container) return;

  let startX = 0, startY = 0, startT = 0;
  let bloqueaPorVertical = false;

  function onStart(e) {
    if (currentScale > 1) return; // con zoom activo no navegamos
    const t = e.touches[0];
    startX = t.clientX;
    startY = t.clientY;
    startT = Date.now();
    bloqueaPorVertical = false;
    modal.classList.add('is-gesturing');
  }

  function onMove(e) {
    if (currentScale > 1) return;
    const t = e.touches[0];
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;

    // si el gesto es más vertical, no interceptar
    if (!bloqueaPorVertical && Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 10) {
      bloqueaPorVertical = true;
      modal.classList.remove('is-gesturing');
    }
  }

  function onEnd(e) {
    modal.classList.remove('is-gesturing');
    if (currentScale > 1 || bloqueaPorVertical) return;

    const t = e.changedTouches[0];
    const dx = t.clientX - startX;
    const dt = Date.now() - startT;

    const threshold = 60; // píxeles
    const esRapido = Math.abs(dx) / dt > 0.5; // velocidad px/ms

    if (Math.abs(dx) > threshold || esRapido) {
      ignoreNextClick = true; // evita click fantasma
      if (dx < 0) {
        navegarFoto(1);
      } else {
        navegarFoto(-1);
      }
      setTimeout(() => { ignoreNextClick = false; }, 300);
    }
  }

  container.addEventListener('touchstart', onStart, { passive: true });
  container.addEventListener('touchmove', onMove, { passive: true });
  container.addEventListener('touchend', onEnd, { passive: true });
}

// ================== BOTTOM SHEET (subir/bajar panel con gesto vertical) ==================
function attachBottomSheet(modal) {
  const isMobile = window.matchMedia('(max-width: 1024px)').matches;
  if (!isMobile) return; // sólo en móvil/tablet

  const imgContainer = modal.querySelector('.modal-img-container');
  const info = modal.querySelector('.modal-info');
  const handle = modal.querySelector('.info-handle');
  if (!imgContainer || !info || !handle) return;

  function getCollapsed() { return window.matchMedia('(orientation: landscape)').matches ? '20dvh' : '26dvh'; }
  function getExpanded() { return '60dvh'; }
  function setInfoHeight(val) { modal.style.setProperty('--info-height', val); }

  // Estado inicial
  setInfoHeight(getCollapsed());

  function expand() { setInfoHeight(getExpanded()); }
  function collapse() { setInfoHeight(getCollapsed()); }

  // Gestos sobre la imagen: swipe UP -> expand, DOWN -> collapse
  let startY = 0;
  let deltaY = 0;

  imgContainer.addEventListener('touchstart', (e) => {
    if (currentScale > 1) return;
    const t = e.touches[0];
    startY = t.clientY;
    deltaY = 0;
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
      if (deltaY < 0) expand();
      else collapse();
      setTimeout(() => { ignoreNextClick = false; }, 250);
    }
  }, { passive: true });

  // Drag del asa del sheet
  let dragging = false;
  let dragStartY = 0;
  let startHeightPx = 0;

  function vhToPx(v) {
    const match = String(v).match(/([\d.]+)d?vh/);
    const num = match ? parseFloat(match[1]) : 0;
    return (num / 100) * window.innerHeight;
  }

  function pxToVh(px) {
    return (px / window.innerHeight) * 100;
  }

  handle.addEventListener('touchstart', (e) => {
    const t = e.touches[0];
    dragging = true;
    dragStartY = t.clientY;
    startHeightPx = vhToPx(getComputedStyle(modal).getPropertyValue('--info-height'));
    modal.classList.add('is-gesturing');
    e.preventDefault();
  }, { passive: false });

  handle.addEventListener('touchmove', (e) => {
    if (!dragging) return;
    const t = e.touches[0];
    const dy = t.clientY - dragStartY;
    let newHeightPx = startHeightPx - dy; // arrastrar hacia arriba aumenta altura
    const minPx = vhToPx(getCollapsed());
    const maxPx = vhToPx(getExpanded());
    newHeightPx = Math.max(minPx, Math.min(maxPx, newHeightPx));
    const newVh = pxToVh(newHeightPx).toFixed(2) + 'dvh';
    setInfoHeight(newVh);
    e.preventDefault();
  }, { passive: false });

  handle.addEventListener('touchend', () => {
    if (!dragging) return;
    dragging = false;
    modal.classList.remove('is-gesturing');

    // Snap al estado más cercano
    const currentPx = vhToPx(getComputedStyle(modal).getPropertyValue('--info-height'));
    const midPx = (vhToPx(getCollapsed()) + vhToPx(getExpanded())) / 2;
    if (currentPx >= midPx) { expand(); } else { collapse(); }
    ignoreNextClick = true;
    setTimeout(() => { ignoreNextClick = false; }, 250);
  });

  // Ajustar altura al rotar o cambiar viewport
  const onResize = () => {
    if (!isModalOpen) return;
    const currentPx = vhToPx(getComputedStyle(modal).getPropertyValue('--info-height'));
    const collapsedPx = vhToPx(getCollapsed());
    const expandedPx = vhToPx(getExpanded());
    const target = Math.abs(currentPx - expandedPx) < Math.abs(currentPx - collapsedPx) ? getExpanded() : getCollapsed();
    setInfoHeight(target);
  };
  window.addEventListener('resize', onResize);
}

// ================== MANEJO DE ROTACIÓN EN MÓVILES - NO CERRAR ==================
function initMobileRotationHandler() {
  let ultimaOrientacion = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
  window.addEventListener('resize', () => {
    const nuevaOrientacion = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
    if (ultimaOrientacion !== nuevaOrientacion && isModalOpen) {
      console.log('📱 Cambio de orientación con modal abierto (no se cierra)');
      // Con dvh el layout se reajusta solo.
    }
    ultimaOrientacion = nuevaOrientacion;
  });
}

// ================== CERRAR MODAL (sin tocar historial) ==================
function closeModal() {
  const modal = document.getElementById('modal');
  if (modal) {
    modal.classList.remove('active', 'is-zoomed', 'is-gesturing');
    document.body.classList.remove('modal-open');
    isModalOpen = false;
    resetZoom();
    if (keydownHandler) {
      document.removeEventListener('keydown', keydownHandler);
      keydownHandler = null;
    }
    console.log('✅ Modal cerrado');
  }
}

// ================== VOLVER A GALERÍA (sin historial) ==================
function volverAGaleriaInternal() {
  console.log('🏠 Mostrando portada...');
  
  currentSeccion = null;
  currentFotoIndex = 0;
  todasLasFotos = [];
  isModalOpen = false;
  
  const homeView = document.getElementById('home-view');
  if (homeView) homeView.style.display = 'block';
  
  const inspirationSection = document.getElementById('inspiration-section');
  if (inspirationSection) inspirationSection.style.display = 'block';
  
  const seccionView = document.getElementById('seccion-view');
  if (seccionView) seccionView.style.display = 'none';
  
  const modal = document.getElementById('modal');
  if (modal) {
    modal.classList.remove('active', 'is-zoomed', 'is-gesturing');
    document.body.classList.remove('modal-open');
    resetZoom();
  }
  
  window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  currentView = 'home';
}

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
  iniciar();
});
