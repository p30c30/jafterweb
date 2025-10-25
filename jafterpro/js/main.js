async function loadData() {
  try {
    const resp = await fetch('../data.json');
    if (!resp.ok) {
      console.error('Error al cargar data.json:', resp.status);
      return null;
    }
    const data = await resp.json();
    console.log('Datos cargados:', data);
    return data;
  } catch (error) {
    console.error('Error al cargar los datos:', error);
    return null;
  }
}

function createHomePage(secciones) {
  const container = document.getElementById('gallery-sections');
  container.innerHTML = '';
  
  secciones.forEach(sec => {
    const card = document.createElement('div');
    card.className = 'section-card';
    
    const img = document.createElement('img');
    img.src = sec.imagen || 'images/placeholder.jpg';
    img.alt = sec.nombre;
    
    const h3 = document.createElement('h3');
    h3.textContent = sec.nombre;
    
    card.appendChild(img);
    card.appendChild(h3);
    
    card.addEventListener('click', () => {
      window.showSection(sec.nombre);
    });
    
    container.appendChild(card);
  });
}

function createGallerySections(secciones) {
  const container = document.getElementById('gallery-sections');
  container.innerHTML = '';
  
  secciones.forEach(sec => {
    const sectionDiv = document.createElement('div');
    sectionDiv.id = `section-${sec.nombre}`;
    sectionDiv.className = 'gallery-section';
    sectionDiv.style.display = 'none';
    
    const backBtn = document.createElement('button');
    backBtn.className = 'back-btn';
    backBtn.textContent = '← Volver a la galería';
    backBtn.addEventListener('click', () => window.showHome());
    
    const h2 = document.createElement('h2');
    h2.textContent = sec.nombre;
    
    const grid = document.createElement('div');
    grid.className = 'photo-grid';
    
    if (sec.fotos && Array.isArray(sec.fotos)) {
      sec.fotos.forEach(foto => {
        const photoDiv = document.createElement('div');
        photoDiv.className = 'photo-item';
        
        const img = document.createElement('img');
        img.src = foto.thumbnail || foto.url;
        img.alt = foto.texto || sec.nombre;
        
        const texto = document.createElement('p');
        texto.textContent = foto.texto || '';
        
        photoDiv.appendChild(img);
        photoDiv.appendChild(texto);
        
        photoDiv.addEventListener('click', () => {
          window.showModal(foto.url);
        });
        
        grid.appendChild(photoDiv);
      });
    }
    
    sectionDiv.appendChild(backBtn);
    sectionDiv.appendChild(h2);
    sectionDiv.appendChild(grid);
    
    container.appendChild(sectionDiv);
  });
}

window.showSection = function(nombre) {
  document.getElementById('home-page').style.display = 'none';
  document.querySelectorAll('.gallery-section').forEach(s => {
    s.style.display = 'none';
  });
  const section = document.getElementById(`section-${nombre}`);
  if (section) {
    section.style.display = 'block';
  }
};

window.showHome = function() {
  document.getElementById('home-page').style.display = 'block';
  document.querySelectorAll('.gallery-section').forEach(s => {
    s.style.display = 'none';
  });
};

window.showModal = function(url) {
  const modal = document.getElementById('modal');
  const modalImg = document.getElementById('modal-img');
  modalImg.src = url;
  modal.style.display = 'flex';
};

window.hideModal = function() {
  const modal = document.getElementById('modal');
  modal.style.display = 'none';
};

document.addEventListener('DOMContentLoaded', async () => {
  const data = await loadData();
  if (data && data.secciones) {
    createHomePage(data.secciones);
    createGallerySections(data.secciones);
  }
});
