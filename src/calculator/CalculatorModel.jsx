import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as THREE from 'three';
const VIEWS={front:[0,0,145],back:[0,0,-145],left:[-145,0,0],right:[145,0,0],top:[0,145,0],bottom:[0,-145,0]};
function keyForObject(object){while(object){if(object.userData.calculatorKey)return object.userData.calculatorKey;object=object.parent;}return null;}
function Device({display,status,selectedId,onPress,onLoaded}){
  const gltf=useLoader(GLTFLoader,`${import.meta.env.BASE_URL}models/hp12c-platinum.glb`);
  const scene=useMemo(()=>{const scene=gltf.scene.clone(true);scene.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;if(o.material)o.material=o.material.clone();}});return scene;},[gltf]);
  const pressedAt=useRef(0);
  const screen=useMemo(()=>{const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=280;const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.flipY=false;return {canvas,ctx:canvas.getContext('2d'),map};},[]);
  useEffect(()=>{onLoaded();},[onLoaded]);
  useEffect(()=>{const mesh=scene.getObjectByName('display_window');if(mesh)mesh.material=new THREE.MeshBasicMaterial({map:screen.map});},[scene,screen]);
  useEffect(()=>{
    const draw=()=>{const {ctx,map}=screen;ctx.fillStyle='#b9c4a7';ctx.fillRect(0,0,1200,280);ctx.fillStyle='#3c4b35';ctx.font='24px Inter, Arial';ctx.textAlign='left';ctx.fillText(status,26,35);ctx.textAlign='right';ctx.textBaseline='middle';ctx.fillStyle='#1d281b';let size=96;ctx.font=`${size}px 'DSEG7 Classic', monospace`;while(ctx.measureText(display).width>1130&&size>24){size-=2;ctx.font=`${size}px 'DSEG7 Classic', monospace`;}ctx.fillText(display,1166,165);map.needsUpdate=true;};
    draw();document.fonts.ready.then(draw);
  },[display,status,screen]);
  useEffect(()=>{pressedAt.current=performance.now();},[selectedId,display]);
  useFrame(()=>{const delta=performance.now()-pressedAt.current;scene.traverse(o=>{if(o.userData.calculatorKey){o.position.y=o.userData.calculatorKey===selectedId&&delta<130?-.00045:0;}if(o.isMesh&&o.name.startsWith('keycap_')){const active=keyForObject(o)===selectedId;if(o.material.emissive)o.material.emissive.set(active?'#203d30':'#000000');}});});
  const handlePress=(event)=>{const id=keyForObject(event.object);if(id){event.stopPropagation();onPress(id);}};
  return <group rotation={[Math.PI/2,0,0]} scale={1000}>
    <primitive object={scene} onClick={handlePress} onPointerOver={event=>{if(keyForObject(event.object))document.body.style.cursor='pointer';}} onPointerOut={()=>document.body.style.cursor='default'} />
  </group>;
}
function CameraViews({view,controls}){const {camera,size}=useThree();useEffect(()=>{const distance=Math.max(145,129/(2*Math.tan(17*Math.PI/180)*(size.width/size.height))*1.1);camera.position.set(...VIEWS[view].map(value=>value/145*distance));camera.up.set(...(['top','bottom'].includes(view)?[0,0,-1]:[0,1,0]));camera.lookAt(0,0,0);controls.current?.target.set(0,0,0);controls.current?.update();},[view,camera,controls,size.width,size.height]);return null;}
function Scene(props){const controls=useRef();return <>
  <color attach="background" args={['#111514']} />
  <ambientLight intensity={1.6} />
  <directionalLight position={[-50,80,110]} intensity={3.1} />
  <directionalLight position={[65,-30,80]} intensity={1.7} color="#d7e4dc" />
  <directionalLight position={[20,70,-100]} intensity={2.5} />
  <Suspense fallback={null}><Device {...props}/></Suspense>
  <OrbitControls ref={controls} enablePan={false} minDistance={112} maxDistance={230} rotateSpeed={.5} zoomSpeed={.6}/>
  <CameraViews view={props.view||'front'} controls={controls}/>
</>;}
export function CalculatorModel(props){const [loaded,setLoaded]=useState(false);const onLoaded=useCallback(()=>setLoaded(true),[]);return <><Canvas dpr={[1,1.8]} camera={{position:[0,0,145],fov:34}} gl={{antialias:true}}><Scene {...props} onLoaded={onLoaded}/></Canvas>{!loaded&&<div className="model-loading">Carregando modelo 3D…</div>}</>;}

