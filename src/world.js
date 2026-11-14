import * as THREE from 'three';
import { districts, people } from './people.js';
import './style.css';

const $ = id => document.getElementById(id);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf2cb8f);
scene.fog = new THREE.FogExp2(0xe9bd87, 0.003);
const camera = new THREE.PerspectiveCamera(44, 1, 0.1, 480);
const world = $('world');
const enter = $('enter');
const panel = $('panel');
const picker = $('district');
const keys = new Set();
const directions = {
  ArrowUp:[0,-1], ArrowDown:[0,1], ArrowLeft:[-1,0], ArrowRight:[1,0],
  w:[0,-1], s:[0,1], a:[-1,0], d:[1,0],
};
const characters = [];
const colliders = [];
const materials = new Map();
const cube = new THREE.BoxGeometry();
const ray = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const focus = new THREE.Vector3();
const destination = new THREE.Vector3();
const offset = new THREE.Vector3(18,22,25);
let walking = false;
let activeDistrict = 0;
let renderer;
let seed = 1337;

function random() {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
}

function mesh(parent, geometry, color, x, y, z) {
  if (!materials.has(color)) materials.set(color, new THREE.MeshStandardMaterial({color, flatShading:true}));
  const object = new THREE.Mesh(geometry, materials.get(color));
  object.position.set(x,y,z);
  parent.add(object);
  return object;
}

function box(parent, color, x, y, z, width, height, depth) {
  const object = mesh(parent, cube, color, x,y,z);
  object.scale.set(width,height,depth);
  return object;
}

function mountain(parent, x, z, width, height, color, snow) {
  const peak = mesh(parent, new THREE.ConeGeometry(width,height,5),color,x,height/2-8,z);
  peak.rotation.y = random()*Math.PI;
  if (snow) {
    const cap = mesh(parent,new THREE.ConeGeometry(width*.36,height*.36,5),0xe9ddc9,x,height*.82-7.93,z);
    cap.rotation.y = peak.rotation.y;
  }
}

function pine(parent,x,z,height,color) {
  box(parent,0x594030,x,height*.2,z,.28,height*.4,.28);
  for (let layer=0;layer<3;layer++) {
    mesh(parent,new THREE.ConeGeometry(height*(.25-layer*.045),height*.6,6),
      color,x,height*(.43+layer*.18),z);
  }
}

function building(parent,x,z,width,depth,height,color,roof,y=0) {
  box(parent,0x625e51,x,y+.25,z,width+.35,.5,depth+.35);
  box(parent,color,x,y+height/2,z,width,height,depth);
  const top = mesh(parent,new THREE.ConeGeometry(1,1,4),roof,x,y+height+.65,z);
  top.rotation.y = Math.PI/4;
  top.scale.set(width*.79,1.45,depth*.79);
  for(let side of [-1,1]) {
    for(let col of [-1,1]) {
      box(parent,0x463b31,x+col*width*.24,y+height*.69,z+side*depth*.503,.78,.89,.10);
      box(parent,0xf1bd79,x+col*width*.24,y+height*.69,z+side*depth*.513,.53,.65,.10);
    }
  }
  box(parent,0x514338,x,y+.75,z+depth*.503,.83,1.48,.12);
}

function lanterns(parent) {
  const flags = [0xcd633e,0xf0bd50,0x4c8198,0xf5dfb6,0x678468];
  for (const z of [-12,8,23]) {
    box(parent,0x504339,-7,2.7,z,.15,5.4,.15);
    box(parent,0x504339,7,2.7,z,.15,5.4,.15);
    box(parent,0x504339,0,5.22,z,14,.055,.055);
    for(let i=0;i<15;i++) box(parent,flags[i%5],-6.5+i*.93,4.95,z,.58,.5,.08).rotation.z = (i-7)*.03;
  }
}

