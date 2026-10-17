export type RouteSheetSize='closed'|'half'|'full';
export function swipeRouteSheet(size:RouteSheetSize,deltaY:number):RouteSheetSize{
 if(Math.abs(deltaY)<40)return size;
 const sizes:RouteSheetSize[]=['closed','half','full'];
 return sizes[Math.max(0,Math.min(2,sizes.indexOf(size)+(deltaY<0?1:-1)))];
}
