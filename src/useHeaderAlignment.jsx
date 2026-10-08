import {useLayoutEffect} from 'react';

export function useHeaderAlignment(){
  useLayoutEffect(()=>{
    const calculator=document.querySelector('.calculator');
    const header=calculator.querySelector('.silver-panel'),surface=calculator.querySelector('.lcd-face');
    const orientation=window.matchMedia('(orientation:landscape)');
    let frame=0;
    const align=()=>{
      if(orientation.matches){
        calculator.style.removeProperty('--model-inner-left');calculator.style.removeProperty('--brand-inner-right');
        const h=header.getBoundingClientRect(),lcd=calculator.querySelector('.lcd').getBoundingClientRect(),left=calculator.querySelector('.key-sin').getBoundingClientRect(),right=calculator.querySelector('.key-plus').getBoundingClientRect();
        const model=calculator.querySelector('.model-name');
        const size=Math.min(calculator.clientHeight*.048,Math.max(12,(lcd.left-left.left-24)/3.9));
        calculator.style.setProperty('--desktop-title-size',size+'px');
        calculator.style.setProperty('--desktop-title-left',(left.left-h.left)+'px');
        calculator.style.setProperty('--desktop-title-top',(lcd.top+lcd.height/2-h.top-model.getBoundingClientRect().height/2)+'px');
        calculator.style.setProperty('--desktop-brand-left',(right.right-h.left-lcd.height)+'px');
        calculator.style.setProperty('--desktop-brand-top',(lcd.top-h.top)+'px');
        calculator.style.setProperty('--desktop-brand-size',lcd.height+'px');
        calculator.dispatchEvent(new Event('hp-header-aligned'));
        return;
      }
      const h=header.getBoundingClientRect(),r=surface.getBoundingClientRect();
      const left=`${r.left-h.left}px`,right=`${h.right-r.right}px`;
      if(calculator.style.getPropertyValue('--model-inner-left')===left&&calculator.style.getPropertyValue('--brand-inner-right')===right)return;
      calculator.style.setProperty('--model-inner-left',left);
      calculator.style.setProperty('--brand-inner-right',right);
      calculator.dispatchEvent(new Event('hp-header-aligned'));
    };
    const schedule=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(align)};
    align();const observer=new ResizeObserver(schedule);observer.observe(header);observer.observe(surface);observer.observe(calculator.querySelector('.model-name'));
    calculator.addEventListener('hp-keyboard-aligned',schedule);
    orientation.addEventListener('change',schedule);
    window.addEventListener('resize',schedule);window.addEventListener('pageshow',schedule);
    window.visualViewport?.addEventListener('resize',schedule);
    return()=>{observer.disconnect();cancelAnimationFrame(frame);calculator.removeEventListener('hp-keyboard-aligned',schedule);orientation.removeEventListener('change',schedule);window.removeEventListener('resize',schedule);window.removeEventListener('pageshow',schedule);window.visualViewport?.removeEventListener('resize',schedule)};
  },[]);
}
