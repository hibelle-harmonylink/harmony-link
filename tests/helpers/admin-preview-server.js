// Optional browser QA: node tests/helpers/admin-preview-server.js
// Open /?width=390&height=844&kind=student (or partner/withdrawn).
// Only synthetic data is used; CSP blocks all external/network connections.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const allowed = new Set(['admin.css', 'styles.css', 'admin.js', 'access-control.js']);

http.createServer((request, response) => {
  const url = new URL(request.url, 'http://127.0.0.1:4173');
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('Content-Security-Policy', "default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; frame-src 'self'; connect-src 'none'; img-src 'none'; font-src 'none'");
  const file = url.pathname.slice(1);
  if (allowed.has(file)) {
    response.setHeader('Content-Type', file.endsWith('.css') ? 'text/css' : 'text/javascript');
    response.end(fs.readFileSync(path.join(root, file)));
    return;
  }
  response.setHeader('Content-Type', 'text/html; charset=utf-8');
  const kind = ['student', 'partner', 'withdrawn'].includes(url.searchParams.get('kind')) ? url.searchParams.get('kind') : 'student';
  if (url.pathname === '/fixture') {
    const row = {
      id: 'fixture-member', email: 'very.long.synthetic.member.name.for.layout@example.test',
      display_name: '테스트 회원', full_name: 'Synthetic English Member Name With Long Content', nickname: 'Synthetic Business',
      user_type: kind === 'partner' ? 'partner' : 'student', membership: 'premium',
      account_status: kind === 'withdrawn' ? 'withdrawn' : 'active', is_withdrawn: kind === 'withdrawn', role: kind === 'partner' ? 'partner50' : 'member',
      member_number: 'HL-26-999', phone: '+82 10 1234 5678', created_at: '2026-09-01T12:00:00Z',
      specialty: '긴 설명을 확인하기 위한 테스트 전문분야입니다. '.repeat(16),
      teaching_subjects: '긴 강의과목 설명입니다. '.repeat(16),
      enrolled_subject: '아주 긴 테스트 수강과목 이름', assigned_instructor: '아주 긴 테스트 담당강사 이름',
    };
    const mock = `
      const fixtureRows = ${JSON.stringify([row])};
      window.supabase = { createClient: () => ({
        auth: { getSession: async () => ({ data: { session: { user: { id: 'fixture-admin', email: 'admin@example.test' } } } }) },
        from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { role: 'admin', account_status: 'active', display_name: '테스트 관리자' } }) }) }) }),
        rpc: async name => {
          if (name === 'admin_list_members') return { data: fixtureRows, error: null };
          if (name === 'admin_get_partner_region') return { data: [{ member_id: 'fixture-member', country_code: 'US', country_name: 'United States', state_code: 'NY', state_name: 'New York', city: 'New York', service_area: ['New York'], online_available: true, nationwide_available: false }], error: null };
          throw new Error('All writes disabled in the browser fixture: ' + name);
        },
        functions: { invoke: async () => { throw new Error('External actions disabled in fixture'); } }
      }) };
      const openFixture = () => {
        const button = document.querySelector('.member-manage');
        if (button) button.click(); else requestAnimationFrame(openFixture);
      };
      requestAnimationFrame(openFixture);
    `;
    const html = fs.readFileSync(path.join(root, 'admin.html'), 'utf8')
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<link\b[^>]*>/gi, link => /href="(?:styles|admin)\.css/.test(link) ? link : '')
      .replace('</body>', `<script>${mock}</script><script src="/access-control.js"></script><script src="/admin.js"></script></body>`);
    response.end(html);
    return;
  }
  if (url.pathname !== '/') { response.statusCode = 404; response.end('Not found'); return; }
  const width = [390, 1366, 1440, 1920].includes(Number(url.searchParams.get('width'))) ? Number(url.searchParams.get('width')) : 390;
  const height = Math.max(500, Math.min(1200, Number(url.searchParams.get('height')) || 844));
  response.end(`<!doctype html><html><head><title>Harmony Link isolated layout QA</title></head><body style="margin:0">
    <button onclick="const body=document.querySelector('iframe').contentDocument.querySelector('.member-detail');body.scrollTop=body.scrollHeight;">Scroll fixture to bottom</button>
    <iframe id="preview" title="Synthetic member admin" src="/fixture?kind=${kind}" width="${width}" height="${height}" style="display:block;border:0"></iframe>
    <pre id="metrics" aria-label="Layout measurements" style="white-space:pre-wrap;overflow-wrap:anywhere;max-width:1000px;max-height:200px;overflow:auto;font-size:10px">Waiting for layout</pre>
    <script>
      const frame = document.querySelector('#preview');
      const report = () => {
        const d=frame.contentDocument,w=frame.contentWindow,modal=d.querySelector('#memberDialog'),body=d.querySelector('.member-detail');
        if(!modal?.open || !body) { requestAnimationFrame(report); return; }
        const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,right:r.right};};
        const header=d.querySelector('.member-dialog-head'),footer=d.querySelector('.member-detail-actions'),save=d.querySelector('#detailSave'),region=d.querySelector('.partner-region');
        document.querySelector('#metrics').textContent=JSON.stringify({
          viewport:{width:w.innerWidth,height:w.innerHeight},modal:rect(modal),header:rect(header),
          body:{...rect(body),clientWidth:body.clientWidth,scrollWidth:body.scrollWidth,clientHeight:body.clientHeight,scrollHeight:body.scrollHeight,scrollTop:body.scrollTop},
          footer:rect(footer),save:rect(save),
          grid:[...d.querySelectorAll('.member-group-grid')].map(e=>({columns:w.getComputedStyle(e).gridTemplateColumns,fields:[...e.children].filter(c=>w.getComputedStyle(c).display!=='none').map(c=>({column:w.getComputedStyle(c).gridColumn,...rect(c)}))})),
          region:{hidden:region.hidden,display:w.getComputedStyle(region).display},
          innerScrollers:[...body.querySelectorAll('*')].filter(e=>w.getComputedStyle(e).overflowY==='auto'&&e.scrollHeight>e.clientHeight).map(e=>e.className||e.tagName)
        });
        body.onscroll=report;
      };
      frame.addEventListener('load',()=>requestAnimationFrame(report));
    </script>
    </body></html>`);
}).listen(4173, '127.0.0.1', () => console.log('Isolated admin fixture: http://127.0.0.1:4173'));
