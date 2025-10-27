// SCRIPT ULTRA-SIMPLE - ELIMINA TODA COMPLEJIDAD
function iniciar() {
    console.log('🚀 INICIANDO...');
    
    // Esperar 2 segundos para asegurar DOM
    setTimeout(() => {
        console.log('🔍 Buscando contenedor...');
        const container = document.getElementById('secciones-container');
        console.log('Contenedor encontrado:', container);
        
        if (container) {
            console.log('✅ Contenedor EXISTE, cargando datos...');
            cargarDatos(container);
        } else {
            console.error('❌ Contenedor NO EXISTE');
            // Intentar nuevamente
            setTimeout(iniciar, 1000);
        }
    }, 2000);
}

async function cargarDatos(container) {
    try {
        console.log('📥 Cargando data.json...');
        const response = await fetch('data.json');
        const data = await response.json();
        
        console.log('🎨 Creando tarjetas...');
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
            card.onclick = () => {
                window.location.hash = `seccion/${seccion.id}`;
                mostrarSeccion(seccion.id);
            };
            container.appendChild(card);
        });
        
        console.log('🎉 ÉXITO: Secciones cargadas');
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

function mostrarSeccion(seccionId) {
    console.log('Mostrando sección:', seccionId);
    // Implementación simple de navegación
}

// INICIAR CUANDO EL DOM ESTÉ LISTO
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
} else {
    iniciar();
}
