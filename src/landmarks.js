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
  const tiers = 7;
  const seatParts = new THREE.InstancedMesh(
    new THREE.BoxGeometry(),
    new THREE.MeshStandardMaterial({roughness:.53}),
    44*tiers*6*2
  );
  const pose = new THREE.Object3D();
  const color = new THREE.Color();
  let seats = 0;
  function seatPart(x,y,z,angle,width,height,depth,tint) {
    pose.position.set(x,y,z);
    pose.rotation.y=angle;
    pose.scale.set(width,height,depth);
    pose.updateMatrix();
    seatParts.setMatrixAt(seats,pose.matrix);
    seatParts.setColorAt(seats++,color.setHex(tint));
  }
  for(let i=0;i<44;i++) {
    const angle = i/44*Math.PI*2;
    if ((i>=9 && i<=13) || (i>=29 && i<=37)) continue;
    const rotation = -Math.atan2(Math.sin(angle)/.78,Math.cos(angle));
    for(let tier=0;tier<tiers;tier++) {
      const radius = 25.6+tier*.88;
      const x = Math.cos(angle)*radius;
      const rowZ = z+Math.sin(angle)*radius*.78;
      const height = .36+tier*.36;
      const step = box(town,tier%2?0xb5ac9d:0xc1b8a9,x,height/2,rowZ,.94,height,4.37);
      step.rotation.y = rotation;
      if(i%6===0) continue;
      const tint=[0xd6b64f,0xd6893c,0x4a9383,0xe1b85c][Math.floor(i/5)%4];
      for(let col=0;col<6;col++) {
        const lateral=(col-2.5)*.61;
        const sx=x+Math.sin(rotation)*lateral;
        const sz=rowZ+Math.cos(rotation)*lateral;
        seatPart(sx,height+.14,sz,rotation,.46,.11,.39,tint);
        seatPart(sx+Math.cos(rotation)*.18,height+.30,sz-Math.sin(rotation)*.18,
          rotation,.10,.31,.39,tint);
      }
    }
  }
  seatParts.count=seats;
  seatParts.castShadow=true;
  seatParts.receiveShadow=true;
  town.add(seatParts);

  const pavilionZ = z-25;
  const facade = pavilionZ+3.7;
  const plaster = 0xd8ad72;
  const wood = 0x745045;
  const red = 0xa32f2d;
  box(town,0x827463,0,.30,pavilionZ,27,.60,8.5);
  box(town,plaster,0,2.55,pavilionZ,25,4.5,7.4);
  box(town,0x7c4c3c,0,2.59,facade+.035,25.3,.24,.20);
  for(const side of [-1,1]) {
    box(town,0xc68453,side*11.75,3.30,pavilionZ,2.9,5.6,8.1);
    roof(town,mesh,side*11.75,6.1,pavilionZ,4.5,9.2,1.4,red);
    for(let stair=0;stair<8;stair++) {
      const stepHeight=.16*(stair+1);
      box(town,0xaa9e8b,side*10.4,stepHeight/2,facade+2.43-stair*.29,2.3,stepHeight,.30);
    }
  }
  for(let bay=-5;bay<=5;bay++) {
    const x=bay*1.74;
    box(town,wood,x,1.43,facade+.055,1.42,1.68,.13);
    box(town,0x58635f,x,1.52,facade+.13,1.12,1.32,.045);
    box(town,0x333f44,x,3.69,facade+.06,1.65,1.53,.15);
    box(town,bay%3===0?0x789399:0x516e78,x,3.72,facade+.145,1.47,1.35,.036);
    box(town,0x9fb2b4,x,4.05,facade+.168,1.44,.026,.018);
    box(town,0x443f37,x+.25,3.72,facade+.168,.035,1.36,.026);
  }
  box(town,0xb28e65,0,2.49,facade+.46,21.6,.16,1.12);
  for(const y of [2.74,3.03]) box(town,wood,0,y,facade+.98,21.6,.055,.075);
  for(let i=-14;i<=14;i++) box(town,wood,i*.76,2.81,facade+.98,.035,.55,.05);
  box(town,0x685146,0,4.85,pavilionZ,26.3,.36,8.7);
  roof(town,mesh,0,5.65,pavilionZ,26.8,9.2,2,red);

  for(const x of [-7.6,0,7.6]) {
    const topHeight=x===0?7.26:7;
    box(town,0xa47a51,x,6.25,pavilionZ,3.4,1.1,3.4);
    for(const side of [-1,1]) {
      box(town,0x55483c,x+side*.98,6.45,pavilionZ+1.72,.40,.58,.08);
    }
    mesh(town,new THREE.CylinderGeometry(.68,2.13,.66,8),red,x,topHeight-.25,pavilionZ);
    mesh(town,new THREE.CylinderGeometry(.22,.81,.56,8),0x8d2929,x,topHeight+.30,pavilionZ);
    mesh(town,new THREE.CylinderGeometry(0,.22,.58,8),0xb98b43,x,topHeight+.84,pavilionZ);
    mesh(town,new THREE.SphereGeometry(.11,10,7),0xe0ad54,x,topHeight+1.13,pavilionZ);
  }
  const pavilionSign = label('HPCA WELCOMES YOU',9,'#253746',0);
  pavilionSign.position.set(0,4.78,facade+.17);
  town.add(pavilionSign);
  const scoreboard = label('HPCA  •  DHARAMSHALA',7,'#263435',0);
  scoreboard.position.set(24,4.15,z-19);
  scoreboard.rotation.y=-.45;
  town.add(scoreboard);
  for(const dx of [-2.2,2.2]) box(town,0x4f5856,24+dx,1.92,z-19,.13,3.84,.14);
  for(const x of [-30,30]) {
    for(const dz of [-22,22]) {
      const support=mesh(town,new THREE.CylinderGeometry(.11,.24,11,12),0x8b9696,x,5.5,z+dz);
      support.material.roughness=.6;
      box(town,0x87857b,x,.23,z+dz,.75,.46,.75);
      box(town,0x46585b,x,11,z+dz,3,1.25,.4);
      for(let i=-2;i<=2;i++) box(town,0xffebba,x+i*.52,11,z+dz+.22,.36,.69,.07);
    }
  }
}
