export const printers = [
 {id:'X2D',name:'Bambu Lab X2D',code:'X2D',volume:[256,256,260],dualVolume:[235.5,256,256],enclosed:true,chamber:true,url:'https://bambulab.com/en/x2d/specs'},
 {id:'X1 Carbon',name:'X1 Carbon',code:'X1C',volume:[256,256,256],enclosed:true,chamber:false,url:'https://bambulab.com/en/x1/tech-specs'},
 {id:'P1S',name:'P1S',code:'P1S',volume:[256,256,256],enclosed:true,chamber:false,url:'https://bambulab.com/en/p1/tech-specs'},
 {id:'P1P',name:'P1P',code:'P1P',volume:[256,256,256],enclosed:false,chamber:false,url:'https://bambulab.com/en/p1/tech-specs'},
 {id:'A1',name:'A1',code:'A1',volume:[256,256,256],enclosed:false,chamber:false,url:'https://bambulab.com/en/a1/tech-specs'},
 {id:'A1 mini',name:'A1 mini',code:'A1M',volume:[180,180,180],enclosed:false,chamber:false,url:'https://bambulab.com/en/a1-mini/tech-specs'},
 {id:'Other',name:'Other',code:'',volume:null,enclosed:false,chamber:false,url:''}
];
export const nozzles=[.2,.4,.6,.8];
export const materials=['PLA','PLA Matte','PLA Silk','PETG','PETG Matte','TPU','ABS','ASA','Other'];
export const plates=['Textured PEI','Smooth PEI / High Temp','Engineering Plate','Cool Plate'];
export const manufacturers=['Generic','Bambu Lab','Polymaker','eSUN','Overture','SUNLU','Other'];
export const uses=['Decorative','Functional','Coaster / flat object','Figurine','Container','Bottle cover / sleeve','Mechanical part','Outdoor','Heat-exposed','Other'];
export const defaults={printer:'X2D',nozzle:.4,material:'PLA',manufacturer:'Generic',profile:'',plate:'Textured PEI',priority:'Balanced' as const,use:'Decorative',accuracy:false,finish:false,detail:false,strong:false,avoidSupport:false,dual:false,customVolume:[0,0,0]};
