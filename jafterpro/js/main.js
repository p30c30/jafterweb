// Función principal que carga y gestiona los datos
async function loadData() {
  console.log('=== INICIO loadData ===');

  // 1. CONTENEDOR PRINCIPAL
  const contentElement = document.getElementById('content');
  if (!contentElement) {
    const errorMsg = 'ERROR CRÍTICO: No se encontró elemento con id="content"';
    console.error(errorMsg);
    document.body.innerHTML += `<div style="position:fixed;top:0;left:0;width:100%;background:red;color:white;padding:20px;z-index:9999;font-family:monospace;">${errorMsg}</div>`;
    return;
  }

  // 2. DATOS GLOBALES
  if (typeof window.galeriaData === 'undefined' || window.galeriaData === null || typeof window.galeriaData !== 'object') {
    const errorMsg = 'ERROR CRÍTICO: window.galeriaData inválido o no definido';
    console.error(errorMsg);
    contentElement.innerHTML = `<div style="background:#ff6b6b;color:white;padding:40px;margin:20px;border-radius:10px;font-family:monospace;">
      ❌ ${errorMsg}
      Verifica que index.html incluya data.js antes de main.js
    </div>`;
    return;
  }

  const data = window.galeriaData;
  if (!data.secciones || !Array.isArray(data.secciones) || data.secciones.length === 0) {
    const errorMsg = 'ERROR: data.secciones inexistente o vacío';
    console.error(errorMsg);
    contentElement.innerHTML = `<div style="background:#ffa500;color:white;padding:40px;margin:20px;border-radius:10px;font-family:monospace;">
      ⚠️ ${errorMsg}
    </div>`;
    return;
  }

  // 3. CONFIGURAR ENLACE HOME EN LOGO/TÍTULO
  const logo = document.getElementById('logoHome');
  if (logo) {
    logo.style.cursor = 'pointer';
    logo.setAttribute('role', 'link');
    logo.setAttribute('tabindex', '0');
    logo.title = 'Volver al inicio';
    const goHome = () => {
      const clean = window.location.origin + window.location.pathname;
      window.history.replaceState({}, '', clean);
      // volver a renderizar home
      createHomePage(data);
      // Enfocar el contenedor
      const content = document.getElementById('content');
      if (content) content.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    logo.onclick = goHome;
    logo.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        goHome();
      }
    });
  }

  // 4. CONFIGURAR MODAL ACCESIBLE
  setupModalAccessibility();

  // 5. RENDER SEGÚN PARÁMETRO
  const urlParams = new URLSearchParams(window.location.search);
  const section = urlParams.get('section');
  if (!section) {
    createHomePage(data);
  } else {
    createGallerySections(data);
  }
}

// Configuración y helpers del modal
function setupModalAccessibility() {
  const modal = document.getElementById('modal') || document.getElementById('imageModal');
  const modalImg = document.getElementById('modal-img') || document.getElementById('modalImage');
  const modalClose = document.querySelector('.close') || document.getElementById('modalClose');
  if (!modal || !modalImg) {
    console.warn('⚠️ Elementos del modal faltantes', { modal: !!modal, modalImg: !!modalImg });
    return;
  }
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-label', 'Visor de imagen');
  modal.style.display = 'none';

  const closeModal = () => {
    modal.style.display = 'none';
    document.body.style.overflow = '';
    modalImg.removeAttribute('src');
    // devolver el foco si hay último trigger
    const last = modal._lastTrigger;
    if (last && last.focus) {
      last.focus();
    }
  };
  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target === modalImg) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (modal.style.display !== 'none' && (e.key === 'Escape' || e.key === 'Esc')) {
      closeModal();
    }
  });
  if (modalClose) {
    modalClose.addEventListener('click', (e) => { e.stopPropagation(); closeModal(); });
  }
  // guardar utilidades en el nodo para reuso
  modal._openWith = (src, trigger) => {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    modalImg.src = src;
    modal._lastTrigger = trigger || null;
    // centrado y alto
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modalImg.style.maxWidth = '90vw';
    modalImg.style.maxHeight = '90vh';
  };
}

