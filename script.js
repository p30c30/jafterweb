// Cargar y mostrar las secciones
async function cargarSecciones() {
    try {
        console.log('🔍 Cargando secciones...');
        const response = await fetch('data.json');
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ Datos cargados:', data);
        
        const container = document.getElementById('secciones-container');
        if (!container) {
            console.error('❌ No se encontró el contenedor de secciones');
            return;
        }
        
        container.innerHTML = '';
        
        if (!data.secciones || data.secciones.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #ff6b6b; padding: 2rem;">No hay secciones disponibles.</p>';
            return;
        }
        
        data.secciones.forEach(seccion => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <img src="${seccion.preview}" alt="${seccion.titulo}" class="card-image" 
                     onerror="this.src='https://via.placeholder.com/400x300/333/fff?text=Imagen+no+disponible'">
                <div class="card-content">
                    <h3>${seccion.titulo}</h3>
                    <p>${seccion.descripcion}</p>
                </div>
            `;
            card.addEventListener('click', () => {
                console.log('🔄 Navegando a sección:', seccion.id);
                window.location.href = `seccion.html?id=${seccion.id}`;
            });
            container.appendChild(card);
        });
        
        console.log('🎉 Secciones cargadas correctamente');
    } catch (error) {
        console.error('❌ Error cargando secciones:', error);
        const container = document.getElementById('secciones-container');
        if (container) {
            container.innerHTML = '<p style="text-align: center; color: #ff6b6b; padding: 2rem;">Error cargando las secciones. Por favor, recarga la página.</p>';
        }
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
        .then(response => {
            if (!response.ok) throw new Error('Error cargando datos');
            return response.json();
        })
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
                <button onclick="window.location.href='index.html'" class="back-button">← Volver a Galería</button>
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
                    <img src="${foto.miniatura}" alt="${foto.texto}" class="foto-miniatura"
                         onerror="this.src='https://via.placeholder.com/300x200/333/fff?text=Imagen+no+disponible'">
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

// Logo click para ir al inicio
document.addEventListener('DOMContentLoaded', function() {
    const logo = document.getElementById('logoHome');
    if (logo) {
        logo.addEventListener('click', function() {
            window.location.href = 'index.html';
        });
    }
    
    // Verificar si estamos en la página de sección
    if (window.location.pathname.includes('seccion.html')) {
        cargarSeccion();
    } else {
        cargarSecciones();
    }
});
