import * as THREE from 'three';

export const landmarks = [
  {name:'Tsuglagkhang', district:0, x:0, z:-36, description:'The Main Tibetan Temple complex in McLeod Ganj.', source:'https://www.dalailama.com/'},
  {name:'St John in the Wilderness', district:1, x:0, z:-36, description:'A stone church among the deodars near McLeod Ganj.', source:'https://hpkangra.nic.in/'},
  {name:'Norbulingka Institute', district:2, x:0, z:-36, description:'A center for Tibetan arts and crafts in Sidhpur.', source:'https://norbulingka.org/'},
  {name:'HPCA Cricket Stadium', district:3, x:0, z:-45, description:'Walk through the stands to the cricket oval beneath the Dhauladhar.', source:'https://www.hpca.cricket/stadium/dharamshala-cricket-stadium-3'},
  {name:'Bhagsunag Temple & Falls', district:4, x:0, z:-36, description:'The temple and waterfall above McLeod Ganj, represented here in a single walkable scene.', source:'https://hpkangra.nic.in/'},
];

export function label(text, width = 4, background = '#202820', rotation = null) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 192;
  const context = canvas.getContext('2d');
  context.fillStyle = background;
  context.fillRect(0, 0, 1024, 192);
  context.strokeStyle = '#dfb879';
  context.lineWidth = 7;
  context.strokeRect(11,11,1002,170);
  context.fillStyle = '#fff4db';
  context.font = 'bold 85px sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, 512, 98, 952);
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;
  if(rotation !== null) {
    const board = new THREE.Mesh(new THREE.PlaneGeometry(width,width*192/1024),
      new THREE.MeshBasicMaterial({map,side:THREE.DoubleSide,toneMapped:false}));
    board.rotation.y = rotation;
    return board;
  }
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({map, transparent:true, depthWrite:false}));
  sprite.scale.set(width,width*96/512,1);
  return sprite;
}

export function buildLandmark(town, index, {box, mesh, pine}) {
  const z = landmarks[index].z;
  const sign = label(landmarks[index].name, 9);
  sign.position.set(0, 3, z+10);
  if(index!==3) town.add(sign);
  if (index === 3) {
    stadium(town, z, box, mesh);
    return;
  }
  box(town,0xada183,0,.03,z,31,.17,26);
  if (index === 1) {
    box(town,0x777870,0,2.3,z-2,7,4.6,11);
    roof(town,mesh,0,5,z-2,7.6,11.6,3.6,0x384445);
    box(town,0x656c68,0,4,z+4,4,8,4);
    roof(town,mesh,0,8.7,z+4,4.5,4.5,2.4,0x384445);
    box(town,0x44392d,0,1.3,z+6.03,1.3,2.6,.09);
    box(town,0xacb998,0,5.1,z+6.03,.64,1.3,.09);
    box(town,0x493f35,0,10.18,z+4,.13,.85,.13);
    box(town,0x493f35,0,10.27,z+4,.56,.12,.13);
    for(const x of [-12,-8,8,12]) pine(town,x,z+2,8,0x3f6351);
    return;
  }
  if (index === 4) {
    for(let step=0;step<4;step++) {
      box(town,0x72776a,9,1+step*1.5,z-7-step*2.4,14,2+step*3,5);
      box(town,0xa0dce1,9,2.02+step*3,z-6.7-step*2.4,3.4,.09,4);
      box(town,0x82c6cf,9,1.2+step*3,z-4.4-step*2.4,3.4,2.6,.16);
    }
    mesh(town,new THREE.CylinderGeometry(4,4,.13,28),0x61afbd,9,.15,z-3);
  }
  const x = index === 4 ? -7 : 0;
  const walls = index === 2 ? 0xf7d490 : 0xe7d5a1;
  box(town,walls,x,2,z-1,12,4,8);
  box(town,0x9e3730,x,3.7,z+3.04,12,.68,.1);
  box(town,0x53352c,x,1.2,z+3.05,2.2,2.4,.1);
  roof(town,mesh,x,4.6,z-1,14,10,1.7,0xad7339);
  box(town,0xd9b975,x,5.2,z-1,6,1.3,4.5);
  roof(town,mesh,x,6.25,z-1,7.5,6,1.7,0xd6a544);
  for (const column of [-4.5,-2.8,2.8,4.5]) {
    box(town,0x825146,x+column,2,z+3.1,.85,1.1,.15);
    box(town,0xefd07b,x+column,2,z+3.19,.58,.82,.1);
  }
}

