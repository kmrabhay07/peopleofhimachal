import * as THREE from 'three';
import { districts, people } from './people.js';
import { buildLandmark, label, landmarks } from './landmarks.js';
import { ridges, storefront, streetDetails, surfaceTexture } from './scenery.js';
import './style.css';

const $ = id => document.getElementById(id);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9ccce2);
scene.fog = new THREE.FogExp2(0xb5d4df, 0.003);
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
const towns = [];
const colliders = [];
const materials = new Map();
const cube = new THREE.BoxGeometry();
const ray = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const focus = new THREE.Vector3();
const destination = new THREE.Vector3();
const look = new THREE.Vector3();
let yaw = 0, pitch = .16, drag = null, suppressClick = false, nearby = null;
const interact = $('interact');
let walking = false;
let activeDistrict = 0;
let renderer;
let seed = 1337;

function random() {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
}

function mesh(parent, geometry, color, x, y, z) {
  if (!materials.has(color)) {
    const kind = {0x555b61:'asphalt',0x7e8b59:'grass',0x3b854e:'grass',0x468f54:'grass',0xc8b9a0:'stone'}[color];
    materials.set(color, new THREE.MeshStandardMaterial({
      color:kind ? 0xffffff : color, map:kind ? surfaceTexture(color,kind) : null, roughness:.88, flatShading:true
    }));
  }
  const object = new THREE.Mesh(geometry, materials.get(color));
  object.position.set(x,y,z);
  object.castShadow = y>.35;
  object.receiveShadow = true;
  parent.add(object);
  return object;
}

