import {useEffect,useState} from 'react';
import {nextLocalMidnight} from './history-dates.mjs';
export function useLocalNow(){
 const [now,setNow]=useState(()=>new Date());
 useEffect(()=>{
  let midnight;const refresh=()=>{const date=new Date();setNow(date);clearTimeout(midnight);midnight=setTimeout(refresh,Math.max(20,nextLocalMidnight(date)-date.getTime()+20))};
  const visible=()=>{if(!document.hidden)refresh()};refresh();const interval=setInterval(refresh,60000);
  window.addEventListener('pageshow',refresh);window.addEventListener('focus',refresh);document.addEventListener('visibilitychange',visible);
  return()=>{clearTimeout(midnight);clearInterval(interval);window.removeEventListener('pageshow',refresh);window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',visible)};
 },[]);return now;
}
