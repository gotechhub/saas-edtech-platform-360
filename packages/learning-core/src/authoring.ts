import { strToU8, zipSync } from "fflate";

export type AuthorCourse = {
  title: string;
  sections: { title: string; body: string }[];
  question: string;
  choices: string[];
  answer: number;
};
export const sampleCourse: AuthorCourse = {
  title: "Bilgiyi uygulamaya dönüştürmek",
  sections: [
    {
      title: "Hedefini belirle",
      body: "Öğrenmek istediğin beceriyi tek bir cümleyle tanımla. Bu sentetik içerik, paket üretme ve öğrenme akışını denemek içindir.",
    },
    {
      title: "Bir uygulama adımı seç",
      body: "Edindiğin bilgiyi küçük bir uygulamayla dene. Geri bildirim al, sonucu değerlendir ve bir sonraki adımını seç.",
    },
  ],
  question: "Öğrenmeyi kalıcı kılan yaklaşım hangisidir?",
  choices: [
    "Yalnızca başlıkları okumak",
    "Uygulamak ve geri bildirim almak",
    "Değerlendirmeyi atlamak",
  ],
  answer: 1,
};
export function validateAuthorCourse(input: unknown): AuthorCourse {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new Error("Geçerli bir eğitim taslağı gerekli.");
  const c = input as AuthorCourse;
  const text = (v: unknown, min: number, max: number) =>
    typeof v === "string" && v.trim().length >= min && v.length <= max;
  if (
    !text(c.title, 3, 120) ||
    !text(c.question, 5, 400) ||
    !Array.isArray(c.sections) ||
    c.sections.length < 1 ||
    c.sections.length > 8
  )
    throw new Error("Başlık, soru veya bölüm sayısı geçersiz.");
  if (
    c.sections.some(
      (s) => !s || !text(s.title, 3, 100) || !text(s.body, 10, 5000),
    )
  )
    throw new Error("Her bölüm için başlık ve açıklama gerekli.");
  if (
    !Array.isArray(c.choices) ||
    c.choices.length < 2 ||
    c.choices.length > 6 ||
    c.choices.some((x) => !text(x, 1, 200)) ||
    new Set(c.choices.map((x) => x.trim())).size !== c.choices.length ||
    !Number.isInteger(c.answer) ||
    c.answer < 0 ||
    c.answer >= c.choices.length
  )
    throw new Error("En az iki farklı seçenek ve geçerli doğru yanıt seçin.");
  return {
    title: c.title.trim(),
    sections: c.sections.map((s) => ({
      title: s.title.trim(),
      body: s.body.trim(),
    })),
    question: c.question.trim(),
    choices: c.choices.map((x) => x.trim()),
    answer: c.answer,
  };
}
const xml = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[c]!,
  );
const scriptData = (v: unknown) =>
  JSON.stringify(v)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");

