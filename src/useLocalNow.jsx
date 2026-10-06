import {useEffect,useState} from 'react';
import {nextLocalMidnight,localClockKey} from './history-dates.mjs';
export function useLocalNow(){
 const [clock,setClock]=useState(()=>{const now=new Date();return {now,key:localClockKey(now)}});
 useEffect(()=>{
  let midnight;const refresh=()=>{const date=new Date(),key=localClockKey(date);if(!document.hidden)setClock(current=>current.key===key?current:{now:date,key});clearTimeout(midnight);midnight=setTimeout(refresh,Math.max(20,nextLocalMidnight(date)-date.getTime()+20))};
  const visible=()=>{if(!document.hidden)refresh()};refresh();const interval=setInterval(refresh,60000);
  window.addEventListener('pageshow',refresh);window.addEventListener('focus',refresh);document.addEventListener('visibilitychange',visible);
  return()=>{clearTimeout(midnight);clearInterval(interval);window.removeEventListener('pageshow',refresh);window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',visible)};
 },[]);return clock.now;
}
