const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const script = read('app/app.js');
const page = read('app/index.html');
const css = read('app/overrides.css');
function source(name) {
  const match = script.match(new RegExp(`function ${name}\\([^)]*\\)\\{[\\s\\S]*?\\n\\}`));
  assert.ok(match, name);
  return match[0];
}
function harness(date = '2026-09-26') {
  const nodes = new Map();
  const node = id => {
    if (!nodes.has(id)) nodes.set(id, {innerHTML: '', hidden: false, attrs: {}, handlers: {},
      setAttribute(key, value) { this.attrs[key] = value; },
      addEventListener(key, handler) { this.handlers[key] = handler; }});
    return nodes.get(id);
  };
  const context = vm.createContext({window: {}, $: node,
    Date: class extends Date { constructor() { super(`${date}T12:00:00Z`); } },
    history: {pushState() { throw Error('period controls must not push history'); },
      replaceState() { throw Error('period controls must not replace history'); }}});
  for (const file of ['businesses', 'events']) vm.runInContext(read(`shared/data/${file}.js`), context);
  for (const data of [context.window.HARMONY_LINK_BUSINESSES, context.window.HARMONY_LINK_EVENTS]) {
    data.forEach(Object.freeze);
    Object.freeze(data);
  }
  const before = JSON.stringify(context.window);
  vm.runInContext([
    source('businessToPromotion'), source('eventToAppModel'),
    'let language="ko", pastEventsOpen=false;',
    'const businessPromotions=window.HARMONY_LINK_BUSINESSES.map(businessToPromotion);',
    'const events=window.HARMONY_LINK_EVENTS.map(eventToAppModel);',
    ...['renderPartners', 'eventCard', 'homeEventCard', 'renderEvents'].map(source),
    ...script.split(/\r?\n/).filter(line => /^\$\("#(?:past|upcoming)EventsToggle"\)\.addEventListener/.test(line)),
    'renderPartners(); renderEvents();'
  ].join('\n'), context);
  return {context, node, before};
}
function cards(html) { return html.match(/<article\b[\s\S]*?<\/article>/g) || []; }

test('business spotlight renders every canonical business exactly once without mutating shared data', () => {
  const h = harness();
  const rendered = cards(h.node('#partnerPrograms').innerHTML);
  assert.equal(rendered.length, 7);
  h.context.window.HARMONY_LINK_BUSINESSES.forEach((business, i) => {
    assert.ok(rendered[i].includes(`data-business-id="${business.id}"`));
    assert.ok(rendered[i].includes(business.appTextKo.replace(/<br\s*\/?\s*>/gi, ' ')));
    if (!business.appLogo.includes('highline-hl-symbol')) assert.ok(rendered[i].includes(business.spotlightImage || business.appLogo));
    else assert.match(rendered[i], /yura-mini-logo/);
  });
  assert.equal(JSON.stringify(h.context.window), h.before);
});

