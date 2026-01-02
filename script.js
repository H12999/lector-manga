const PROXY = "https://api.allorigins.win/raw?url=";
const lista = document.getElementById('lista-manga');
const msjInicio = document.getElementById('mensaje-inicio');
let favoritos = JSON.parse(localStorage.getItem('mangas_favs')) || [];

document.getElementById('buscador').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') buscarManga(e.target.value);
});

async function buscarManga(query) {
    msjInicio.style.display = "none";
    lista.innerHTML = "<p>Buscando en MangaDex...</p>";
    
    // Eliminamos etiquetas específicas para encontrar más resultados
    const url = `https://api.mangadex.org/manga?title=${query}&limit=20&includes[]=cover_art`;
    
    try {
        const res = await fetch(PROXY + encodeURIComponent(url));
        const data = await res.json();
        renderMangas(data.data);
    } catch (error) {
        lista.innerHTML = "<p>Error al conectar con el servidor.</p>";
    }
}

function renderMangas(mangas) {
    lista.innerHTML = "";
    if(mangas.length === 0) { lista.innerHTML = "<p>No se encontraron resultados.</p>"; return; }

    mangas.forEach(manga => {
        const coverFileName = manga.relationships.find(r => r.type === 'cover_art')?.attributes?.fileName;
        const coverUrl = coverFileName ? `https://uploads.mangadex.org/covers/${manga.id}/${coverFileName}` : 'https://via.placeholder.com/200x300';
        
        const card = document.createElement('div');
        card.className = 'manga-card';
        card.innerHTML = `
            <button class="btn-fav" onclick="toggleFav(event, '${manga.id}', '${manga.attributes.title.en}')">★</button>
            <img src="${coverUrl}">
            <h4>${manga.attributes.title.en || "Manga"}</h4>
        `;
        card.onclick = () => abrirManga(manga.id, manga.attributes.title.en);
        lista.appendChild(card);
    });
}

function toggleFav(e, id, titulo) {
    e.stopPropagation();
    const index = favoritos.findIndex(f => f.id === id);
    if (index > -1) favoritos.splice(index, 1);
    else favoritos.push({id, titulo});
    localStorage.setItem('mangas_favs', JSON.stringify(favoritos));
    alert(index > -1 ? "Eliminado de favoritos" : "¡Añadido a favoritos!");
}

function mostrarFavoritos() {
    msjInicio.style.display = "none";
    if (favoritos.length === 0) {
        lista.innerHTML = "<h2>No tienes favoritos guardados.</h2>";
        return;
    }
    lista.innerHTML = "<h2>Tus Favoritos</h2>";
    // Aquí podrías hacer una petición para traer las portadas de nuevo, 
    // por ahora listamos los nombres guardados para que sea rápido:
    favoritos.forEach(fav => {
        const item = document.createElement('div');
        item.className = 'manga-card';
        item.innerHTML = `<h4>${fav.titulo}</h4>`;
        item.onclick = () => abrirManga(fav.id, fav.titulo);
        lista.appendChild(item);
    });
}

function mostrarInicio() {
    lista.innerHTML = "";
    msjInicio.style.display = "block";
}

// Funciones abrirManga y cerrarLector iguales al paso anterior...
function cerrarLector() { document.getElementById('modal-lector').style.display = "none"; }
async function abrirManga(id, titulo) {
    const modal = document.getElementById('modal-lector');
    const visor = document.getElementById('visor-manga');
    modal.style.display = "block";
    visor.innerHTML = "Cargando capítulos...";
    
    const res = await fetch(PROXY + encodeURIComponent(`https://api.mangadex.org/manga/${id}/feed?translatedLanguage[]=es&order[chapter]=asc`));
    const data = await res.json();

    let html = `<h2>${titulo}</h2><select id="select-ch" onchange="cargarCapitulo(this.value)">`;
    html += '<option value="">-- Selecciona Capítulo --</option>';
    data.data.forEach(ch => html += `<option value="${ch.id}">Capítulo ${ch.attributes.chapter}</option>`);
    html += `</select><div id="paginas"></div>`;
    visor.innerHTML = html;
}

async function cargarCapitulo(id) {
    if(!id) return;
    const divPaginas = document.getElementById('paginas');
    divPaginas.innerHTML = "<p style='padding:20px'>Cargando imágenes del capítulo...</p>";
    
    try {
        // Pedimos la información del servidor de imágenes a MangaDex
        const res = await fetch(PROXY + encodeURIComponent(`https://api.mangadex.org/at-home/server/${id}`));
        const data = await res.json();
        
        const hash = data.chapter.hash;
        const serverUrl = data.baseUrl;
        
        divPaginas.innerHTML = ""; // Limpiamos el mensaje de carga
        
        // Cargamos cada página directamente sin usar el Proxy para la imagen
        data.chapter.data.forEach(imgName => {
            const imgElement = document.createElement('img');
            imgElement.src = `${serverUrl}/data/${hash}/${imgName}`;
            imgElement.style.width = "100%";
            imgElement.style.display = "block";
            imgElement.style.marginBottom = "10px";
            
            // Si hay un error con una imagen, intentamos cargar la versión de menor calidad (data-saver)
            imgElement.onerror = () => {
                imgElement.src = `${serverUrl}/data-saver/${hash}/${imgName}`;
            };
            
            divPaginas.appendChild(imgElement);
        });
    } catch (error) {
        divPaginas.innerHTML = "<p>Error al cargar las imágenes. Intenta seleccionar otro capítulo.</p>";
        console.error(error);
    }
}