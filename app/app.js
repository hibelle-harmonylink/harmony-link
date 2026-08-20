const basePrograms = [
  {id:"digital",emoji:"💻",ko:"디지털 교육",en:"Digital Learning",category:"디지털",tagsKo:"스마트폰 · 키오스크 · AI 활용",tagsEn:"Smartphones · Kiosks · AI",color:"#dbeaff"},
  {id:"english",emoji:"🌍",ko:"언어 교육",en:"Language Education",category:"언어",tagsKo:"영어 · 생활 회화 · 일본어",tagsEn:"English · Conversation · Japanese",color:"#bcd9e8"},
  {id:"music",emoji:"🎵",ko:"음악 교육",en:"Music Education",category:"음악",tagsKo:"합창 · 발성 · 악기",tagsEn:"Choir · Voice · Instruments",color:"#f2c7ad"},
  {id:"dance",emoji:"💃",ko:"댄스 교육",en:"Dance Education",category:"댄스",tagsKo:"라인댄스 · 생활 댄스 · 리듬",tagsEn:"Line dance · Social dance · Rhythm",color:"#efcfda"},
  {id:"finance",emoji:"💰",ko:"금융 교육",en:"Financial Education",category:"금융",tagsKo:"재무 기초 · 세무 · 부동산",tagsEn:"Finance basics · Tax · Real estate",color:"#d7d2ee"},
  {id:"art",emoji:"🎨",ko:"미술·공예",en:"Art & Crafts",category:"취미",tagsKo:"수채화 · 캘리그래피 · 공예",tagsEn:"Watercolor · Calligraphy · Crafts",color:"#efcfda"},
  {id:"wellness",emoji:"🧘",ko:"건강·운동",en:"Health & Fitness",category:"건강",tagsKo:"요가 · 필라테스 · 스트레칭",tagsEn:"Yoga · Pilates · Stretching",color:"#eef5ff"},
  {id:"culture",emoji:"📚",ko:"문화·교양",en:"Culture & Enrichment",category:"문화",tagsKo:"인문학 · 독서 · 문화 이해",tagsEn:"Humanities · Reading · Culture",color:"#d7cce8"},
  {id:"counseling",emoji:"💬",ko:"상담·심리",en:"Counseling & Psychology",category:"상담",tagsKo:"마음 건강 · 소통 · 관계",tagsEn:"Well-being · Communication · Relationships",color:"#f3dfae"},
  {id:"cognitive",emoji:"🧠",ko:"치매예방·인지",en:"Cognitive Wellness",category:"건강",tagsKo:"두뇌 건강 · 인지 활동 · 웃음치료",tagsEn:"Brain health · Activities · Laughter",color:"#c9e5de"},
  {id:"travel",emoji:"🗺️",ko:"여행·체험",en:"Travel & Experiences",category:"여행",tagsKo:"뉴욕 체험 · 문화 탐방 · 맞춤 여행",tagsEn:"New York · Culture trips · Custom trips",color:"#cbd8e5"},
  {id:"career",emoji:"💼",ko:"자격증·직업교육",en:"Career & Certification",category:"직업",tagsKo:"자격증 · 취업 · 창업",tagsEn:"Certificates · Employment · Business",color:"#cbd8e5"}
];
const sharedContent=window.HARMONY_LINK_SHARED_CONTENT||{};
const programs=[...(sharedContent.featuredPrograms||[]),...basePrograms];
const categoryNames={전체:"All",디지털:"Digital",언어:"Language",음악:"Music",댄스:"Dance",금융:"Finance",취미:"Art",건강:"Wellness",문화:"Culture",상담:"Counseling",여행:"Travel",직업:"Career"};
const fallbackPopupNews=[
  {badgeKo:"무료강좌",badgeEn:"FREE CLASS",titleKo:"무료 원데이 클래스",titleEn:"Free One-Day Class",textKo:"관심있는 배움을 가볍게 경험해 보세요.<br>새로운 일정은 앱에서 가장 먼저 안내합니다.",textEn:"Try a new learning experience.<br>New dates are announced in the app first.",image:"../assets/events/one-day-class.jpg",actionKo:"신청하기",actionEn:"Apply",url:"https://forms.gle/8b88T3zSsfPUxu128",screen:"events"},
  {badgeKo:"지역사회 봉사",badgeEn:"COMMUNITY SUPPORT",titleKo:"무료 방문 디지털 지원",titleEn:"Free in-home digital support",textKo:"스마트폰과 디지털 기기 사용이 어려운 이웃을<br>직접 찾아가 친절하게 도와드립니다.",textEn:"Friendly volunteers visit neighbors who need help<br>using smartphones and digital devices.",image:"../assets/volunteer/digital-volunteer.png",actionKo:"신청하기",actionEn:"Apply",screen:"contact"},
  {badgeKo:"파트너 모집",badgeEn:"PARTNER RECRUITMENT",titleKo:"입점 파트너 모집",titleEn:"Partner Recruitment",textKo:"전문 강사와 교육업체의 좋은 프로그램이 더 많은<br>사람과 만날 수 있도록 연결합니다.",textEn:"We connect trusted instructors and education providers<br>with more learners and organizations.",image:"../assets/partners/partner-recruitment.png",actionKo:"문의하기",actionEn:"Contact us",screen:"contact"}
];
const popupNews=sharedContent.promotions?.length?sharedContent.promotions:fallbackPopupNews;
// TODO: replace these placeholder dates (relative to today, so they never show as
// incorrectly expired) with the real class dates once confirmed.
const daysFromNow=n=>new Date(Date.now()+n*86400000).toISOString().slice(0,10);
const events=(sharedContent.events?.length?sharedContent.events:[
  {id:"one-day-class",date:daysFromNow(20),badgeKo:"참가비 무료",badgeEn:"FREE",titleKo:"무료 원데이 클래스",titleEn:"Free One-Day Class",textKo:"관심 분야를 부담 없이 경험해 보세요. 새 일정은 앱에서 가장 먼저 안내합니다.",textEn:"Try a new topic with no commitment. New dates will appear here first.",image:"../assets/events/one-day-class.jpg"},
  {id:"finance-ai-seminar",date:daysFromNow(35),badgeKo:"특별 세미나",badgeEn:"SPECIAL SEMINAR",badgeDark:true,titleKo:"생활 금융 × AI",titleEn:"Everyday Finance × AI",textKo:"실생활에 바로 쓰는 금융 정보와 AI 활용법을 함께 배웁니다.",textEn:"Learn practical financial information and useful AI skills together.",image:"../assets/events/finance-ai-seminar.jpg"}
]);
let language=localStorage.getItem("hl-language")||"ko";
let activeCategory="전체";
let saved=new Set(JSON.parse(localStorage.getItem("hl-saved")||"[]"));
let installPrompt=null;
let popupIndex=Math.floor(Math.random()*popupNews.length);
let popupTimer=null;
let activeContactMode="general";
let pastEventsOpen=false;

