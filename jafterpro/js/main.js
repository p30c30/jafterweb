// Función principal que carga y gestiona los datos
async function loadData() {
  console.log('=== INICIO loadData ===');
  
  // 1. VERIFICAR CONTENEDOR
  console.log('1. Verificando contenedor #content...');
  const contentElement = document.getElementById('content');
  
  if (!contentElement) {
    const errorMsg = 'ERROR CRÍTICO: No se encontró elemento con id="content"';
    console.error(errorMsg);
    document.body.innerHTML += `<div style="position:fixed;top:0;left:0;width:100%;background:red;color:white;padding:20px;z-index:9999;font-family:monospace;">${errorMsg}</div>`;
    return;
  }
  console.log('✓ Contenedor #content encontrado:', contentElement);
  
  // 2. VERIFICAR window.galeriaData
  console.log('2. Verificando window.galeriaData...');
  console.log('window.galeriaData:', window.galeriaData);
  console.log('typeof window.galeriaData:', typeof window.galeriaData);
  
  if (typeof window.galeriaData === 'undefined') {
    const errorMsg = 'ERROR CRÍTICO: window.galeriaData no está definido';
    console.error(errorMsg);
    contentElement.innerHTML = `<div style="background:#ff6b6b;color:white;padding:40px;margin:20px;border-radius:10px;font-family:monospace;">
      <h2>❌ ${errorMsg}</h2>
      <p>Verifica que index.html incluya data.js antes de main.js</p>
    </div>`;
    return;
  }
  console.log('✓ window.galeriaData existe');
  
  // 3. VERIFICAR QUE SEA UN OBJETO
  if (window.galeriaData === null || typeof window.galeriaData !== 'object') {
    const errorMsg = `ERROR: window.galeriaData no es un objeto válido. Tipo: ${typeof window.galeriaData}, Valor: ${window.galeriaData}`;
    console.error(errorMsg);
    contentElement.innerHTML = `<div style="background:#ff6b6b;color:white;padding:40px;margin:20px;border-radius:10px;font-family:monospace;">
      <h2>❌ ${errorMsg}</h2>
    </div>`;
    return;
  }
  console.log('✓ window.galeriaData es un objeto válido');
  
  const data = window.galeriaData;
  console.log('3. Datos cargados:', JSON.stringify(data, null, 2));
  
  // 4. VERIFICAR data.secciones
  console.log('4. Verificando data.secciones...');
  console.log('data.secciones:', data.secciones);
  console.log('typeof data.secciones:', typeof data.secciones);
  console.log('Array.isArray(data.secciones):', Array.isArray(data.secciones));
  
  if (!data.secciones) {
    const errorMsg = 'ERROR: data.secciones no existe';
    console.error(errorMsg);
    contentElement.innerHTML = `<div style="background:#ff6b6b;color:white;padding:40px;margin:20px;border-radius:10px;font-family:monospace;">
      <h2>❌ ${errorMsg}</h2>
      <p>Estructura de datos recibida:</p>
      <pre>${JSON.stringify(data, null, 2)}</pre>
    </div>`;
    return;
  }
  
  if (!Array.isArray(data.secciones)) {
    const errorMsg = `ERROR: data.secciones no es un array. Tipo: ${typeof data.secciones}`;
    console.error(errorMsg);
    contentElement.innerHTML = `<div style="background:#ff6b6b;color:white;padding:40px;margin:20px;border-radius:10px;font-family:monospace;">
      <h2>❌ ${errorMsg}</h2>
      <p>Valor de data.secciones:</p>
      <pre>${JSON.stringify(data.secciones, null, 2)}</pre>
    </div>`;
    return;
  }
  
  if (data.secciones.length === 0) {
    const errorMsg = 'ADVERTENCIA: data.secciones es un array vacío';
    console.warn(errorMsg);
    contentElement.innerHTML = `<div style="background:#ffa500;color:white;padding:40px;margin:20px;border-radius:10px;font-family:monospace;">
      <h2>⚠️ ${errorMsg}</h2>
      <p>No hay secciones para mostrar</p>
    </div>`;
    return;
  }
  
  console.log(`✓ data.secciones es un array válido con ${data.secciones.length} elementos`);
  console.log('5. Contenido de secciones:', JSON.stringify(data.secciones, null, 2));
  
  // 5. CONFIGURAR MODAL
  console.log('6. Configurando modal...');
  const modal = document.getElementById('imageModal');
  const modalImg = document.getElementById('modalImage');
  const modalClose = document.getElementById('modalClose');
  
  if (!modal || !modalImg || !modalClose) {
    console.warn('⚠️ Elementos del modal no encontrados:', { modal: !!modal, modalImg: !!modalImg, modalClose: !!modalClose });
  } else {
    console.log('✓ Modal configurado correctamente');
    modalClose.onclick = () => {
      modal.style.display = 'none';
    };
  }
  
  // 6. RENDERIZAR PÁGINA
  console.log('7. Renderizando página...');
  const urlParams = new URLSearchParams(window.location.search);
  const section = urlParams.get('section');
  console.log('Parámetro section:', section);
  
  if (!section) {
    console.log('→ Renderizando home page');
    createHomePage(data);
  } else {
    console.log(`→ Renderizando sección: ${section}`);
    createGallerySections(data);
  }
  
  console.log('=== FIN loadData ===');
}