function districtTown(district) {
  const town = new THREE.Group();
  town.position.x = district.x;
  scene.add(town);
  box(town,0x888758,0,-.48,1,116,.85,132);
  box(town,0xc3a17d,0,.01,1,12,.17,77);
  box(town,0xc7aa85,0,.025,-2,33,.16,11);
  for(let i=0;i<22;i++) {
    box(town,0xb39372,-5.3,.105,-32+i*3.25,.33,.04,2.6);
    box(town,0xb39372,5.3,.105,-32+i*3.25,.33,.04,2.6);
  }

  const roofs = [0x664741,0x536b60,0x8d492f,0x4c5558];
  const walls = [district.color,0xd0ac79,0xe3c68d,0x8e9c82];
  for(const side of [-1,1]) {
    for(let row=0;row<8;row++) {
      if(row===4) continue;
      const x = side*(10+random()*1.7);
      const z = -37+row*8.5;
      const width = 4.7 + random()*2.3;
      const depth = 4.1 + random()*2;
      building(town,x,z,width,depth,2.6+random()*3,walls[row%4],roofs[(row+1)%4]);
      colliders.push([district.x+x,z,width/2+.6,depth/2+.6]);
      building(town,side*(19+random()*3),z+1,width,depth,3.8+random()*3,walls[(row+2)%4],roofs[row%4],1.4);
    }
  }
  for (let i=0;i<110;i++) {
    const x = (random()<.5?-1:1)*(15+random()*45);
    const z = -55+random()*105;
    if (Math.abs(x)>25 || z<-37 || z>28) pine(town,x,z,1.8+random()*4,district.trees);
  }
  for(let i=0;i<15;i++) {
    mountain(town,-100+i*15+random()*9,-96-random()*38,16+random()*26,30+random()*37,[0x727a72,0x737c79,0xa19881][i%3],true);
  }
  for(let i=0;i<11;i++) {
    mountain(town,-62+i*12,-65-random()*13,17+random()*13,12+random()*20,[0x657052,0x797e5a,0x8f8762][i%3],false);
  }
  lanterns(town);
}

function figure(color,skin=0xbb825e) {
  const group = new THREE.Group();
  const legs = [-.17,.17].map(x=>box(group,0x333c38,x,.36,0,.21,.63,.28));
  box(group,color,0,1,0,.65,.70,.39);
  for(const x of [-.38,.38]) box(group,color,x,.96,0,.15,.64,.24);
  box(group,skin,0,1.61,0,.43,.43,.39);
  box(group,0x3d2e28,0,1.84,-.01,.47,.15,.43);
  for(const x of [-.09,.09]) box(group,0x312620,x,1.64,.204,.045,.045,.026);
  group.userData.legs = legs;
  return group;
}

function marker() {
  const sign = new THREE.Group();
  mesh(sign,new THREE.OctahedronGeometry(.25),0xffb648,0,2.35,0);
  return sign;
}

for (const district of districts) {
  districtTown(district);
  picker.add(new Option(district.name));
}

people.forEach((person,index)=>{
  const character = figure(person.color);
  character.position.set(districts[person.district].x+person.x,.09,person.z);
  character.add(marker());
  character.userData.profile = index;
  scene.add(character);
  characters.push(character);
});

const player = figure(0x365d58);
scene.add(player);
player.visible = false;
for(const [color,intensity] of [[0xfff0d0,2.1],[0xd7e6f5,.8]]) {
  const light = new THREE.DirectionalLight(color,intensity);
  light.position.set(intensity===2.1 ? -35 : 25,45,-18);
  scene.add(light);
}
scene.add(new THREE.HemisphereLight(0xffe1ab,0x5f6348,2.0));

function teleport(index) {
  activeDistrict = index;
  picker.selectedIndex = index;
  const district = districts[index];
  player.position.set(district.x,.11,5);
  player.rotation.y = Math.PI;
  focus.copy(player.position);
  $('arrival').textContent = district.name;
}

function openPanel(kicker,title) {
  $('panel-kicker').textContent = kicker;
  $('panel-title').textContent = title;
  $('panel-body').replaceChildren();
  if(!panel.open) panel.showModal();
  keys.clear();
  return $('panel-body');
}

function profile(person) {
  const body = openPanel('Fictional profile · '+districts[person.district].name,person.name);
  const role = document.createElement('strong');
  role.textContent = person.role;
  const story = document.createElement('p');
  story.textContent = person.story;
  body.append(role,story);
}

function search() {
  const body = openPanel('Dharamshala · fictional profiles','Find someone');
  const input = document.createElement('input');
  input.type = 'search';
  input.placeholder = 'Name, craft or neighborhood';
  input.setAttribute('aria-label','Search profiles');
  const list = document.createElement('ul');
  function update() {
    const query = input.value.trim().toLowerCase();
    const matches = people.filter(person=>[person.name,person.role,districts[person.district].name].join(' ').toLowerCase().includes(query));
    list.replaceChildren();
    for(const person of matches) {
      const item = document.createElement('li');
      const link = document.createElement('button');
      const description = document.createElement('small');
      description.textContent = person.role+' · '+districts[person.district].name;
      link.append(person.name,description);
      link.onclick = ()=>{
        teleport(person.district);
        profile(person);
        panel.querySelector('.close').focus();
      };
      item.append(link);
      list.append(item);
    }
    if(!matches.length) {
      const empty = document.createElement('li');
      empty.textContent = 'No profiles found.';
      list.append(empty);
    }
  }
  body.append(input,list);
  input.addEventListener('input',update);
  update();
  input.focus();
}

