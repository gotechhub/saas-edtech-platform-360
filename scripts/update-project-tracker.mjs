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

const total = data.modules.reduce((sum, item) => sum + item.total, 0);
const done = data.modules.reduce((sum, item) => sum + item.done, 0);
const active = data.modules.reduce((sum, item) => sum + item.active, 0);
const remaining = total - done;
const progress = Math.round((done / total) * 100);
const statusCounts = data.modules.reduce(
  (result, item) => ({ ...result, [item.status]: (result[item.status] || 0) + 1 }),
  {},
);
const labels = { planned: "Planlandı", in_progress: "Devam ediyor", verified: "Doğrulandı", released: "Yayınlandı" };
const phaseStats = data.phases.map((phase) => {
  const modules = data.modules.filter((item) => item.phase === phase.key);
  const phaseTotal = modules.reduce((sum, item) => sum + item.total, 0);
  const phaseDone = modules.reduce((sum, item) => sum + item.done, 0);
  return { ...phase, total: phaseTotal, done: phaseDone, progress: phaseTotal ? Math.round((phaseDone / phaseTotal) * 100) : 0 };
});
const esc = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

const markdown = `# Proje Takibi — ${data.project}

> Son güncelleme: **${data.updatedAt}** · Sürüm: **${data.version}** · Aşama: **${data.stage}**

## Genel durum

| Gösterge | Değer |
|---|---:|
| Ürün yol haritası ilerlemesi | **%${progress}** |
| Kalan | **%${100 - progress}** |
| Planlama baz çizgisi | **%${data.planningProgress}** |
| Toplam izlenen kabul görevi | **${total}** |
| Tamamlanan görev | **${done}** |
| Devam eden görev | **${active}** |
| Kalan görev | **${remaining}** |
| Toplam modül | **${data.modules.length}** |
| Devam eden modül | **${statusCounts.in_progress || 0}** |
| Planlanan modül | **${statusCounts.planned || 0}** |
| Tam doğrulanmış/yayınlanmış modül | **${(statusCounts.verified || 0) + (statusCounts.released || 0)}** |

> **Ölçüm kuralı:** ${data.method}

## Faz ilerlemesi

| Faz | Kapsam | Görev | İlerleme |
|---|---|---:|---:|
${phaseStats.map((phase) => `| ${phase.key} · ${phase.name} | ${phase.moduleRange} | ${phase.done}/${phase.total} | **%${phase.progress}** |`).join("\n")}

## Modüller

| Modül | Faz | Durum | Görev | İlerleme | Yapılan | Sıradaki |
|---|---|---|---:|---:|---|---|
${data.modules.map((item) => `| ${item.id} · ${item.name} | ${item.phase} | ${labels[item.status] || item.status} | ${item.done}/${item.total} | %${Math.round((item.done / item.total) * 100)} | ${item.delivered} | ${item.next} |`).join("\n")}

## Sıradaki öncelikler

${data.priorities.map((item) => `${item.order}. **${item.title}** · ${item.module}\n   ${item.detail}`).join("\n")}

## Dış bağımlılıklar ve karar girdileri

${data.dependencies.map((item) => `- ${item}`).join("\n")}

## Doğrulama kanıtı

- Çekirdek/PostgreSQL testleri: **${data.evidence.unitAndDatabaseTests} geçti**
- Tarayıcı uçtan uca testleri: **${data.evidence.browserTests} geçti**
- TypeScript: **${data.evidence.typecheck}**
- Next.js üretim derlemesi: **${data.evidence.productionBuild}**
- Bağımlılık güvenliği: **${data.evidence.securityAudit}**

## Son değişiklikler

${data.recent.map((item) => `- **${item.date}:** ${item.text}`).join("\n")}

## Güncelleme

Önce \`project-tracker.json\` içindeki modül/görev durumlarını değiştirin, sonra:

\`\`\`powershell
pnpm tracker:update
\`\`\`

Bu komut \`proje-takip.md\`, \`proje-takip.html\` ve portalda sunulan \`apps/web/public/proje-takip.html\` dosyalarını aynı kaynaktan yeniler. Tutarlılık kontrolü: \`pnpm tracker:check\`.
`;

const moduleRows = data.modules.map((item) => {
  const value = Math.round((item.done / item.total) * 100);
  return `<tr><td><b>${esc(item.id)}</b><span>${esc(item.name)}</span></td><td><span class="phase">${esc(item.phase)}</span></td><td><span class="status ${esc(item.status)}"><i></i>${esc(labels[item.status] || item.status)}</span></td><td><b>${item.done}/${item.total}</b><small>${item.active ? `${item.active} görev aktif` : "Aktif görev yok"}</small></td><td><div class="bar"><span style="width:${value}%"></span></div><b>%${value}</b></td><td>${esc(item.next)}</td></tr>`;
}).join("");

