async function leerManga(mangaId, titulo) {
    modal.style.display = "block";
    btnGuardar.style.display = "flex"; 
    visor.innerHTML = '<div class="loading-state"><h2>Cargando lista de capítulos...</h2></div>';
    modal.scrollTop = 0;

    try {
        // 1. Obtener la lista de capítulos disponibles (los últimos 50 por ejemplo)
        const feedUrl = `https://api.mangadex.org/manga/${mangaId}/feed?limit=50&translatedLanguage[]=es&translatedLanguage[]=es-la&order[chapter]=asc`;
        const respFeed = await fetch(PROXY + encodeURIComponent(feedUrl));
        const datosFeed = await respFeed.json();
        
        if (!datosFeed.data.length) {
            visor.innerHTML = '<h2 class="error-msg">No hay capítulos disponibles en español.</h2>';
            return;
        }

        // 2. Crear un selector simple para que elijas qué capítulo leer
        let selectorHTML = `<div class="selector-capitulos">
            <select id="select-ch" onchange="cargarPaginasCapitulo(this.value, '${titulo}', '${mangaId}')">
                <option value="">-- Selecciona un Capítulo --</option>
                ${datosFeed.data.map(ch => `
                    <option value="${ch.id}">Capítulo ${ch.attributes.chapter} - ${ch.attributes.title || 'Sin título'}</option>
                `).join('')}
            </select>
        </div>`;

        visor.innerHTML = `<h1 class="manga-title">${titulo}</h1>${selectorHTML}<div id="manga-pages"></div>`;

    } catch (e) {
        visor.innerHTML = '<h2 class="error-msg">Error al conectar con la biblioteca.</h2>';
    }
}

// Nueva función para cargar las fotos del capítulo elegido
async function cargarPaginasCapitulo(chapterId, titulo, mangaId) {
    if(!chapterId) return;
    const container = document.getElementById('manga-pages');
    container.innerHTML = '<p style="text-align:center;">Cargando páginas...</p>';

    try {
        const capUrl = `https://api.mangadex.org/at-home/server/${chapterId}`;
        const respCap = await fetch(PROXY + encodeURIComponent(capUrl));
        const datosCap = await respCap.json();
        
        const hash = datosCap.chapter.hash;
        const base = datosCap.baseUrl;

        container.innerHTML = ''; // Limpiar mensaje de carga

        datosCap.chapter.data.forEach(imgName => {
            const img = document.createElement('img');
            img.src = `${base}/data/${hash}/${imgName}`;
            img.onerror = () => { img.src = `https://uploads.mangadex.org/data/${hash}/${imgName}`; };
            container.appendChild(img);
        });

        // Revisar marcador después de cargar
        if (marcadoresPagina[mangaId]) {
            const saltarBtn = document.createElement('button');
            saltarBtn.className = 'btn-ir-marcador';
            saltarBtn.innerText = "📍 Saltar a donde me quedé";
            saltarBtn.onclick = () => saltarAMarcador(mangaId);
            container.prepend(saltarBtn);
        }

    } catch (e) {
        container.innerHTML = '<p class="error-msg">Error al cargar las imágenes de este capítulo.</p>';
    }
}