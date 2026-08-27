(() => {
  const board = document.getElementById("soundboard");
  if (!board || typeof SOUND_FILES === "undefined" || !Array.isArray(SOUND_FILES)) return;
  let currentAudio = null;
  let currentTile = null;
  function stopCurrent() {
    if (currentAudio) { currentAudio.pause(); currentAudio.currentTime = 0; }
    if (currentTile) currentTile.classList.remove("is-playing");
    currentAudio = null; currentTile = null;
  }
  function fileUrl(filename) { return "./" + filename.split("/").map(encodeURIComponent).join("/"); }
  SOUND_FILES.forEach((sound, index) => {
    const tile = document.createElement("button"); tile.type="button"; tile.className="tile";
    tile.setAttribute("aria-label", `Přehrát: ${sound.title}`);
    const top=document.createElement("span"); top.className="tile-top";
    const number=document.createElement("span"); number.className="tile-number"; number.textContent=String(index+1).padStart(2,"0");
    const icon=document.createElement("span"); icon.className="play-icon"; icon.setAttribute("aria-hidden","true");
    top.append(number,icon);
    const iw=document.createElement("span"); iw.className="tile-image-wrap";
    const img=document.createElement("img"); img.className="tile-image"; img.src="./hlavy.jpeg"; img.alt=""; img.loading=index<8?"eager":"lazy"; iw.appendChild(img);
    const title=document.createElement("span"); title.className="tile-title"; title.textContent=sound.title;
    tile.append(top,iw,title);
    tile.addEventListener("click", async () => {
      if (currentTile===tile && currentAudio && !currentAudio.paused) { stopCurrent(); return; }
      stopCurrent(); tile.classList.remove("has-error");
      const audio=new Audio(fileUrl(sound.file)); audio.preload="auto"; currentAudio=audio; currentTile=tile;
      audio.addEventListener("ended",stopCurrent,{once:true});
      audio.addEventListener("error",()=>{ tile.classList.add("has-error"); if(currentTile===tile) stopCurrent(); console.warn("Nelze načíst:",sound.file); },{once:true});
      try { await audio.play(); if(currentTile===tile) tile.classList.add("is-playing"); }
      catch(err){ tile.classList.add("has-error"); if(currentTile===tile) stopCurrent(); console.warn("Přehrávání selhalo:",sound.file,err); }
    });
    board.appendChild(tile);
  });
})();
