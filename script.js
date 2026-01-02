// --- 1. DEFINICIÓN DE VARIABLES (Solo una vez) ---
const PROXY = "https://api.allorigins.win/raw?url=";
let marcadoresPagina = JSON.parse(localStorage.getItem('marcadoresPagina')) || {};

const contenedor = document.getElementById('contenedor-manga');
const buscador = document.getElementById('busqueda');
const modal = document.getElementById('modal-lector');
const visor = document.getElementById('visor-paginas');
const botonCerrar = document.querySelector('.cerrar');
const btnGuardar = document.getElementById('btn-guardar-flotante');

// --- 2. BUSCADOR Y LISTADO ---
async function buscarManga(titulo = 'One Piece') {
    contenedor.innerHTML = '<div style="grid-column: 1/-1; text-align:center;">Buscando...</div>';
    const api = `https://api.mangadex.org/manga?title=${encodeURIComponent(titulo)}&limit=20&availableTranslatedLanguage[]=es&availableTranslatedLanguage[]=es-la&includes[]=cover_art&contentRating[]=safe&contentRating[]=suggestive`;
    
    try {
        const resp = await fetch(PROXY + encodeURIComponent(api));
        const datos = await resp.json();
        mostrarMangas(datos.data);
    } catch (e) {
        contenedor.innerHTML = '<div style="grid-column: 1/-1; text-align:center;">Error de conexión.</div>';
    }
}

function mostrarMangas(lista) {
    contenedor.innerHTML = '';
    lista.forEach(manga => {
        const id = manga.id;
        const coverObj = manga.relationships.find(r => r.type === 'cover_art');
        const cover = coverObj ? `https://uploads.mangadex.org/covers/${id}/${coverObj.attributes.fileName}.256.jpg` : '';
        const titulo = manga.attributes.title.en || Object.values(manga.attributes.title)[0];
        
        const card = document.createElement('div');
        card.className = 'card';
        const tieneMarcador = marcadoresPagina[id] ? '<div class="badge-marcador">📍 Sigues aquí</div>' : '';

        card.innerHTML = `
            <img src="${cover}">
            ${tieneMarcador}
            <div class="card-info"><h3>${titulo}</h3></div>
        `;
        card.onclick = () => leerManga(id, titulo);
        contenedor.appendChild(card);
    });
}

// --- 3. LECTOR Y MARCADORES ---
async function leerManga(mangaId, titulo) {
    modal.style.display = "block";
    btnGuardar.style.display = "flex"; 
    visor.innerHTML = '<div class="loading-state"><h2>Cargando...</h2></div>';
    modal.scrollTop = 0;

    try {
        const feedUrl = `https://api.mangadex.org/manga/${mangaId}/feed?limit=1&translatedLanguage[]=es&translatedLanguage[]=es-la&order[chapter]=asc`;
        const respFeed = await fetch(PROXY + encodeURIComponent(feedUrl));
        const datosFeed = await respFeed.json();
        
        const chapter = datosFeed.data[0];
        const capUrl = `https://api.mangadex.org/at-home/server/${chapter.id}`;
        const respCap = await fetch(PROXY + encodeURIComponent(capUrl));
        const datosCap = await respCap.json();
        
        const hash = datosCap.chapter.hash;
        const base = datosCap.baseUrl;

        // Banner de continuar
        let bannerHTML = '';
        if (marcadoresPagina[mangaId]) {
            bannerHTML = `
                <div class="banner-continuar" id="aviso-marcador">
                    <p>📍 Tienes una marca guardada</p>
                    <button class="btn-ir-marcador" onclick="saltarAMarcador('${mangaId}')">
                        Continuar por donde lo dejaste
                    </button>
                </div>`;
        }

        visor.innerHTML = `<h1 class="manga-title">${titulo}</h1>${bannerHTML}<div id="manga-pages"></div>`;
        
        const container = document.getElementById('manga-pages');
        datosCap.chapter.data.forEach(imgName => {
            const img = document.createElement('img');
            img.src = `${base}/data/${hash}/${imgName}`;
            img.onerror = () => { img.src = `https://uploads.mangadex.org/data/${hash}/${imgName}`; };
            container.appendChild(img);
        });

        // Configurar el botón flotante 📍
        btnGuardar.onclick = () => {
            marcadoresPagina[mangaId] = modal.scrollTop;
            localStorage.setItem('marcadoresPagina', JSON.stringify(marcadoresPagina));
            alert("📍 Posición guardada");
        };

    } catch (e) {
        visor.innerHTML = '<h2 class="error-msg">Error al abrir el manga.</h2>';
    }
}

// Función global para el botón de continuar
window.saltarAMarcador = function(mangaId) {
    const posicion = marcadoresPagina[mangaId];
    if (posicion) {
        modal.scrollTo({ top: posicion, behavior: 'smooth' });
        document.getElementById('aviso-marcador').style.display = 'none';
    }
};

// --- 4. EVENTOS ---
botonCerrar.onclick = () => { 
    modal.style.display = "none"; 
    btnGuardar.style.display = "none";
    buscarManga(buscador.value || 'One Piece'); 
};

buscador.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') buscarManga(e.target.value);
});

window.onload = () => buscarManga();