function roof(group,mesh,x,y,z,width,depth,height,color) {
  const shape = mesh(group,new THREE.ConeGeometry(1,1,4),color,x,y,z);
  shape.rotation.y = Math.PI/4;
  shape.scale.set(width*.707,height,depth*.707);
}

function stadium(town, z, box, mesh) {
  const oval = (color,width,depth,y) => {
    const field = mesh(town,new THREE.CylinderGeometry(1,1,.10,80),color,0,y,z);
    field.scale.set(width,1,depth);
  };
  oval(0x596954,36,28,.02);
  oval(0x3b854e,25,19,.08);
  for(let i=0;i<6;i++) {
    const stripe = mesh(town,new THREE.PlaneGeometry(Math.sqrt(1-((i-2.5)/4)**2)*45,3),0x468f54,0,.135,z+(i-2.5)*5.7);
    stripe.rotation.x = -Math.PI/2;
  }
  const boundary = mesh(town,new THREE.RingGeometry(.973,1,80),0xf0eee0,0,.143,z);
  boundary.rotation.x = -Math.PI/2;
  boundary.scale.set(23.5,17.5,1);
  box(town,0xc6b28b,0,.145,z,3.8,.03,14);
  for (const end of [-1,1]) {
    box(town,0xf3eee1,0,.17,z+end*5.5,4,.025,.1);
    for (const dx of [-.19,0,.19]) box(town,0xf3eee1,dx,.48,z+end*5.8,.065,.65,.065);
  }
  for(let i=0;i<40;i++) {
    const angle = i/40*Math.PI*2;
    if ([8,9,10,11,12,28,29,30,31,32].includes(i)) continue;
    for(let tier=0;tier<4;tier++) {
      const radius = 26+tier*1.6;
      const color = [0xdab252,0xdc803d,0xab5340,0xda9e45][tier];
      const step = box(town,color,Math.cos(angle)*radius,.4+tier*.46,z+Math.sin(angle)*radius*.78,1.65,.74+tier*.16,4.25);
      step.rotation.y = -Math.atan2(Math.sin(angle)/.78,Math.cos(angle));
      for(const lateral of [-1.35,-.45,.45,1.35]) {
        const seat=box(town,tier%2 ? 0xe3a345 : 0xe5bf59,
          step.position.x+Math.sin(step.rotation.y)*lateral,
          .91+tier*.54,step.position.z+Math.cos(step.rotation.y)*lateral,.25,.28,.59);
        seat.rotation.y=step.rotation.y;
      }
    }
  }
  const pavilionZ = z-24;
  box(town,0xe6bd81,0,2.35,pavilionZ,20,4.7,5.7);
  box(town,0x394c51,0,3.4,pavilionZ+2.88,17,1.64,.10);
  for(let i=-7;i<=7;i++) box(town,0xd49d67,i*1.1,3.4,pavilionZ+2.95,.09,1.7,.09);
  for(let i=-4;i<=4;i++) {
    box(town,0x4c5350,i*1.9,1.30,pavilionZ+2.88,1.12,1.66,.10);
    box(town,0x8c9ca1,i*1.9,1.6,pavilionZ+2.95,.80,.78,.10);
  }
  box(town,0xc99b65,0,2.38,pavilionZ+3.30,19,.22,.96);
  box(town,0x624843,0,2.83,pavilionZ+3.73,19,.084,.08);
  for(let i=-10;i<=10;i++) box(town,0x624843,i*.88,2.60,pavilionZ+3.73,.075,.47,.075);
  roof(town,mesh,0,5.2,pavilionZ,22,7,2.15,0xa3352f);
  for(const x of [-7,0,7]) {
    box(town,0xe6ac66,x,5.9,pavilionZ,2.75,1.9,2.55);
    roof(town,mesh,x,7.25,pavilionZ,3.45,3.25,2,0xab3b30);
    mesh(town,new THREE.SphereGeometry(.16,8,5),0xefb750,x,8.25,pavilionZ);
  }
  const pavilionSign = label('HPCA',5,'#643428',0);
  pavilionSign.position.set(0,4.63,pavilionZ+2.98);
  town.add(pavilionSign);
  for(const x of [-30,30]) {
    for(const dz of [-22,22]) {
      box(town,0x778480,x,5.5,z+dz,.26,11,.26);
      box(town,0x46585b,x,11,z+dz,3,1.25,.4);
      for(let i=-2;i<=2;i++) box(town,0xffebba,x+i*.52,11,z+dz+.22,.36,.69,.07);
    }
  }
}