export function exportScorm12(input: unknown): Uint8Array {
  return zipSync(
    Object.fromEntries(
      Object.entries(createScormFiles(input)).map(([k, v]) => [k, strToU8(v)]),
    ),
    { level: 6 },
  );
}
export function createScormFiles(input: unknown): Record<string, string> {
  const course = validateAuthorCourse(input);
  return {
    "imsmanifest.xml": `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="respongo-${crypto.randomUUID()}" version="1.0" xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2" xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2">
<metadata><schema>ADL SCORM</schema><schemaversion>1.2</schemaversion></metadata>
<organizations default="org"><organization identifier="org"><title>${xml(course.title)}</title><item identifier="item" identifierref="sco"><title>${xml(course.title)}</title></item></organization></organizations>
<resources><resource identifier="sco" type="webcontent" adlcp:scormtype="sco" href="index.html"><file href="index.html"/><file href="course.js"/><file href="course.css"/></resource></resources></manifest>`,
    "index.html": `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${xml(course.title)}</title><link rel="stylesheet" href="course.css"></head><body><main><span class="label">OGUZ LAW ACADEMY · ÖRNEK EĞİTİM</span><h1 id="title"></h1><div id="content"></div><p id="feedback" role="status"></p><button id="next" type="button">Devam et</button><p class="note">Sentetik demo. Tamamlama, mesleki yeterlilik veya gerçek sertifika değildir.</p></main><script src="course.js"></script></body></html>`,
    "course.css": `*{box-sizing:border-box}body{margin:0;background:#f5f7f4;color:#193f35;font:16px/1.7 Arial,sans-serif}main{max-width:720px;margin:auto;padding:32px}h1{font-size:28px;line-height:1.3}h2{font-size:20px}p{white-space:pre-wrap}.label{font-size:11px;letter-spacing:2px}.note{font-size:12px;color:#53655c;margin-top:28px}button{padding:13px 20px;border:0;border-radius:7px;background:#286653;color:white;font-size:15px;cursor:pointer}button:disabled{opacity:.55}label{display:flex;align-items:center;gap:12px;padding:14px;border:1px solid #cdd7cf;border-radius:7px;margin:10px 0}input{width:18px;height:18px}button:focus-visible,input:focus-visible{outline:3px solid #a8762b;outline-offset:3px}fieldset{border:0;padding:0;margin:0}legend{font-weight:bold}.result{padding:20px;background:#e3eee5;border-radius:10px}@media(max-width:400px){main{padding:22px}h1{font-size:24px}}`,
    "course.js": `"use strict";
const course=${scriptData(course)};
const title=document.getElementById('title'),content=document.getElementById('content'),next=document.getElementById('next'),feedback=document.getElementById('feedback');
title.textContent=course.title;
function findAPI(){let w=window;for(let i=0;i<8;i++){try{if(w.API)return w.API;if(w.parent===w)break;w=w.parent}catch{break}}return null}
const api=findAPI();let position=0,selected=null,finished=false;
function element(tag,text,cls){const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n}
function save(){if(!api)return false;api.LMSSetValue('cmi.core.lesson_location',String(position));api.LMSSetValue('cmi.suspend_data',JSON.stringify({position}));return api.LMSCommit('')==='true'}
function render(){content.replaceChildren();feedback.textContent='';if(finished){content.append(element('h2','Eğitim tamamlandı'),element('p','Örnek soruyu doğru yanıtladınız.','result'));next.hidden=true;return}if(position<course.sections.length){const section=course.sections[position];content.append(element('h2',section.title),element('p',section.body));next.textContent='Bölümü tamamla';return}const group=element('fieldset');group.append(element('legend',course.question));course.choices.forEach((choice,i)=>{const label=element('label'),input=document.createElement('input');input.type='radio';input.name='response';input.value=String(i);input.addEventListener('change',()=>{selected=i;feedback.textContent=''});label.append(input,document.createTextNode(choice));group.append(label)});content.append(group);next.textContent='Yanıtı kontrol et'}
next.addEventListener('click',()=>{if(!api)return;if(position<course.sections.length){position++;if(!save()){feedback.textContent='Kayıt kuyruğuna eklenemedi. Yeniden deneyin.';position--;return}render();return}if(selected===null){feedback.textContent='Bir yanıt seçin.';return}api.LMSSetValue('cmi.interactions.0.id','question-1');api.LMSSetValue('cmi.interactions.0.type','choice');api.LMSSetValue('cmi.interactions.0.student_response',String.fromCharCode(97+selected));api.LMSSetValue('cmi.interactions.0.correct_responses.0.pattern',String.fromCharCode(97+course.answer));api.LMSSetValue('cmi.interactions.0.result',selected===course.answer?'correct':'wrong');api.LMSSetValue('cmi.core.score.raw',selected===course.answer?'100':'0');api.LMSSetValue('cmi.core.lesson_status',selected===course.answer?'passed':'incomplete');if(!save()){feedback.textContent='Kayıt kuyruğuna eklenemedi.';return}if(selected!==course.answer){feedback.textContent='Bu yanıt doğru değil. Bölümlerdeki bilgiyi yeniden düşünün.';return}if(api.LMSFinish('')!=='true'){feedback.textContent='Tamamlama kaydı bekliyor. Tekrar deneyin.';return}finished=true;render()});
if(!api||api.LMSInitialize('')!=='true'){content.textContent='Bu paketi SCORM 1.2 destekleyen bir LMS içinden açın.';next.disabled=true}else{const bookmark=Number(api.LMSGetValue('cmi.core.lesson_location'));if(Number.isInteger(bookmark)&&bookmark>=0&&bookmark<=course.sections.length)position=bookmark;finished=['passed','completed'].includes(api.LMSGetValue('cmi.core.lesson_status'));if(!finished&&api.LMSGetValue('cmi.core.lesson_status')==='not attempted')api.LMSSetValue('cmi.core.lesson_status','incomplete');render()}
`,
  };
}