test('home business names have explicit DMS and Korean police lines while IDs and links stay canonical', () => {
  const h = harness();
  const rendered = cards(h.node('#partnerPrograms').innerHTML);
  const dms = rendered.find(card => card.includes('data-business-id="dms-care"'));
  assert.match(dms, /business-name-line">DMS<\/span><span class="business-name-line business-name-secondary">Care Training Center<\/span>/);
  assert.match(dms, /href="https:\/\/dmscare.org\/ko"/);
  const police = rendered.find(card => card.includes('data-business-id="aaleac"'));
  assert.match(police, /business-name-line">아시안 아메리칸<\/span><span class="business-name-line">사법 경찰자문위원회<\/span>/);
  assert.match(police, /href="https:\/\/aaleac.org\/"/);
  vm.runInContext('language="en"; renderPartners();', h.context);
  const englishPolice = cards(h.node('#partnerPrograms').innerHTML).find(card => card.includes('data-business-id="aaleac"'));
  assert.match(englishPolice, /아시안 아메리칸/);
  assert.doesNotMatch(englishPolice, />AALEAC</);
});

test('HOLE19 home CTA uses its canonical official website; other business targets and phone action are preserved', () => {
  const h = harness();
  const rendered = cards(h.node('#partnerPrograms').innerHTML);
  h.context.window.HARMONY_LINK_BUSINESSES.forEach((b, i) => {
    const expected = b.id === 'hole19' ? b.websiteUrl : b.appCtaField === 'phone' ? `tel:${b.phoneHref}` : b[b.appCtaField];
    assert.ok(rendered[i].includes(`href="${expected}"`));
    assert.match(rendered[i], /target="_blank" rel="noopener noreferrer"/);
    assert.ok(rendered[i].includes(b.appCtaField === 'phone' ? b.appCtaKo : '업체 바로가기'));
  });
  assert.doesNotMatch(rendered[2], /instagram\.com/);
});

test('mobile business cards use native snapping, fixed equal sizes, one-line descriptions and no arrow/timer paging', () => {
  assert.match(page, /id="partnerPrograms" role="region"[\s\S]*?tabindex="0"/);
  assert.doesNotMatch(page, /class="app-partner-(?:prev|next)"|id="partner(?:Prev|Next)"/);
  assert.doesNotMatch(script, /partnerIndex|partnerTimer|restartPartnerTimer/);
  assert.match(css, /#partnerPrograms\{display:flex;[^}]*overflow-x:auto;[^}]*scroll-snap-type:x proximity/);
  assert.match(css, /#partnerPrograms \.app-partner-card\{flex:0 0 154px;width:154px;height:220px;scroll-snap-align:start/);
  assert.match(css, /#partnerPrograms \.app-partner-copy p\{[^}]*height:20px;[^}]*white-space:nowrap;text-overflow:ellipsis;overflow:hidden!important/);
  assert.match(css, /#partnerPrograms\{display:grid;grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(css, /\.desktop-app-nav\{width:min\(100%,560px\)!important\}/);
});

test('event period buttons render real upcoming/past events, retain DMS past detail, and return without history writes', () => {
  const h = harness();
  // The harness freezes today at 2026-09-24: the Sep. 26/28 and Oct. 3 additions
  // are still upcoming here, while DMS and the older three are already past.
  assert.equal(cards(h.node('#upcomingEventsList').innerHTML).length, 6);
  assert.equal(cards(h.node('#pastEventsList').innerHTML).length, 4);
  assert.match(h.node('#pastEventsList').innerHTML, /DMS 실무자를 위한 AI 업무 자동화 특강/);
  assert.match(h.node('#pastEventsList').innerHTML, /href="\.\.\/special-event-dms-ai-workshop\.html"/);
  h.node('#pastEventsToggle').handlers.click();
  assert.equal(h.node('#upcomingEventsList').hidden, true);
  assert.equal(h.node('#pastEventsList').hidden, false);
  assert.equal(h.node('#pastEventsToggle').attrs['aria-pressed'], 'true');
  h.node('#upcomingEventsToggle').handlers.click();
  assert.equal(h.node('#pastEventsList').hidden, true);
  assert.equal(h.node('#upcomingEventsList').hidden, false);
  assert.equal(h.node('#upcomingEventsToggle').attrs['aria-pressed'], 'true');
  assert.equal(JSON.stringify(h.context.window), h.before);
});

test('event classification continues to use inclusive UTC end dates, not start dates or hardcoded period data', () => {
  const h = harness('2026-09-23');
  assert.match(h.node('#upcomingEventsList').innerHTML, /DMS 실무자를 위한/);
  assert.doesNotMatch(h.node('#pastEventsList').innerHTML, /DMS 실무자를 위한/);
  const next = harness('2026-09-24');
  assert.match(next.node('#pastEventsList').innerHTML, /DMS 실무자를 위한/);
  assert.match(source('renderEvents'), /new Date\(\)\.toISOString\(\)\.slice\(0,10\)/);
  assert.match(source('renderEvents'), /const eventEnd=e=>e\.endDate\|\|e\.date/);
});

test('empty past list resets the period selection safely and hides only the past control', () => {
  const h = harness('2000-01-01');
  h.node('#pastEventsToggle').handlers.click();
  assert.equal(h.node('#pastEventsToggle').hidden, true);
  assert.equal(h.node('#upcomingEventsList').hidden, false);
  assert.equal(h.node('#upcomingEventsToggle').attrs['aria-pressed'], 'true');
});

test('golf event links and original flyers stay separate from the golf business URL in both event renderers', () => {
  const h = harness();
  for (const fn of ['eventCard', 'homeEventCard']) {
    const rendered = vm.runInContext(`events.map(${fn}).join("")`, h.context);
    for (const e of h.context.window.HARMONY_LINK_EVENTS) {
      assert.ok(rendered.includes(e.appImage));
      if (e.detailUrl) assert.ok(rendered.includes(`href="../${e.detailUrl}"`));
    }
    assert.match(rendered, /href="\.\.\/special-event-hole19\.html"/);
    assert.doesNotMatch(rendered, /hole19golflounge\.com/);
  }
  assert.doesNotMatch(source('homeEventCard'), /item\.textKo|item\.textEn/);
});

test('event controls are touch-sized and selected; equal frames contain uncropped flyers and retain the 140px home carousel', () => {
  assert.match(page, /id="upcomingEventsToggle"[^>]*aria-pressed="true"[^>]*aria-controls="upcomingEventsList"/);
  assert.match(page, /id="pastEventsToggle"[^>]*aria-controls="pastEventsList"/);
  assert.match(css, /\.event-view-controls button\{min-height:44px/);
  assert.match(css, /\.event-view-controls button\[aria-pressed="true"\]\{background:#1155d9;[^}]*color:#fff/);
  assert.match(css, /grid-auto-rows:1fr/);
  assert.match(css, /#events \.event-card \.event-image-open img\{position:absolute;inset:6px;[^}]*object-fit:contain!important/);
  assert.match(css, /\.app-home-event-card \.event-image-open img\{position:absolute;inset:6px;[^}]*object-fit:contain/);
  assert.match(css, /\.app-home-event-card\{flex:0 0 auto;width:140px;scroll-snap-align:start/);
  assert.match(css, /\.app-home-event-card h3\{[^}]*-webkit-line-clamp:2/);
});
