(() => {
  "use strict";
  const people = ["A", "B", "C", "D", "E", "F"];
  // LIAR EYE の A〜F は、ナビキャラ6人に固定対応させる。
  const characterByPerson = {
    A: { id: "riku", name: "りく" },
    B: { id: "sora", name: "そら" },
    C: { id: "kai", name: "かい" },
    D: { id: "saku", name: "さく" },
    E: { id: "tsuki", name: "つき" },
    F: { id: "nami", name: "なみ" }
  };
  const characterImage = (person) =>
    "https://tt-sensei.github.io/navi-character-/assets/web/characters/" +
    characterByPerson[person].id + "/fullbody/hint.webp";
  const personLabel = (person) =>
    characterByPerson[person].name + "（" + person + "）";
  // kind: culprit / notCulprit は「その人が答えの行動をした／していない」。
  // 今回の答えになる人だけがうそをつく。全候補を検証して、答えが一つか確認する。
  // 問題データは cases.js で管理し、ゲーム本体から分離する。
  const cases = window.LIAR_EYE_CASES || [];


  // Kuroshiro + Kuromoji で、文章の文脈を見ながらふりがなを付ける。
  // 辞書の読み込みが終わるまでは本文を表示し、準備ができたらルビに置き換える。
  const rubyJobs = new WeakMap();
  let kuroshiroInstance = null;
  const kuroshiroReady = (async () => {
    if (!window.Kuroshiro || !window.KuromojiAnalyzer) {
      throw new Error("Kuroshiro または KuromojiAnalyzer を読み込めませんでした。");
    }
    const instance = new window.Kuroshiro();
    await instance.init(new window.KuromojiAnalyzer({
      dictPath: "https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/dict/"
    }));
    kuroshiroInstance = instance;
    return instance;
  })();

  // 読みが揺れやすい語は、ふりがなだけを辞書で補正する。
  const readingOverrides = new Map([
    ["発言", "はつげん"], ["証言", "しょうげん"], ["矛盾", "むじゅん"],
    ["論理的", "ろんりてき"], ["特定", "とくてい"], ["説明", "せつめい"],
    ["真相", "しんそう"], ["教室", "きょうしつ"], ["時間割", "じかんわり"],
    ["植木", "うえき"], ["配膳台", "はいぜんだい"]
  ]);
  function applyReadingOverrides(converted) {
    let result = converted;
    for (const [word, reading] of readingOverrides) {
      const escaped = word;
      result = result.replace(new RegExp(escaped + "\\\\([^()]*\\\\)", "g"), word + "(" + reading + ")");
    }
    return result;
  }

  function appendKuroshiroFurigana(element, converted) {
    // mode:"furigana" の出力例：感(かん)じ取(と)れたら
    converted = applyReadingOverrides(converted);
    const pattern = /([一-龯々]+)\(([^()]+)\)/g;
    let cursor = 0, match;
    element.replaceChildren();
    while ((match = pattern.exec(converted)) !== null) {
      if (match.index > cursor) element.append(document.createTextNode(converted.slice(cursor, match.index)));
      const ruby = document.createElement("ruby");
      ruby.append(document.createTextNode(match[1]));
      const rt = document.createElement("rt");
      rt.textContent = match[2];
      ruby.append(rt);
      element.append(ruby);
      cursor = match.index + match[0].length;
    }
    if (cursor < converted.length) element.append(document.createTextNode(converted.slice(cursor)));
  }

  function setReadingText(element, value) {
    const text = String(value ?? "");
    const job = (rubyJobs.get(element) || 0) + 1;
    rubyJobs.set(element, job);
    element.textContent = text;

    kuroshiroReady.then(async (instance) => {
      if (rubyJobs.get(element) !== job || !element.isConnected) return;
      const converted = await instance.convert(text, { mode: "furigana", to: "hiragana" });
      if (rubyJobs.get(element) !== job || !element.isConnected) return;
      appendKuroshiroFurigana(element, converted);
    }).catch((error) => {
      // CDN や辞書に接続できない場合も、問題自体は読める状態にしておく。
      console.warn("ふりがなの自動変換を利用できませんでした。", error);
    });
  }

  // 固定表示の見出し・ボタンにもふりがなを付ける。既存の ruby と動的表示は二重変換しない。
  function appendRubyFragment(converted) {
    const fragment = document.createDocumentFragment();
    const pattern = /([一-龯々]+)\(([^()]+)\)/g;
    let cursor = 0, match;
    while ((match = pattern.exec(converted)) !== null) {
      if (match.index > cursor) fragment.append(document.createTextNode(converted.slice(cursor, match.index)));
      const ruby = document.createElement("ruby");
      ruby.append(document.createTextNode(match[1]));
      const rt = document.createElement("rt");
      rt.textContent = match[2];
      ruby.append(rt);
      fragment.append(ruby);
      cursor = match.index + match[0].length;
    }
    if (cursor < converted.length) fragment.append(document.createTextNode(converted.slice(cursor)));
    return fragment;
  }

  async function addRubyToStaticText(instance) {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const parent = node.parentElement;
      if (!parent || parent.closest("ruby, rt, script, style, noscript") ||
          !/[一-龯々]/.test(node.nodeValue) || !node.nodeValue.trim()) continue;
      nodes.push(node);
    }
    // 一度に少数ずつ処理し、画面表示を止めない。
    for (let i = 0; i < nodes.length; i += 12) {
      await Promise.all(nodes.slice(i, i + 12).map(async node => {
        if (!node.isConnected || node.parentElement?.closest("ruby, rt, script, style, noscript")) return;
        const original = node.nodeValue;
        try {
          const converted = applyReadingOverrides(await instance.convert(original, { mode: "furigana", to: "hiragana" }));
          if (node.isConnected && node.nodeValue === original) node.replaceWith(appendRubyFragment(converted));
        } catch (error) {
          // 読み変換に失敗した箇所は元の文章をそのまま残す。
        }
      }));
    }
  }

  const $ = id => document.getElementById(id);
  const views = {home:$("homeView"), puzzle:$("puzzleView"), result:$("resultView")};
  let currentCase = null, selected = null, hintCount = 0, answered = false;
  let activeFilter = "all", correctCount = 0, completed = new Set(), cleared = new Set(), currentSequence = cases.slice();

  // タブレットの指・タッチペンで使える手書きメモ
  const scratchCanvas = $("scratchpadCanvas");
  const scratchContext = scratchCanvas.getContext("2d");
  let scratchDrawing = false;
  function sizeScratchpad() {
    const rect = scratchCanvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    const previous = document.createElement("canvas");
    previous.width = scratchCanvas.width;
    previous.height = scratchCanvas.height;
    if (previous.width && previous.height) previous.getContext("2d").drawImage(scratchCanvas, 0, 0);
    scratchCanvas.width = Math.max(1, Math.round(rect.width * ratio));
    scratchCanvas.height = Math.max(1, Math.round(rect.height * ratio));
    scratchContext.setTransform(ratio, 0, 0, ratio, 0, 0);
    scratchContext.lineWidth = 2.5;
    scratchContext.lineCap = "round";
    scratchContext.lineJoin = "round";
    scratchContext.strokeStyle = "#24334b";
    if (previous.width && previous.height) {
      scratchContext.drawImage(previous, 0, 0, previous.width, previous.height, 0, 0, rect.width, rect.height);
    }
  }
  function clearScratchpad() {
    const rect = scratchCanvas.getBoundingClientRect();
    scratchContext.clearRect(0, 0, rect.width, rect.height);
  }
  function scratchPoint(event) {
    const rect = scratchCanvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }
  scratchCanvas.addEventListener("pointerdown", event => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    scratchDrawing = true;
    scratchCanvas.setPointerCapture(event.pointerId);
    const point = scratchPoint(event);
    scratchContext.beginPath();
    scratchContext.moveTo(point.x, point.y);
    scratchContext.lineTo(point.x + 0.1, point.y + 0.1);
    scratchContext.stroke();
    event.preventDefault();
  });
  scratchCanvas.addEventListener("pointermove", event => {
    if (!scratchDrawing) return;
    const point = scratchPoint(event);
    scratchContext.lineTo(point.x, point.y);
    scratchContext.stroke();
    event.preventDefault();
  });
  function stopScratchDrawing() { scratchDrawing = false; scratchContext.closePath(); }
  scratchCanvas.addEventListener("pointerup", stopScratchDrawing);
  scratchCanvas.addEventListener("pointercancel", stopScratchDrawing);
  scratchCanvas.addEventListener("lostpointercapture", stopScratchDrawing);
  $("clearScratchpad").addEventListener("click", clearScratchpad);
  window.addEventListener("resize", sizeScratchpad);
  sizeScratchpad();

  function statementIsTrue(statement, culprit, item) {
    if (statement.kind === "culprit") return statement.target === culprit;
    if (statement.kind === "notCulprit") return statement.target !== culprit;
    if (statement.kind === "outside") return item.whereabouts[statement.target] === "outside";
    if (statement.kind === "inside") return item.whereabouts[statement.target] === "inside";
    return false;
  }
  function solutions(item) {
    const result = [];
    item.statements.forEach((_, candidate) => {
      const valid = item.statements.every((statement, speakerIndex) => {
        const truth = statementIsTrue(statement, item.statements[candidate].speaker, item);
        return speakerIndex === candidate ? !truth : truth;
      });
      if (valid) result.push(item.statements[candidate].speaker);
    });
    return result;
  }
  function assertPuzzleQuality() {
    cases.forEach(item => {
      const answer = solutions(item);
      if (answer.length !== 1) console.error("LIAR EYE: case must have exactly one solution", item.id, answer);
    });
  }
  function showView(name) {
    Object.entries(views).forEach(([key, element]) => element.classList.toggle("hidden", key !== name));
    window.scrollTo({top:0, behavior:"smooth"});
  }
  function renderGrid() {
    const grid = $("questionGrid");
    grid.replaceChildren();
    const filtered = cases.filter(item => activeFilter === "all" || String(item.level) === activeFilter);
    filtered.forEach((item, index) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "question-card" + (cleared.has(item.id) ? " is-cleared" : completed.has(item.id) ? " is-attempted" : "");
      const top = document.createElement("div"); top.className = "card-top";
      const number = document.createElement("span"); number.className = "card-number"; number.textContent = "CASE " + String(item.id).padStart(2,"0");
      const level = document.createElement("span"); level.className = "level-pill level-" + item.level; level.textContent = "LEVEL " + item.level;
      top.append(number, level);
      const title = document.createElement("h3"); title.className = "card-title"; setReadingText(title, item.title);
      const meta = document.createElement("div"); meta.className = "card-meta";
      const detail = document.createElement("span"); setReadingText(detail, item.statements.length + "人の証言");
      const arrow = document.createElement("span"); arrow.className = "card-status";
      if (cleared.has(item.id)) { arrow.textContent = "✓ クリア"; arrow.setAttribute("aria-label", "クリア済み"); }
      else if (completed.has(item.id)) { setReadingText(arrow, "再挑戦"); arrow.setAttribute("aria-label", "挑戦済み"); }
      else { setReadingText(arrow, "挑戦する ↗"); }
      meta.append(detail, arrow);
      card.append(top, title, meta);
      card.addEventListener("click", () => openCase(item));
      grid.append(card);
    });
  }
  function setFilter(value) {
    activeFilter = value;
    document.querySelectorAll(".filter-chip").forEach(button => button.classList.toggle("active", button.dataset.filter === value));
    renderGrid();
  }
  function openCase(item) {
    currentCase = item; selected = null; hintCount = 0; answered = false;
    clearScratchpad();
    $("puzzleLevel").textContent = "LEVEL " + item.level + " · " + (item.level === 1 ? "OBSERVATION" : item.level === 2 ? "CONNECTION" : "DEDUCTION");
    setReadingText($("puzzleTitle"), item.title);
    setReadingText($("puzzleIntro"), item.intro);
    $("caseNumber").textContent = String(item.id).padStart(2,"0");
    $("progressLabel").textContent = "CASE " + String(item.id).padStart(2,"0") + " / " + String(cases.length).padStart(2,"0");
    $("progressBar").style.width = (item.id / cases.length * 100) + "%";
    $("statementList").replaceChildren();
    $("answerOptions").replaceChildren();
    const linesBySpeaker = new Map((item.lines || []).map(line => [line.speaker, line.text]));
    item.statements.forEach(statement => {
      const card = document.createElement("article"); card.className = "statement-card";
      const person = characterByPerson[statement.speaker];
      const portrait = document.createElement("img");
      portrait.className = "character-portrait";
      portrait.src = characterImage(statement.speaker);
      portrait.alt = person.name;
      portrait.loading = "lazy";
      portrait.decoding = "async";
      portrait.width = 64;
      portrait.height = 76;
      const copy = document.createElement("div"); copy.className = "statement-copy";
      const name = document.createElement("p"); name.className = "statement-name";
      setReadingText(name, person.name + "（" + statement.speaker + "）の発言");
      const text = document.createElement("p"); text.className = "statement-text";
      const targetName = characterByPerson[statement.target].name;
      const actionText = statement.kind === "culprit"
        ? targetName + "が" + currentCase.action.positive + "。"
        : statement.kind === "notCulprit"
          ? targetName + "は" + currentCase.action.negative + "。"
          : statement.kind === "outside"
            ? targetName + "はこのとき教室の外にいたよ。"
            : targetName + "はこのとき教室にいたよ。";
      const displayedLine = linesBySpeaker.get(statement.speaker) || actionText;
      setReadingText(text, "「" + displayedLine + "」");
      copy.append(name, text); card.append(portrait, copy); $("statementList").append(card);
      const option = document.createElement("button"); option.type = "button"; option.className = "answer-option"; option.dataset.person = statement.speaker;
      const avatar = document.createElement("img"); avatar.className = "option-avatar";
      avatar.src = characterImage(statement.speaker); avatar.alt = ""; avatar.loading = "lazy"; avatar.decoding = "async";
      const label = document.createElement("span"); setReadingText(label, personLabel(statement.speaker));
      option.append(avatar, label); option.addEventListener("click", () => selectAnswer(statement.speaker));
      $("answerOptions").append(option);
    });
    ["feedback","hintBox","explanationBox","nextActions"].forEach(id => { $(id).classList.add("hidden"); $(id).replaceChildren(); });
    $("checkButton").disabled = true;
    $("hintButton").disabled = false;
    showView("puzzle");
    sizeScratchpad();
    clearScratchpad();
  }
  function selectAnswer(person) {
    if (answered) return;
    selected = person;
    document.querySelectorAll(".answer-option").forEach(button => button.classList.toggle("selected", button.dataset.person === person));
    $("checkButton").disabled = false;
  }
  function showHint() {
    if (answered || hintCount >= 2) return;
    hintCount++;
    const box = $("hintBox"); box.classList.remove("hidden"); box.replaceChildren();
    const title = document.createElement("strong"); title.textContent = "ヒント " + hintCount;
    const text = document.createElement("p"); setReadingText(text, hintCount === 1 ? currentCase.hint : "一人ずつ「この人が答え」と仮定しよう。その人の発言だけがうそになり、ほかの人の発言は本当になるかな？");
    box.append(title, text);
    if (hintCount >= 2) $("hintButton").disabled = true;
  }
  function checkAnswer() {
    if (answered || !selected) return;
    const answer = solutions(currentCase);
    if (answer.length !== 1) {
      const feedback = $("feedback"); feedback.className = "feedback incorrect"; feedback.textContent = "この問題の条件を確認する必要があります。"; return;
    }
    answered = true;
    const correct = selected === answer[0];
    if (correct) correctCount++;
    completed.add(currentCase.id);
    const feedback = $("feedback"); feedback.className = "feedback " + (correct ? "correct" : "incorrect"); feedback.classList.remove("hidden");
    setReadingText(feedback, correct ? "正解！ 証言をつなげて真相を見抜いたね。" : "今回はちがったね。証言を解説で確かめよう。");
    const explanation = $("explanationBox"); explanation.classList.remove("hidden");
    const heading = document.createElement("h3"); setReadingText(heading, "答え：" + characterByPerson[answer[0]].name);
    const text = document.createElement("p"); setReadingText(text, currentCase.explanation);
    const motiveHeading = document.createElement("h3"); setReadingText(motiveHeading, "なぜうそをついたの？");
    const motive = document.createElement("p"); setReadingText(motive, characterByPerson[answer[0]].name + "は、" + (currentCase.motive || "ある理由から真相を隠そうとしていたんだ。"));
    explanation.append(heading, text, motiveHeading, motive);
    document.querySelectorAll(".answer-option").forEach(button => {
      button.disabled = true;
      if (button.dataset.person === answer[0]) button.classList.add("is-correct");
      else if (button.dataset.person === selected) button.classList.add("is-wrong");
    });
    $("checkButton").disabled = true; $("hintButton").disabled = true;
    $("nextActions").classList.remove("hidden");
    const next = cases.find(item => !completed.has(item.id));
    $("nextButton").textContent = next ? "次の問題へ →" : "結果を見る →";
    $("retryButton").textContent = "もう一度考える";
    renderGrid();
  }
  function goNext() {
    const next = cases.find(item => !completed.has(item.id));
    if (next) openCase(next);
    else showResults();
  }
  function showResults() {
    $("resultScore").textContent = correctCount + " / " + completed.size;
    const percent = completed.size ? Math.round(correctCount / completed.size * 100) : 0;
    $("resultBar").style.width = percent + "%";
    setReadingText($("resultMessage"), completed.size === cases.length ? "全" + cases.length + "問に挑戦！ 発言を比べて考えたことが力になるよ。" : completed.size + "問に挑戦したね。残りの問題も解いてみよう。");
    showView("result");
  }
  $("startButton").addEventListener("click", () => { const next = cases.find(item => !completed.has(item.id)); openCase(next || cases[0]); });
  $("homeButton").addEventListener("click", () => showView("home"));
  $("backButton").addEventListener("click", () => { renderGrid(); showView("home"); });
  $("hintButton").addEventListener("click", showHint);
  $("checkButton").addEventListener("click", checkAnswer);
  $("retryButton").addEventListener("click", () => openCase(currentCase));
  $("nextButton").addEventListener("click", goNext);
  $("reviewButton").addEventListener("click", () => { renderGrid(); showView("home"); });
  $("restartButton").addEventListener("click", () => { correctCount = 0; completed = new Set(); cleared = new Set(); renderGrid(); openCase(cases[0]); });
  document.querySelectorAll(".filter-chip").forEach(button => button.addEventListener("click", () => setFilter(button.dataset.filter)));
  assertPuzzleQuality();
  renderGrid();
  kuroshiroReady.then(addRubyToStaticText).catch(() => {
    // 辞書を読み込めない環境でもゲームの操作・文章表示はそのまま使える。
  });
})();