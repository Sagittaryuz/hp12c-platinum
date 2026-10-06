// A drag belongs only to its designated surface, never the scrollable contents.
export function createDirectionalDrag(direction,freeMotion=false){
 let gesture=null;
 const cancel=()=>{gesture=null};
 const update=e=>{if(!gesture||e.pointerId!==gesture.id)return false;const dx=e.clientX-gesture.x,dy=(e.clientY-gesture.y)*direction;
  if(Math.abs(dx)>Math.max(48,Math.max(0,dy)*1.25)||!freeMotion&&(dy< -16||gesture.maximum-dy>24)){cancel();return false}
  const time=Number.isFinite(e.timeStamp)?e.timeStamp:gesture.previousTime+1000;if(Math.abs(dy-gesture.current)>.5){gesture.velocity=(dy-gesture.current)/Math.max(1,time-gesture.previousTime);gesture.lastMotion=time}gesture.current=dy;gesture.previousTime=time;gesture.maximum=Math.max(gesture.maximum,dy);return true;
 };
 return {cancel,active:()=>gesture!==null,distance:()=>Math.max(0,gesture?.current||0),offset:()=>gesture?.current||0,
  down(e){if(gesture){cancel();return false}if(e.isPrimary===false||e.button!==0)return false;gesture={id:e.pointerId,x:e.clientX,y:e.clientY,maximum:0,current:0,velocity:0,lastMotion:0,previousTime:Number.isFinite(e.timeStamp)?e.timeStamp:0};return true},
  move:update,
  up(e){if(!update(e))return false;const distance=(e.clientY-gesture.y)*direction;const accepted=distance>=Math.abs(e.clientX-gesture.x)*.8&&(distance>=18||(distance>=12&&gesture.velocity>=.15&&gesture.previousTime-gesture.lastMotion<=80));cancel();return accepted},
  other(e){if(gesture&&e.pointerId!==gesture.id)cancel()}
 };
}
