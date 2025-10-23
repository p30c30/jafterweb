// Variable global para almacenar los datos
let galleryData;

// Función para convertir URL de imgbox a thumbnail
function getImgboxImageUrl(url) {
  if (!url) return url;
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
      <img src="${getImgboxImageUrl(sec.preview)}" alt="${sec.titulo}" />
      <h3>${sec.titulo}</h3>
    `;
    
    // Manejar error de carga de imagen fuera del template
    const img = card.querySelector('img');
    img.onerror = () => {
      img.src = 'https://via.placeholder.com/400x300/1a1a1a/FDB813?text=' + encodeURIComponent(sec.titulo);
    };

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
        <img src="${getImgboxImageUrl(f.url)}" alt="${f.alt || ''}" loading="lazy" />
        <div class="desc">${f.texto}</div>
      `;
      
      // Manejar error de carga de imagen fuera del template
      const imgElem = card.querySelector('img');
      imgElem.onerror = () => {
        imgElem.src = 'https://via.placeholder.com/400x300/1a1a1a/FDB813?text=' + encodeURIComponent(f.texto || 'Imagen');
      };

      card.onclick = () => showModal(f.url);
      gal.appendChild(card);
    });

    content.appendChild(section);
  });
}

// Mostrar la vista principal
function showHome() {
  document.getElementById('home-view').classList.remove('hidden');
  document.querySelectorAll('.seccion').forEach(s => s.classList.add('hidden'));
}

// Mostrar una sección específica
function showSection(id) {
  document.getElementById('home-view').classList.add('hidden');
  document.querySelectorAll('.seccion').forEach(s => {
    s.classList.toggle('hidden', s.id !== id);
  });
}

// Modal
function showModal(imgUrl) {
  const modal = document.getElementById('modal');
  const modalImg = document.getElementById('modal-img');
  modalImg.src = imgUrl;
  modal.classList.add('active');
}

function hideModal() {
  document.getElementById('modal').classList.remove('active');
}

// Iniciar
window.addEventListener('DOMContentLoaded', loadData);
