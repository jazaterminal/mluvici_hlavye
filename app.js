(() => {
  const board = document.getElementById('soundboard');
  let currentAudio = null;
  let currentTile = null;

  const stopCurrent = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }
    if (currentTile) currentTile.classList.remove('is-playing');
    currentAudio = null;
    currentTile = null;
  };

  const fileUrl = (filename) =>
    filename.split('/').map(encodeURIComponent).join('/');

  SOUND_FILES.forEach((sound, index) => {
    const tile = document.createElement('button');
    tile.type = 'button';
    tile.className = 'tile';
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

    tile.addEventListener('click', async () => {
      if (currentTile === tile && currentAudio && !currentAudio.paused) {
        stopCurrent();
        return;
      }

      stopCurrent();
      tile.classList.remove('has-error');

      // MP3 files are stored directly next to index.html.
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
        tile.classList.add('has-error');
        if (currentTile === tile) stopCurrent();
        console.warn(`Přehrávání selhalo: ${sound.file}`, error);
      }
    });

    board.appendChild(tile);
  });
})();