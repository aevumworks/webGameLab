(() => {
  const scene = document.getElementById("scene");
  const canvas = document.getElementById("harbor");
  const chrome = document.querySelector(".chrome");
  const pause = document.getElementById("pause");
  const full = document.getElementById("fullscreen");
  const reveal = document.getElementById("reveal");
  const note = document.getElementById("renderer-note");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const presets = { dusk: [0,0], moon: [1,0], rain: [0,1] };
  const buttons = [...document.querySelectorAll("[data-weather]")];
  const home = { yaw: .44, pitch: .16, radius: 37 };
  const camera = { ...home };
  const target = { ...camera };
  const weather = [0,0];
  let chosen = presets.dusk;
  let paused = reduced.matches;
  let elapsed = 0;
  let previous = 0;
  let raf = 0;
  let frameTimer = 0;
  let renderer;
  let lost = false;
  let quality = 1;
  let samples = 0;
  let frameTotal = 0;
  let retryHandle = 0;

  function view() {
    return { ...camera, weather, time: elapsed };
  }

  function sizeCanvas() {
    if (!renderer || lost) return;
    const width = canvas.clientWidth, height = canvas.clientHeight;
    if (!width || !height) return;
    const density = Math.min(devicePixelRatio || 1, 1.55, 2048/width, 1380/height);
    const w = Math.max(1,Math.round(width*density*quality));
    const h = Math.max(1,Math.round(height*density*quality));
    if (canvas.width !== w || canvas.height !== h) {
      renderer.resize(w,h);
    }
    renderer.draw(view());
  }

  function schedule() {
    if (!renderer || lost || document.hidden || raf) return;
    raf = requestAnimationFrame(tick);
    // Some embedded Chromium views remain visible but stop sending compositor
    // frames. Keep the scene clock and controls alive in that specific case.
    frameTimer = setTimeout(() => {
      cancelAnimationFrame(raf);
      tick(performance.now(),false);
    },80);
  }
  function cancelFrame() {
    cancelAnimationFrame(raf);
    clearTimeout(frameTimer);
    raf = 0;
  }

  function settle(value, goal, amount) {
    return Math.abs(goal-value) < .00012 ? goal : value + (goal-value)*amount;
  }

  function tick(now, compositorFrame = true) {
    clearTimeout(frameTimer);
    raf = 0;
    if (document.hidden || lost) return;
    const interval = previous ? now - previous : 0;
    previous = now;
    const dt = Math.min(interval / 1000,.10);
    if (!paused) elapsed += dt;
    const motion = reduced.matches ? 1 : 1-Math.exp(-dt*12);
    const sky = reduced.matches ? 1 : 1-Math.exp(-dt*3.4);
    for (const key of ["yaw","pitch","radius"]) camera[key] = settle(camera[key],target[key],motion);
    for (let i = 0; i < 2; i++) weather[i] = settle(weather[i],chosen[i],sky);
    renderer.draw(view());
    // Long frames lower the pixel budget, without changing the simulation clock.
    if (!paused && compositorFrame && interval > 0 && interval < 160) {
      frameTotal += interval;
      if (++samples === 48) {
        const mean = frameTotal/samples;
        const next = mean > 38 ? Math.max(.58,quality*.84) : mean < 19 ? Math.min(1,quality+.04) : quality;
        if (next !== quality) { quality = next; sizeCanvas(); }
        frameTotal = 0;
        samples = 0;
      }
    }
    const moving = Object.keys(camera).some(key => camera[key] !== target[key]);
    if (!paused || moving || weather.some((v,i) => v !== chosen[i])) schedule();
    else previous = 0;
  }

  function syncPause() {
    const label = paused ? "继续时间" : "暂停时间";
    pause.classList.toggle("paused",paused);
    pause.setAttribute("aria-label",label);
    pause.title = label + "（空格）";
  }
  function togglePause() {
    paused = !paused;
    previous = 0;
    syncPause();
    schedule();
  }
  pause.addEventListener("click",togglePause);
  reduced.addEventListener("change",event => {
    if (event.matches) { paused = true; syncPause(); schedule(); }
  });
  buttons.forEach(button => button.addEventListener("click",() => {
    chosen = presets[button.dataset.weather];
    buttons.forEach(other => other.setAttribute("aria-pressed",String(other === button)));
    schedule();
  }));

  function setClean(clean) {
    scene.classList.toggle("clean",clean);
    chrome.inert = clean;
    reveal.hidden = !clean;
    scene.classList.remove("show-handle");
    if (clean) canvas.focus({ preventScroll: true });
  }
  function showHandle() {
    if (!scene.classList.contains("clean")) return;
    scene.classList.add("show-handle");
    clearTimeout(retryHandle);
    retryHandle = setTimeout(() => scene.classList.remove("show-handle"),1800);
  }
  document.getElementById("hide").addEventListener("click",() => setClean(true));
  reveal.addEventListener("click",() => setClean(false));
  async function toggleFull() {
    if (!document.fullscreenEnabled) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await scene.requestFullscreen();
    } catch {
      note.textContent = "当前窗口限制了全屏显示。";
      note.hidden = false;
    }
  }
  full.hidden = !document.fullscreenEnabled;
  full.addEventListener("click",toggleFull);
  document.addEventListener("fullscreenchange",() => {
    const label = document.fullscreenElement ? "退出全屏" : "进入全屏";
    full.setAttribute("aria-label",label);
    full.title = label + "（F）";
  });

  function moveBy(dx,dy) {
    target.yaw -= dx / canvas.clientWidth * Math.PI * 2;
    target.pitch = Math.max(.028,Math.min(1.22,target.pitch + dy/canvas.clientHeight*2.3));
    schedule();
  }
  function zoomAt(factor) {
    target.radius = Math.max(15,Math.min(70,target.radius/factor));
    schedule();
  }
  const pointers = new Map();
  let dragDistance = 0;
  function pair() {
    const [a,b] = pointers.values();
    return { x: (a.x+b.x)/2, y: (a.y+b.y)/2, distance: Math.hypot(a.x-b.x,a.y-b.y) };
  }
  canvas.addEventListener("pointerdown",event => {
    if (event.button !== 0 || pointers.size >= 2) return;
    canvas.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId,{ x:event.clientX, y:event.clientY });
    dragDistance = pointers.size === 1 ? 0 : 10;
  });
  canvas.addEventListener("pointermove",event => {
    const old = pointers.get(event.pointerId);
    if (!old) {
      if (event.clientY > canvas.clientHeight-75) showHandle();
      return;
    }
    const before = pointers.size === 2 ? pair() : null;
    const dx = event.clientX-old.x, dy = event.clientY-old.y;
    pointers.set(event.pointerId,{ x:event.clientX, y:event.clientY });
    dragDistance += Math.hypot(dx,dy);
    if (before) {
      const after = pair();
      moveBy(after.x-before.x,after.y-before.y);
      if (before.distance > 0) zoomAt(after.distance/before.distance);
    } else {
      moveBy(dx,dy);
    }
  });
  canvas.addEventListener("pointerup",event => {
    if (!pointers.delete(event.pointerId)) return;
    if (!pointers.size && dragDistance < 5) showHandle();
  });
  canvas.addEventListener("lostpointercapture",event => pointers.delete(event.pointerId));
  canvas.addEventListener("wheel",event => {
    event.preventDefault();
    const units = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? canvas.clientHeight : 1;
    zoomAt(Math.exp(-event.deltaY*units*.0014));
  },{ passive:false });
  canvas.addEventListener("dblclick",() => { Object.assign(target,home); schedule(); });
  document.addEventListener("keydown",event => {
    if (event.ctrlKey || event.metaKey || event.altKey || (event.key === " " && event.target.closest("button"))) return;
    const actions = {
      " ":togglePause, h:() => setClean(!scene.classList.contains("clean")), f:toggleFull,
      "+":() => zoomAt(1.15), "=":() => zoomAt(1.15), "-":() => zoomAt(1/1.15),
      arrowleft:() => moveBy(46,0), arrowright:() => moveBy(-46,0),
      arrowup:() => moveBy(0,46), arrowdown:() => moveBy(0,-46),
    };
    const action = actions[event.key.toLowerCase()];
    if (action) { event.preventDefault(); action(); }
  });
  document.addEventListener("visibilitychange",() => {
    previous = 0;
    if (document.hidden) cancelFrame();
    else schedule();
  });
  canvas.addEventListener("webglcontextlost",event => {
    event.preventDefault();
    lost = true;
    cancelFrame();
    canvas.style.visibility = "hidden";
  });
  canvas.addEventListener("webglcontextrestored",() => {
    lost = false;
    previous = 0;
    queueMicrotask(() => {
      canvas.style.visibility = "visible";
      renderer.renderer.shadowMap.needsUpdate = true;
      renderer.resize(canvas.width,canvas.height);
      renderer.draw(view());
      schedule();
    });
  });
  function start() {
    renderer = Harbor3D.createStage(canvas);
    canvas.dataset.renderer = renderer.renderer.capabilities.isWebGL2 ? "webgl2" : "webgl";
    canvas.style.visibility = "visible";
    sizeCanvas();
    schedule();
  }
  syncPause();
  new ResizeObserver(sizeCanvas).observe(canvas);
  try { start(); } catch(error) {
    console.error("Fog Harbor renderer",error);
    canvas.style.visibility = "hidden";
    note.textContent = "无法启动三维场景，请在支持 WebGL 的浏览器中启用硬件加速后重试。";
    note.hidden = false;
  }
})();
