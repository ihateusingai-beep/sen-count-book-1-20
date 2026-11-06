// App flow: start → book pages → quiz modals
(function () {
  const L = window.L;
  const $ = id => document.getElementById(id);
  const pages = L.PAGES;
  let started = false;

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

  function paintPanel(p) {
    const pan = p.panel || { kick: '', title: p.title || '', idea: p.idea || '', text: '' };
    $('kick').textContent = pan.kick || '';
    $('title').textContent = pan.title || '';
    $('idea').textContent = pan.idea || '';
    $('text').innerHTML = pan.text || '';
    $('miniT').textContent = pan.title || '';
    $('miniI').textContent = pan.idea || '';
    const bn = $('bigNum'), chips = $('chips');
    if (p.kind === 'number') {
      bn.hidden = false; chips.hidden = false;
      bn.textContent = String(p.n);
      bn.style.borderColor = p.color || '#1d6fb8';
      bn.style.color = p.color || '#1d6fb8';
      chips.innerHTML = Array.from({ length: p.n }, (_, i) => {
        return `<i data-i="${i}" style="background:rgba(0,0,0,.12);outline:2px solid ${p.dot || p.color || '#1d6fb8'}"></i>`;
      }).join('');
      paintCountProgress({ counted: 0, total: p.n, done: false, next: 1 });
    } else {
      bn.hidden = true; chips.hidden = true; chips.innerHTML = '';
    }
    $('count').textContent = `${L.Book.i + 1}/${pages.length}`;
    $('btnBack').disabled = L.Book.i <= 0;
    $('btnNext').textContent = L.Book.i >= pages.length - 1 ? '再讀 ↻' : (p.kind === 'quiz' ? '答題 →' : '下一頁 →');
    $('btnNext').classList.toggle('go', p.kind === 'quiz');
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
        ? `✅ 有 <b>${ev.total}</b> 個！`
        : `已數 <b>${ev.counted}</b> / ${ev.total}`;
    }
    const mini = $('miniI');
    if (mini && L.Book.current() && L.Book.current().kind === 'number') {
      mini.textContent = ev.done ? `有 ${ev.total} 個！` : `已數 ${ev.counted}/${ev.total} · 撳水果`;
    }
    const bn = $('bigNum');
    if (bn && !bn.hidden) {
      bn.textContent = ev.done ? String(ev.total) : (ev.counted > 0 ? String(ev.counted) : String(ev.total));
      bn.style.transform = ev.done ? 'scale(1.08)' : 'scale(1)';
      bn.style.transition = 'transform .2s';
    }
  }

  L.Book.onCountProgress = paintCountProgress;
  L.Book.onCountComplete = function (n) {
    paintCountProgress({ counted: n, total: n, done: true, next: n + 1 });
  };

  function openQuiz(p) {
    return new Promise(resolve => {
      const q = p.quiz;
      const labels = ['A', 'B', 'C', 'D'];
      $('modalCard').innerHTML = `
        <div class="kick">小測驗 · N 選 1</div>
        <h2>${q.q}</h2>
        <div class="opts">
          ${q.options.map((n, i) => `
            <button type="button" class="opt" data-i="${i}">
              <span class="mark">${labels[i]}</span>
              <span>${n}</span>
            </button>`).join('')}
        </div>`;
      $('modal').classList.add('show');
      L.say(p.speak || q.q);
      const btns = [...$('modalCard').querySelectorAll('.opt')];
      btns.forEach(b => b.onclick = () => {
        const i = +b.dataset.i;
        L.sfx.click();
        if (i === q.correct) {
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
    if (p.kind !== 'quiz') L.say(p.speak || '');
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
    L.say(L.Book.current().speak || '');
  }

  $('startBtn').onclick = () => boot(0);
  $('jumpBtn').onclick = () => boot(L.PAGE_INDEX.n11);
  $('btnNext').onclick = () => { L.sfx.click(); next(); };
  $('btnBack').onclick = () => { L.sfx.click(); back(); };
  $('btnReplay').onclick = async () => {
    L.sfx.click();
    await L.Book.replay();
    const p = L.Book.current();
    paintPanel(p);
    if (p.kind === 'number') L.say('再數一次。撳水果。');
    else if (p.kind !== 'quiz') L.say(p.speak || '');
  };
  $('btnSpeak').onclick = () => {
    L.sfx.click();
    const p = L.Book.current();
    const st = L.Book.getCountState && L.Book.getCountState();
    if (p.kind === 'number' && st) {
      if (st.done) L.say(`有 ${st.total} 個！`);
      else L.say(`已經數咗 ${st.counted} 個。繼續撳。`);
    } else {
      L.say(p.speak || p.idea || p.title || '');
    }
  };
  $('btnHome').onclick = () => {
    L.hush();
    location.reload();
  };
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

  // keyboard assist for teachers
  window.addEventListener('keydown', e => {
    if (!started) return;
    if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); back(); }
    if (e.key === '+' || e.key === '=') { e.preventDefault(); L.zoomIn(); }
    if (e.key === '-' || e.key === '_') { e.preventDefault(); L.zoomOut(); }
    if (e.key === '0') { e.preventDefault(); L.zoomReset(); }
  });
})();
