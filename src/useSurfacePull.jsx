import {useEffect,useRef} from 'react';
import {attachSurfacePull} from './surface-pull.mjs';
export function useSurfacePull(surface,onPull,enabled=true,scrollSelector,onProgress){
 const latest=useRef({onPull,enabled,onProgress});latest.current={onPull,enabled,onProgress};
 useEffect(()=>attachSurfacePull(surface.current,{onPull:gesture=>latest.current.onPull(gesture),enabled:()=>latest.current.enabled,scrollSelector,onProgress:d=>latest.current.onProgress?.(d)}),[surface,scrollSelector]);
}
