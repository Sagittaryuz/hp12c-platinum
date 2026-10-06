import {useEffect,useRef} from 'react';
import {attachHistoryActions} from './history-actions.mjs';
export function useHistoryActions(surface,onAction){const latest=useRef(onAction);latest.current=onAction;useEffect(()=>attachHistoryActions(surface.current,(...args)=>latest.current(...args)),[surface])}