const html = `<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="60"><title>Proje Takibi · ${esc(data.project)}</title>
<style>
:root{--bg:#f4f6f3;--card:#fff;--ink:#18342d;--muted:#6f7d78;--line:#e1e7e3;--green:#286653;--soft:#e8f1ec;--gold:#b49b64;--warn:#b86a3e}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:14px/1.55 Inter,Arial,sans-serif}main{max-width:1320px;margin:auto;padding:42px 32px 70px}.top{display:flex;justify-content:space-between;gap:30px;align-items:flex-end;margin-bottom:28px}.kicker{font-size:10px;letter-spacing:2px;color:var(--green);font-weight:800}.top h1{font:500 clamp(30px,4vw,50px)/1.08 Georgia,serif;margin:9px 0}.top p{color:var(--muted);margin:0}.stamp{text-align:right;white-space:nowrap;color:var(--muted);font-size:11px}.stamp b{display:block;color:var(--ink);font-size:14px}.hero{display:grid;grid-template-columns:280px 1fr;gap:20px;margin-bottom:20px}.progress-card,.card{background:var(--card);border:1px solid var(--line);border-radius:16px;box-shadow:0 12px 40px #14392e0a}.progress-card{padding:27px;display:flex;align-items:center;gap:22px}.ring{--p:${progress};width:120px;aspect-ratio:1;border-radius:50%;display:grid;place-items:center;background:conic-gradient(var(--green) calc(var(--p)*1%),#e4ebe7 0);position:relative}.ring:after{content:"";position:absolute;inset:10px;background:var(--card);border-radius:50%}.ring strong{z-index:1;font:500 29px Georgia,serif}.ring strong small{font:11px Arial;color:var(--muted)}.progress-copy b,.progress-copy span{display:block}.progress-copy b{font-size:16px}.progress-copy span{font-size:11px;color:var(--muted);margin-top:6px}.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.metric{background:var(--card);border:1px solid var(--line);border-radius:13px;padding:20px}.metric span{font-size:10px;color:var(--muted);display:block}.metric b{font:500 29px Georgia,serif;display:block;margin:8px 0 2px}.metric small{color:var(--muted);font-size:9px}.grid{display:grid;grid-template-columns:1.35fr .65fr;gap:20px;margin-bottom:20px}.card{padding:25px}.card h2{font:500 21px Georgia,serif;margin:0 0 18px}.phases{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.phase-card{padding:17px;border-radius:11px;background:var(--bg)}.phase-card header{display:flex;justify-content:space-between;gap:8px}.phase-card b{font-size:12px}.phase-card strong{font:500 19px Georgia}.phase-card p{font-size:9px;color:var(--muted);min-height:29px}.bar{height:7px;background:#e5ebe7;border-radius:10px;overflow:hidden}.bar span{height:100%;display:block;background:linear-gradient(90deg,var(--green),#6a9a84);border-radius:10px}.priority{display:grid;grid-template-columns:28px 1fr auto;gap:11px;align-items:start;padding:13px 0;border-top:1px solid var(--line)}.priority>span{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;background:var(--soft);color:var(--green);font-size:10px;font-weight:800}.priority b,.priority small{display:block}.priority b{font-size:11px}.priority small{font-size:9px;color:var(--muted);margin-top:3px}.priority em{font-style:normal;font-size:9px;color:var(--green)}.table-card{padding:0;overflow:hidden;margin-bottom:20px}.table-head{display:flex;justify-content:space-between;align-items:center;padding:24px 25px 17px}.table-head h2{margin:0}.legend{font-size:9px;color:var(--muted)}.scroll{overflow-x:auto}table{border-collapse:collapse;width:100%;min-width:1080px}th,td{text-align:left;padding:14px 16px;border-top:1px solid var(--line);vertical-align:middle}th{background:#f8faf8;color:var(--muted);font-size:9px;text-transform:uppercase;letter-spacing:.7px}td{font-size:10px;color:var(--muted)}td:first-child b,td:first-child span,td:nth-child(4) b,td:nth-child(4) small{display:block}td:first-child b{color:var(--green);font-size:10px}td:first-child span{color:var(--ink);font-size:11px;margin-top:2px}td:nth-child(4) b{color:var(--ink)}td:nth-child(4) small{font-size:8px}.phase{font-weight:800;color:var(--green)}td:nth-child(5){display:grid;grid-template-columns:100px 34px;align-items:center;gap:8px}.status{display:inline-flex;align-items:center;gap:6px;white-space:nowrap}.status i{width:7px;height:7px;border-radius:50%;background:#aab4b0}.status.in_progress i{background:#d49a45;box-shadow:0 0 0 3px #d49a4520}.status.verified i,.status.released i{background:#41916e}.bottom{display:grid;grid-template-columns:1fr 1fr;gap:20px}.list{padding:0;margin:0;list-style:none}.list li{padding:11px 0;border-top:1px solid var(--line);font-size:11px;color:var(--muted)}.list li:before{content:"";display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--gold);margin-right:9px}.evidence{display:grid;grid-template-columns:1fr 1fr;gap:10px}.evidence div{padding:14px;background:var(--bg);border-radius:9px}.evidence span,.evidence b{display:block}.evidence span{font-size:9px;color:var(--muted)}.evidence b{font-size:15px;margin-top:4px}.method{margin-top:20px;padding:16px 18px;border-left:3px solid var(--gold);background:#f4f0e7;color:#6d6046;font-size:10px;border-radius:0 8px 8px 0}footer{display:flex;justify-content:space-between;gap:15px;padding-top:24px;color:var(--muted);font-size:9px}@media(max-width:900px){main{padding:25px 18px}.top{align-items:flex-start;flex-direction:column}.stamp{text-align:left}.hero,.grid,.bottom{grid-template-columns:1fr}.metrics,.phases{grid-template-columns:1fr 1fr}}@media(max-width:520px){.progress-card{align-items:flex-start}.ring{width:92px;flex-shrink:0}.metrics,.phases,.evidence{grid-template-columns:1fr}.metric{padding:16px}.top h1{font-size:32px}}
</style></head><body><main>
<header class="top"><div><span class="kicker">TEK KAYNAKLI PROJE PANOSU</span><h1>${esc(data.project)}</h1><p>${esc(data.stage)} · Planlama baz çizgisi %${data.planningProgress} tamamlandı</p></div><div class="stamp">SON GÜNCELLEME<b>${esc(data.updatedAt)}</b>Sürüm ${esc(data.version)}</div></header>
<section class="hero"><div class="progress-card"><div class="ring"><strong>%${progress}<small> bitti</small></strong></div><div class="progress-copy"><b>%${100-progress} kaldı</b><span>${done} / ${total} kabul görevi</span></div></div><div class="metrics"><div class="metric"><span>Tamamlanan görev</span><b>${done}</b><small>kanıtlı çıktı</small></div><div class="metric"><span>Devam eden görev</span><b>${active}</b><small>aktif çalışma</small></div><div class="metric"><span>Kalan görev</span><b>${remaining}</b><small>aktifler dahil</small></div><div class="metric"><span>Modül durumu</span><b>${statusCounts.in_progress || 0}/${data.modules.length}</b><small>devam eden / toplam</small></div></div></section>
<section class="grid"><article class="card"><h2>Faz ilerlemesi</h2><div class="phases">${phaseStats.map((phase)=>`<div class="phase-card"><header><b>${esc(phase.key)}</b><strong>%${phase.progress}</strong></header><p>${esc(phase.name)}<br>${esc(phase.moduleRange)}</p><div class="bar"><span style="width:${phase.progress}%"></span></div></div>`).join("")}</div><div class="method"><b>Nasıl ölçülüyor?</b> ${esc(data.method)}</div></article><article class="card"><h2>Sıradaki öncelikler</h2>${data.priorities.map((item)=>`<div class="priority"><span>${item.order}</span><div><b>${esc(item.title)}</b><small>${esc(item.detail)}</small></div><em>${esc(item.module)}</em></div>`).join("")}</article></section>
<section class="card table-card"><div class="table-head"><h2>20 modüllük yol haritası</h2><span class="legend">${statusCounts.in_progress || 0} devam ediyor · ${statusCounts.planned || 0} planlandı · ${(statusCounts.verified || 0)+(statusCounts.released || 0)} tamamlandı</span></div><div class="scroll"><table><thead><tr><th>Modül</th><th>Faz</th><th>Durum</th><th>Görev</th><th>İlerleme</th><th>Sıradaki somut çıktı</th></tr></thead><tbody>${moduleRows}</tbody></table></div></section>
<section class="bottom"><article class="card"><h2>Dış bağımlılıklar</h2><ul class="list">${data.dependencies.map((item)=>`<li>${esc(item)}</li>`).join("")}</ul></article><article class="card"><h2>Doğrulama kanıtı</h2><div class="evidence"><div><span>Çekirdek/PostgreSQL</span><b>${data.evidence.unitAndDatabaseTests} test geçti</b></div><div><span>Tarayıcı E2E</span><b>${data.evidence.browserTests} test geçti</b></div><div><span>TypeScript</span><b>${esc(data.evidence.typecheck)}</b></div><div><span>Üretim derlemesi</span><b>${esc(data.evidence.productionBuild)}</b></div></div></article></section>
<footer><span>Kaynak: project-tracker.json · Üretim: pnpm tracker:update</span><span>60 saniyede bir kendini yeniler</span></footer>
</main></body></html>`;

async function sync(path, expected) {
  if (check) {
    const actual = await readFile(path, "utf8").catch(() => "");
    if (actual !== expected) throw new Error(`${path} güncel değil. pnpm tracker:update çalıştırın.`);
    return;
  }
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, expected, "utf8");
}

await Promise.all([
  sync(markdownPath, markdown),
  sync(htmlPath, html),
  sync(publicHtmlPath, html),
]);
console.log(check ? "Proje takip çıktıları güncel." : `Proje takip dosyaları güncellendi: %${progress} tamamlandı (${done}/${total}).`);