function box(parent, color, x, y, z, width, height, depth) {
  const object = mesh(parent, cube, color, x,y,z);
  object.scale.set(width,height,depth);
  return object;
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

function districtTown(district,index) {
  const town = new THREE.Group();
  town.position.x = district.x;
  scene.add(town);
  towns.push(town);
  box(town,0x7e8b59,0,-.53,-10,116,1,150);
  box(town,0x555b61,0,.01,index===3?6.5:1,10,.17,index===3?67:78);
  for(const side of [-1,1]) {
    box(town,0xc8b9a0,5.95*side,.03,index===3?6.5:1,1.9,.18,index===3?67:78);
    for(let i=0;i<(index===3?33:38);i++) box(town,i%2 ? 0xe5b54a : 0x353a3d,5.04*side,.11,38-i*2,.25,.13,1.94);
  }
  for(let i=0;i<(index===3?11:12);i++) box(town,0xe6e1ca,0,.105,34-i*6, .12,.02,2.7);
  for(const z of [-6,13]) for(let i=-4;i<=4;i++) box(town,0xece6d6,i*.95,.12,z,.48,.021,2.05);
  box(town,0x555b61,0,.015,-2,33,.17,9);
  for(let i=index===3?3:0;i<22;i++) {
    box(town,0xb39372,-5.3,.105,-32+i*3.25,.33,.04,2.6);
    box(town,0xb39372,5.3,.105,-32+i*3.25,.33,.04,2.6);
  }

  const roofs = [0x664741,0x536b60,0x8d492f,0x4c5558];
  const walls = [district.color,0xd0ac79,0xe3c68d,0x8e9c82];
  const shops = ['CHAI & MOMOS','KANGRA TEA','BOOK SHOP','WOOL & WEAVE','HILL BAKERY','TIBETAN CRAFTS','CRICKET SHOP','CORNER CAFE'];
  for(const side of [-1,1]) {
    for(let row=0;row<8;row++) {
      if(row===4 || (index===3 && row<3) || (index!==3 && row===0)) continue;
      const x = side*(10+random()*1.7);
      const z = -37+row*8.5;
      const width = 4.7 + random()*2.3;
      const depth = 4.1 + random()*2;
      const height=3.35+random()*2.3;
      building(town,x,z,width,depth,height,walls[row%4],roofs[(row+1)%4]);
      storefront(town,box,x,z,width,height,depth,side,shops[(row+(side===1?3:0))%shops.length],roofs[row%4]);
      colliders.push([district.x+x,z,width/2+.6,depth/2+.6]);
      building(town,side*(19+random()*3),z+1,width,depth,3.8+random()*3,walls[(row+2)%4],roofs[row%4],1.4);
    }
  }
  for (let i=0;i<110;i++) {
    const x = (random()<.5?-1:1)*(15+random()*45);
    const z = -55+random()*105;
    if ((index!==3 || z>-17 || Math.abs(x)>37) && (Math.abs(x)>25 || z>28)) pine(town,x,z,1.8+random()*4,district.trees);
  }
  ridges(town,mesh);
  lanterns(town);
  buildLandmark(town,index,{box,mesh,pine});
  streetDetails(town,index,{box,mesh,pine});
  for(const [x,z] of [[-4,3],[4,23],[-4,31]]) colliders.push([district.x+x,z,1,1.8]);
  if(index!==3) colliders.push([district.x+(index===4?-7:0),-37,index===1?4.3:6.4,index===1?7:4.6]);
}

function figure(color,skin=0xbb825e) {
  const group = new THREE.Group();
  const limbs = new THREE.CapsuleGeometry(.112,.41,3,8);
  const legs = [-.145,.145].map(x=>{
    const pivot = new THREE.Group();
    pivot.position.set(x,.68,0);
    group.add(pivot);
    mesh(pivot,limbs,0x39484c,0,-.28,0);
    box(pivot,0x2a3031,0,-.64,.075,.22,.15,.38);
    return pivot;
  });
  const jacket = mesh(group,new THREE.CylinderGeometry(.30,.23,.62,10),color,0,1,0);
  jacket.scale.z=.77;
  for(const x of [-.315,.315]) {
    const arm=mesh(group,limbs,color,x,1.01,0);
    arm.rotation.z=Math.sign(x)*.13;
    mesh(group,new THREE.SphereGeometry(.097,8,5),skin,x*1.09,.68,0);
  }
  mesh(group,new THREE.CylinderGeometry(.11,.11,.20,10),skin,0,1.38,0);
  const head=mesh(group,new THREE.SphereGeometry(.228,12,8),skin,0,1.61,0);
  head.scale.y=1.17;
  const hair=mesh(group,new THREE.SphereGeometry(.233,12,8,0,Math.PI*2,0,Math.PI*.57),0x342c27,0,1.65,-.023);
  hair.scale.y=1.15;
  for(const x of [-.082,.082]) box(group,0x342c27,x,1.65,.209,.035,.038,.025);
  group.userData.legs = legs;
  return group;
}

function marker() {
  const sign = new THREE.Group();
  mesh(sign,new THREE.OctahedronGeometry(.25),0xffb648,0,2.35,0);
  return sign;
}

for (const [index,district] of districts.entries()) {
  districtTown(district,index);
  picker.add(new Option(district.name));
}

people.forEach((person,index)=>{
  const character = figure(person.color);
  character.position.set(districts[person.district].x+person.x,.09,person.z);
  character.add(marker());
  const nameplate = label(person.name,2.65);
  nameplate.position.y = 2.9;
  character.add(nameplate);
  character.userData.profile = index;
  scene.add(character);
  characters.push(character);
});

const player = figure(0x4b776c,0xbd885f);
scene.add(player);
player.visible = false;
const sun = new THREE.DirectionalLight(0xffebcd,2.45);
sun.castShadow = true;
sun.shadow.mapSize.set(1024,1024);
Object.assign(sun.shadow.camera,{left:-37,right:37,top:40,bottom:-40,near:1,far:160});
sun.shadow.normalBias = .045;
scene.add(sun,sun.target);
scene.add(new THREE.HemisphereLight(0xc9e4ff,0x89906a,2.0));

function teleport(index) {
  activeDistrict = index;
  showDistrict(index);
  picker.selectedIndex = index;
  const district = districts[index];
  player.position.set(district.x,.11,index===3?-9:8);
  yaw=0; pitch=.16;
  player.rotation.y = Math.PI;
  focus.copy(player.position);
  $('arrival').textContent = district.name;
  interact.hidden = true;
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

function showLandmark(place) {
  const body = openPanel('Dharamshala landmarks',place.name);
  const copy = document.createElement('p');
  copy.textContent = place.description;
  const source = document.createElement('a');
  source.href = place.source;
  source.textContent = 'About the real landmark ↗';
  source.target = '_blank';
  source.rel = 'noopener noreferrer';
  body.append(copy,source);
}

function places() {
  const body = openPanel('Explore Dharamshala','Landmarks');
  const list = document.createElement('ul');
  for(const place of [landmarks[3],landmarks[0],landmarks[4],landmarks[1],landmarks[2]]) {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.textContent = place.name;
    button.onclick = ()=>{
      teleport(place.district);
      panel.close();
    };
    item.append(button);
    list.append(item);
  }
  body.append(list);
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
  teleport(3);
  $('home').focus();
};
$('home').onclick = ()=>{
  walking = false;
  keys.clear();
  player.visible = false;
  $('intro').hidden = false;
  showDistrict(3);
  $('hud').hidden = true;
  enter.focus();
};
$('find').onclick = search;
$('places').onclick = places;
interact.onclick = ()=>{
  if(!nearby) return;
  if(nearby.story) profile(nearby);
  else showLandmark(nearby);
};
picker.onchange = ()=>teleport(picker.selectedIndex);

window.addEventListener('keydown',event=>{
  const key = event.key.length===1 ? event.key.toLowerCase() : event.key;
  if(!walking || panel.open || event.target===picker || event.ctrlKey || event.metaKey || event.altKey) return;
  if(key==='e' && !event.repeat && !interact.hidden) {
    interact.click();
    return;
  }
  if(key==='f' && !event.repeat) {
    search();
    return;
  }
  if(key!=='Shift' && !Object.hasOwn(directions,key)) return;
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
    if(event.detail===0) walkRelative(...directions[key],.9);
  });
}

function walkRelative(x,z,step) {
  const cos = Math.cos(yaw), sin = Math.sin(yaw);
  move(x*cos+z*sin,-x*sin+z*cos,step);
}

function move(x,z,step) {
  const district = districts[activeDistrict];
  const canWalk = (nextX,nextZ)=> !colliders.some(([cx,cz,w,d])=>Math.abs(nextX-cx)<w && Math.abs(nextZ-cz)<d);
  const nextX = THREE.MathUtils.clamp(player.position.x+x*step,district.x-(activeDistrict===3?23:14),district.x+(activeDistrict===3?23:14));
  const nextZ = THREE.MathUtils.clamp(player.position.z+z*step,activeDistrict===3?-62:-44,34);
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

function showDistrict(index) {
  towns.forEach((town,i)=>{ town.visible = i===index; });
  characters.forEach((character,i)=>{ character.visible = people[i].district===index; });
  const x = districts[index].x;
  sun.position.set(x-29,48,8);
  sun.target.position.set(x,0,-24);
  renderer.shadowMap.needsUpdate = true;
}

let previous = 0;
function frame(time) {
  const dt = Math.min((time-previous)/1000,.05);
  previous = time;
  if (walking) {
    let x=0,z=0;
    for(const key of keys) {
      if(!directions[key]) continue;
      x += directions[key][0];
      z += directions[key][1];
    }
    const length = Math.hypot(x,z);
    if(length && !panel.open) walkRelative(x/length,z/length,dt*(keys.has('Shift')?13:7.2));
    if(length) renderer.shadowMap.needsUpdate = true;
    player.userData.legs.forEach((leg,index)=>leg.rotation.x = length ? Math.sin(time*.017+index*Math.PI)*.52 : 0);
    focus.lerp(player.position,1-Math.exp(-dt*7));
    destination.set(focus.x+Math.sin(yaw)*5.8,focus.y+2.9+pitch*3,focus.z+Math.cos(yaw)*5.8);
    camera.position.copy(destination);
    look.set(focus.x-Math.sin(yaw)*9,focus.y+2.1-pitch*7,focus.z-Math.cos(yaw)*9);
    camera.lookAt(look);
    const position = player.position;
    const district = districts[activeDistrict];
    nearby = people.find(person=>person.district===activeDistrict && Math.hypot(position.x-district.x-person.x,position.z-person.z)<3.2);
    const place = landmarks[activeDistrict];
    if(!nearby && Math.hypot(position.x-district.x-place.x,position.z-place.z-8)<5.5) nearby = place;
    interact.hidden = !nearby || panel.open;
    if(nearby) {
      const caption = (nearby.story ? 'Meet ' : 'Explore ') + nearby.name + ' · E';
      if (interact.textContent!==caption) interact.textContent = caption;
    }
  } else {
    const angle = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : Math.sin(time*.00011)*.1;
    camera.position.set(381+angle*30,26,-10);
    camera.lookAt(360,6,-67);
  }
  for(const character of characters) character.children.at(-2).rotation.y = time*.0014;
  renderer.render(scene,camera);
}

try {
  renderer = new THREE.WebGLRenderer({antialias:true});
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .92;
  world.append(renderer.domElement);
  const canvas = renderer.domElement;
  canvas.addEventListener('pointerdown',event=>{
    if(!walking || panel.open || event.button!==0) return;
    drag = {id:event.pointerId, x:event.clientX, y:event.clientY};
    suppressClick = false;
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove',event=>{
    if(drag?.id!==event.pointerId) return;
    const dx = event.clientX-drag.x, dy = event.clientY-drag.y;
    if(!suppressClick && Math.hypot(dx,dy)<4) return;
    suppressClick = true;
    yaw -= dx*.007;
    pitch = THREE.MathUtils.clamp(pitch-dy*.006,-.42,.65);
    drag.x = event.clientX;
    drag.y = event.clientY;
  });
  for(const event of ['pointerup','pointercancel','lostpointercapture']) {
    canvas.addEventListener(event,()=>{ drag = null; });
  }
  canvas.addEventListener('click',event=>{
    if(!walking || panel.open || suppressClick) return;
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
  showDistrict(3);
  resize();
  window.addEventListener('resize',resize);
  renderer.setAnimationLoop(frame);
  enter.disabled = false;
} catch(error) {
  $('load-error').hidden = false;
  console.error(error);
}
