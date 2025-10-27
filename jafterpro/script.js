// Cargar y mostrar las secciones
async function cargarSecciones() {
    try {
        const response = await fetch('data.json');
        const data = await response.json();
        
        const container = document.getElementById('secciones-container');
        container.innerHTML = '';
        
        data.secciones.forEach(seccion => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <img src="${seccion.preview}" alt="${seccion.titulo}" class="card-image">
                <div class="card-content">
                    <h3>${seccion.titulo}</h3>
                    <p>${seccion.descripcion}</p>
                </div>
            `;
            card.addEventListener('click', () => {
                window.location.href = `seccion.html?id=${seccion.id}`;
            });
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Error cargando secciones:', error);
        document.getElementById('secciones-container').innerHTML = 
            '<p>Error cargando las secciones. Por favor, recarga la página.</p>';
    }
}

// Cargar sección específica
function cargarSeccion() {
    const urlParams = new URLSearchParams(window.location.search);
    const seccionId = urlParams.get('id');
    
    if (!seccionId) {
        window.location.href = 'index.html';
        return;
    }
    
    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            const seccion = data.secciones.find(s => s.id === seccionId);
            if (!seccion) {
                window.location.href = 'index.html';
                return;
            }
            
            document.title = `${seccion.titulo} - JAfterPic`;
            
            const header = document.createElement('header');
            header.className = 'seccion-header';
            header.innerHTML = `
                <button onclick="window.history.back()" class="back-button">← Volver</button>
                <h1>${seccion.titulo}</h1>
                <p>${seccion.descripcion}</p>
            `;
            document.body.insertBefore(header, document.body.firstChild);
            
            const container = document.getElementById('fotos-container');
            container.innerHTML = '';
            
            seccion.fotos.forEach(foto => {
                const fotoElement = document.createElement('div');
                fotoElement.className = 'foto-item';
                fotoElement.innerHTML = `
                    <img src="${foto.miniatura}" alt="${foto.texto}" class="foto-miniatura">
                    <p class="foto-texto">${foto.texto}</p>
                `;
                fotoElement.addEventListener('click', () => {
                    window.open(foto.url, '_blank');
                });
                container.appendChild(fotoElement);
            });
        })
        .catch(error => {
            console.error('Error cargando la sección:', error);
            window.location.href = 'index.html';
        });
}

// Inicializar
if (window.location.pathname.includes('seccion.html')) {
    document.addEventListener('DOMContentLoaded', cargarSeccion);
} else {
    document.addEventListener('DOMContentLoaded', cargarSecciones);
}
