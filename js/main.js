// App flow: start → difficulty → book pages → quiz
(function () {
  const L = window.L;
  const $ = id => document.getElementById(id);
  const pages = L.PAGES;
  let started = false;

  // 初=2選1 · 中=3選1 · 高=自行入數（大鍵盤）
  const DIFF = {
    low: { id: 'low', label: '初', mode: 'mc', choices: 2, speak: '初級。兩個答案揀一個。' },
    mid: { id: 'mid', label: '中', mode: 'mc', choices: 3, speak: '中級。三個答案揀一個。' },
    high: { id: 'high', label: '高', mode: 'input', choices: 0, speak: '高級。自己入數字。' }
  };
  try {
    const saved = localStorage.getItem('sen_count_diff');
    L.difficulty = (saved && DIFF[saved]) ? saved : 'mid';
  } catch (e) { L.difficulty = 'mid'; }

  function toast(text, kind) {
    const t = $('toast');
    t.className = '';
    t.textContent = text;
    void t.offsetWidth;
    t.className = 'show ' + (kind || '');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { t.className = kind || ''; }, 2200);
  }
  L.toast = toast;

  function setDiff(id) {
    if (!DIFF[id]) return;
    L.difficulty = id;
    try { localStorage.setItem('sen_count_diff', id); } catch (e) {}
    document.querySelectorAll('.diffBtn').forEach(b => {
      b.classList.toggle('on', b.dataset.diff === id);
    });
    const d = DIFF[id];
    const tip = $('diffTip');
    if (tip) {
      tip.textContent = id === 'low' ? '測驗：2 選 1'
        : id === 'mid' ? '測驗：3 選 1'
        : '測驗：自己撳數字作答';
    }
    L.sfx && L.sfx.click();
  }

  function paintPanel(p) {
    const pan = p.panel || { kick: '', title: p.title || '', idea: p.idea || '', text: '' };
    $('kick').textContent = pan.kick || '';
    $('title').textContent = pan.title || '';
    $('idea').textContent = pan.idea || '';
    $('text').innerHTML = pan.text || '';
    $('miniT').textContent = pan.title || '';
    $('miniI').textContent = pan.idea || '';
    const bn = $('bigNum'), chips = $('chips');
    const countable = p.kind === 'number' || p.kind === 'quiz';
    if (countable) {
      bn.hidden = false; chips.hidden = false;
      const n = p.n || p.quizN;
      bn.textContent = p.kind === 'quiz' ? '?' : String(n);
      bn.style.borderColor = p.color || '#1d6fb8';
      bn.style.color = p.color || '#1d6fb8';
      chips.innerHTML = Array.from({ length: n }, (_, i) => {
        return `<i data-i="${i}" style="background:rgba(0,0,0,.12);outline:2px solid ${p.dot || p.color || '#1d6fb8'}"></i>`;
      }).join('');
      paintCountProgress({ counted: 0, total: n, done: false, next: 1 });
    } else {
      bn.hidden = true; chips.hidden = true; chips.innerHTML = '';
    }
    $('count').textContent = `${L.Book.i + 1}/${pages.length}`;
    $('btnBack').disabled = L.Book.i <= 0;
    if (p.kind === 'quiz') {
      $('btnNext').textContent = '答題 →';
      $('btnNext').classList.add('go');
    } else {
      $('btnNext').textContent = L.Book.i >= pages.length - 1 ? '再讀 ↻' : '下一頁 →';
      $('btnNext').classList.remove('go');
    }
  }

  function paintCountProgress(ev) {
    if (!ev || ev.total == null) return;
    const chips = $('chips');
    if (chips) {
      [...chips.querySelectorAll('i')].forEach((el, i) => {
        const on = i < ev.counted;
        el.classList.toggle('on', on);
        if (on) {
          el.style.background = el.style.outlineColor || '#1d6fb8';
          el.style.outline = 'none';
        } else {
          const p = L.Book.current();
          const c = (p && (p.dot || p.color)) || '#1d6fb8';
          el.style.background = 'rgba(0,0,0,.12)';
          el.style.outline = `2px solid ${c}`;
        }
      });
    }
    const prog = document.getElementById('countProg');
    if (prog) {
      prog.innerHTML = ev.done
        ? `✅ 有 <b>${ev.total}</b> 個！可以答題`
        : `已數 <b>${ev.counted}</b> / ${ev.total}`;
    }
    const mini = $('miniI');
    const cur = L.Book.current();
    if (mini && cur && (cur.kind === 'number' || cur.kind === 'quiz')) {
      mini.textContent = ev.done
        ? (cur.kind === 'quiz' ? `有 ${ev.total} 個！→ 答題` : `有 ${ev.total} 個！`)
        : `已數 ${ev.counted}/${ev.total} · 撳水果`;
    }
    const bn = $('bigNum');
    if (bn && !bn.hidden) {
      if (cur && cur.kind === 'quiz' && !ev.done && ev.counted === 0) bn.textContent = '?';
      else bn.textContent = ev.done ? String(ev.total) : (ev.counted > 0 ? String(ev.counted) : (cur && cur.kind === 'quiz' ? '?' : String(ev.total)));
      bn.style.transform = ev.done ? 'scale(1.08)' : 'scale(1)';
      bn.style.transition = 'transform .2s';
    }

    // Screen flash + aria-live for ordinal (1..N) — dual channel with 3D label
    if (ev.ordinal > 0 && !ev.done) {
      flashOrdinal(ev.ordinal);
    } else if (ev.done && ev.total > 0) {
      flashOrdinal(ev.total, true);
    }
  }

  function flashOrdinal(n, cardinal) {
    const live = $('ordLive');
    if (live) {
      live.textContent = cardinal ? `有 ${n} 個` : String(n);
    }
    const flash = $('ordFlash');
    if (!flash) return;
    flash.textContent = cardinal ? `有 ${n} 個` : String(n);
    flash.classList.remove('show', 'cardinal');
    void flash.offsetWidth;
    if (cardinal) flash.classList.add('cardinal');
    flash.classList.add('show');
    clearTimeout(flashOrdinal._t);
    flashOrdinal._t = setTimeout(() => flash.classList.remove('show', 'cardinal'), cardinal ? 1200 : 550);
  }

  L.Book.onCountProgress = paintCountProgress;
  L.Book.onCountComplete = function (n) {
    paintCountProgress({ counted: n, total: n, done: true, next: n + 1 });
  };

  function openQuiz(p) {
    const q = p.quiz;
    const answer = q.answer;
    const diff = DIFF[L.difficulty] || DIFF.mid;
    const labels = ['A', 'B', 'C', 'D'];

    return new Promise(resolve => {
      if (diff.mode === 'input') {
        // 高：大數字鍵盤自行輸入
        let buf = '';
        const paintBuf = () => {
          const el = $('numDisp');
          if (el) el.textContent = buf || '—';
        };
        $('modalCard').innerHTML = `
          <div class="kick">小測驗 · 高 · 自己入數</div>
          <h2>${q.q}</h2>
          <div class="numDisp" id="numDisp">—</div>
          <div class="numPad" id="numPad">
            ${[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20].map(n =>
              `<button type="button" class="numKey" data-n="${n}">${n}</button>`).join('')}
          </div>
          <div class="row" style="margin-top:10px">
            <button type="button" class="btn ghost" id="numClear">清除</button>
            <button type="button" class="btn primary" id="numOk">確定</button>
          </div>`;
        $('modal').classList.add('show');
        L.say('有幾多個？撳數字，再確定。');
        paintBuf();
        $('numPad').onclick = e => {
          const b = e.target.closest('[data-n]');
          if (!b) return;
          L.sfx.click();
          buf = b.dataset.n;
          paintBuf();
          L.say(buf);
        };
        $('numClear').onclick = () => { L.sfx.click(); buf = ''; paintBuf(); };
        $('numOk').onclick = () => {
          L.sfx.click();
          const v = parseInt(buf, 10);
          if (!v) { toast('請先揀一個數', ''); L.say('請先揀一個數'); return; }
          if (v === answer) {
            L.sfx.good();
            toast(q.sayCorrect, 'good');
            L.say(q.sayCorrect);
            setTimeout(() => { $('modal').classList.remove('show'); resolve(true); }, 900);
          } else {
            L.sfx.bad();
            toast(q.sayWrong, 'bad');
            L.say(q.sayWrong);
            buf = '';
            paintBuf();
          }
        };
        return;
      }

      // 初/中：MC
      const choices = L.buildChoices(answer, diff.choices);
      const correct = choices.indexOf(answer);
      $('modalCard').innerHTML = `
        <div class="kick">小測驗 · ${diff.label} · ${diff.choices} 選 1</div>
        <h2>${q.q}</h2>
        <div class="opts ${diff.choices === 2 ? 'opts2' : 'opts3'}">
          ${choices.map((n, i) => `
            <button type="button" class="opt" data-i="${i}">
              <span class="mark">${labels[i]}</span>
              <span>${n}</span>
            </button>`).join('')}
        </div>`;
      $('modal').classList.add('show');
      L.say(`有幾多個？${diff.choices} 個答案，揀一個。`);
      const btns = [...$('modalCard').querySelectorAll('.opt')];
      btns.forEach(b => b.onclick = () => {
        const i = +b.dataset.i;
        L.sfx.click();
        if (i === correct) {
          b.classList.add('right');
          L.sfx.good();
          toast(q.sayCorrect, 'good');
          L.say(q.sayCorrect);
          btns.forEach(x => x.disabled = true);
          setTimeout(() => { $('modal').classList.remove('show'); resolve(true); }, 900);
        } else {
          b.classList.add('wrong');
          L.sfx.bad();
          toast(q.sayWrong, 'bad');
          L.say(q.sayWrong);
          setTimeout(() => b.classList.remove('wrong'), 400);
        }
      });
    });
  }

  async function show(i, flip) {
    await L.Book.go(i, flip);
    const p = L.Book.current();
    paintPanel(p);
    L.say(p.speak || '');
  }

  async function next() {
    const p = L.Book.current();
    if (p.kind === 'quiz') {
      await openQuiz(p);
      if (L.Book.i < pages.length - 1) await show(L.Book.i + 1, true);
      return;
    }
    if (L.Book.i >= pages.length - 1) {
      await show(0, false);
      L.say(pages[0].speak);
      return;
    }
    await show(L.Book.i + 1, true);
  }

  async function back() {
    if (L.Book.i <= 0) return;
    await show(L.Book.i - 1, true);
  }

  async function boot(startIdx) {
    if (started) return;
    started = true;
    $('start').style.display = 'none';
    try { L.sfx.click(); } catch (e) {}
    L.start();
    await L.Book.open(pages, startIdx || 0);
    paintPanel(L.Book.current());
    const d = DIFF[L.difficulty];
    L.say((d ? d.speak + ' ' : '') + (L.Book.current().speak || ''));
  }

  // difficulty buttons on start
  document.querySelectorAll('.diffBtn').forEach(b => {
    b.onclick = () => setDiff(b.dataset.diff);
  });
  setDiff(L.difficulty);

  $('startBtn').onclick = () => boot(0);
  $('jumpBtn').onclick = () => boot(L.PAGE_INDEX.n11);
  $('btnNext').onclick = () => { L.sfx.click(); next(); };
  $('btnBack').onclick = () => { L.sfx.click(); back(); };
  $('btnReplay').onclick = async () => {
    L.sfx.click();
    await L.Book.replay();
    const p = L.Book.current();
    paintPanel(p);
    if (p.kind === 'number' || p.kind === 'quiz') L.say('再數一次。撳水果。');
    else L.say(p.speak || '');
  };
  $('btnSpeak').onclick = () => {
    L.sfx.click();
    const p = L.Book.current();
    const st = L.Book.getCountState && L.Book.getCountState();
    if ((p.kind === 'number' || p.kind === 'quiz') && st) {
      if (st.done) L.say(p.kind === 'quiz' ? `有 ${st.total} 個！可以答題。` : `有 ${st.total} 個！`);
      else L.say(`已經數咗 ${st.counted} 個。繼續撳。`);
    } else {
      L.say(p.speak || p.idea || p.title || '');
    }
  };
  $('btnHome').onclick = () => { L.hush(); location.reload(); };
  $('brand').onclick = e => { e.preventDefault(); L.hush(); location.reload(); };
  $('voiceBtn').onclick = () => {
    L.voiceOn = !L.voiceOn;
    $('voiceBtn').classList.toggle('on', L.voiceOn);
    $('voiceBtn').textContent = L.voiceOn ? '🔊' : '🔈';
    if (!L.voiceOn) L.hush();
    toast(L.voiceOn ? '聲音開' : '聲音關', '');
  };
  $('zoomInBtn').onclick = () => { L.sfx.click(); L.zoomIn(); toast('放大', ''); };
  $('zoomOutBtn').onclick = () => { L.sfx.click(); L.zoomOut(); toast('縮小', ''); };
  $('zoomResetBtn').onclick = () => { L.sfx.click(); L.zoomReset(); toast('還原大小', ''); };

  window.addEventListener('keydown', e => {
    if (!started) return;
    if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); back(); }
    if (e.key === '+' || e.key === '=') { e.preventDefault(); L.zoomIn(); }
    if (e.key === '-' || e.key === '_') { e.preventDefault(); L.zoomOut(); }
    if (e.key === '0' && !e.metaKey) { e.preventDefault(); L.zoomReset(); }
  });
})();
