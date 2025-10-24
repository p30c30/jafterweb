
// Force rebuild// Variable global para almacenar los datos
let galleryData;

// Cargar datos desde ../data.json
async function loadData() {
  try {
    const resp = await fetch('../data.json');
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
  if (!cardsContainer) {
    console.error('No se encontró el contenedor section-cards');
    return;
  }
  
  cardsContainer.innerHTML = '';

  if (!galleryData || !galleryData.secciones) {
    console.error('No hay datos de galería');
    return;
  }

  galleryData.secciones.forEach(sec => {
    const card = document.createElement('div');
    card.className = 'section-card';
    
    card.innerHTML = `
      <img src="${sec.preview}" alt="${sec.titulo}" loading="lazy" />
      <h3>${sec.titulo}</h3>
    `;
    
    // Manejar click en la tarjeta
    card.onclick = () => window.showSection(sec.id);
    
    // Manejar error de carga de imagen
    const img = card.querySelector('img');
    if (img) {
      img.onerror = () => {
        img.src = 'https://via.placeholder.com/400x300/1a1a1a/FDB813?text=' + encodeURIComponent(sec.titulo);
      };
    }

    cardsContainer.appendChild(card);
  });
}

// Crear las secciones de galería
function createGallerySections() {
  const content = document.getElementById('content');
  if (!content) {
    console.error('No se encontró el contenedor content');
    return;
  }

  if (!galleryData || !galleryData.secciones) {
    return;
  }

  galleryData.secciones.forEach(sec => {
    const section = document.createElement('section');
    section.id = sec.id;
    section.className = 'seccion hidden';
    section.innerHTML = `
      <div class="section-header">
        <button class="back-btn" onclick="showHome()">← Volver</button>
        <h2>${sec.titulo}</h2>
      </div>
      <div class="galeria"></div>
    `;

    // Añadir fotos a la galería
    const gal = section.querySelector('.galeria');
    if (sec.fotos && gal) {
      sec.fotos.forEach(f => {
        const card = document.createElement('div');
        card.className = 'thumb';
        
        card.innerHTML = `
          <img src="${f.url}" alt="${f.alt || f.texto}" loading="lazy" />
          <div class="desc">${f.texto}</div>
        `;
        
        // Manejar error de carga de imagen
        const imgElem = card.querySelector('img');
        if (imgElem) {
          imgElem.onerror = () => {
            imgElem.src = 'https://via.placeholder.com/400x300/1a1a1a/FDB813?text=' + encodeURIComponent(f.texto || 'Imagen');
          };
        }

        // Manejar click para modal
        card.onclick = () => window.showModal(f.url);
        gal.appendChild(card);
      });
    }

    content.appendChild(section);
  });
}

// Mostrar la vista principal
window.showHome = function() {  const homeView = document.getElementById('home-view');
  if (homeView) {
    homeView.classList.remove('hidden');
  }
  
  document.querySelectorAll('.seccion').forEach(s => {
    s.classList.add('hidden');
  });
}

// Mostrar una sección específica
window.showSection = function(id) {  const homeView = document.getElementById('home-view');
  if (homeView) {
    homeView.classList.add('hidden');
  }
  
  document.querySelectorAll('.seccion').forEach(s => {
    if (s.id === id) {
      s.classList.remove('hidden');
    } else {
      s.classList.add('hidden');
    }
  });
}

// Modal
window.showModal = function(imgUrl) {  const modal = document.getElementById('modal');
  const modalImg = document.getElementById('modal-img');
  
  if (modal && modalImg) {
    modalImg.src = imgUrl;
    
    // Manejar error en modal
    modalImg.onerror = () => {
      modalImg.src = 'https://via.placeholder.com/800x600/1a1a1a/FDB813?text=Imagen+no+disponible';
    };
    
    modal.classList.add('active');
  }
}

window.hideModal = function() {  const modal = document.getElementById('modal');
  if (modal) {
    modal.classList.remove('active');
  }
}

// Iniciar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadData);
} else {
  loadData();
}






