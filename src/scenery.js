import * as THREE from 'three';
import { label } from './landmarks.js';

export function surfaceTexture(color, kind) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const context = canvas.getContext('2d');
  const tint = new THREE.Color(color);
  context.fillStyle = '#' + tint.getHexString();
  context.fillRect(0,0,128,128);
  let seed = color;
  for(let i=0;i<1550;i++) {
    seed = (Math.imul(seed,1664525)+1013904223)>>>0;
    context.fillStyle = i%2 ? 'rgba(255,255,255,.12)' : 'rgba(20,24,22,.15)';
    const size = kind==='grass' ? 2.5 : 1.3;
    context.fillRect(seed%128,(seed>>>10)%128,size,1);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function ridges(town, mesh) {
  const layers = [
    {z:-154, color:0x829baa, height:60, phase:1, snow:true},
    {z:-119, color:0x778b97, height:46, phase:4, snow:true},
    {z:-93, color:0x627b65, height:20, phase:7, snow:false},
  ];
  for(const layer of layers) {
    const vertices=[], colors=[];
    const rock = new THREE.Color(layer.color), snow = new THREE.Color(0xf2eee4);
    const heightAt = x => {
      const waves = .62 + .16*Math.sin(x*.038+layer.phase) + .13*Math.sin(x*.095-2*layer.phase);
      return layer.height*(waves + .07*Math.sin(x*.21) + .028*Math.sin(x*.57+layer.phase));
    };
    const point = (x,row) => {
      const fraction = row/9;
      const h = heightAt(x);
      const detail = Math.sin(x*.45+row*.8)*Math.sin(row*2+x*.21);
      return [x+Math.sin(row*1.7+x)*.7,h*fraction-6+detail*(1-fraction)*4,
        layer.z+(1-fraction)*24+Math.sin(x*.11+layer.phase)*6+detail*2.1];
    };
    for(let x=-174;x<174;x+=3) {
      for(let row=0;row<9;row++) {
        const a=point(x,row), b=point(x+3,row), c=point(x,row+1), d=point(x+3,row+1);
        for(const triangle of [[a,b,c],[b,d,c]]) {
          const cover=(row+.5)/9;
          const snowline=.72 + .14*Math.sin(x*.19+layer.phase) + .05*Math.cos(x*.47);
          const tone=(layer.snow && cover>snowline ? snow : rock).clone();
          tone.multiplyScalar(.83+.16*Math.sin(x*.23+row*1.9)+.1*Math.cos(x*.61+row));
          for(const vertex of triangle) {
            vertices.push(...vertex);
            colors.push(tone.r,tone.g,tone.b);
          }
        }
      }
    }
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
    geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
    geometry.computeVertexNormals();
    const ridge=mesh(town,geometry,0xffffff,0,0,0);
    ridge.material = new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,side:THREE.DoubleSide});
    ridge.castShadow=false;
  }
}

export function storefront(town,box,x,z,width,height,depth,side,shop,roof) {
  const front = x-side*(width/2+.026);
  box(town,0x40525b,front,1.14,z,.10,1.77,depth*.68);
  for(const dz of [-depth*.26,0,depth*.26]) {
    box(town,0x9b7450,front-side*.06,1.15,z+dz,.10,1.82,.1);
  }
  box(town,0x524335,front-side*.06,.38,z,.12,.12,depth*.69);
  for(let i=0;i<9;i++) {
    const awning=box(town,i%2 ? 0xf3dea9 : roof,front-side*.57,2.45,z+(i-4)*depth*.085,1.15,.085,depth*.092);
    awning.rotation.z=side*.16;
    box(town,i%2 ? 0xf3dea9 : roof,front-side*1.1,2.40,z+(i-4)*depth*.085,.08,.23,depth*.092);
  }
  const sign=label(shop,Math.min(3.3,depth*.73),'#3f4135');
  sign.position.set(front-side*.25,Math.min(height-.18,2.93),z);
  town.add(sign);
  if(height>3.65) {
    for(const dz of [-depth*.22,depth*.22]) {
      box(town,0x3b453f,front,height-.78,z+dz,.12,.91,.75);
      box(town,0xb4c4b0,front-side*.075,height-.78,z+dz,.10,.71,.55);
      box(town,0x635649,front-side*.15,height-1.13,z+dz,.32,.10,.81);
    }
  }
}

export function streetDetails(town,index,{box,mesh,pine}) {
  const wheel = new THREE.CylinderGeometry(.37,.37,.24,14);
  const sapling = new THREE.IcosahedronGeometry(.65,1);
  for(const side of [-1,1]) {
    for(const z of [-20,-7,14,28]) {
      box(town,0x384744,side*6.6,1.85,z,.105,3.7,.105);
      box(town,0x384744,side*6.27,3.64,z,.72,.10,.11);
      box(town,0xf6d99f,side*5.96,3.59,z,.27,.1,.23);
      if(z===-7 || z===14) {
        box(town,0x9e7450,side*6.6,.28,z+2,.68,.54,.68);
        mesh(town,sapling,0x567c45,side*6.6,.76,z+2);
      }
      for(const dz of [-1.5,1.5]) {
        box(town,0x555c52,side*5.58,.13,z+dz,.09,.012,1.9);
      }
    }
  }
  for(const [x,z,color] of [[-4,3,0x377786],[4,23,0xd6c6a0],[-4,31,0x9b4538]]) {
    box(town,color,x,.61,z,1.65,.57,3.25);
    box(town,0x50656a,x,1.04,z-.13,1.44,.54,1.88);
    box(town,color,x,1.32,z-.17,1.5,.10,1.42);
    box(town,0x575651,x,.41,z+1.63,1.63,.13,.12);
    for(const dx of [-.69,.69]) for(const dz of [-1.03,1.03]) {
      const tire=mesh(town,wheel,0x292e31,x+dx,.34,z+dz);
      tire.rotation.z=Math.PI/2;
      box(town,dz<0 ? 0xf6dfaa : 0xb03428,x+dx,.66,z+Math.sign(dz)*1.64,.30,.17,.08);
    }
  }
  for(const [x,z] of [[7,-2],[-7,16]]) {
    box(town,0x695238,x,.73,z,1.02,.16,1.8);
    box(town,0x473d2d,x,.43,z,.58,.62,1.16);
    box(town,0xc99a50,x,1.95,z,1.24,.12,2.0);
    for(const dz of [-.8,.8]) box(town,0x524638,x,1.36,z+dz,.075,1.19,.075);
    for(let i=0;i<6;i++) {
      const fruit=mesh(town,new THREE.IcosahedronGeometry(.15,0),i%2 ? 0xd98839 : 0x8b9b43,x+(i%2-.5)*.38,.91,z+(i-2.5)*.22);
      fruit.rotation.y=i;
    }
  }
  if(index===3) {
    for(const side of [-1,1]) {
      box(town,0x68594b,side*4.75,1.55,-24,.55,3.1,.57);
      box(town,0xbc9f77,side*4.75,3.14,-24,.8,.22,.8);
      for(let i=0;i<9;i++) {
        const x=side*(5.3+i*1.19);
        box(town,0x6e7361,x,.75,-24,1.12,1.35,.06);
        for(const dx of [-.38,0,.38]) box(town,0x4b594d,x+dx,.76,-23.95,.052,1.33,.10);
      }
      pine(town,side*13,-14,6.9,0x385b44);
    }
    box(town,0x534439,0,3.1,-24,9.3,.22,.28);
    const gate=label('HPCA CRICKET STADIUM',7.5,'#6a352e');
    gate.position.set(0,3.35,-23.9);
    town.add(gate);
  }
}
