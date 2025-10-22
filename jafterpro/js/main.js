async function loadData() {
const resp = await fetch('data.json');
const data = await resp.json();

const content = document.getElementById('content');
data.secciones.forEach(sec => {
// Sección completa
const section = document.createElement('section');
section.id = sec.id;
section.className = 'seccion';
section.innerHTML = <h2>${sec.titulo}</h2><div class="galeria"></div>;
content.appendChild(section);

// Galería de la sección
const gal = section.querySelector('.galeria');
sec.fotos.forEach(f => {
  const card = document.createElement('div');
  card.className = 'thumb';
  card.innerHTML = `<img src="${f.url}" alt="${f.alt || ''}"/><div class="desc">${f.texto}</div>`;
  card.onclick = () => showModal(f.url);
  gal.appendChild(card);
});

});

// Muestra la primera sección por defecto (opcional)
if (data.secciones.length > 0) {
showSection(data.secciones.id);
}
}

function showHome() {
document.querySelectorAll('.seccion').forEach(s => s.classList.remove('active'));
// Regresar al inicio: mostrar el contenido principal
document.getElementById('content').innerHTML = '';
// Opcional: recomenzar a cargar desde data.json si quieres reconstruir desde cero
// Para simplicidad, recargamos la página
location.reload();
}

function showSection(id) {
document.querySelectorAll('.seccion').forEach(s => s.classList.remove('active'));
const el = document.getElementById(id);
if (el) {
el.classList.add('active');
window.scrollTo({ top: 0, behavior: 'smooth' });
}
// Ocultar la vista de inicio si está visible
const homeVisible = document.getElementById('home');
if (homeVisible) homeVisible.style.display = 'none';
}

function showModal(src) {
const modal = document.getElementById('modalFoto');
const img = document.getElementById('modalImg');
img.src = src;
modal.classList.add('active');
}

function hideModal() {
const modal = document.getElementById('modalFoto');
modal.classList.remove('active');
const img = document.getElementById('modalImg');
// Limpiar para liberar memoria
setTimeout(() => { img.src = ''; }, 200);
}

document.addEventListener('keydown', (e) => {
if (e.key === 'Escape') hideModal();
});

document.addEventListener('DOMContentLoaded', loadData);