const { chromium } = require('playwright'); const fs = require('fs')
const D = __dirname, dark = fs.readFileSync(D + '/dark.css', 'utf8') + fs.readFileSync(D + '/clock-face.css', 'utf8')
const SW = `<span class="mock-label">Dark</span><span class="mock-track"><span class="mock-knob"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg></span></span>`
function restyle(opt) {
  const hex = (h) => h.match(/\d+/g).slice(0, 3).map(Number)
  const lum = (c) => { const s = c.map((v) => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4 }); return .2126 * s[0] + .7152 * s[1] + .0722 * s[2] }
  const mix = (a, b, t) => a.map((v, i) => Math.round(v * t + b[i] * (1 - t)))
  const rgb = (c) => `rgb(${c.join(',')})`
  const bg = [42, 39, 35], cream = '#e8dfcf'
  document.querySelectorAll('select.tag').forEach((el) => {
    if (!el.dataset.orig) el.dataset.orig = el.style.background || getComputedStyle(el).backgroundColor
    const c = hex(el.dataset.orig), darkColour = lum(c) < lum(bg)
    const hair = '0 0 0 1px rgba(232,223,207,.28) inset'
    if (darkColour) { el.style.background = rgb(c); el.style.color = cream; el.style.boxShadow = hair; return }
    if (opt === 'B') { el.style.background = 'transparent'; el.style.color = cream; el.style.boxShadow = `0 0 0 2px ${rgb(c)} inset` }
    if (opt === 'C') { el.style.background = rgb(mix(c, bg, .22)); el.style.color = rgb(mix(c, [255, 255, 255], .8)); el.style.boxShadow = 'none' }
  })
}
;(async () => { const b = await chromium.launch(); const errs = []
  for (const [w, touch, tag] of [[1200, false, 'computer'], [390, true, 'phone']]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 1000 }, hasTouch: touch, isMobile: touch, deviceScaleFactor: 2 })
    const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(e.message))
    await p.goto('http://localhost:4303/#list'); await p.waitForTimeout(600)
    await p.addStyleTag({ content: dark })
    await p.evaluate((sw) => { const n = document.querySelector('.nav'); const s = document.createElement('span'); s.className = 'mock-switch'; s.innerHTML = sw; n.appendChild(s) }, SW)
    for (const o of ['now', 'B', 'C']) {
      if (o !== 'now') await p.evaluate(restyle, o)
      await p.waitForTimeout(200)
      await p.screenshot({ path: `${D}/shots/pills-${o}-${tag}.png`, clip: { x: 0, y: 0, width: w, height: touch ? 1000 : 760 } })
    }
    console.log(tag, 'sideways', await p.evaluate(() => document.documentElement.scrollWidth - innerWidth))
    await ctx.close() }
  await b.close(); console.log('errors', errs) })()
