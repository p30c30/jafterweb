// Cargar datos desde data.json
async function loadData() {
  try {
    const resp = await fetch('./data.json');
    if (!resp.ok) throw new Error(`HTTP error! status: ${resp.status}`);
    const data = await resp.json();
    createHomePage(data.secciones);
    createGallerySections(data.secciones);
  } catch (error) {
    console.error('Error cargando datos:', error);
  }
}

// Crear tarjetas de sección en la vista principal
function createHomePage(secciones) {
  const container = document.getElementById('section-cards');
  container.innerHTML = '';

  secciones.forEach(sec => {
    const card = document.createElement('div');
    card.className = 'section-card';
    card.innerHTML = `
      <img src="${sec.preview}" alt="${sec.titulo}" loading="lazy" />
      <h3>${sec.titulo}</h3>
    `;

    card.addEventListener('click', () => {
      showSection(sec.id);
    });

    container.appendChild(card);
  });
}

// Crear las secciones de galería con miniaturas
function createGallerySections(secciones) {
  secciones.forEach(sec => {
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

// Mostrar una sección específica
function showSection(sectionId) {
  document.querySelectorAll('.gallery-section').forEach(sec => {
    sec.style.display = 'none';
  });

  const target = document.getElementById(sectionId);
  if (target) {
    target.style.display = 'block';
    window.scrollTo({ top: target.offsetTop, behavior: 'smooth' });
  }
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

// Iniciar la carga
loadData();