const $=(selector,root=document)=>root.querySelector(selector);
const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];

function programCard(program){
  const title=language==="ko"?program.ko:program.en;
  const tags=language==="ko"?program.tagsKo:program.tagsEn;
  return `<article class="program-card" data-id="${program.id}"${program.url?` data-program-url="${program.url}" tabindex="0"`:""}>
    <div class="program-art" style="background:${program.color}">${program.image?`<img src="${program.image}" alt="">`:program.emoji}</div>
    <div><h3>${title}</h3><p>${tags}</p></div>
    <button class="save-button ${saved.has(program.id)?"saved":""}" type="button" data-save="${program.id}" aria-label="${saved.has(program.id)?"Remove from saved":"Save program"}">${saved.has(program.id)?"♥":"♡"}</button>
  </article>`;
}
function renderRecommended(){
  const featured=sharedContent.featuredPrograms||[];
  $("#recommendedPrograms").innerHTML=featured.map(p=>`<article class="program-mini" data-open-program="${p.id}"><div class="program-art" style="background:${p.color}">${p.image?`<img src="${p.image}" alt="">`:p.emoji}</div><div><h3>${language==="ko"?p.ko:p.en}</h3><p>${language==="ko"?p.tagsKo:p.tagsEn}</p></div></article>`).join("");
}
function renderPartners(){
  const container=$("#partnerPrograms");
  if(!container)return;
  const partners=(sharedContent.promotions||[]).filter(item=>item.kind==="advertising"||item.kind==="community");
  container.innerHTML=partners.map(item=>{
    const isYura=item.image?.includes("highline-hl-symbol");
    return `<a class="program-mini" href="${item.url}" target="_blank" rel="noopener noreferrer"><div class="program-art" style="background:${isYura?"#b8b8b6":"#eef5ff"}"><img src="${item.image}" alt=""></div><div><h3>${language==="ko"?item.titleKo:item.titleEn}</h3><p>${language==="ko"?item.badgeKo:item.badgeEn}</p></div></a>`;
  }).join("");
}
function eventCard(item){
  const title=language==="ko"?item.titleKo:item.titleEn;
  const text=language==="ko"?item.textKo:item.textEn;
  const badge=language==="ko"?item.badgeKo:item.badgeEn;
  return `<article class="event-card"><img src="${item.image}" alt="${title}"><div><span class="badge${item.badgeDark?" dark":""}">${badge}</span><h2>${title}</h2><p>${text}</p></div></article>`;
}
function renderEvents(){
  const today=new Date().toISOString().slice(0,10);
  const upcoming=events.filter(e=>e.date>=today).sort((a,b)=>a.date<b.date?-1:1);
  const past=events.filter(e=>e.date<today).sort((a,b)=>a.date>b.date?-1:1);
  $("#upcomingEventsList").innerHTML=upcoming.map(eventCard).join("");
  const toggle=$("#pastEventsToggle");
  toggle.hidden=past.length===0;
  toggle.classList.toggle("open",pastEventsOpen);
  $("#pastEventsList").innerHTML=past.map(eventCard).join("");
  $("#pastEventsList").hidden=!pastEventsOpen;
}
function renderFilters(){
  $("#categoryFilters").innerHTML=Object.keys(categoryNames).map(name=>`<button type="button" class="${activeCategory===name?"active":""}" data-filter="${name}">${language==="ko"?name:categoryNames[name]}</button>`).join("");
}
function renderPrograms(){
  const query=$("#programSearch").value.trim().toLowerCase();
  // The "전체" (all) browse view with no search stays to the 12 general category
  // cards only — featured businesses (하이벨 디지털, 화상영어, 미란멜로디, and any
  // future ones with a matching category) appear once their category is picked,
  // shown together with that category's card instead of cluttering the top list.
  const pool=(activeCategory==="전체"&&!query)?basePrograms:programs;
  const filtered=pool.filter(p=>(activeCategory==="전체"||p.category===activeCategory)&&[p.ko,p.en,p.tagsKo,p.tagsEn].join(" ").toLowerCase().includes(query));
  $("#programList").innerHTML=filtered.map(programCard).join("");
  $("#programEmpty").hidden=filtered.length>0;
}
function renderSaved(){
  const items=programs.filter(p=>saved.has(p.id));
  $("#savedList").innerHTML=items.map(programCard).join("");
  $("#savedEmpty").hidden=items.length>0;
}
function renderPopup(){
  const item=popupNews[popupIndex];
  $("#newsPopup").classList.toggle("one-day-popup",item.kind==="benefit"||popupIndex===0&&!item.kind);
  $("#newsPopup").classList.toggle("volunteer-popup",item.kind==="community"||popupIndex===1&&!item.kind);
  $("#newsPopup").classList.toggle("partner-popup",item.kind==="advertising"||item.kind==="program"||popupIndex===2&&!item.kind);
  $("#newsPopup").dataset.item=item.image?.includes("hibelle-digital")?"digital":item.image?.includes("hibelle-online-english")?"english":item.image?.includes("meeran-melody")?"melody":item.image?.includes("highline-hl-symbol")?"yura":item.image?.includes("organic-one")?"organic":item.image?.includes("hole19")?"hole19":item.image?.includes("aaleac-shield")?"aaleac":item.image?.includes("jangsu-daycare")?"jangsu":"";
  $("#newsPopup").dataset.kind=item.kind||"";
  $("#newsPopupImage").src=item.image;
  $("#newsPopupImage").alt=language==="ko"?item.titleKo:item.titleEn;
  $("#newsPopupBadge").textContent=language==="ko"?item.badgeKo:item.badgeEn;
  $("#newsPopupTitle").innerHTML=language==="ko"?item.titleKo:item.titleEn;
  $("#newsPopupText").innerHTML=language==="ko"?item.textKo:item.textEn;
  $("#newsPopupAction span").textContent=language==="ko"?item.actionKo:item.actionEn;
  $("#newsCounter").textContent=`${popupIndex+1} / ${popupNews.length}`;
}
function closePopup(){
  $("#newsPopup").hidden=true;
  document.body.style.overflow="";
  window.clearInterval(popupTimer);
  popupTimer=null;
}
function setContactMode(mode="general"){
  const title=$("#contactTitle"),description=$("#contactDescription"),select=$("#contactSubject"),submitLabel=$("#contactSubmitLabel");
  activeContactMode=mode;
  $("#contact").classList.toggle("volunteer-contact",mode==="volunteer");
  $("#contact").classList.toggle("general-contact",mode!=="volunteer");
  if(mode==="volunteer"){
    title.dataset.ko="봉사 또는 도움이 필요하신가요?";
    title.dataset.en="Would you like to volunteer or get help?";
    description.dataset.ko="봉사에 참여하고 싶거나 디지털 도움이 필요하시면 신청해 주세요.";
    description.dataset.en="Apply to volunteer or request friendly digital support.";
    select.innerHTML='<option value="봉사하고 싶어요" data-ko="봉사하고 싶어요" data-en="I want to volunteer">봉사하고 싶어요</option><option value="도움이 필요해요" data-ko="도움이 필요해요" data-en="I need help">도움이 필요해요</option>';
    submitLabel.dataset.ko="신청하기";
    submitLabel.dataset.en="Apply";
  }else{
    title.dataset.ko="궁금한 점을 편하게 남겨주세요";
    title.dataset.en="Tell us how we can help";
    description.dataset.ko="프로그램, 강사·파트너 입점 문의를 주시면 확인 후 연락드립니다.";
    description.dataset.en="Send us your program, instructor, or partner inquiry and we will get back to you.";
    select.innerHTML='<option value="수업 신청 문의" data-ko="수업 신청 문의" data-en="Class inquiry">수업 신청 문의</option><option value="입점 파트너 문의" data-ko="입점 파트너 문의" data-en="Partner inquiry">입점 파트너 문의</option><option value="기타 문의" data-ko="기타 문의" data-en="Other inquiry">기타 문의</option>';
    submitLabel.dataset.ko="문의 보내기";
    submitLabel.dataset.en="Send inquiry";
  }
  title.textContent=title.dataset[language];
  description.textContent=description.dataset[language];
  submitLabel.textContent=submitLabel.dataset[language];
  $$("option[data-ko]",select).forEach(option=>{option.textContent=option.dataset[language]});
}
function openPopup(){
  popupIndex=Math.floor(Math.random()*popupNews.length);
  renderPopup();
  $("#newsPopup").hidden=false;
  document.body.style.overflow="hidden";
  window.clearInterval(popupTimer);
  popupTimer=window.setInterval(()=>{popupIndex=(popupIndex+1)%popupNews.length;renderPopup()},7000);
}
function applyLanguage(){
  document.documentElement.lang=language;
  $$("[data-ko]").forEach(el=>{el.innerHTML=el.dataset[language]});
  $$("[data-ko-placeholder]").forEach(el=>{el.placeholder=el.dataset[`${language}Placeholder`]});
  $("#languageButton").textContent=language==="ko"?"EN":"한";
  localStorage.setItem("hl-language",language);
  renderRecommended();renderPartners();renderFilters();renderPrograms();renderSaved();renderEvents();renderPopup();
}
function navigate(screen,contactMode="general",historyAction="push"){
  const resetScroll=()=>window.scrollTo({top:0,left:0,behavior:"auto"});
  resetScroll();
  requestAnimationFrame(resetScroll);
  if(screen==="contact") setContactMode(contactMode);
  $$(".screen").forEach(el=>el.classList.toggle("active",el.dataset.screen===screen));
  $$(".bottom-nav button").forEach(el=>el.classList.toggle("active",el.dataset.go===screen));
  document.body.classList.toggle("contact-screen-open",screen==="contact");
  if(historyAction==="push") history.pushState({screen,contactMode},"",`#${screen}`);
  if(historyAction==="replace") history.replaceState({screen,contactMode},"",`#${screen}`);
}
function toggleSaved(id){
  saved.has(id)?saved.delete(id):saved.add(id);
  localStorage.setItem("hl-saved",JSON.stringify([...saved]));
  renderPrograms();renderSaved();
}

