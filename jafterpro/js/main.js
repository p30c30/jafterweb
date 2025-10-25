// Carga dinámica del data.json y renderizado de contenido

async function loadData() {
  try {
    const resp = await fetch('../data.json');
    const data = await resp.json();
    
    // Elementos del DOM
    const modal = document.getElementById('modal');
    const modalImg = document.getElementById('modal-image');
    const modalClose = document.getElementById('modal-close');
    
    // Navegar entre secciones desde el home
    function createHomePage() {
      const container = document.getElementById('container');
      container.innerHTML = '';
      
      data.secciones.forEach(sec => {
        const card = document.createElement('div');
        card.className = 'section-card';
        
        const img = document.createElement('img');
        img.src = sec.preview || (sec.fotos && sec.fotos[0] ? sec.fotos[0].thumb : '');
        img.alt = sec.titulo;
        
        const h3 = document.createElement('h3');
        h3.textContent = sec.titulo;
        
        card.appendChild(img);
        card.appendChild(h3);
        
        card.addEventListener('click', () => {
          createGallerySections([sec]);
        });
        
        container.appendChild(card);
      });
      
      // Botón Home no tiene sentido en home
      document.getElementById('home-btn').style.display = 'none';
    }
    
    // Crear las galerías de cada sección
    function createGallerySections(secciones) {
      const container = document.getElementById('container');
      container.innerHTML = '';
      
      secciones.forEach(sec => {
        const section = document.createElement('section');
        section.className = 'gallery-section';
        
        const heading = document.createElement('h2');
        heading.textContent = sec.titulo;
        section.appendChild(heading);
        
        const gallery = document.createElement('div');
        gallery.className = 'photo-grid';
        
        sec.fotos.forEach(foto => {
          const photoDiv = document.createElement('div');
          photoDiv.className = 'photo-item';
          
          const thumb = document.createElement('img');
          thumb.src = foto.thumb;
          thumb.alt = foto.texto || sec.titulo;
          thumb.loading = 'lazy';
          
          photoDiv.appendChild(thumb);
          
          // Click en la miniatura abre el modal con la foto en alta
          photoDiv.addEventListener('click', () => {
            modalImg.src = foto.alta;
            modalImg.alt = foto.texto || sec.titulo;
            modal.style.display = 'flex';
          });
          
          gallery.appendChild(photoDiv);
        });
        
        section.appendChild(gallery);
        container.appendChild(section);
      });
      
      // Mostrar botón Home cuando estás en una galería
      document.getElementById('home-btn').style.display = 'block';
    }
    
    // Cerrar modal
    modalClose.addEventListener('click', () => {
      modal.style.display = 'none';
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
    
    // Botón Home
    document.getElementById('home-btn').addEventListener('click', createHomePage);
    
    // Iniciar en la página de inicio
    createHomePage();
    
  } catch (error) {
    console.error('Error cargando data.json:', error);
    document.getElementById('container').innerHTML = '<p>Error al cargar las imágenes.</p>';
  }
}

// Iniciar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadData);
} else {
  loadData();
}