enter.onclick = ()=>{
  walking = true;
  $('intro').hidden = true;
  $('hud').hidden = false;
  player.visible = true;
  teleport(0);
  $('home').focus();
};
$('home').onclick = ()=>{
  walking = false;
  keys.clear();
  player.visible = false;
  $('intro').hidden = false;
  $('hud').hidden = true;
  enter.focus();
};
$('find').onclick = search;
picker.onchange = ()=>teleport(picker.selectedIndex);

window.addEventListener('keydown',event=>{
  const key = event.key.length===1 ? event.key.toLowerCase() : event.key;
  if(!walking || panel.open || event.target===picker || !Object.hasOwn(directions,key)) return;
  event.preventDefault();
  keys.add(key);
});
window.addEventListener('keyup',event=>keys.delete(event.key.length===1 ? event.key.toLowerCase() : event.key));
window.addEventListener('blur',()=>keys.clear());
for(const button of $('pad').querySelectorAll('button')) {
  const key = button.dataset.key;
  button.addEventListener('pointerdown',event=>{
    button.setPointerCapture(event.pointerId);
    keys.add(key);
  });
  for(const type of ['pointerup','pointercancel','lostpointercapture']) {
    button.addEventListener(type,()=>keys.delete(key));
  }
  button.addEventListener('click',event=>{
    if(event.detail===0) move(...directions[key],.9);
  });
}

function move(x,z,step) {
  const district = districts[activeDistrict];
  const canWalk = (nextX,nextZ)=> !colliders.some(([cx,cz,w,d])=>Math.abs(nextX-cx)<w && Math.abs(nextZ-cz)<d);
  const nextX = THREE.MathUtils.clamp(player.position.x+x*step,district.x-14,district.x+14);
  const nextZ = THREE.MathUtils.clamp(player.position.z+z*step,-37,34);
  if(canWalk(nextX,player.position.z)) player.position.x = nextX;
  if(canWalk(player.position.x,nextZ)) player.position.z = nextZ;
  player.rotation.y = Math.atan2(x,z);
}

function resize() {
  camera.aspect = world.clientWidth/world.clientHeight;
  camera.fov = camera.aspect<.8 ? 58 : 44;
  camera.updateProjectionMatrix();
  renderer.setSize(world.clientWidth,world.clientHeight);
}

let previous = 0;
function frame(time) {
  const dt = Math.min((time-previous)/1000,.05);
  previous = time;
  if (walking) {
    let x=0,z=0;
    for(const key of keys) {
      x += directions[key][0];
      z += directions[key][1];
    }
    const length = Math.hypot(x,z);
    if(length) move(x/length,z/length,dt*8);
    player.userData.legs.forEach((leg,index)=>leg.rotation.x = length ? Math.sin(time*.017+index*Math.PI)*.52 : 0);
    focus.lerp(player.position,1-Math.exp(-dt*7));
    destination.copy(focus).add(offset);
    camera.position.copy(destination);
    camera.lookAt(focus);
  } else {
    const angle = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : Math.sin(time*.00011)*.1;
    camera.position.set(25+angle*30,22,34);
    camera.lookAt(0,4,-14);
  }
  for(const character of characters) character.children.at(-1).rotation.y = time*.0014;
  renderer.render(scene,camera);
}

try {
  renderer = new THREE.WebGLRenderer({antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .92;
  world.append(renderer.domElement);
  renderer.domElement.addEventListener('click',event=>{
    if(!walking || panel.open) return;
    const bounds = renderer.domElement.getBoundingClientRect();
    pointer.set((event.clientX-bounds.left)/bounds.width*2-1,1-(event.clientY-bounds.top)/bounds.height*2);
    ray.setFromCamera(pointer,camera);
    const visibleCharacters = characters.filter(character=>people[character.userData.profile].district===activeDistrict);
    const hit = ray.intersectObjects(visibleCharacters,true)[0];
    if(!hit) return;
    let target = hit.object;
    while(target.userData.profile===undefined) target = target.parent;
    profile(people[target.userData.profile]);
  });
  resize();
  window.addEventListener('resize',resize);
  renderer.setAnimationLoop(frame);
  enter.disabled = false;
} catch(error) {
  $('load-error').hidden = false;
  console.error(error);
}
