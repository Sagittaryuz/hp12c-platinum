// A drag belongs only to its designated surface, never the scrollable contents.
export function createDirectionalDrag(direction){
 let gesture=null;
 const cancel=()=>{gesture=null};
 const update=e=>{if(!gesture||e.pointerId!==gesture.id)return false;const dx=e.clientX-gesture.x,dy=(e.clientY-gesture.y)*direction;
  if(Math.abs(dx)>24||dy< -12||gesture.maximum-dy>20){cancel();return false}
  gesture.maximum=Math.max(gesture.maximum,dy);return true;
 };
 return {cancel,active:()=>gesture!==null,
  down(e){if(gesture){cancel();return false}if(e.isPrimary===false||e.button!==0)return false;gesture={id:e.pointerId,x:e.clientX,y:e.clientY,maximum:0};return true},
  move:update,
  up(e){if(!update(e))return false;const accepted=(e.clientY-gesture.y)*direction>=56;cancel();return accepted},
  other(e){if(gesture&&e.pointerId!==gesture.id)cancel()}
 };
}
