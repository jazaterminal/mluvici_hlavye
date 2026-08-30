(() => {
  const board = document.getElementById('soundboard');

  if (!board || typeof SOUND_FILES === 'undefined' || !Array.isArray(SOUND_FILES)) {
    return;
  }

  let currentAudio = null;
  let currentTile = null;

  const stopCurrent = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }
    if (currentTile) {
      currentTile.classList.remove('is-playing');
      currentTile.setAttribute('aria-pressed', 'false');
    }
    currentAudio = null;
    currentTile = null;
  };

  const fileUrl = (filename) =>
    './' + filename.split('/').map(encodeURIComponent).join('/');

  const slugFor = (sound) => {
    const base = sound.file.replace(/\.[^.]+$/, '');
    return base
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const tileBySlug = new Map();

  SOUND_FILES.forEach((sound, index) => {
    const slug = slugFor(sound);

    // Zachováváme původní DIV strukturu karty,
    // takže se nemění její vzhled ani názvy.
    const tile = document.createElement('div');
    tile.className = 'tile';
    tile.dataset.slug = slug;
    tile.setAttribute('role', 'button');
    tile.setAttribute('tabindex', '0');
    tile.setAttribute('aria-pressed', 'false');
    tile.setAttribute('aria-label', `${index + 1}. ${sound.title}`);

    const image = document.createElement('img');
    image.className = 'tile-image';
    image.src = './hlavy.jpeg';
    image.alt = '';
    image.loading = 'lazy';

    const number = document.createElement('div');
    number.className = 'tile-number';
    number.textContent = String(index + 1).padStart(2, '0');

    const title = document.createElement('div');
    title.className = 'tile-title';
    title.textContent = sound.title;

    const play = document.createElement('div');
    play.className = 'tile-play';
    play.setAttribute('aria-hidden', 'true');
    play.textContent = '▶';

    tile.append(image, number, title, play);
    board.appendChild(tile);

    const audio = new Audio(fileUrl(sound.file));
    audio.preload = 'none';

    const playThis = async ({ updateUrl = true } = {}) => {
      if (currentAudio === audio && !audio.paused) {
        stopCurrent();
        return;
      }

      stopCurrent();

      currentAudio = audio;
      currentTile = tile;
      tile.classList.add('is-playing');
      tile.setAttribute('aria-pressed', 'true');

      if (updateUrl) {
        history.replaceState(null, '', `${location.pathname}${location.search}#${slug}`);
      }

      try {
        await audio.play();
      } catch (err) {
        tile.classList.remove('is-playing');
        tile.setAttribute('aria-pressed', 'false');
        currentAudio = null;
        currentTile = null;
      }
    };

    tile.addEventListener('click', () => {
      playThis({ updateUrl: true });
    });

    tile.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        playThis({ updateUrl: true });
      }
    });

    audio.addEventListener('ended', () => {
      if (currentAudio === audio) {
        tile.classList.remove('is-playing');
        tile.setAttribute('aria-pressed', 'false');
        currentAudio = null;
        currentTile = null;
      }
    });

    tileBySlug.set(slug, { tile, playThis });
  });

  const openFromHash = () => {
    const slug = decodeURIComponent(location.hash.slice(1)).trim().toLowerCase();
    if (!slug) return;

    const item = tileBySlug.get(slug);
    if (!item) return;

    requestAnimationFrame(() => {
      item.tile.scrollIntoView({ behavior: 'smooth', block: 'center' });
      item.playThis({ updateUrl: false });
    });
  };

  window.addEventListener('hashchange', openFromHash);

  if (location.hash) {
    window.addEventListener('load', openFromHash, { once: true });
  }
})();
