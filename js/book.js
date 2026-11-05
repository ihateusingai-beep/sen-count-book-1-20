// 3D pop-up book shell (ChemLab-inspired, SEN simplified)
(function () {
  const L = window.L, V = L.V;
  const B = (L.Book = {});
  const PW = 0.28, PH = 0.36, H0 = 0.02;
  const PAGE_PX = 768, PAGE_PY = Math.round(768 * PH / PW);
  const POS = V(0.42, L.TABLE_Y, 0);

  const paperBase = (() => {
    const c = document.createElement('canvas'); c.width = 128; c.height = 128;
    const x = c.getContext('2d');
    x.fillStyle = '#f7f1e0'; x.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 400; i++) {
      x.fillStyle = `rgba(140,110,70,${Math.random() * 0.05})`;
      x.fillRect(Math.random() * 128, Math.random() * 128, 2, 1);
    }
    return c;
  })();

  function paper(side) {
    const c = document.createElement('canvas'); c.width = PAGE_PX; c.height = PAGE_PY;
    const x = c.getContext('2d');
    x.fillStyle = x.createPattern(paperBase, 'repeat');
    x.fillRect(0, 0, PAGE_PX, PAGE_PY);
    const g = side === 'R'
      ? x.createLinearGradient(0, 0, 70, 0)
      : x.createLinearGradient(PAGE_PX, 0, PAGE_PX - 70, 0);
    g.addColorStop(0, 'rgba(90,70,40,0.22)'); g.addColorStop(1, 'rgba(90,70,40,0)');
    x.fillStyle = g; x.fillRect(0, 0, PAGE_PX, PAGE_PY);
    return { c, x };
  }

  function drawLeft(page) {
    const { c, x } = paper('L');
    const accent = page.color || '#1d6fb8';
    // header
    x.fillStyle = '#8a7a5a'; x.font = '700 22px "Segoe UI", sans-serif';
    x.fillText(page.running || '數數小書', 70, 56);
    x.strokeStyle = 'rgba(138,122,90,.45)'; x.lineWidth = 2;
    x.beginPath(); x.moveTo(70, 70); x.lineTo(PAGE_PX - 70, 70); x.stroke();

    if (page.kind === 'cover') {
      x.fillStyle = accent; x.font = '900 36px "Segoe UI", sans-serif';
      x.fillText('數學 · 數數', 70, 160);
      x.fillStyle = '#1f2a33'; x.font = '800 72px Georgia, serif';
      x.fillText('1 至 20', 70, 260);
      x.fillStyle = '#4a5560'; x.font = '600 28px "Segoe UI", "PingFang HK", sans-serif';
      x.fillText('一頁一個數', 70, 330);
      x.fillText('看 · 聽 · 用手指數', 70, 380);
      // decorative dots 1..5
      for (let i = 0; i < 5; i++) {
        x.beginPath();
        x.fillStyle = ['#ff6b6b', '#ffb703', '#3ddc97', '#4dabf7', '#b197fc'][i];
        x.arc(120 + i * 70, 480, 22, 0, Math.PI * 2); x.fill();
        x.fillStyle = '#fff'; x.font = '900 24px sans-serif'; x.textAlign = 'center';
        x.fillText(String(i + 1), 120 + i * 70, 488); x.textAlign = 'left';
      }
    } else if (page.kind === 'number') {
      // giant number badge
      const n = page.n;
      x.fillStyle = accent;
      roundRect(x, PAGE_PX / 2 - 120, 110, 240, 240, 36); x.fill();
      x.fillStyle = '#fff'; x.font = '900 160px "Segoe UI", sans-serif';
      x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText(String(n), PAGE_PX / 2, 230);
      x.textAlign = 'left'; x.textBaseline = 'alphabetic';
      x.fillStyle = '#1f2a33'; x.font = '800 40px "Segoe UI", "PingFang HK", sans-serif';
      x.fillText(page.title, 70, 420);
      x.fillStyle = '#445'; x.font = '600 28px "Segoe UI", "PingFang HK", sans-serif';
      x.fillText(page.idea, 70, 470);
      // small chips
      const cols = Math.min(n, 10);
      for (let i = 0; i < n; i++) {
        const row = Math.floor(i / 10), col = i % 10;
        const cx = 80 + col * ((PAGE_PX - 160) / Math.max(cols - 1, 1) || 0);
        const cy = 530 + row * 40;
        x.beginPath(); x.fillStyle = page.dot || accent;
        x.arc(n === 1 ? PAGE_PX / 2 : cx, cy, 14, 0, Math.PI * 2); x.fill();
      }
    } else if (page.kind === 'quiz') {
      x.fillStyle = accent; x.font = '900 28px "Segoe UI", sans-serif';
      x.fillText('小測驗', 70, 150);
      x.fillStyle = '#1f2a33'; x.font = '800 48px "Segoe UI", "PingFang HK", sans-serif';
      wrap(x, page.title, 70, 230, PAGE_PX - 140, 56);
      x.fillStyle = '#445'; x.font = '600 30px "Segoe UI", "PingFang HK", sans-serif';
      wrap(x, page.idea, 70, 360, PAGE_PX - 140, 40);
    } else if (page.kind === 'end') {
      x.fillStyle = accent; x.font = '900 32px sans-serif'; x.fillText('完成！', 70, 180);
      x.fillStyle = '#1f2a33'; x.font = '800 56px "Segoe UI", "PingFang HK", sans-serif';
      x.fillText('你識數 1 至 20', 70, 280);
      x.fillStyle = '#445'; x.font = '600 30px "Segoe UI", sans-serif';
      x.fillText('好叻！再讀一次都可以。', 70, 360);
    }
    // page no
    x.fillStyle = '#8a7a5a'; x.font = '600 22px Georgia, serif';
    x.fillText(String(page.no || ''), 70, PAGE_PY - 40);
    return c;
  }

  function drawRight(page) {
    const { c, x } = paper('R');
    x.fillStyle = '#8a7a5a'; x.font = '700 22px "Segoe UI", sans-serif';
    x.textAlign = 'right'; x.fillText(page.running || '數數小書', PAGE_PX - 70, 56);
    x.textAlign = 'left';
    x.strokeStyle = 'rgba(138,122,90,.45)'; x.lineWidth = 2;
    x.beginPath(); x.moveTo(70, 70); x.lineTo(PAGE_PX - 70, 70); x.stroke();

    if (page.kind === 'cover') {
      x.fillStyle = '#1d6fb8'; x.font = '900 34px sans-serif';
      x.textAlign = 'center'; x.fillText('打開書', PAGE_PX / 2, 200);
      x.fillStyle = '#1f2a33'; x.font = '700 44px "Segoe UI", "PingFang HK", sans-serif';
      x.fillText('物品會彈起來', PAGE_PX / 2, 280);
      x.fillStyle = '#556'; x.font = '600 28px sans-serif';
      x.fillText('用手指指住，一齊數', PAGE_PX / 2, 360);
      x.textAlign = 'left';
    } else if (page.kind === 'number') {
      x.fillStyle = '#3a3020'; x.font = 'italic 28px Georgia, serif';
      x.textAlign = 'center';
      x.fillText(page.caption || `圖 · ${page.n} 個`, PAGE_PX / 2, PAGE_PY - 80);
      x.textAlign = 'left';
      // faint printed circles as silhouette placeholders
      const n = page.n;
      layoutDots(n).forEach((p, i) => {
        const px = 90 + p.x * (PAGE_PX - 180);
        const py = 120 + p.y * (PAGE_PY - 260);
        x.beginPath();
        x.fillStyle = 'rgba(40,60,80,0.12)';
        x.arc(px, py, 28, 0, Math.PI * 2); x.fill();
        x.strokeStyle = 'rgba(40,60,80,0.35)'; x.lineWidth = 3; x.stroke();
        x.fillStyle = 'rgba(40,60,80,0.45)'; x.font = '800 22px sans-serif';
        x.textAlign = 'center'; x.fillText(String(i + 1), px, py + 8); x.textAlign = 'left';
      });
    } else if (page.kind === 'quiz') {
      x.fillStyle = '#1f2a33'; x.font = '800 36px "Segoe UI", "PingFang HK", sans-serif';
      x.textAlign = 'center';
      x.fillText('睇圖', PAGE_PX / 2, 200);
      x.fillText('揀正確個數', PAGE_PX / 2, 260);
      x.fillStyle = '#1d6fb8'; x.font = '900 28px sans-serif';
      x.fillText('A  B  C  D', PAGE_PX / 2, 360);
      x.textAlign = 'left';
    } else if (page.kind === 'end') {
      x.textAlign = 'center';
      for (let i = 0; i < 10; i++) {
        x.beginPath();
        x.fillStyle = `hsl(${i * 36},70%,55%)`;
        x.arc(140 + (i % 5) * 100, 220 + Math.floor(i / 5) * 120, 28, 0, Math.PI * 2); x.fill();
      }
      x.textAlign = 'left';
    }
    x.fillStyle = '#8a7a5a'; x.font = '600 22px Georgia, serif'; x.textAlign = 'right';
    x.fillText(String((page.no || 0) + (page.kind === 'cover' ? 0 : 0)), PAGE_PX - 70, PAGE_PY - 40);
    x.textAlign = 'left';
    return c;
  }

  function roundRect(x, a, b, w, h, r) {
    x.beginPath();
    x.moveTo(a + r, b);
    x.arcTo(a + w, b, a + w, b + h, r);
    x.arcTo(a + w, b + h, a, b + h, r);
    x.arcTo(a, b + h, a, b, r);
    x.arcTo(a, b, a + w, b, r);
    x.closePath();
  }
  function wrap(x, text, left, y, maxW, lh) {
    const words = String(text || '').split('');
    let line = '', yy = y;
    for (const ch of words) {
      const t = line + ch;
      if (x.measureText(t).width > maxW && line) { x.fillText(line, left, yy); line = ch; yy += lh; }
      else line = t;
    }
    if (line) x.fillText(line, left, yy);
  }

  // unit-square layout for n dots (centered grid)
  function layoutDots(n) {
    if (n <= 0) return [];
    if (n === 1) return [{ x: 0.5, y: 0.45 }];
    const cols = n <= 4 ? 2 : n <= 9 ? 3 : n <= 16 ? 4 : 5;
    const rows = Math.ceil(n / cols);
    const out = [];
    for (let i = 0; i < n; i++) {
      const r = Math.floor(i / cols), c = i % cols;
      const inRow = Math.min(cols, n - r * cols);
      const x = (c + 0.5) / inRow * 0.85 + 0.075;
      const y = (r + 0.5) / rows * 0.7 + 0.1;
      out.push({ x, y });
    }
    return out;
  }
  B.layoutDots = layoutDots;

  // build book mesh
  let book, pageL, pageR, leafG, popRoot, built = false;
  const texL = new THREE.CanvasTexture(document.createElement('canvas'));
  const texR = new THREE.CanvasTexture(document.createElement('canvas'));
  texL.colorSpace = texR.colorSpace = THREE.SRGBColorSpace;

  function build() {
    if (built) return; built = true;
    book = new THREE.Group();
    book.position.copy(POS);
    L.scene.add(book);

    const cloth = new THREE.MeshStandardMaterial({ color: 0x1f4d6e, roughness: 0.85 });
    const gold = new THREE.MeshStandardMaterial({ color: 0xc9a54a, metalness: 0.8, roughness: 0.35 });
    const BW = PW + 0.012, BD = PH + 0.02, BT = 0.004;

    [-1, 1].forEach(sx => {
      const board = new THREE.Mesh(new THREE.BoxGeometry(BW, BT, BD), cloth);
      board.position.set(sx * (BW / 2 + 0.005), BT / 2, 0);
      board.castShadow = board.receiveShadow = true;
      book.add(board);
      const edge = new THREE.Mesh(new THREE.BoxGeometry(BW * 0.92, 0.0007, 0.004), gold);
      edge.position.set(sx * (BW / 2 + 0.005), BT + 0.0004, BD / 2 - 0.008);
      book.add(edge);
      const block = new THREE.Mesh(
        new THREE.BoxGeometry(PW - 0.004, H0 - BT, PH - 0.006),
        new THREE.MeshStandardMaterial({ color: 0xefe6d2, roughness: 0.95 })
      );
      block.position.set(sx * (PW / 2), BT + (H0 - BT) / 2, 0);
      block.castShadow = block.receiveShadow = true;
      book.add(block);
    });
    const spine = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, BD * 0.95, 16, 1, false, Math.PI / 2, Math.PI),
      cloth
    );
    spine.rotation.x = Math.PI / 2;
    spine.position.set(0, 0.007, 0);
    book.add(spine);

    const mkPage = (sx, tex) => {
      const g = new THREE.PlaneGeometry(PW, PH, 20, 1);
      g.rotateX(-Math.PI / 2);
      const pos = g.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const xx = pos.getX(i) + PW / 2;
        const d = sx > 0 ? xx : PW - xx;
        pos.setY(i, 0.003 * Math.exp(-d / 0.02));
      }
      g.computeVertexNormals();
      const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }));
      m.position.set(sx * PW / 2, H0, 0);
      m.receiveShadow = true;
      return m;
    };
    pageL = mkPage(-1, texL);
    pageR = mkPage(1, texR);
    book.add(pageL, pageR);

    // simple turning leaf (flat rotate)
    leafG = new THREE.Group();
    const leafMatF = new THREE.MeshStandardMaterial({ map: texR.clone(), roughness: 0.9, side: THREE.FrontSide });
    const leafMatB = new THREE.MeshStandardMaterial({ map: texL.clone(), roughness: 0.9, side: THREE.BackSide });
    leafMatF.map.colorSpace = leafMatB.map.colorSpace = THREE.SRGBColorSpace;
    const leafGeo = new THREE.PlaneGeometry(PW, PH, 16, 1);
    leafGeo.rotateX(-Math.PI / 2);
    const leafF = new THREE.Mesh(leafGeo, leafMatF);
    const leafB = new THREE.Mesh(leafGeo.clone(), leafMatB);
    leafF.position.x = PW / 2; leafB.position.x = PW / 2;
    leafG.add(leafF, leafB);
    leafG.position.set(0, H0 + 0.001, 0);
    leafG.visible = false;
    book.add(leafG);
    leafG.userData = { leafF, leafB, leafMatF, leafMatB };

    popRoot = new THREE.Group();
    popRoot.position.set(PW / 2, H0 + 0.002, 0);
    book.add(popRoot);

    B.book = book;
    B.popRoot = popRoot;
    L.setOrbitFocus(0.42, 0.95, 0, 1.65);
  }

  function setPageTextures(page) {
    const left = drawLeft(page);
    const right = drawRight(page);
    texL.image = left; texL.needsUpdate = true;
    texR.image = right; texR.needsUpdate = true;
    pageL.material.map = texL; pageL.material.needsUpdate = true;
    pageR.material.map = texR; pageR.material.needsUpdate = true;
  }

  // pop-up objects: colored spheres / fruits
  const COLORS = [0xff6b6b, 0xffb703, 0x3ddc97, 0x4dabf7, 0xb197fc, 0xff8e53, 0x20c997, 0xf06595];
  function clearPop() {
    while (popRoot.children.length) {
      const o = popRoot.children.pop();
      o.traverse(m => {
        if (m.geometry) m.geometry.dispose();
        if (m.material) {
          if (Array.isArray(m.material)) m.material.forEach(x => x.dispose());
          else m.material.dispose();
        }
      });
    }
  }

  function makeFruit(color, labeled) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.SphereGeometry(0.028, 24, 18),
      new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.05 })
    );
    body.castShadow = true;
    g.add(body);
    // leaf
    const leaf = new THREE.Mesh(
      new THREE.SphereGeometry(0.01, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0x2f9e44, roughness: 0.8 })
    );
    leaf.scale.set(1.6, 0.4, 1); leaf.position.set(0.012, 0.026, 0);
    g.add(leaf);
    if (labeled != null) {
      const c = document.createElement('canvas'); c.width = 128; c.height = 128;
      const x = c.getContext('2d');
      x.fillStyle = '#fff'; x.beginPath(); x.arc(64, 64, 50, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#1b2430'; x.font = '900 64px sans-serif';
      x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText(String(labeled), 64, 70);
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
      const badge = new THREE.Mesh(
        new THREE.CircleGeometry(0.014, 20),
        new THREE.MeshBasicMaterial({ map: t, transparent: true })
      );
      badge.position.set(0, 0.01, 0.029);
      g.add(badge);
    }
    return g;
  }

  async function showPop(page) {
    clearPop();
    if (page.kind !== 'number' && page.kind !== 'quiz') return;
    const n = page.n || page.quizN || 0;
    const dots = layoutDots(n);
    const items = [];
    for (let i = 0; i < n; i++) {
      const color = COLORS[i % COLORS.length];
      const fruit = makeFruit(color, page.showLabels ? i + 1 : null);
      const p = dots[i];
      const x = (p.x - 0.5) * PW * 0.85;
      const z = (p.y - 0.5) * PH * 0.75;
      fruit.position.set(x, 0, z);
      fruit.scale.setScalar(0.001);
      popRoot.add(fruit);
      items.push(fruit);
    }
    // sequential pop for counting
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      L.sfx.pop();
      await L.tween(0.22, k => {
        const e = L.ease.outBack(k);
        it.scale.setScalar(e);
        it.position.y = 0.028 * e;
        it.rotation.y = e * Math.PI * 2 * 0.15;
      });
      if (page.countSpeak) L.say(String(i + 1));
      await L.wait(page.countSpeak ? 0.28 : 0.05);
    }
    B._items = items;
  }

  async function flip(dir) {
    // simple: hide pops, rotate leaf group
    clearPop();
    leafG.visible = true;
    leafG.rotation.y = dir > 0 ? 0 : Math.PI;
    await L.tween(0.55, k => {
      const e = L.ease.inOut(k);
      leafG.rotation.y = dir > 0 ? -e * Math.PI : Math.PI - e * Math.PI;
    });
    leafG.visible = false;
    leafG.rotation.y = 0;
  }

  B.open = async function (pages, startIndex) {
    build();
    B.pages = pages;
    B.i = startIndex || 0;
    setPageTextures(pages[B.i]);
    await showPop(pages[B.i]);
  };

  B.go = async function (i, withFlip) {
    const pages = B.pages;
    if (i < 0 || i >= pages.length) return;
    const dir = i > B.i ? 1 : -1;
    if (withFlip && i !== B.i) await flip(dir);
    B.i = i;
    setPageTextures(pages[i]);
    await showPop(pages[i]);
  };

  B.replay = () => showPop(B.pages[B.i]);
  B.clear = clearPop;
  B.current = () => B.pages[B.i];
})();
