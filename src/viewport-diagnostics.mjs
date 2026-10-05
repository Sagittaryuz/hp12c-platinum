const rounded = value => Math.round(value * 100) / 100;
const rect = element => {
  if (!element) return null;
  const r = element.getBoundingClientRect();
  return Object.fromEntries(['x','y','width','height','top','right','bottom','left'].map(key => [key,rounded(r[key])]));
};
// Geometry only: no calculator value, storage, program, account or battery data.
export function collectViewportDiagnostics(reason = 'manual') {
  const host = document.createElement('div');
  host.setAttribute('aria-hidden','true');
  host.style.cssText='position:absolute;left:0;top:0;visibility:hidden;pointer-events:none;width:0;height:0;';
  document.body.appendChild(host);
  try {
    const units={};
    for (const unit of ['vh','svh','lvh','dvh']) {
      if (!CSS.supports('height',`100${unit}`)) { units[unit]=null; continue; }
      const probe=document.createElement('div');
      probe.style.cssText=`position:absolute;top:0;left:0;width:1px;height:100${unit};padding:0;border:0;`;
      host.appendChild(probe);units[unit]=rect(probe).height;
    }
    const safe=document.createElement('div');
    safe.style.cssText='position:absolute;width:0;height:0;padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px);';
    host.appendChild(safe);const style=getComputedStyle(safe);
    const fixed=document.createElement('div');fixed.style.cssText='position:fixed;inset:0;padding:0;border:0;';host.appendChild(fixed);
    const page=rect(document.querySelector('.page')), calculator=rect(document.querySelector('.calculator')), maker=rect(document.querySelector('.maker-strip'));
    const vv=window.visualViewport;
    const keys=[...document.querySelectorAll('.key')].map(rect);
    const ys=[window.innerHeight-1,document.documentElement.clientHeight-1,rect(fixed).bottom-1,screen.height-1,...(page?[page.bottom-1,page.bottom+1]:[])];
    return {
      version:'hp12c-viewport-diagnostic-v1',reason,time:new Date().toISOString(),
      mode:{iosStandalone:navigator.standalone === true,standalone:matchMedia('(display-mode: standalone)').matches,fullscreen:matchMedia('(display-mode: fullscreen)').matches},
      orientation:{type:screen.orientation?.type || null,angle:screen.orientation?.angle ?? window.orientation ?? null},
      statusBarMeta:document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')?.content,
      viewportMeta:document.querySelector('meta[name="viewport"]')?.content,
      window:{innerWidth,innerHeight,outerWidth,outerHeight,devicePixelRatio,scrollX,scrollY},
      document:{clientWidth:document.documentElement.clientWidth,clientHeight:document.documentElement.clientHeight,scrollHeight:document.documentElement.scrollHeight},
      screen:{width:screen.width,height:screen.height,availWidth:screen.availWidth,availHeight:screen.availHeight},
      visualViewport:vv?{width:rounded(vv.width),height:rounded(vv.height),offsetTop:rounded(vv.offsetTop),offsetLeft:rounded(vv.offsetLeft),pageTop:rounded(vv.pageTop),scale:vv.scale}:null,
      cssUnits:units,safeArea:Object.fromEntries(['Top','Right','Bottom','Left'].map(side=>[side.toLowerCase(),parseFloat(style['padding'+side]) || 0])),
      rectangles:{html:rect(document.documentElement),body:rect(document.body),root:rect(document.querySelector('#root')),fixed:rect(fixed),page,calculator,maker},
      keys:{count:keys.length,bottom:rounded(Math.max(...keys.map(k=>k.bottom))),top:rounded(Math.min(...keys.map(k=>k.top)))},
      textureBelowMaker:calculator&&maker?rounded(calculator.bottom-maker.bottom):null,
      hitTests:[...new Set(ys)].map(y=>{const e=document.elementFromPoint(innerWidth/2,y);return {y,hit:e?{tag:e.tagName,className:e.getAttribute('class') || ''}:null}}),
      background:{html:getComputedStyle(document.documentElement).backgroundColor,body:getComputedStyle(document.body).backgroundColor},
      markers:document.documentElement.classList.contains('viewport-marked'),userAgent:navigator.userAgent,
      caution:'Screen dimensions are comparison data, not a usable DOM height or permission to paint outside WebKit. Correlate with the colored boundary screenshot.',
    };
  } finally {host.remove();}
}
