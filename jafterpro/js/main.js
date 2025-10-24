// Variable global para almacenar los datos
let galleryData;

// Cargar datos desde ./data.json
async function loadData() {
  try {
    const resp = await fetch('./data.json');
    if (!resp.ok) throw new Error(`HTTP error! status: ${resp.status}`);
    galleryData = await resp.json();
    console.log('Datos cargados correctamente:', galleryData);

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
    card.setAttribute('data-section-id', sec.id);
    card.innerHTML = `
      <img src="${sec.preview}" alt="${sec.titulo}" loading="lazy" />
      <h3>${sec.titulo}</h3>
    `;

    card.addEventListener('click', () => {
      console.log('Click detectado en:', sec.id);
      window.showSection(sec.id);
    });

    const img = card.querySelector('img');
    if (img) {
      img.onerror = () => {
        console.log('Imagen no cargó:', sec.preview);
        img.src = 'https://via.placeholder.com/400x300/1a1a1a/FDB813?text=' + encodeURIComponent(sec.titulo);
      };
    }

    cardsContainer.appendChild(card);
  });
}

// Crear las secciones de galería
function createGallerySections() {
  if (!galleryData || !galleryData.secciones) return;

  galleryData.secciones.forEach(sec => {
    const sectionDiv = document.createElement('div');
    sectionDiv.className = 'gallery-section';
    sectionDiv.id = sec.id;
    sectionDiv.style.display = 'none';

    const title = document.createElement('h2');
    title.textContent = sec.titulo;
    sectionDiv.appendChild(title);

    const gallery = document.createElement('div');
    gallery.className = 'gallery';

    sec.fotos.forEach(f => {
      const card = document.createElement('div');
      card.className = 'thumb';

      const img = document.createElement('img');
      img.src = f.url;
      img.alt = f.texto;
      img.loading = 'lazy';

      img.addEventListener('click', () => {
        showModal(f.url);
      });

      const desc = document.createElement('div');
      desc.className = 'desc';
      desc.textContent = f.texto;

      card.appendChild(img);
      card.appendChild(desc);
      gallery.appendChild(card);
    });

    sectionDiv.appendChild(gallery);
    document.body.appendChild(sectionDiv);
  });
}

// Mostrar el modal con imagen ampliada
function showModal(imgUrl) {
  const modal = document.getElementById('modal');
  const modalImg = document.getElementById('modal-img');
  if (modal && modalImg) {
    modalImg.src = imgUrl;
    modal.classList.add('active');
  }
}

// Ocultar el modal
function hideModal() {
  const modal = document.getElementById('modal');
  const modalImg = document.getElementById('modal-img');
  if (modal && modalImg) {
    modal.classList.remove('active');
    modalImg.src = '';
  }
}

// Ejecutar carga inicial
loadData();
