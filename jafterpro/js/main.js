// ===== main.js: Refactor minimalista funcional y alineado =====
// Carga datos del objeto global galeriaData y monta interfaz
function loadData() {
  try {
    const data = window.galeriaData;
    // Elementos del modal
    const modal = document.getElementById('modal');
    const modalImg = document.getElementById('modal-img');
    const modalClose = document.getElementById('modal-close');
    // Página principal con tarjetas de sección
    function createHomePage() {
      const container = document.getElementById('content');
      container.innerHTML = '';
      data.secciones.forEach(sec => {
        const card = document.createElement('div');
        card.className = 'card';
        const img = document.createElement('img');
        img.src = sec.preview;
        img.alt = sec.titulo;
        const h3 = document.createElement('h3');
        h3.textContent = sec.titulo;
        card.append(img, h3);
        card.addEventListener('click', () => createGallerySections(sec));
        container.appendChild(card);
      });
    }
    // Galerías de las secciones
    function createGallerySections(sec) {
      const container = document.getElementById('content');
      container.innerHTML = '';
      const backBtn = document.createElement('button');
      backBtn.textContent = '← Volver';
      backBtn.className = 'back-btn';
      backBtn.addEventListener('click', createHomePage);
      container.appendChild(backBtn);
      const h2 = document.createElement('h2');
      h2.textContent = sec.titulo;
      container.appendChild(h2);
      const grid = document.createElement('div');
      grid.className = 'gallery-grid';
      sec.galerias.forEach(gal => {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        const thumb = document.createElement('img');
        thumb.src = gal.thumbnail;
        thumb.alt = gal.texto;
        const p = document.createElement('p');
        p.textContent = gal.texto;
        item.append(thumb, p);
        item.addEventListener('click', () => {
          modalImg.src = gal.url;
          modal.style.display = 'flex';
        });
        grid.appendChild(item);
      });
      container.appendChild(grid);
    }
    // Cerrar modal
    modalClose.addEventListener('click', () => {
      modal.style.display = 'none';
    });
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.style.display = 'none';
    });
    // Iniciar
    createHomePage();
  } catch (err) {
    console.error('Error cargando datos:', err);
    document.getElementById('content').innerHTML = 'Error al cargar datos.';
  }
}
// Arrancar cuando DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadData);
} else {
  loadData();
}