document.addEventListener("click",event=>{
  const go=event.target.closest("[data-go]");
  if(go){
    const subject=go.dataset.subject;
    const contactMode=subject==="무료 방문 디지털 지원"?"volunteer":"general";
    navigate(go.dataset.go,contactMode);
    if(subject&&contactMode==="general") $("#contactSubject").value="수업 신청 문의";
  }
  const filter=event.target.closest("[data-filter]");
  if(filter){activeCategory=filter.dataset.filter;renderFilters();renderPrograms()}
  const category=event.target.closest("[data-category]");
  if(category){activeCategory=category.dataset.category;navigate("programs");renderFilters();renderPrograms()}
  const saveButton=event.target.closest("[data-save]");
  if(saveButton) toggleSaved(saveButton.dataset.save);
  const linkedProgram=event.target.closest("[data-program-url]");
  if(linkedProgram&&!saveButton) window.open(linkedProgram.dataset.programUrl,"_blank","noopener,noreferrer");
  const mini=event.target.closest("[data-open-program]");
  if(mini){const program=programs.find(p=>p.id===mini.dataset.openProgram);if(program.url){window.open(program.url,"_blank","noopener,noreferrer")}else{activeCategory="전체";navigate("programs");$("#programSearch").value=language==="ko"?program.ko:program.en;renderFilters();renderPrograms()}}
});
$("#programSearch").addEventListener("input",renderPrograms);
$("#pastEventsToggle").addEventListener("click",()=>{pastEventsOpen=!pastEventsOpen;renderEvents()});
$("#languageButton").addEventListener("click",()=>{language=language==="ko"?"en":"ko";applyLanguage()});
function openImageLightbox(src,alt,action){
  $("#lightboxImage").src=src;
  $("#lightboxImage").alt=alt;
  const actionButton=$("#lightboxAction");
  actionButton.hidden=!action;
  if(action){
    actionButton.querySelector("span").textContent=action.label;
    actionButton.onclick=action.onClick;
  }
  $("#imageLightbox").hidden=false;
}
function closeImageLightbox(){
  $("#imageLightbox").hidden=true;
}
$("#newsPopupImage").addEventListener("click",()=>openImageLightbox($("#newsPopupImage").src,$("#newsPopupImage").alt));
$("#newsPopupImage").addEventListener("keydown",event=>{
  if(event.key==="Enter"||event.key===" "){
    event.preventDefault();
    openImageLightbox($("#newsPopupImage").src,$("#newsPopupImage").alt);
  }
});
const volunteerImage=$("#volunteerImage");
if(volunteerImage){
  const openVolunteerLightbox=()=>openImageLightbox(volunteerImage.src,volunteerImage.alt,{
    label:language==="ko"?"신청하기":"Apply",
    onClick:()=>{closeImageLightbox();navigate("contact","volunteer")}
  });
  volunteerImage.addEventListener("click",openVolunteerLightbox);
  volunteerImage.addEventListener("keydown",event=>{
    if(event.key==="Enter"||event.key===" "){event.preventDefault();openVolunteerLightbox()}
  });
}
$$("[data-lightbox-close]").forEach(button=>button.addEventListener("click",closeImageLightbox));
$("#brandHome").addEventListener("click",event=>{
  event.preventDefault();
  navigate("home");
  openPopup();
});
$$("[data-popup-close]").forEach(button=>button.addEventListener("click",closePopup));
$("#newsPrev").addEventListener("click",()=>{popupIndex=(popupIndex-1+popupNews.length)%popupNews.length;renderPopup()});
$("#newsNext").addEventListener("click",()=>{popupIndex=(popupIndex+1)%popupNews.length;renderPopup()});
$("#newsPopupAction").addEventListener("click",()=>{
  const item=popupNews[popupIndex];
  if(item.url){
    window.open(item.url,"_blank","noopener,noreferrer");
    return;
  }
  const contactMode=item.badgeKo==="지역사회 봉사"?"volunteer":"general";
  const topic=item.badgeKo==="파트너 모집"?"partner":"";
  const query=item.screen==="contact"?`?v=74&popup=off&contact=${contactMode}${topic?`&topic=${topic}`:""}`:"?v=74&popup=off";
  window.open(`${location.pathname}${query}#${item.screen}`,"_blank","noopener,noreferrer");
});
$("#hidePopupToday").addEventListener("click",()=>{
  localStorage.setItem("hl-popup-hidden-date-v3",new Date().toLocaleDateString("en-CA"));
  closePopup();
});
$("#contactSubject").addEventListener("change",event=>{
  const submitLabel=$("#contactSubmitLabel");
  if(activeContactMode==="volunteer"){
    submitLabel.dataset.ko="신청하기";
    submitLabel.dataset.en="Apply";
  }else if(event.currentTarget.value==="입점 파트너 문의"){
    submitLabel.dataset.ko="문의하기";
    submitLabel.dataset.en="Contact us";
  }else{
    submitLabel.dataset.ko="문의 보내기";
    submitLabel.dataset.en="Send inquiry";
  }
  submitLabel.textContent=submitLabel.dataset[language];
});
$("#contactForm").addEventListener("submit",async event=>{
  event.preventDefault();
  const form=event.currentTarget,status=$("#formStatus"),button=$(".submit-button",form);
  const toast=$("#contactToast"),selectedSubject=$("#contactSubject").value;
  status.className="form-status";status.textContent=language==="ko"?"전송 중입니다…":"Sending…";button.disabled=true;
  try{
    const formData=new FormData(form);
    formData.set("_subject",`[Harmony Link] ${selectedSubject}`);
    formData.set("문의 분야",selectedSubject);
    const response=await fetch("https://formsubmit.co/ajax/hibelle@hibelleconsulting.com",{method:"POST",headers:{Accept:"application/json"},body:formData});
    if(!response.ok) throw new Error("send failed");
    status.textContent=language==="ko"?"문의가 접수되었습니다. 확인 후 연락드리겠습니다.":"Your inquiry was received. We will be in touch.";
    status.className="form-status success";
    toast.querySelector("span").textContent=language==="ko"?"접수가 완료되었습니다. 확인 후 연락드리겠습니다.":"Your inquiry has been received.";
    toast.hidden=false;
    window.setTimeout(()=>{toast.hidden=true},4500);
    form.reset();
  }catch{
    status.className="form-status error";
    status.innerHTML=language==="ko"?'전송하지 못했습니다. <a href="mailto:hibelle@hibelleconsulting.com">이메일로 문의해 주세요.</a>':'Could not send. Please <a href="mailto:hibelle@hibelleconsulting.com">email us</a>.';
  }finally{button.disabled=false}
});
window.addEventListener("beforeinstallprompt",event=>{
  event.preventDefault();
  installPrompt=event;
  $("#installButton").hidden=false;
  if(new URLSearchParams(location.search).get("install")==="1"){
    setTimeout(()=>$("#installButton").focus(),150);
  }
});
$("#installButton").addEventListener("click",async()=>{
  if(window.matchMedia("(display-mode: standalone)").matches){
    alert(language==="ko"?"이미 Harmony Link 앱으로 설치되어 있습니다.":"Harmony Link is already installed.");
    return;
  }
  if(!installPrompt){
    alert(language==="ko"?"Chrome에서 화면을 한 번 누른 뒤 30초 정도 기다리고 다시 ‘앱 설치’를 눌러 주세요. 기존에 Google 표시가 붙은 바로가기가 있으면 먼저 삭제해 주세요.":"Tap the page, wait about 30 seconds, then press Install App again. Remove any old Chrome shortcut first.");
    return;
  }
  installPrompt.prompt();
  const choice=await installPrompt.userChoice;
  if(choice.outcome==="accepted") installPrompt=null;
});
window.addEventListener("appinstalled",()=>{$("#installButton").hidden=true});
if("serviceWorker" in navigator){
  if(location.protocol==="https:"){
    window.addEventListener("load",async()=>{
      const registration=await navigator.serviceWorker.register("service-worker-v77.js",{updateViaCache:"none"});
      await registration.update();
    });
    let refreshing=false;
    navigator.serviceWorker.addEventListener("controllerchange",()=>{
      if(refreshing)return;
      refreshing=true;
      location.reload();
    });
  }else{
    navigator.serviceWorker.getRegistrations().then(registrations=>registrations.forEach(registration=>registration.unregister()));
    if("caches" in window) caches.keys().then(keys=>keys.forEach(key=>caches.delete(key)));
  }
}
applyLanguage();
const initialParams=new URLSearchParams(location.search);
if(initialParams.get("install")==="1"){
  const installButton=$("#installButton");
  installButton.hidden=false;
  installButton.classList.add("install-highlight");
  const isIos=/iphone|ipad|ipod/i.test(navigator.userAgent);
  if(isIos&&!window.matchMedia("(display-mode: standalone)").matches){
    setTimeout(()=>alert("iPhone에서는 Safari 아래의 공유 버튼을 누른 뒤 ‘홈 화면에 추가’를 선택해 주세요."),500);
  }
}
if("scrollRestoration" in history) history.scrollRestoration="manual";
const initialScreen=location.hash.slice(1)&&$(`[data-screen="${location.hash.slice(1)}"]`)?location.hash.slice(1):"home";
const initialContactMode=initialParams.get("contact")==="volunteer"?"volunteer":"general";
navigate(initialScreen,initialContactMode,"none");
const initialBase=`${location.pathname}${location.search}`;
history.replaceState({screen:"home",contactMode:"general"},"",`${initialBase}#home`);
if(initialScreen!=="home"){
  history.pushState({screen:initialScreen,contactMode:initialContactMode},"",`${initialBase}#${initialScreen}`);
}
window.addEventListener("popstate",event=>{
  const state=event.state||{screen:"home",contactMode:"general"};
  navigate(state.screen||"home",state.contactMode||"general","none");
  setTimeout(()=>window.scrollTo({top:0,left:0,behavior:"auto"}),0);
});
if(initialScreen==="contact"&&initialParams.get("topic")==="partner"){
  $("#contactSubject").value="입점 파트너 문의";
  const submitLabel=$("#contactSubmitLabel");
  submitLabel.dataset.ko="문의하기";
  submitLabel.dataset.en="Contact us";
  submitLabel.textContent=submitLabel.dataset[language];
}
if(initialParams.get("popup")==="off") closePopup();
else if(initialParams.get("install")==="1") openPopup();
else if(localStorage.getItem("hl-popup-hidden-date-v3")!==new Date().toLocaleDateString("en-CA")) openPopup();
else closePopup();
