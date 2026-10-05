import {useEffect,useRef} from 'react';
import {attachSurfacePull} from './surface-pull.mjs';
export function useSurfacePull(surface,onPull,enabled=true,scrollSelector){
 const latest=useRef({onPull,enabled});latest.current={onPull,enabled};
 useEffect(()=>attachSurfacePull(surface.current,{onPull:()=>latest.current.onPull(),enabled:()=>latest.current.enabled,scrollSelector}),[surface,scrollSelector]);
}