// Crea la página de inicio
function createHomePage(data) {
  console.log('=== createHomePage INICIO ===');
  const container = document.getElementById('content');
  if (!container) return;

  // limpiar URL de sección
  const clean = window.location.origin + window.location.pathname;
  if (window.location.href !== clean) window.history.replaceState({}, '', clean);

  // Reset contenido
  container.innerHTML = '';
  container.setAttribute('tabindex', '-1');

  const grid = document.createElement('div');
  grid.id = 'section-cards';
  grid.className = 'section-cards';

  data.secciones.forEach((seccion, index) => {
    // Card accesible como botón/enlace
    const card = document.createElement('article');
    card.className = 'card';
    card.setAttribute('role', 'link');
    card.setAttribute('tabindex', '0');
    card.style.cursor = 'pointer';
    card.setAttribute('aria-label', `Abrir sección ${seccion.titulo || seccion.id || index + 1}`);

    const img = document.createElement('img');
    img.src = seccion.preview || 'img/default.jpg';
    img.alt = seccion.titulo ? `Miniatura de ${seccion.titulo}` : 'Miniatura de sección';
    img.loading = 'lazy';

    const h3 = document.createElement('h3');
    h3.textContent = seccion.titulo || 'Sin nombre';

    const p = document.createElement('p');
    p.className = 'card-desc';
    p.textContent = seccion.descripcion || seccion.resumen || 'Explorar galería';

    card.appendChild(img);
    card.appendChild(h3);
    card.appendChild(p);

    const openSection = () => {
      window.location.href = `?section=${encodeURIComponent(seccion.id)}`;
    };
    card.addEventListener('click', openSection);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openSection();
      }
    });

    grid.appendChild(card);
  });

  container.appendChild(grid);

  // Sección inspiradora al final de la portada
  const inspiration = document.getElementById('inspiration-section');
  if (inspiration) {
    // si ya existe en el DOM (index.html), simplemente moverlo al final del contenedor
    container.appendChild(inspiration);
  } else {
    // fallback: crear rápidamente si no existe
    const wrap = document.createElement('div');
    wrap.id = 'inspiration-section';
    wrap.innerHTML = `
      <div style="display:grid;grid-template-columns:1.1fr 0.9fr;gap:28px;align-items:center;
                  background:linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02));
                  border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:28px;
                  box-shadow:0 10px 30px rgba(0,0,0,0.35);backdrop-filter:blur(2px);">
        <div style="text-align:left;max-width:640px;margin:0 auto;">
          <h2 style="font-size:clamp(1.8rem,3.2vw,2.3rem);margin:0 0 14px;color:#FDB813;">El Arte de Capturar el Momento</h2>
          <p style="font-size:1.05rem;line-height:1.75;margin:0 0 12px;color:#e6e6e6;">
            En la fotografía, cada instante es único e irrepetible. Un mismo momento, contemplado a través de diferentes miradas, revela infinitas perspectivas y emociones...
          </p>
          <p style="font-size:1.05rem;line-height:1.75;margin:0 0 12px;color:#e6e6e6;">
            Cada fotografía es un diálogo silencioso entre el observador y el instante congelado en el tiempo...
          </p>
          <p style="font-size:1.05rem;line-height:1.75;margin:0;color:#e6e6e6;">
            Porque al final, fotografiar es mucho más que presionar un botón. Es el arte de ver lo invisible...
          </p>
        </div>
        <div style="position:relative;width:100%;max-width:520px;margin:0 auto;border-radius:14px;overflow:hidden;
                    background:radial-gradient(600px 300px at 50% 60%, rgba(255,255,255,0.08), rgba(0,0,0,0.6));
                    box-shadow:0 10px 26px rgba(0,0,0,0.45);aspect-ratio:4/5;display:flex;align-items:center;justify-content:center;">
          <img src="https://images2.imgbox.com/a7/ae/imIfzK4c_o.jpg" alt="Retrato artístico" style="width:100%;height:100%;object-fit:cover;object-position:center 45%;display:block;filter:contrast(1.02) saturate(1.02);" />
        </div>
      </div>`;
    container.appendChild(wrap);
  }

  console.log('✓ Home page renderizada');
}

// Crea las galerías de una sección
function createGallerySections(data) {
  const container = document.getElementById('content');
  if (!container) return;

  const urlParams = new URLSearchParams(window.location.search);
  const sectionName = urlParams.get('section');
  const seccion = data.secciones.find(s => s.id === sectionName);
  if (!seccion) {
    container.innerHTML = `<div style="background:#ff6b6b;color:white;padding:40px;margin:20px;border-radius:10px;font-family:monospace;">
      ❌ Sección "${sectionName}" no encontrada
      <a href="index.html" style="color:white;">Volver al inicio</a>
    </div>`;
    return;
  }

  container.innerHTML = '';
  const title = document.createElement('h2');
  title.textContent = seccion.titulo || seccion.id;
  container.appendChild(title);

  // contenedor de galerías
  seccion.galerias?.forEach((galeria) => {
    const galeriaDiv = document.createElement('section');
    galeriaDiv.className = 'galeria';

    const titulo = document.createElement('h3');
    titulo.textContent = galeria.titulo || 'Sin título';
    galeriaDiv.appendChild(titulo);

    if (!Array.isArray(galeria.fotos)) return;

    const grid = document.createElement('div');
    grid.className = 'galeria-grid';

    galeria.fotos.forEach((foto, idx) => {
      const src = typeof foto === 'string' ? foto : (foto.src || foto.thumb || foto.url);
      const alt = (typeof foto === 'object' && (foto.alt || foto.titulo)) || `Foto ${idx + 1}`;
      const full = (typeof foto === 'object' && (foto.full || foto.hd || foto.src)) || src;

      const item = document.createElement('figure');
      item.className = 'foto';

      const img = document.createElement('img');
      img.src = src;
      img.alt = alt;
      img.loading = 'lazy';

      const figcap = document.createElement('figcaption');
      figcap.textContent = (typeof foto === 'object' && (foto.caption || foto.descripcion)) || '';

      item.appendChild(img);
      if (figcap.textContent) item.appendChild(figcap);

      const open = (triggerEl) => {
        const modal = document.getElementById('modal') || document.getElementById('imageModal');
        const modalImg = document.getElementById('modal-img') || document.getElementById('modalImage');
        if (!modal || !modalImg) return;
        if (typeof modal._openWith === 'function') {
          modal._openWith(full, triggerEl || img);
        } else {
          modal.style.display = 'flex';
          document.body.style.overflow = 'hidden';
          modalImg.src = full;
        }
      };

      // Interacciones accesibles
      item.style.cursor = 'zoom-in';
      item.setAttribute('tabindex', '0');
      item.setAttribute('role', 'button');
      item.setAttribute('aria-label', `Ampliar ${alt}`);
      item.addEventListener('click', () => open(item));
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(item); }
      });

      grid.appendChild(item);
    });

    galeriaDiv.appendChild(grid);
    container.appendChild(galeriaDiv);
  });
}

// Ejecutar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadData);
} else {
  loadData();
}
console.log('✓ main.js cargado y configurado');
