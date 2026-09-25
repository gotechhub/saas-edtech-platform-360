import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = resolve(root, "project-tracker.json");
const markdownPath = resolve(root, "proje-takip.md");
const htmlPath = resolve(root, "proje-takip.html");
const publicHtmlPath = resolve(root, "apps/web/public/proje-takip.html");
const check = process.argv.includes("--check");
const data = JSON.parse(await readFile(sourcePath, "utf8"));
const programs = data.programs || [];
const tracked = data.modules.concat(programs);
const labels = { planned: "Planlandı", in_progress: "Devam ediyor", verified: "Doğrulandı", released: "Yayınlandı" };
const esc = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const pct = (done, total) => total ? Math.round((done / total) * 100) : 0;
const total = tracked.reduce((sum, item) => sum + item.total, 0);
const done = tracked.reduce((sum, item) => sum + item.done, 0);
const active = tracked.reduce((sum, item) => sum + item.active, 0);
const remaining = total - done;
const progress = pct(done, total);
const statusCounts = data.modules.reduce((result, item) => {
  result[item.status] = (result[item.status] || 0) + 1;
  return result;
}, {});
const phaseStats = data.phases.map((phase) => {
  const items = tracked.filter((item) => item.phase === phase.key);
  const phaseTotal = items.reduce((sum, item) => sum + item.total, 0);
  const phaseDone = items.reduce((sum, item) => sum + item.done, 0);
  return { ...phase, total: phaseTotal, done: phaseDone, progress: pct(phaseDone, phaseTotal) };
});

const md = [];
md.push("# Proje Takibi — " + data.project);
md.push("");
md.push("> Son güncelleme: **" + data.updatedAt + "** · Sürüm: **" + data.version + "** · Aşama: **" + data.stage + "**");
md.push("");
md.push("## Genel durum");
md.push("");
md.push("| Gösterge | Değer |");
md.push("|---|---:|");
md.push("| Ürün yol haritası ilerlemesi | **%" + progress + "** |");
md.push("| Kalan | **%" + (100 - progress) + "** |");
md.push("| Planlama baz çizgisi | **%" + data.planningProgress + "** |");
md.push("| Toplam izlenen kabul görevi | **" + total + "** |");
md.push("| Tamamlanan görev | **" + done + "** |");
md.push("| Devam eden görev | **" + active + "** |");
md.push("| Kalan görev | **" + remaining + "** |");
md.push("| Ana modül | **" + data.modules.length + "** |");
md.push("| Bağımsız program | **" + programs.length + "** |");
md.push("");
md.push("> **Ölçüm kuralı:** " + data.method);
md.push("");
md.push("## Faz ilerlemesi");
md.push("");
md.push("| Faz | Kapsam | Görev | İlerleme |");
md.push("|---|---|---:|---:|");
phaseStats.forEach((phase) => md.push("| " + phase.key + " · " + phase.name + " | " + phase.moduleRange + " | " + phase.done + "/" + phase.total + " | **%" + phase.progress + "** |"));

programs.forEach((program) => {
  md.push("");
  md.push("## " + program.id + " — " + program.name);
  md.push("");
  md.push("Ana modül: **" + program.parent + "** · İlerleme: **%" + pct(program.done, program.total) + "** · Görev: **" + program.done + "/" + program.total + "** · Aktif: **" + program.active + "**");
  md.push("");
  md.push("| İş paketi | Durum | Görev | İlerleme | Kabul kanıtı | Sıradaki |");
  md.push("|---|---|---:|---:|---|---|");
  program.workPackages.forEach((item) => md.push("| " + item.id + " · " + item.name + " | " + (labels[item.status] || item.status) + " | " + item.done + "/" + item.total + " | %" + pct(item.done, item.total) + " | " + item.evidence + " | " + item.next + " |"));
});

