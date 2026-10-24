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
  // kind: culprit は「その人が事件を起こした」、notCulprit は「その人は事件を起こしていない」。
  // 犯人だけがうそをつく。全候補を検証して、答えが一つか確認する。
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

  function appendKuroshiroFurigana(element, converted) {
    // mode:"furigana" の出力例：感(かん)じ取(と)れたら
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

  const $ = id => document.getElementById(id);
  const views = {home:$("homeView"), puzzle:$("puzzleView"), result:$("resultView")};
  let currentCase = null, selected = null, hintCount = 0, answered = false;
  let activeFilter = "all", correctCount = 0, completed = new Set(), currentSequence = cases.slice();

  function statementIsTrue(statement, culprit) {
    return statement.kind === "culprit" ? statement.target === culprit : statement.target !== culprit;
  }
  function solutions(item) {
    const result = [];
    item.statements.forEach((_, candidate) => {
      const valid = item.statements.every((statement, speakerIndex) => {
        const truth = statementIsTrue(statement, item.statements[candidate].speaker);
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
      card.className = "question-card";
      const top = document.createElement("div"); top.className = "card-top";
      const number = document.createElement("span"); number.className = "card-number"; number.textContent = "CASE " + String(item.id).padStart(2,"0");
      const level = document.createElement("span"); level.className = "level-pill level-" + item.level; level.textContent = "LEVEL " + item.level;
      top.append(number, level);
      const title = document.createElement("h3"); title.className = "card-title"; setReadingText(title, item.title);
      const meta = document.createElement("div"); meta.className = "card-meta";
      const detail = document.createElement("span"); detail.textContent = item.statements.length + "人の証言";
      const arrow = document.createElement("span"); arrow.className = "card-arrow"; arrow.textContent = completed.has(item.id) ? "✓" : "↗";
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
    $("puzzleLevel").textContent = "LEVEL " + item.level + " · " + (item.level === 1 ? "OBSERVATION" : item.level === 2 ? "CONNECTION" : "DEDUCTION");
    setReadingText($("puzzleTitle"), item.title);
    setReadingText($("puzzleIntro"), item.intro);
    $("caseNumber").textContent = String(item.id).padStart(2,"0");
    $("progressLabel").textContent = "CASE " + String(item.id).padStart(2,"0") + " / " + String(cases.length).padStart(2,"0");
    $("progressBar").style.width = (item.id / cases.length * 100) + "%";
    $("statementList").replaceChildren();
    $("answerOptions").replaceChildren();
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
        : targetName + "は" + currentCase.action.negative + "。";
      setReadingText(text, "「" + actionText + "」");
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
    const text = document.createElement("p"); setReadingText(text, hintCount === 1 ? currentCase.hint : "一人ずつ「この人が犯人」と仮定しよう。その人の発言だけがうそになり、ほかの人の発言は本当になるかな？");
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
    feedback.textContent = correct ? "正解！ 証言をつなげて真相を見抜いたね。" : "今回はちがったね。事件の手がかりを解説で確かめよう。";
    const explanation = $("explanationBox"); explanation.classList.remove("hidden");
    const heading = document.createElement("h3"); setReadingText(heading, "犯人：" + characterByPerson[answer[0]].name);
    const text = document.createElement("p"); setReadingText(text, currentCase.explanation);
    explanation.append(heading, text);
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
  $("restartButton").addEventListener("click", () => { correctCount = 0; completed = new Set(); renderGrid(); openCase(cases[0]); });
  document.querySelectorAll(".filter-chip").forEach(button => button.addEventListener("click", () => setFilter(button.dataset.filter)));
  assertPuzzleQuality();
  renderGrid();
})();