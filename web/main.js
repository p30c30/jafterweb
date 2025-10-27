// UPDATED: main.js working version
// MAIN.JS - VERSIÓN DEFINITIVA
console.log('✅ main.js CARGADO - VERSIÓN NUEVA');

function iniciar() {
    console.log('🚀 INICIANDO DESDE MAIN.JS...');
    
    setTimeout(() => {
        console.log('🔍 Buscando secciones-container...');
        const container = document.getElementById('secciones-container');
        console.log('Contenedor:', container);
        
        if (container) {
            console.log('✅ Contenedor EXISTE!');
            cargarDatos(container);
        } else {
            console.error('❌ Contenedor NO EXISTE');
        }
    }, 1000);
}

async function cargarDatos(container) {
    try {
        console.log('📥 Cargando data.json...');
        const response = await fetch('data.json');
        const data = await response.json();
        
        console.log('🎨 Creando', data.secciones.length, 'tarjetas...');
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
            container.appendChild(card);
        });
        
        console.log('🎉 ÉXITO: Web funcionando!');
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

// INICIAR
document.addEventListener('DOMContentLoaded', iniciar);