md.push("");
md.push("## 20 ana modül");
md.push("");
md.push("| Modül | Faz | Durum | Görev | İlerleme | Yapılan | Sıradaki |");
md.push("|---|---|---|---:|---:|---|---|");
data.modules.forEach((item) => md.push("| " + item.id + " · " + item.name + " | " + item.phase + " | " + (labels[item.status] || item.status) + " | " + item.done + "/" + item.total + " | %" + pct(item.done, item.total) + " | " + item.delivered + " | " + item.next + " |"));
md.push("");
md.push("## Sıradaki öncelikler");
md.push("");
data.priorities.forEach((item) => {
  md.push(item.order + ". **" + item.title + "** · " + item.module);
  md.push("   " + item.detail);
});
md.push("");
md.push("## Dış bağımlılıklar ve karar girdileri");
md.push("");
data.dependencies.forEach((item) => md.push("- " + item));
md.push("");
md.push("## Doğrulama kanıtı");
md.push("");
md.push("- Çekirdek/PostgreSQL testleri: **" + data.evidence.unitAndDatabaseTests + " geçti**");
md.push("- Tarayıcı uçtan uca testleri: **" + data.evidence.browserTests + " geçti**");
md.push("- TypeScript: **" + data.evidence.typecheck + "**");
md.push("- Next.js üretim derlemesi: **" + data.evidence.productionBuild + "**");
md.push("- Bağımlılık güvenliği: **" + data.evidence.securityAudit + "**");
md.push("");
md.push("## Son değişiklikler");
md.push("");
data.recent.forEach((item) => md.push("- **" + item.date + ":** " + item.text));
md.push("");
md.push("## Güncelleme");
md.push("");
md.push("Önce project-tracker.json durumlarını değiştirin, sonra pnpm tracker:update çalıştırın. Tutarlılık kontrolü: pnpm tracker:check.");
md.push("");
const markdown = md.join("\n");

const bar = (value) => '<div class="bar"><span style="width:' + value + '%"></span></div><b>%' + value + '</b>';
const phaseCards = phaseStats.map((phase) => '<div class="phase-card"><header><b>' + esc(phase.key) + '</b><strong>%' + phase.progress + '</strong></header><p>' + esc(phase.name) + '<br>' + esc(phase.moduleRange) + '</p><div class="bar"><span style="width:' + phase.progress + '%"></span></div></div>').join("");
const moduleRows = data.modules.map((item) => '<tr><td><b>' + esc(item.id) + '</b><span>' + esc(item.name) + '</span></td><td><span class="phase">' + esc(item.phase) + '</span></td><td><span class="status ' + esc(item.status) + '"><i></i>' + esc(labels[item.status] || item.status) + '</span></td><td><b>' + item.done + '/' + item.total + '</b><small>' + (item.active ? item.active + ' görev aktif' : 'Aktif görev yok') + '</small></td><td class="progress-cell">' + bar(pct(item.done, item.total)) + '</td><td>' + esc(item.next) + '</td></tr>').join("");
const programSections = programs.map((program) => {
  const rows = program.workPackages.map((item) => '<tr><td><b>' + esc(item.id) + '</b><span>' + esc(item.name) + '</span></td><td><span class="status ' + esc(item.status) + '"><i></i>' + esc(labels[item.status] || item.status) + '</span></td><td><b>' + item.done + '/' + item.total + '</b><small>' + item.active + ' görev aktif</small></td><td class="progress-cell">' + bar(pct(item.done, item.total)) + '</td><td>' + esc(item.evidence) + '</td><td>' + esc(item.next) + '</td></tr>').join("");
  return '<section class="card program"><div class="program-head"><div><span class="kicker">' + esc(program.parent) + ' ALT PROGRAMI</span><h2>' + esc(program.id + " · " + program.name) + '</h2><p>' + esc(program.delivered) + '</p></div><div class="program-score"><strong>%' + pct(program.done, program.total) + '</strong><span>' + program.done + ' / ' + program.total + ' görev</span></div></div><div class="scroll"><table><thead><tr><th>İş paketi</th><th>Durum</th><th>Görev</th><th>İlerleme</th><th>Kabul kanıtı</th><th>Sıradaki</th></tr></thead><tbody>' + rows + '</tbody></table></div></section>';
}).join("");

