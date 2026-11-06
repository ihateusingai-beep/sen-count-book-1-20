// Content: cover + numbers 1–20 + quizzes every 5 + end
(function () {
  const L = window.L;
  const CANT = {
    1: '一', 2: '二', 3: '三', 4: '四', 5: '五',
    6: '六', 7: '七', 8: '八', 9: '九', 10: '十',
    11: '十一', 12: '十二', 13: '十三', 14: '十四', 15: '十五',
    16: '十六', 17: '十七', 18: '十八', 19: '十九', 20: '二十'
  };
  const DOT = [
    '#ff6b6b', '#ffb703', '#3ddc97', '#4dabf7', '#b197fc',
    '#ff8e53', '#20c997', '#f06595', '#748ffc', '#69db7c',
    '#ffd43b', '#ff8787', '#63e6be', '#91a7ff', '#e599f7',
    '#ffa94d', '#66d9e8', '#ff6b9d', '#8ce99a', '#74c0fc'
  ];

  function numPage(n) {
    return {
      kind: 'number',
      n,
      no: n,
      running: '數數小書 · 1–20',
      color: DOT[n - 1],
      dot: DOT[n - 1],
      title: `${n}　${CANT[n]}`,
      idea: `撳水果，一齊數到 ${n}`,
      caption: `圖 · ${n} 個水果 · 撳一撳`,
      speak: `有一啲水果。用手指撳，一齊數。`,
      countSpeak: false,
      showLabels: false,
      panel: {
        kick: `第 ${n} 頁 · 數字`,
        title: `${n}　${CANT[n]}`,
        idea: `撳水果數數`,
        text: `<p>撳一粒，讀 <b>1</b>、<b>2</b>…</p><p>數齊會話：有 <b>${n}</b> 個。</p><p id="countProg">已數 <b>0</b> / ${n}</p>`
      }
    };
  }

  function quizPage(afterN, answer) {
    // wrong options nearby unique
    const opts = new Set([answer]);
    const pool = [];
    for (let d = 1; d <= 4 && opts.size < 4; d++) {
      if (answer - d >= 1) opts.add(answer - d);
      if (opts.size >= 4) break;
      if (answer + d <= 20) opts.add(answer + d);
    }
    while (opts.size < 4) opts.add(Math.min(20, answer + opts.size + 1));
    const options = [...opts].sort((a, b) => a - b);
    // shuffle lightly but keep stable-ish: rotate
    const rot = answer % 3;
    const shuffled = options.slice(rot).concat(options.slice(0, rot));
    const correct = shuffled.indexOf(answer);
    return {
      kind: 'quiz',
      n: answer,
      quizN: answer,
      no: afterN + 0.5,
      running: '數數小書 · 小測驗',
      color: '#1d6fb8',
      title: '有幾多個？',
      idea: '睇書上面，揀正確個數。',
      speak: `小測驗。睇吓有幾多個？揀 A B C 或者 D。`,
      countSpeak: false,
      showLabels: false,
      quiz: {
        q: '有幾多個？',
        options: shuffled,
        correct,
        sayCorrect: `啱！有 ${answer} 個。`,
        sayWrong: '未啱，再試。'
      },
      panel: {
        kick: '小測驗',
        title: '有幾多個？',
        idea: '睇圖，揀答案',
        text: '<p>撳 <b>A B C D</b> 其中一個。</p>'
      }
    };
  }

  const pages = [];
  pages.push({
    kind: 'cover',
    no: 0,
    running: '數數小書',
    color: '#1d6fb8',
    title: '數數小書 1 至 20',
    idea: '一頁一個數',
    speak: '歡迎打開數數小書。我哋一齊學數 1 到 20。',
    panel: {
      kick: '封面',
      title: '數數小書',
      idea: '1 至 20',
      text: '<p>一頁一個數。</p><p>看圖、聽、用手指數。</p>'
    }
  });

  for (let n = 1; n <= 20; n++) {
    pages.push(numPage(n));
    if (n % 5 === 0) pages.push(quizPage(n, n));
  }

  pages.push({
    kind: 'end',
    no: 21,
    running: '數數小書',
    color: '#2ec4b6',
    title: '完成！',
    idea: '你識數 1 至 20',
    speak: '完成！你識數一到二十。好叻！',
    panel: {
      kick: '完',
      title: '完成！',
      idea: '你識數 1 至 20',
      text: '<p>好叻！可以再讀一次。</p>'
    }
  });

  L.PAGES = pages;
  L.CANT = CANT;

  // index of first page for number 11 (jump)
  L.PAGE_INDEX = {
    cover: 0,
    n1: pages.findIndex(p => p.kind === 'number' && p.n === 1),
    n11: pages.findIndex(p => p.kind === 'number' && p.n === 11),
    end: pages.length - 1
  };
})();
