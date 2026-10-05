import {useLayoutEffect} from 'react';

export function useHeaderAlignment(){
  useLayoutEffect(()=>{
    const calculator=document.querySelector('.calculator');
    const header=calculator.querySelector('.silver-panel'),surface=calculator.querySelector('.lcd-face');
    const orientation=window.matchMedia('(orientation:landscape)');
    let frame=0;
    const align=()=>{
      // Preserve the approved landscape brands beside the LCD.
      if(orientation.matches){
        const changed=calculator.style.getPropertyValue('--model-inner-left')||calculator.style.getPropertyValue('--brand-inner-right');
        calculator.style.removeProperty('--model-inner-left');calculator.style.removeProperty('--brand-inner-right');
        if(changed)calculator.dispatchEvent(new Event('hp-header-aligned'));
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
    align();const observer=new ResizeObserver(schedule);observer.observe(header);observer.observe(surface);
    orientation.addEventListener('change',schedule);
    window.addEventListener('resize',schedule);window.addEventListener('pageshow',schedule);
    window.visualViewport?.addEventListener('resize',schedule);
    return()=>{observer.disconnect();cancelAnimationFrame(frame);orientation.removeEventListener('change',schedule);window.removeEventListener('resize',schedule);window.removeEventListener('pageshow',schedule);window.visualViewport?.removeEventListener('resize',schedule)};
  },[]);
}
