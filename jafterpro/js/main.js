// Función principal que carga y gestiona los datos para la galería
async function loadData() {
  const contentElement = document.getElementById('content');
  if (!contentElement) return;

  // Validación básica
  if (typeof window.galeriaData === 'undefined' || window.galeriaData === null || typeof window.galeriaData !== 'object') {
    contentElement.innerHTML = '<p style="color:red;">❌ Error crítico: window.galeriaData no está definido correctamente.</p>';
    return;
  }
  const data = window.galeriaData;
  if (!data.secciones || !Array.isArray(data.secciones) || data.secciones.length === 0) {
    contentElement.innerHTML = '<p style="color:red;">⚠️ No hay secciones disponibles para mostrar.</p>';
    return;
  }

  // Verifica parámetro de sección en la URL
  const urlParams = new URLSearchParams(window.location.search);
  const section = urlParams.get('section');
  if (!section) {
    createHomePage(data);
  } else {
    createGallerySections(data);
  }
}

// FUNCIONA PARA LA PORTADA PRINCIPAL Y MUEVE LA SECCIÓN INSPIRADORA AL FINAL
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
  let inspiration = document.getElementById('inspiration-section');
  if (inspiration) {
    container.appendChild(inspiration);
  } else {
    inspiration = document.createElement('div');
    inspiration.id = 'inspiration-section';
    inspiration.innerHTML = `
      <h2>El Arte de Capturar el Momento</h2>
      <p>En la fotografía, cada instante es único e irrepetible. Un mismo momento, contemplado a través de diferentes miradas, revela infinitas perspectivas y emociones...</p>
      <p>Cada fotografía es un diálogo silencioso entre el observador y el instante congelado en el tiempo...</p>
      <p>Porque al final, fotografiar es mucho más que presionar un botón. Es el arte de ver lo invisible...</p>
    `;
    container.appendChild(inspiration);
  }
}

// Esta función renderiza la galería de una sección específica
function createGallerySections(data) {
  const urlParams = new URLSearchParams(window.location.search);
  const sectionId = urlParams.get('section');
  if (!sectionId) return;
  const seccion = data.secciones.find(s => s.id === sectionId);
  if (!seccion) {
    return;
  }
  const container = document.getElementById('content');
  if (!container) return;
  container.innerHTML = '';

  // Cabecera y botón volver
  const header = document.createElement('header');
  header.className = 'section-header';
  const backBtn = document.createElement('button');
  backBtn.textContent = '← Volver';
  backBtn.className = 'back-btn';
  backBtn.onclick = () => { window.location.href = window.location.pathname; };
  backBtn.setAttribute('aria-label', 'Volver al inicio');
  header.appendChild(backBtn);

  const title = document.createElement('h2');
  title.textContent = seccion.titulo || seccion.id;
  header.appendChild(title);
  container.appendChild(header);

  // Galería de fotos (miniaturas)
  const galeriaDiv = document.createElement('div');
  galeriaDiv.className = 'galeria
