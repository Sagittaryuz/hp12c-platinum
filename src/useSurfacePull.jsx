import {useEffect,useRef} from 'react';
import {attachSurfacePull} from './surface-pull.mjs';
export function useSurfacePull(surface,onPull,enabled=true,scrollSelector,onProgress,options={}){
 const latest=useRef({onPull,enabled,onProgress,options});latest.current={onPull,enabled,onProgress,options};
 useEffect(()=>attachSurfacePull(surface.current,{onPull:gesture=>latest.current.onPull(gesture),enabled:()=>latest.current.enabled,scrollSelector,direction:options.direction||1,freeMotion:options.freeMotion,ignoreSelector:options.ignoreSelector,onStart:()=>latest.current.options.onStart?.(),onProgress:(d,phase)=>latest.current.onProgress?.(d,phase)}),[surface,scrollSelector,options.direction,options.ignoreSelector,options.freeMotion]);
}
