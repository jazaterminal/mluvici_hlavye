(() => {
  const board = document.getElementById('soundboard');

  if (!board || typeof SOUND_FILES === 'undefined' || !Array.isArray(SOUND_FILES)) {
    console.error('Soundboard: SOUND_FILES nejsou dostupné.');
    return;
  }

  let currentAudio = null;
  let currentTile = null;

  const fileUrl = (filename) =>
    filename.split('/').map(encodeURIComponent).join('/');

  const slugFor = (sound) => {
    const base = sound.file.replace(/\.[^.]+$/, '');
    return base
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const stopCurrent = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }
    if (currentTile) {
      currentTile.classList.remove('is-playing');
    }
    currentAudio = null;
    currentTile = null;
  };

  const itemsBySlug = new Map();

  SOUND_FILES.forEach((sound, index) => {
    const slug = slugFor(sound);

    // PŮVODNÍ STRUKTURA KARTY – musí odpovídat existujícímu styles.css.
    const tile = document.createElement('button');
    tile.type = 'button';
    tile.className = 'tile';
    tile.dataset.slug = slug;
    tile.setAttribute('aria-label', `Přehrát: ${sound.title}`);

    const top = document.createElement('span');
    top.className = 'tile-top';

    const number = document.createElement('span');
    number.className = 'tile-number';
    number.textContent = String(index + 1).padStart(2, '0');

    const icon = document.createElement('span');
    icon.className = 'play-icon';
    icon.setAttribute('aria-hidden', 'true');

    top.append(number, icon);

    const imageWrap = document.createElement('span');
    imageWrap.className = 'tile-image-wrap';

    const image = document.createElement('img');
    image.className = 'tile-image';
    image.src = 'hlavy.jpeg';
    image.alt = '';
    image.loading = index < 8 ? 'eager' : 'lazy';
    image.decoding = 'async';
    imageWrap.appendChild(image);

    const title = document.createElement('span');
    title.className = 'tile-title';
    title.textContent = sound.title;

    tile.append(top, imageWrap, title);
    board.appendChild(tile);

    const playTile = async ({ updateUrl = true, autoplayAttempt = false } = {}) => {
      if (!autoplayAttempt && currentTile === tile && currentAudio && !currentAudio.paused) {
        stopCurrent();
        return;
      }

      stopCurrent();
      tile.classList.remove('has-error');

      if (updateUrl) {
        history.replaceState(null, '', `${location.pathname}${location.search}#${slug}`);
      }

      const audio = new Audio(fileUrl(sound.file));
      audio.preload = 'auto';
      currentAudio = audio;
      currentTile = tile;

      audio.addEventListener('ended', stopCurrent, { once: true });
      audio.addEventListener('error', () => {
        tile.classList.add('has-error');
        if (currentTile === tile) stopCurrent();
        console.warn(`Zvukový soubor se nepodařilo načíst: ${sound.file}`);
      }, { once: true });

      try {
        await audio.play();
        if (currentTile === tile) tile.classList.add('is-playing');
      } catch (error) {
        // Autoplay může být na mobilu zablokovaný. Kartu ale necháme normálně použitelnou.
        if (!autoplayAttempt) {
          tile.classList.add('has-error');
        }
        if (currentTile === tile) stopCurrent();
        console.warn(`Přehrávání selhalo: ${sound.file}`, error);
      }
    };

    tile.addEventListener('click', () => {
      playTile({ updateUrl: true, autoplayAttempt: false });
    });

    itemsBySlug.set(slug, { tile, playTile });
  });

  const openFromHash = () => {
    const raw = location.hash.slice(1);
    if (!raw) return;

    const slug = decodeURIComponent(raw).trim().toLowerCase();
    const item = itemsBySlug.get(slug);
    if (!item) return;

    item.tile.scrollIntoView({ behavior: 'smooth', block: 'center' });
    item.playTile({ updateUrl: false, autoplayAttempt: true });
  };

  window.addEventListener('hashchange', openFromHash);

  if (location.hash) {
    if (document.readyState === 'complete') {
      openFromHash();
    } else {
      window.addEventListener('load', openFromHash, { once: true });
    }
  }
})();
