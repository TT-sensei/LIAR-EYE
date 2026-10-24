// LIAR EYE 問題データ検証スクリプト
// 実行方法: node liar-eye-check.js
const fs = require("fs");
const vm = require("vm");
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(require("path").join(__dirname, "cases.js"), "utf8"), context);
const cases = context.window.LIAR_EYE_CASES || [];
const errors = [];
const answerCounts = Object.fromEntries(["A","B","C","D","E","F"].map(x => [x, 0]));
function statementIsTrue(statement, culprit, item) {
  if (statement.kind === "culprit") return statement.target === culprit;
  if (statement.kind === "notCulprit") return statement.target !== culprit;
  if (statement.kind === "outside") return item.whereabouts?.[statement.target] === "outside";
  if (statement.kind === "inside") return item.whereabouts?.[statement.target] === "inside";
  return false;
}
function solutions(item) {
  return item.statements.filter(candidate => item.statements.every(statement => {
    const truth = statementIsTrue(statement, candidate.speaker, item);
    return statement.speaker === candidate.speaker ? !truth : truth;
  })).map(candidate => candidate.speaker);
}
for (const item of cases) {
  const answers = solutions(item);
  if (answers.length !== 1) errors.push(`CASE ${item.id}: 答えが一人に決まらない (${answers.join(", ") || "解なし"})`);
  else answerCounts[answers[0]]++;
  const speakers = item.statements.map(s => s.speaker);
  const lineSpeakers = (item.lines || []).map(line => line.speaker);
  if (speakers.length !== lineSpeakers.length || speakers.some(s => !lineSpeakers.includes(s))) {
    errors.push(`CASE ${item.id}: statements と lines の話者が一致しない`);
  }
  const lineBySpeaker = Object.fromEntries((item.lines || []).map(line => [line.speaker, line.text]));
  for (const statement of item.statements) {
    const targetName = item.cast?.[statement.target];
    const self = statement.speaker === statement.target;
    let expectedLine = "";
    if (statement.kind === "culprit") expectedLine = self ? `自分が${item.action.positive}。` : `${targetName}が${item.action.positive}。`;
    if (statement.kind === "notCulprit") expectedLine = self ? `自分は${item.action.negative}。` : `${targetName}は${item.action.negative}。`;
    if (statement.kind === "outside") expectedLine = self ? "自分は事件のとき外にいたよ。" : `${targetName}は事件のとき外にいたよ。`;
    if (statement.kind === "inside") expectedLine = self ? "自分は事件のとき教室にいたよ。" : `${targetName}は事件のとき教室にいたよ。`;
    if (lineBySpeaker[statement.speaker] !== expectedLine) errors.push(`CASE ${item.id}: ${statement.speaker} の表示文と判定データが不一致`);
    if (!["culprit","notCulprit","outside","inside"].includes(statement.kind)) errors.push(`CASE ${item.id}: 未対応の kind (${statement.kind})`);
    if (!item.cast?.[statement.speaker] || !item.cast?.[statement.target]) errors.push(`CASE ${item.id}: cast に話者または対象がいない`);
    if (["outside","inside"].includes(statement.kind) && !item.whereabouts?.[statement.target]) errors.push(`CASE ${item.id}: 居場所データがない (${statement.target})`);
  }
  if (!item.action?.positive || !item.action?.negative || !item.question || !item.explanation) errors.push(`CASE ${item.id}: 問題・解説・action の必須項目が不足`);
  if (!item.intro?.trim() || !/[。！？]$/.test(item.intro.trim())) errors.push(`CASE ${item.id}: 導入文の句読点を確認`);
  if (answers.length === 1 && !item.explanation.includes(item.cast[answers[0]])) errors.push(`CASE ${item.id}: 解説に正解者名がない`);
}
if (cases.length !== 30) errors.push(`問題数が30問ではない (${cases.length}問)`);
console.log(`検証した問題数: ${cases.length}`);
console.log("正解者の分布:", answerCounts);
if (errors.length) {
  console.error(`NG: ${errors.length}件`);
  for (const error of errors) console.error(" - " + error);
  process.exitCode = 1;
} else {
  console.log("OK: 全問の一意解・話者データ・解説の基本整合性を確認しました。");
}
