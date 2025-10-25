// Cargar datos desde data.json
async function loadData() {
  const resp = await fetch('./data.json');
  const data = await resp.json();
  createHomePage(data.secciones);
  createGallerySections(data.secciones);
}

function createHomePage(secciones) {
  const container = document.getElementById('section-cards');
  container.innerHTML = '';
  secciones.forEach(sec => {
    const card = document.createElement('div');
    card.className = 'section-card';
    card.innerHTML = `
      <img src="${sec.preview}" alt="${sec.titulo}" />
      <h3>${sec.titulo}</h3>
    `;
    card.addEventListener('click', () => {
      showSection(sec.id);
    });
    container.appendChild(card);
  });
}

function createGallerySections(secciones) {
  const container = document.getElementById('gallery-sections');
  container.innerHTML = '';
  secciones.forEach(sec => {
    const sectionDiv = document.createElement('div');
    sectionDiv.className = 'seccion hidden';
    sectionDiv.id = sec.id;
    const header = document.createElement('div');
    header.className = 'section-header';
    header.innerHTML = `
      <button class="back-btn" onclick="goHome()">← Volver</button>
      <h2>${sec.titulo}</h2>
    `;
    const gallery = document.createElement('div');
    gallery.className = 'galeria';
    sec.fotos.forEach(f => {
      const card = document.createElement('div');
      card.className = 'thumb';
      const img = document.createElement('img');
      img.src = f.miniatura || f.url;
      img.alt = f.texto || '';
      img.loading = 'lazy';
      img.addEventListener('click', () => {
        showModal(f.url);
      });
      const desc = document.createElement('div');
      desc.className = 'desc';
      desc.textContent = f.texto || '';
      card.appendChild(img);
      card.appendChild(desc);
      gallery.appendChild(card);
    });
    sectionDiv.appendChild(header);
    sectionDiv.appendChild(gallery);
    container.appendChild(sectionDiv);
  });
}

function showSection(id) {
  document.getElementById('home-view').classList.add('hidden');
  document.querySelectorAll('.seccion').forEach(sec => sec.classList.add('hidden'));
  const target = document.getElementById(id);
  if (target) target.classList.remove('hidden');
}

function goHome() {
  document.getElementById('home-view').classList.remove('hidden');
  document.querySelectorAll('.seccion').forEach(sec => sec.classList.add('hidden'));
}

function showModal(url) {
  const modal = document.getElementById('modal');
  const modalImg = document.getElementById('modal-img');
  modalImg.src = url;
  modal.classList.add('active');
}

function hideModal() {
  const modal = document.getElementById('modal');
  const modalImg = document.getElementById('modal-img');
  modal.classList.remove('active');
  modalImg.src = '';
}

loadData();
