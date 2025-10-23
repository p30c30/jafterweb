// Variable global para almacenar los datos
let galleryData = null;


// Función para convertir URL de imgbox a URL de imagen directa
function getImgboxImageUrl(url) {
  // Si ya es una URL de imagen directa, devolverla
  if (url.includes('images2.imgbox.com') || url.includes('thumbs2.imgbox.com')) {
    return url;
  }
  
  // Extraer el código de la URL de imgbox (ej: https://imgbox.com/41ooNtLb)
  const match = url.match(/imgbox\.com\/([a-zA-Z0-9]+)/);
  if (match && match[1]) {
    const code = match[1];
    // Usar la API de thumbnail de imgbox
    return `https://thumbs2.imgbox.com/${code}_t.jpg`;
  }
  
  // Si no coincide con el patrón, devolver URL original
  return url;
}
// Cargar datos desde data.json
async function loadData() {
  try {
    const resp = await fetch('data.json');
    galleryData = await resp.json();
    
    // Crear la vista principal con las tarjetas de secciones
    createHomePage();
    
    // Crear las secciones de galería (ocultas por defecto)
    createGallerySections();
  } catch (error) {
    console.error('Error cargando datos:', error);
  }
}

// Crear la página principal con tarjetas de sección
function createHomePage() {
  const cardsContainer = document.getElementById('section-cards');
  cardsContainer.innerHTML = '';
  
  galleryData.secciones.forEach(sec => {
    const card = document.createElement('div');
    card.className = 'section-card';
    card.innerHTML = `
            <img src="${getImgboxImageUrl(sec.preview)}" alt="${sec.titulo}" />              const img = card.querySelector('img');
        img.onerror = () => {
            img.src = 'https://via.placeholder.com/400x300/1a1a1a/FDB813?text=' + encodeURIComponent(sec.titulo);
        };
      <h3>${sec.titulo}</h3>
    `;
    card.onclick = () => showSection(sec.id);
    cardsContainer.appendChild(card);
  });
}

// Crear las secciones de galería
function createGallerySections() {
  const content = document.getElementById('content');
  
  galleryData.secciones.forEach(sec => {
    const section = document.createElement('section');
    section.id = sec.id;
    section.className = 'seccion';
    section.innerHTML = `
      <div class="section-header">
        <button class="back-btn" onclick="showHome()">← Volver</button>
        <h2>${sec.titulo}</h2>
      </div>
      <div class="galeria"></div>
    `;
    
    // Añadir fotos a la galería
    const gal = section.querySelector('.galeria');
    sec.fotos.forEach(f => {
      const card = document.createElement('div');
      card.className = 'thumb';
      card.innerHTML = `
                <img src="${getImgboxImageUrl(f.url)}" alt="${f.alt || ''}" loading="lazy" />        <div class="desc">${f.texto}</div>
                    const imgElem = card.querySelector('img');
            imgElem.onerror = () => {
                imgElem.src = 'https://via.placeholder.com/400x300/1a1a1a/FDB813?text=' + encodeURIComponent(f.texto || 'Imagen');
            };
      `;
      card.onclick = () => showModal(f.url);
      gal.appendChild(card);
    });
    
    content.appendChild(section);
  });
}

// Mostrar la vista principal
function showHome() {
  // Ocultar todas las secciones
  document.querySelectorAll('.seccion').forEach(s => s.classList.remove('active'));
  
  // Mostrar la vista principal
  const homeView = document.getElementById('home-view');
  homeView.style.display = 'block';
  
  // Scroll al inicio
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Mostrar una sección específica
function showSection(id) {
  // Ocultar la vista principal
  const homeView = document.getElementById('home-view');
  homeView.style.display = 'none';
  
  // Ocultar todas las secciones
  document.querySelectorAll('.seccion').forEach(s => s.classList.remove('active'));
  
  // Mostrar la sección seleccionada
  const section = document.getElementById(id);
  if (section) {
    section.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// Mostrar modal con imagen a pantalla completa
function showModal(src) {
  const modal = document.getElementById('modalFoto');
  const img = document.getElementById('modalImg');
    img.src = getImgboxImageUrl(src);  modal.classList.add('active');
}

// Ocultar modal
function hideModal() {
  const modal = document.getElementById('modalFoto');
  modal.classList.remove('active');
  const img = document.getElementById('modalImg');
  setTimeout(() => { img.src = ''; }, 200);
}

// Event listeners
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') hideModal();
});

// Cargar datos cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', loadData);