// Crea la página de inicio
function createHomePage(data) {
  console.log('=== createHomePage INICIO ===');
  const container = document.getElementById('content');
  
  if (!container) {
    console.error('ERROR en createHomePage: contenedor #content no encontrado');
    return;
  }
  
  console.log(`Creando ${data.secciones.length} tarjetas...`);
  container.innerHTML = '';
  
  data.secciones.forEach((seccion, index) => {
    console.log(`Procesando sección ${index + 1}:`, seccion);
    
    const card = document.createElement('div');
    card.className = 'card';
    
    const img = document.createElement('img');
    img.src = seccion.imagen_seccion || 'img/default.jpg';
    img.alt = seccion.nombre || 'Imagen';
    img.loading = 'lazy';
    
    const h3 = document.createElement('h3');
    h3.textContent = seccion.nombre || 'Sin nombre';
    
    card.appendChild(img);
    card.appendChild(h3);
    
    card.addEventListener('click', () => {
      console.log(`Click en sección: ${seccion.nombre}`);
      window.location.href = `?section=${encodeURIComponent(seccion.nombre)}`;
    });
    
    container.appendChild(card);
  });
  
  console.log('✓ Home page renderizada');
  console.log('=== createHomePage FIN ===');
}

// Crea las galerías de una sección
function createGallerySections(data) {
  console.log('=== createGallerySections INICIO ===');
  const container = document.getElementById('content');
  
  if (!container) {
    console.error('ERROR en createGallerySections: contenedor #content no encontrado');
    return;
  }
  
  const urlParams = new URLSearchParams(window.location.search);
  const sectionName = urlParams.get('section');
  console.log('Buscando sección:', sectionName);
  
  const seccion = data.secciones.find(s => s.nombre === sectionName);
  
  if (!seccion) {
    console.error(`ERROR: Sección "${sectionName}" no encontrada`);
    container.innerHTML = `<div style="background:#ff6b6b;color:white;padding:40px;margin:20px;border-radius:10px;font-family:monospace;">
      <h2>❌ Sección "${sectionName}" no encontrada</h2>
      <p><a href="index.html" style="color:white;">Volver al inicio</a></p>
    </div>`;
    return;
  }
  
  console.log('✓ Sección encontrada:', seccion);
  container.innerHTML = `<h2>${seccion.nombre}</h2>`;
  
  if (!seccion.galerias || !Array.isArray(seccion.galerias)) {
    console.warn('⚠️ No hay galerías en esta sección');
    container.innerHTML += '<p>No hay galerías disponibles</p>';
    return;
  }
  
  console.log(`Procesando ${seccion.galerias.length} galerías...`);
  
  seccion.galerias.forEach((galeria, gIndex) => {
    console.log(`Galería ${gIndex + 1}:`, galeria);
    
    const galeriaDiv = document.createElement('div');
    galeriaDiv.className = 'galeria';
    
    const titulo = document.createElement('h3');
    titulo.textContent = galeria.titulo || 'Sin título';
    galeriaDiv.appendChild(titulo);
    
    if (!galeria.fotos || !Array.isArray(galeria.fotos)) {
      console.warn(`⚠️ Galería "${galeria.titulo}" sin fotos válidas`);
      return;
    }
    
    console.log(`  → ${galeria.fotos.length} fotos en galería "${galeria.titulo}"`);
    
    galeria.fotos.forEach((foto, fIndex) => {
      console.log(`    Foto ${fIndex + 1}:`, foto);
      
      const fotoDiv = document.createElement('div');
      fotoDiv.className = 'foto';
      
      const img = document.createElement('img');
      img.src = foto.src || foto;
      img.alt = foto.alt || `Foto ${fIndex + 1}`;
      img.loading = 'lazy';
      
      img.addEventListener('click', () => {
        console.log('Click en foto:', foto);
        const modal = document.getElementById('imageModal');
        const modalImg = document.getElementById('modalImage');
        if (modal && modalImg) {
          modal.style.display = 'flex';
          modalImg.src = img.src;
        }
      });
      
      fotoDiv.appendChild(img);
      galeriaDiv.appendChild(fotoDiv);
    });
    
    container.appendChild(galeriaDiv);
  });
  
  console.log('✓ Galerías renderizadas');
  console.log('=== createGallerySections FIN ===');
}

// Ejecutar cuando el DOM esté listo
if (document.readyState === 'loading') {
  console.log('DOM aún cargando, esperando DOMContentLoaded...');
  document.addEventListener('DOMContentLoaded', loadData);
} else {
  console.log('DOM ya listo, ejecutando loadData inmediatamente...');
  loadData();
}

console.log('✓ main.js cargado y configurado');
