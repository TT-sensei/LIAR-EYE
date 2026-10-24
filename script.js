(() => {
  "use strict";
  const people = ["A", "B", "C", "D", "E", "F"];
  // claim: "truth" means the target is honest; "liar" means the target is lying.
  // Every case is checked at runtime: exactly one assignment must satisfy the rules.
  const cases = [
    {id:1,level:1,title:"じぶんを信じて",intro:"3人の発言を読み比べよう。正直者は本当のことを言い、うそつきだけがうそを言うよ。",hint:"Aさんがうそつきだとしたら、「Aは正直者」という発言はどうなる？",explanation:"Aさんがうそつきなら、Aさんの「Aは正直者」はうそ。BさんとCさんの発言はどちらも本当になり、条件に合うよ。Aさん以外をうそつきにすると、発言が食いちがうんだ。",statements:[{speaker:"A",claim:"truth",target:"A"},{speaker:"B",claim:"truth",target:"C"},{speaker:"C",claim:"truth",target:"B"}]},
    {id:2,level:1,title:"だれを信じる？",intro:"3人は、おたがいについて話している。だれの発言がうそなのか考えよう。",hint:"Bさんがうそつきだと仮定して、AさんとCさんの発言を確かめよう。",explanation:"Bさんがうそつきなら、Bさんの「Aはうそつき」はうそ。Aさんの「Cは正直者」とCさんの「Aは正直者」は本当になるよ。うそを言っているのはBさんだけ。",statements:[{speaker:"A",claim:"truth",target:"C"},{speaker:"B",claim:"liar",target:"A"},{speaker:"C",claim:"truth",target:"A"}]},
    {id:3,level:1,title:"自分のことば",intro:"自分自身について話している人もいるよ。発言の内容と、その人が正直者かどうかをつなげて考えよう。",hint:"Bさんの「Bは正直者」という発言に注目。Bさんがうそつきなら、その発言は本当？",explanation:"Bさんがうそつきなら「Bは正直者」はうそになる。AさんとCさんの発言は本当なので、うそつきはBさん一人だけだよ。",statements:[{speaker:"A",claim:"truth",target:"C"},{speaker:"B",claim:"truth",target:"B"},{speaker:"C",claim:"truth",target:"C"}]},
    {id:4,level:2,title:"4人の証言",intro:"4人の発言を一つずつ確認しよう。ひとりだけうそを言っている人がいるよ。",hint:"Aさんがうそつきだと仮定すると、B・C・Dさんの発言はすべて本当になるかな？",explanation:"Aさんがうそつきなら「Cはうそつき」はうそ。BさんとCさんの「Dは正直者」、Dさんの「Bは正直者」は本当になる。Aさんだけがうそつきで、すべての条件に合うよ。",statements:[{speaker:"A",claim:"liar",target:"C"},{speaker:"B",claim:"truth",target:"D"},{speaker:"C",claim:"truth",target:"D"},{speaker:"D",claim:"truth",target:"B"}]},
    {id:5,level:2,title:"証言をつなげよう",intro:"発言の内容が、ほかの人の発言とどうつながっているかを考えよう。",hint:"Cさんの「Bはうそつき」が本当だとしたら、Bさんの発言はどうなる？",explanation:"Cさんの「Bはうそつき」は本当ではない。Cさんがうそつきだと考えると、Aさん・Bさん・Dさんの発言はすべて本当になり、条件にぴったり合うよ。",statements:[{speaker:"A",claim:"truth",target:"B"},{speaker:"B",claim:"truth",target:"A"},{speaker:"C",claim:"liar",target:"B"},{speaker:"D",claim:"truth",target:"B"}]},
    {id:6,level:2,title:"食いちがう発言",intro:"AさんとBさんは、おたがいについて話している。二人の発言をセットで考えよう。",hint:"Aさんがうそつきなら、Aさんの発言とBさんの発言はそれぞれ本当？",explanation:"Aさんがうそつきなら「Bはうそつき」はうそ、Bさんの「Aはうそつき」は本当になる。CさんとDさんの発言も本当になり、Aさんだけがうそつきだよ。",statements:[{speaker:"A",claim:"liar",target:"B"},{speaker:"B",claim:"liar",target:"A"},{speaker:"C",claim:"liar",target:"A"},{speaker:"D",claim:"truth",target:"B"}]},
    {id:7,level:3,title:"5人の証言",intro:"5人の証言が登場。だれか一人をうそつきだと仮定して、ほかの発言も成り立つか調べよう。",hint:"Bさんがうそつきだと仮定して、A・C・D・Eさんの発言を確かめよう。",explanation:"Bさんがうそつきなら、Aさんの「Eは正直者」は本当、Bさんの「Eはうそつき」はうそ、Cさんの「Dは正直者」は本当、Dさんの「Bはうそつき」は本当、Eさんの「Cは正直者」も本当。条件に合うのはBさんだけだよ。",statements:[{speaker:"A",claim:"truth",target:"E"},{speaker:"B",claim:"liar",target:"E"},{speaker:"C",claim:"truth",target:"D"},{speaker:"D",claim:"liar",target:"B"},{speaker:"E",claim:"truth",target:"C"}]},
    {id:8,level:3,title:"つながる推理",intro:"5人の発言は、ほかの人の正直さについて話しているよ。思い込みで決めず、ひとりずつ確かめよう。",hint:"Cさんがうそつきだと仮定して、ほかの4人の発言が本当になるか確かめよう。",explanation:"Cさんがうそつきなら、Cさんの「Bはうそつき」はうそなので、Bさんは正直者。Aさんの「Bは正直者」、Bさんの「Aは正直者」、Dさんの「Bは正直者」、Eさんの「Dは正直者」はすべて本当になるよ。",statements:[{speaker:"A",claim:"truth",target:"B"},{speaker:"B",claim:"truth",target:"A"},{speaker:"C",claim:"liar",target:"B"},{speaker:"D",claim:"truth",target:"B"},{speaker:"E",claim:"truth",target:"D"}]},
    {id:9,level:3,title:"6人の中の一人",intro:"6人の証言に挑戦。候補を一人ずつ仮定して、矛盾が起きないか見つけよう。",hint:"Bさんがうそつきだとすると、Bさんの発言はうそになり、Dさんは正直者になるね。",explanation:"Bさんがうそつきなら、Bさんの「Dはうそつき」はうそなのでDさんは正直者。Dさんの「Aは正直者」は本当で、Aさんの発言も本当になる。CさんとFさんの「Bはうそつき」、Eさんの「Aは正直者」も本当。うそつきはBさんだけだよ。",statements:[{speaker:"A",claim:"truth",target:"A"},{speaker:"B",claim:"liar",target:"D"},{speaker:"C",claim:"liar",target:"B"},{speaker:"D",claim:"truth",target:"A"},{speaker:"E",claim:"truth",target:"A"},{speaker:"F",claim:"liar",target:"B"}]},
    {id:10,level:3,title:"最後の見きわめ",intro:"最後は6人。自分自身についての発言にも注目して、すべての証言が成り立つか確かめよう。",hint:"Dさんがうそつきだとすると、Dさんの「Dは正直者」はどうなる？",explanation:"Dさんがうそつきなら、Dさんの「Dは正直者」はうそ。ほかの5人の発言は、Dさん以外について正直者だと言っているので、すべて本当になるよ。だから、うそつきはDさん一人だけ。",statements:[{speaker:"A",claim:"truth",target:"C"},{speaker:"B",claim:"truth",target:"E"},{speaker:"C",claim:"truth",target:"E"},{speaker:"D",claim:"truth",target:"D"},{speaker:"E",claim:"truth",target:"F"},{speaker:"F",claim:"truth",target:"F"}]}
  ];

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

  function statementIsTrue(statement, liar) {
    return statement.claim === "liar" ? statement.target === liar : statement.target !== liar;
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
      const mark = document.createElement("span"); mark.className = "person-mark"; mark.textContent = statement.speaker;
      const copy = document.createElement("div");
      const name = document.createElement("p"); name.className = "statement-name"; name.textContent = statement.speaker + "さんの発言";
      const text = document.createElement("p"); text.className = "statement-text";
      setReadingText(text, "「" + statement.target + "さんは" + (statement.claim === "liar" ? "うそつき" : "正直者") + "だ。」");
      copy.append(name, text); card.append(mark, copy); $("statementList").append(card);
      const option = document.createElement("button"); option.type = "button"; option.className = "answer-option"; option.dataset.person = statement.speaker;
      const letter = document.createElement("span"); letter.className = "option-letter"; letter.textContent = statement.speaker;
      const label = document.createElement("span"); label.textContent = statement.speaker + "さん";
      option.append(letter, label); option.addEventListener("click", () => selectAnswer(statement.speaker));
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
    const text = document.createElement("p"); setReadingText(text, hintCount === 1 ? currentCase.hint : "一人ずつ「この人がうそつき」と仮定しよう。その人の発言だけがうそになり、ほかの全員の発言が本当になるかな？");
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
    feedback.textContent = correct ? "正解！ 矛盾を見抜いたね。" : "今回はちがったね。考え方を解説で確かめよう。";
    const explanation = $("explanationBox"); explanation.classList.remove("hidden");
    const heading = document.createElement("h3"); setReadingText(heading, "答え：" + answer[0] + "さん");
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
    setReadingText($("resultMessage"), completed.size === cases.length ? "全10問に挑戦！ 発言を比べて考えたことが力になるよ。" : completed.size + "問に挑戦したね。続きの問題も解いてみよう。");
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