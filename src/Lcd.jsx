import {useLayoutEffect, useRef} from 'react';
import {lcdCells,lcdIndicators} from './lcd-layout.mjs';
import {useDisplayTransfer,DisplayTransferFeedback} from './useDisplayTransfer';
import {lcdGlyphs} from './lcd-glyphs.mjs';
let paths;
let commaPath,undoPath;
function segmentPaths(){
  return paths ||= Object.fromEntries(Object.entries(lcdGlyphs).map(([id,path])=>[id,new Path2D(path)]));
}
export function Lcd({state,display,disabled=false}){
  const transfer=useDisplayTransfer(display,disabled);
  const canvasRef=useRef(null);
  const drawingRef=useRef(null);
  const drawRef=useRef(null);
  drawingRef.current={display,powered:state.powered,undo:Boolean(state.undoState),indicators:lcdIndicators(state)};
  useLayoutEffect(()=>{
    const canvas=canvasRef.current;
    let lastDrawing=null,measured=canvas.getBoundingClientRect();
    const draw=()=>{
      const started=performance.now();
      const {width,height}=measured;
      if(!width||!height)return;
      const ratio=window.devicePixelRatio||1;
      const pixelWidth=Math.max(1,Math.round(width*ratio)),pixelHeight=Math.max(1,Math.round(height*ratio));
      const current=drawingRef.current;
      const portrait=window.matchMedia('(orientation: portrait)').matches;
      const signature=JSON.stringify([pixelWidth,pixelHeight,ratio,portrait,current.display,current.powered,current.undo,current.indicators.map(i=>i.active)]);
      // Identical pixels and state need no repaint. Keys still draw synchronously.
      if(signature===lastDrawing&&canvas.width===pixelWidth&&canvas.height===pixelHeight)return;
      if(canvas.width!==pixelWidth||canvas.height!==pixelHeight){canvas.width=pixelWidth;canvas.height=pixelHeight;}
      const ctx=canvas.getContext('2d');
      ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,pixelWidth,pixelHeight);
      const scale=Math.min(pixelWidth*.96/420,pixelHeight*.97/64);
      ctx.translate(Math.round(pixelWidth*.02),Math.round((pixelHeight-64*scale)/2));
      ctx.scale(scale,scale);ctx.fillStyle='#0b1009';
      const {cells,negative,segmented}=lcdCells(current.display);
      if(current.powered&&negative)ctx.fillRect(4,23,10,3);
      if(current.powered&&current.undo)ctx.fill(undoPath ||= new Path2D('M5 34v5h5v-2H8c9-3 9 7 2 7v2c10 0 11-14-2-11v-1z'));
      if(segmented){
        const cached=segmentPaths();
        ctx.strokeStyle='#0b1009';ctx.lineWidth=portrait ? .70 : .35;ctx.lineJoin='round';
        cells.forEach((cell,index)=>{
          ctx.save();ctx.translate(Math.round((30+index*34.4)*scale)/scale,7);
          if(cached[cell.glyph]){
            ctx.fill(cached[cell.glyph]);
            // Thicken the same contours, retaining origin, advance and punctuation.
            ctx.stroke(cached[cell.glyph]);
          }
          if(cell.glyph==='+'){ctx.fillRect(3,17,15,2);ctx.fillRect(9,11,2,15);}
          if(cell.punctuation){
            // A round point on the baseline; comma continues below it with a curved tail.
            ctx.beginPath();ctx.ellipse(26,36,2.2,2.2,0,0,Math.PI*2);ctx.fill();
            if(cell.punctuation===',')ctx.fill(commaPath ||= new Path2D('M27.9 35.5C29 39.2 26.5 42.5 23.6 44L24.6 41C26.1 40.2 26.8 38.6 25.7 37.6Z'));
          }
          ctx.restore();
        });
      }else{
        const text=negative?current.display.slice(1):current.display;ctx.font='28px Arial';
        ctx.save();ctx.translate(30,37);ctx.scale(Math.min(1,365/Math.max(1,ctx.measureText(text).width)),1);ctx.fillText(text,0,0);ctx.restore();
      }
      ctx.font='600 7px Arial';
      current.indicators.forEach(({label,active},i)=>{if(active)ctx.fillText(label,[30,72,112,150,174,203,260,310,337][i],60)});
      canvas.dataset.pixelRatio=String(ratio);canvas.dataset.drawMs=(performance.now()-started).toFixed(2);canvas.dataset.display=current.display;
      lastDrawing=signature;
    };
    drawRef.current=draw;
    const measure=()=>{measured=canvas.getBoundingClientRect();draw()};
    draw();const observer=new ResizeObserver(measure);observer.observe(canvas);
    window.addEventListener('resize',measure);window.addEventListener('pageshow',measure);
    const invalidate=()=>{lastDrawing=null};
    canvas.addEventListener('contextlost',invalidate);canvas.addEventListener('contextrestored',draw);
    return()=>{observer.disconnect();window.removeEventListener('resize',measure);window.removeEventListener('pageshow',measure);canvas.removeEventListener('contextlost',invalidate);canvas.removeEventListener('contextrestored',draw)};
  },[]);
  // Discrete key events redraw before paint; resizing uses the same measured buffer.
  useLayoutEffect(()=>{drawRef.current?.()},[display,state.powered,state.undoState,state.mode,state.shift,state.tvm.begin,state.dateFormat,state.compoundOdd,state.programMode,state.algOperators]);
  return <><div ref={transfer.ref} className="lcd" role="button" tabIndex={disabled?-1:0} aria-disabled={disabled} aria-label={`Copiar valor do visor: ${display}`} aria-describedby="lcd-transfer-help">
    <output className="lcd-readable" aria-live="polite">{display}</output>
    <canvas ref={canvasRef} className="lcd-face" aria-hidden="true"/>
  </div><DisplayTransferFeedback {...transfer}/></>;
}