const html = '<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="60"><title>Proje Takibi · ' + esc(data.project) + '</title><style>' +
':root{--bg:#f1f3f1;--card:#fff;--ink:#15322b;--muted:#6d7b76;--line:#dfe5e1;--green:#246653;--soft:#e6f0eb;--gold:#ae8d4c;--warn:#cb8a35}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:14px/1.55 Inter,Arial,sans-serif}main{max-width:1440px;margin:auto;padding:40px 28px 72px}.top{display:flex;justify-content:space-between;gap:28px;align-items:flex-end;margin-bottom:26px}.kicker{font-size:10px;letter-spacing:1.8px;color:var(--green);font-weight:900}.top h1{font:500 clamp(30px,4vw,50px)/1.08 Georgia,serif;margin:8px 0}.top p,.program-head p{color:var(--muted);margin:0}.stamp{text-align:right;color:var(--muted);font-size:11px}.stamp b{display:block;color:var(--ink);font-size:14px}.hero{display:grid;grid-template-columns:300px 1fr;gap:18px;margin-bottom:18px}.card,.progress-card,.metric{background:var(--card);border:1px solid var(--line);border-radius:17px;box-shadow:0 12px 40px #14392e0a}.progress-card{padding:25px;display:flex;align-items:center;gap:20px}.ring{width:116px;aspect-ratio:1;border-radius:50%;display:grid;place-items:center;background:conic-gradient(var(--green) ' + progress + '%,#e4ebe7 0);position:relative}.ring:after{content:"";position:absolute;inset:10px;background:var(--card);border-radius:50%}.ring strong{z-index:1;font:500 28px Georgia}.progress-copy b,.progress-copy span{display:block}.progress-copy span{font-size:11px;color:var(--muted);margin-top:5px}.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:11px}.metric{padding:19px}.metric span{font-size:10px;color:var(--muted)}.metric b{font:500 28px Georgia;display:block;margin:7px 0 1px}.metric small{font-size:9px;color:var(--muted)}.grid{display:grid;grid-template-columns:1.3fr .7fr;gap:18px;margin-bottom:18px}.card{padding:24px}.card h2{font:500 22px Georgia;margin:0 0 17px}.phases{display:grid;grid-template-columns:repeat(4,1fr);gap:11px}.phase-card{padding:16px;border-radius:11px;background:var(--bg)}.phase-card header{display:flex;justify-content:space-between}.phase-card strong{font:500 19px Georgia}.phase-card p{font-size:9px;color:var(--muted);min-height:31px}.bar{height:7px;background:#e5ebe7;border-radius:10px;overflow:hidden}.bar span{height:100%;display:block;background:linear-gradient(90deg,var(--green),#6a9a84)}.priority{display:grid;grid-template-columns:27px 1fr auto;gap:10px;padding:12px 0;border-top:1px solid var(--line)}.priority>span{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;background:var(--soft);color:var(--green);font-size:10px;font-weight:900}.priority b,.priority small{display:block}.priority b{font-size:11px}.priority small{font-size:9px;color:var(--muted)}.priority em{font-style:normal;color:var(--green);font-size:9px}.program{padding:0;overflow:hidden;margin-bottom:18px;border-color:#cfdcd5}.program-head{padding:25px;display:grid;grid-template-columns:1fr auto;gap:24px;align-items:center;background:linear-gradient(120deg,#fff,#f4f7f5)}.program-head h2{margin:5px 0 8px}.program-head p{max-width:900px;font-size:11px}.program-score{text-align:right}.program-score strong,.program-score span{display:block}.program-score strong{font:500 36px Georgia;color:var(--green)}.program-score span{font-size:10px;color:var(--muted)}.table-card{padding:0;overflow:hidden}.table-head{display:flex;justify-content:space-between;align-items:center;padding:24px}.table-head h2{margin:0}.legend{font-size:9px;color:var(--muted)}.scroll{overflow-x:auto}table{border-collapse:collapse;width:100%;min-width:1120px}th,td{text-align:left;padding:14px 16px;border-top:1px solid var(--line);vertical-align:middle}th{background:#f8faf8;color:var(--muted);font-size:9px;text-transform:uppercase;letter-spacing:.7px}td{font-size:10px;color:var(--muted)}td:first-child b,td:first-child span,td:nth-child(3) b,td:nth-child(3) small{display:block}td:first-child b{color:var(--green)}td:first-child span{color:var(--ink);font-size:11px;margin-top:2px}td small{font-size:8px}.phase{font-weight:900;color:var(--green)}.status{display:inline-flex;align-items:center;gap:6px;white-space:nowrap}.status i{width:7px;height:7px;border-radius:50%;background:#aab4b0}.status.in_progress i{background:var(--warn);box-shadow:0 0 0 3px #cb8a3520}.status.verified i,.status.released i{background:#41916e}.progress-cell{display:grid;grid-template-columns:100px 35px;align-items:center;gap:8px}.bottom{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:18px}.list{padding:0;margin:0;list-style:none}.list li{padding:10px 0;border-top:1px solid var(--line);font-size:11px;color:var(--muted)}.evidence{display:grid;grid-template-columns:1fr 1fr;gap:9px}.evidence div{padding:14px;background:var(--bg);border-radius:9px}.evidence span,.evidence b{display:block}.evidence span{font-size:9px;color:var(--muted)}.evidence b{font-size:14px;margin-top:3px}.method{margin-top:18px;padding:15px;border-left:3px solid var(--gold);background:#f4f0e7;color:#6d6046;font-size:10px}footer{display:flex;justify-content:space-between;padding-top:24px;color:var(--muted);font-size:9px}@media(max-width:900px){main{padding:24px 16px}.top{align-items:flex-start;flex-direction:column}.stamp{text-align:left}.hero,.grid,.bottom{grid-template-columns:1fr}.metrics,.phases{grid-template-columns:1fr 1fr}.program-head{grid-template-columns:1fr}.program-score{text-align:left}}@media(max-width:520px){.progress-card{align-items:flex-start}.ring{width:90px}.metrics,.phases,.evidence{grid-template-columns:1fr}.top h1{font-size:32px}}' +
'</style></head><body><main><header class="top"><div><span class="kicker">TEK KAYNAKLI PROJE PANOSU</span><h1>' + esc(data.project) + '</h1><p>' + esc(data.stage) + ' · Planlama baz çizgisi %' + data.planningProgress + '</p></div><div class="stamp">SON GÜNCELLEME<b>' + esc(data.updatedAt) + '</b>Sürüm ' + esc(data.version) + '</div></header>' +
'<section class="hero"><div class="progress-card"><div class="ring"><strong>%' + progress + '</strong></div><div class="progress-copy"><b>%' + (100-progress) + ' kaldı</b><span>' + done + ' / ' + total + ' kabul görevi</span></div></div><div class="metrics"><div class="metric"><span>Tamamlanan görev</span><b>' + done + '</b><small>kanıtlı çıktı</small></div><div class="metric"><span>Devam eden görev</span><b>' + active + '</b><small>aktif çalışma</small></div><div class="metric"><span>Kalan görev</span><b>' + remaining + '</b><small>aktifler dahil</small></div><div class="metric"><span>Kapsam</span><b>' + data.modules.length + '+' + programs.length + '</b><small>ana modül + program</small></div></div></section>' +
'<section class="grid"><article class="card"><h2>Faz ilerlemesi</h2><div class="phases">' + phaseCards + '</div><div class="method"><b>Nasıl ölçülüyor?</b> ' + esc(data.method) + '</div></article><article class="card"><h2>Sıradaki öncelikler</h2>' + data.priorities.map((item) => '<div class="priority"><span>' + item.order + '</span><div><b>' + esc(item.title) + '</b><small>' + esc(item.detail) + '</small></div><em>' + esc(item.module) + '</em></div>').join("") + '</article></section>' +
programSections +
'<section class="card table-card"><div class="table-head"><h2>20 ana modüllük yol haritası</h2><span class="legend">' + (statusCounts.in_progress || 0) + ' devam ediyor · ' + (statusCounts.planned || 0) + ' planlandı · ' + ((statusCounts.verified || 0)+(statusCounts.released || 0)) + ' tamamlandı</span></div><div class="scroll"><table><thead><tr><th>Modül</th><th>Faz</th><th>Durum</th><th>Görev</th><th>İlerleme</th><th>Sıradaki somut çıktı</th></tr></thead><tbody>' + moduleRows + '</tbody></table></div></section>' +
'<section class="bottom"><article class="card"><h2>Dış bağımlılıklar</h2><ul class="list">' + data.dependencies.map((item) => '<li>' + esc(item) + '</li>').join("") + '</ul></article><article class="card"><h2>Doğrulama kanıtı</h2><div class="evidence"><div><span>Çekirdek/PostgreSQL</span><b>' + data.evidence.unitAndDatabaseTests + ' test geçti</b></div><div><span>Tarayıcı E2E</span><b>' + data.evidence.browserTests + ' test geçti</b></div><div><span>TypeScript</span><b>' + esc(data.evidence.typecheck) + '</b></div><div><span>Üretim derlemesi</span><b>' + esc(data.evidence.productionBuild) + '</b></div></div></article></section>' +
'<footer><span>Kaynak: project-tracker.json · Üretim: pnpm tracker:update</span><span>60 saniyede bir kendini yeniler</span></footer></main></body></html>';

async function sync(path, expected) {
  if (check) {
    const actual = await readFile(path, "utf8").catch(() => "");
    if (actual !== expected) throw new Error(path + " güncel değil. pnpm tracker:update çalıştırın.");
    return;
  }
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, expected, "utf8");
}
await Promise.all([sync(markdownPath, markdown), sync(htmlPath, html), sync(publicHtmlPath, html)]);
console.log(check ? "Proje takip çıktıları güncel." : "Proje takip dosyaları güncellendi: %" + progress + " tamamlandı (" + done + "/" + total + ").");
