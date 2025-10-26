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
    contentElement.innerHTML = `<div style="background:#ff6b6b;color:white;padding:40px;margin:20px;border-radius:10px;font-family:monospace;">\n      ❌ ${errorMsg}\n      Verifica que index.html incluya data.js antes de main.js\n    </div>`;
    return;
  }
  const data = window.galeriaData;
  if (!data.secciones || !Array.isArray(data.secciones) || data.secciones.length === 0) {
    const errorMsg = 'ERROR: data.secciones inexistente o vacío';
    console.error(errorMsg);
    contentElement.innerHTML = `<div style="background:#ffa500;color:white;padding:40px;margin:20px;border-radius:10px;font-family:monospace;">\n      ⚠️ ${errorMsg}\n    </div>`;
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
    // Exponer globalmente por si otros componentes lo usan
    window.goHome = goHome;
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

// Renderizar home principal
function createHomePage(data) {
  const container = document.getElementById('content');
  container.innerHTML = '';

  // Título principal
  const title = document.createElement('h1');
  title.textContent = "Galería Jafter";
  container.appendChild(title);

  // Frase inspiradora bajo el título
  const frase = document.createElement('div');
  frase.className = 'subtitle';
  frase.textContent = "Explora mis colecciones fotográficas";
  container.appendChild(frase);

  // Grid de tarjetas de secciones
  const grid = document.createElement('div');
  grid.className = 'section-cards';
  data.secciones.forEach(seccion => {
    const card = document.createElement('article');
    card.className = 'card';
    card.tabIndex = 0;
    card.style.cursor = 'pointer';

    const img = document.createElement('img');
    img.src = seccion.preview;
    img.alt = seccion.titulo;
    img.loading = 'lazy';

    const h3 = document.createElement('h3');
    h3.textContent = seccion.titulo;

    const desc = document.createElement('p');
    desc.className = 'card-desc';
    desc.textContent = seccion.descripcion || 'Explorar galería';

    card.append(img, h3, desc);

    card.addEventListener('click', () => {
      window.location.href = `?section=${encodeURIComponent(seccion.id)}`;
    });
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        window.location.href = `?section=${encodeURIComponent(seccion.id)}`;
      }
    });

    grid.appendChild(card);
  });

  container.appendChild(grid);

  // Sección inspiradora al final
  const inspiration = document.getElementById('inspiration-section');
  if (inspiration) {
    container.appendChild(inspiration);
  }
}


// Renderizar sección seleccionada
function createGallerySections(data) {
  const urlParams = new URLSearchParams(window.location.search);
  const sectionId = urlParams.get('section');
  if (!sectionId) return;
  const seccion = data.secciones.find(s => s.id === sectionId);
  if (!seccion) {
    console.error(`Sección no encontrada: ${sectionId}`);
    return;
  }
  const container = document.getElementById('content');
  if (!container) return;
  container.innerHTML = '';
  const header = document.createElement('header');
  header.style.display = 'flex';
  header.style.alignItems = 'center';
  header.style.gap = '10px';
  header.style.marginBottom = '1rem';
  const goHomeFn = () => {
    if (typeof window.goHome === 'function') {
      window.goHome();
    } else {
      window.location.href = window.location.pathname;
    }
  };
  const backBtn = document.createElement('button');
  backBtn.textContent = '← Volver';
  backBtn.className = 'btn-volver';
  backBtn.setAttribute('aria-label', 'Volver a la página principal');
  backBtn.onclick = goHomeFn;
  backBtn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goHomeFn(); }
  });
  const title = document.createElement('h2');
  title.textContent = seccion.titulo || seccion.id;
  title.style.margin = '0';
  header.appendChild(backBtn);
  header.appendChild(title);
  container.appendChild(header);
  // contenedor de galerías
  seccion.galerias?.forEach((galeria) => {
    const galeriaDiv = document.createElement('section');
    galeriaDiv.className = 'galeria';
    // Subcabecera por galería con botón Volver
    const subHeader = document.createElement('div');
    subHeader.className = 'galeria-header';
    subHeader.style.display = 'flex';
    subHeader.style.alignItems = 'center';
    subHeader.style.justifyContent = 'space-between';
    subHeader.style.gap = '12px';
    subHeader.style.margin = '10px 0 8px';
    const subBack = backBtn.cloneNode(true);
    // Clonado pierde listeners; añadirlos de nuevo
    subBack.addEventListener('click', goHomeFn);
    subBack.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goHomeFn(); }
    });
    const titulo = document.createElement('h3');
    titulo.textContent = galeria.titulo || 'Sin título';
    titulo.style.margin = '0';
    const leftWrap = document.createElement('div');
    leftWrap.style.display = 'flex';
    leftWrap.style.alignItems = 'center';
    leftWrap.style.gap = '10px';
    leftWrap.appendChild(subBack);
    leftWrap.appendChild(titulo);
    subHeader.appendChild(leftWrap);
    galeriaDiv.appendChild(subHeader);
    if (!Array.isArray(galeria.fotos)) return;
    const grid = document.createElement('div');
    grid.className = 'galeria-grid';
    galeria.fotos.forEach((foto, idx) => {
      const src = typeof foto === 'string' ? foto : (foto.src || foto.thumb || foto.url);
      const alt = (typeof foto === 'object' && (foto.alt || foto.titulo)) || `Foto ${idx + 1}`;
      const full = (typeof foto === 'object' && (foto.full || foto.hd || foto.src)) || src;
      const item = document.createElement('figure');
      item.className = 'foto';
      grid.appendChild(item);
    });
    galeriaDiv.appendChild(grid);
    container.appendChild(galeriaDiv);
  });
}

// Configuración del modal accesible
function setupModalAccessibility() {
  console.log('[setupModalAccessibility] Configurando modal...');
}

// Inicializar aplicación cuando DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadData);
} else {
  loadData();
}
