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
    box(parent,0x504339,-16,2.7,z,.15,5.4,.15);
    box(parent,0x504339,16,2.7,z,.15,5.4,.15);
    box(parent,0x504339,0,5.22,z,32,.055,.055);
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

function figure(color,skin=0xbb825e,style=0) {
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
  jacket.userData.avatarTint=true;
  jacket.scale.z=.77;
  for(const x of [-.315,.315]) {
    const arm=mesh(group,limbs,color,x,1.01,0);
    arm.userData.avatarTint=true;
    arm.rotation.z=Math.sign(x)*.13;
    mesh(group,new THREE.SphereGeometry(.097,8,5),skin,x*1.09,.68,0).userData.avatarSkin=true;
  }
  mesh(group,new THREE.CylinderGeometry(.11,.11,.20,10),skin,0,1.38,0).userData.avatarSkin=true;
  const head=mesh(group,new THREE.SphereGeometry(.228,12,8),skin,0,1.61,0);
  head.userData.avatarSkin=true;
  head.scale.y=1.17;
  const hair=mesh(group,new THREE.SphereGeometry(.233,12,8,0,Math.PI*2,0,Math.PI*.57),0x342c27,0,1.65,-.023);
  hair.scale.y=1.15;
  for(const x of [-.082,.082]) box(group,0x342c27,x,1.65,.209,.035,.038,.025);
  if(style===2 || style===3) {
    const backHair=mesh(group,new THREE.CapsuleGeometry(.21,.37,4,10),0x342c27,0,1.45,-.10);
    backHair.scale.z=.62;
    const coat=mesh(group,new THREE.CylinderGeometry(.23,.32,.36,10),color,0,.73,0);
    coat.scale.z=.75;
  } else {
    box(group,0x354744,0,.73,0,.47,.13,.35);
  }
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

let player = figure(0x4b776c,0xbd885f);
scene.add(player);
player.visible = false;
const visitors = new Map();
const onlineButton = $('online');
const presenceStatus = $('presence');
const avatarStyles = [
  {name:'Male · Pine',color:0x4b776c,skin:0xbd885f},
  {name:'Male · Marigold',color:0xc58a36,skin:0x9e653f},
  {name:'Female · Glacier',color:0x4b75af,skin:0xd8aa87},
  {name:'Female · Rhododendron',color:0xac5273,skin:0xae734f},
];
let savedProfile = {};
try { savedProfile = JSON.parse(localStorage.getItem('walkProfile') || '{}') || {}; } catch {}
let live = null;
let presenceTimer;

function clearVisitors() {
  for (const visitor of visitors.values()) {
    visitor.traverse(object=>{
      if(object.isSprite) {
        object.material.map.dispose();
        object.material.dispose();
      }
      if (object.isMesh && object.geometry!==cube) object.geometry.dispose();
    });
    visitor.removeFromParent();
  }
  visitors.clear();
}

async function syncPresence(session) {
  if(live!==session || !walking) return;
  const district = activeDistrict;
  const body = JSON.stringify({
    id:session.id,district,x:player.position.x-districts[district].x,
    z:player.position.z,yaw:player.rotation.y,name:session.name,avatar:session.avatar,designation:session.designation
  });
  try {
    const response = await fetch('/api/presence',{
      method:'POST',headers:{'Content-Type':'application/json'},body,
      signal:AbortSignal.timeout(4500)
    });
    if(!response.ok) throw new Error('Presence unavailable');
    const next = await response.json();
    if(live!==session || district!==activeDistrict) return;
    const ids=new Set(next.map(person=>person.id));
    for(const [id,avatar] of visitors) {
      avatar.visible=ids.has(id);
    }
    for(const person of next) {
      let avatar=visitors.get(person.id);
      if(!avatar) {
        const style=avatarStyles[person.avatar] || avatarStyles[0];
        avatar=figure(style.color,style.skin,person.avatar);
        const badge=label(person.name || 'Guest',3.2,'#684054');
        badge.position.y=2.25;
        avatar.add(badge);
        if(person.designation) {
          const role=label(person.designation,2.65,'#344c46');
          role.position.y=1.93;
          avatar.add(role);
        }
        avatar.userData.target=new THREE.Vector3(districts[district].x+person.x,.11,person.z);
        avatar.position.copy(avatar.userData.target);
        scene.add(avatar);
        visitors.set(person.id,avatar);
      }
      avatar.userData.visitor=person;
      avatar.visible=true;
      avatar.userData.target.set(districts[district].x+person.x,.11,person.z);
      avatar.rotation.y=person.yaw;
    }
    if(visitors.size>80) clearVisitors();
    presenceStatus.textContent=next.length ? `${next.length} nearby` : 'Live · nobody nearby yet';
  } catch {
    if(live===session) {
      clearVisitors();
      presenceStatus.textContent='Live walk reconnecting…';
    }
  } finally {
    if(live===session) presenceTimer=setTimeout(()=>syncPresence(session),1400);
  }
}

function leaveLiveWalk() {
  if(!live) return;
  const id=live.id;
  live=null;
  clearTimeout(presenceTimer);
  clearVisitors();
  onlineButton.textContent='Become visible';
  onlineButton.setAttribute('aria-pressed','false');
  presenceStatus.textContent='';
  fetch('/api/presence',{method:'POST',headers:{'Content-Type':'application/json'},keepalive:true,
    body:JSON.stringify({id,leave:true,district:activeDistrict,x:0,z:0,yaw:0})
  }).catch(()=>{});
}

onlineButton.onclick=()=>{
  if(live) {
    leaveLiveWalk();
    return;
  }
  const body=openPanel('Live walk','Choose your name and avatar');
  const form=document.createElement('form');
  const name=document.createElement('input');
  name.required=true;
  name.maxLength=24;
  name.placeholder='Display name';
  name.setAttribute('aria-label','Display name');
  name.value=savedProfile.name || '';
  name.addEventListener('input',()=>name.setCustomValidity(''));
  const designation=document.createElement('input');
  designation.placeholder='Designation or role';
  designation.setAttribute('aria-label','Designation or role');
  designation.maxLength=32;
  designation.required=true;
  designation.value=savedProfile.designation || '';
  designation.addEventListener('input',()=>designation.setCustomValidity(''));
  const choices=document.createElement('fieldset');
  const preview=document.createElement('canvas');
  preview.className='avatar-preview';
  preview.width=480;
  preview.height=240;
  preview.setAttribute('aria-label','Full-body avatar preview');
  const previewScene=new THREE.Scene();
  previewScene.background=new THREE.Color(0xd9c8a7);
  previewScene.add(new THREE.HemisphereLight(0xfff5e1,0x927859,2.7));
  const previewCamera=new THREE.PerspectiveCamera(34,2,.1,20);
  previewCamera.position.set(.95,1.4,3.3);
  previewCamera.lookAt(0,.93,0);
  let previewRenderer;
  try { previewRenderer=new THREE.WebGLRenderer({canvas:preview,antialias:true}); } catch {}
  function drawPreview(index) {
    if(!previewRenderer) return;
    const style=avatarStyles[index] || avatarStyles[0];
    const model=figure(style.color,style.skin,index);
    previewScene.add(model);
    previewRenderer.render(previewScene,previewCamera);
    model.removeFromParent();
    model.traverse(part=>{if(part.isMesh && part.geometry!==cube) part.geometry.dispose();});
  }
  panel.addEventListener('close',()=>previewRenderer?.dispose(),{once:true});
  drawPreview(savedProfile.avatar || 0);
  const legend=document.createElement('legend');
  legend.textContent='Avatar';
  choices.append(legend);
  avatarStyles.forEach((style,index)=>{
    const choice=document.createElement('label');
    const radio=document.createElement('input');
    radio.type='radio';
    radio.name='avatar';
    radio.value=index;
    radio.onchange=()=>drawPreview(index);
    radio.checked=(savedProfile.avatar || 0)===index;
    const swatch=document.createElement('span');
    swatch.className='swatch';
    swatch.style.backgroundColor='#'+style.color.toString(16).padStart(6,'0');
    choice.append(radio,swatch,style.name);
    choices.append(choice);
  });
  const submit=document.createElement('button');
  submit.textContent='Join live walk';
  form.append(name,designation,preview,choices,submit);
  form.onsubmit=event=>{
    event.preventDefault();
    if(!name.value.trim()) {
      name.setCustomValidity('Enter a display name.');
      name.reportValidity();
      return;
    }
    if(!designation.value.trim()) {
      designation.setCustomValidity('Enter a designation or role.');
      designation.reportValidity();
      return;
    }
    savedProfile={designation:designation.value.trim(),name:name.value.trim(),avatar:Number(new FormData(form).get('avatar'))};
    try { localStorage.setItem('walkProfile',JSON.stringify(savedProfile)); } catch {}
    const style=avatarStyles[savedProfile.avatar];
    const next=figure(style.color,style.skin,savedProfile.avatar);
    next.position.copy(player.position);
    next.rotation.copy(player.rotation);
    player.removeFromParent();
    player.traverse(part=>{if(part.isMesh && part.geometry!==cube) part.geometry.dispose();});
    player=next;
    scene.add(player);
    live={id:crypto.randomUUID(),...savedProfile};
    onlineButton.textContent='Leave live walk';
    onlineButton.setAttribute('aria-pressed','true');
    presenceStatus.textContent='Connecting…';
    panel.close();
    syncPresence(live);
  };
  body.append(form);
  name.focus();
};
window.addEventListener('pagehide',leaveLiveWalk);
const sun = new THREE.DirectionalLight(0xffebcd,2.45);
sun.castShadow = true;
sun.shadow.mapSize.set(2048,2048);
Object.assign(sun.shadow.camera,{left:-37,right:37,top:40,bottom:-40,near:1,far:160});
sun.shadow.normalBias = .045;
scene.add(sun,sun.target);
scene.add(new THREE.HemisphereLight(0xc9e4ff,0x89906a,2.0));

function teleport(index) {
  clearVisitors();
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
  if(document.pointerLockElement) document.exitPointerLock();
  if(!panel.open) panel.showModal();
  keys.clear();
  stopJoystick();
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

function visitorProfile(person) {
  const body=openPanel('Live visitor · '+districts[activeDistrict].name,person.name || 'Guest');
  const role=document.createElement('p');
  role.textContent=person.designation || 'Visiting Dharamshala';
  body.append(role);
}

function pause() {
  const body=openPanel(live ? 'Live in Dharamshala' : 'Exploring invisibly','Paused');
  const actions=document.createElement('div');
  actions.className='pause-actions';
  function action(label,run) {
    const button=document.createElement('button');
    button.textContent=label;
    button.onclick=run;
    actions.append(button);
  }
  action('Resume',()=>panel.close());
  action(live ? 'Become invisible' : 'Become visible',()=>{
    if(live) { leaveLiveWalk(); panel.close(); }
    else onlineButton.click();
  });
  action('Find someone',search);
  action('Travel to a landmark',places);
  if(document.fullscreenEnabled) action(document.fullscreenElement ? 'Exit full screen' : 'Full screen',async ()=>{
    try {
      if(document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
      panel.close();
    } catch {}
  });
  action('Mouse look',()=>{
    panel.close();
    const canvas=renderer.domElement;
    try { canvas.requestPointerLock?.()?.catch(()=>{}); } catch {}
  });
  action('Back to title',()=>{
    panel.close();
    returnToTitle();
  });
  body.append(actions);
  actions.firstElementChild.focus();
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
    const online=[...visitors.values()].filter(avatar=>avatar.visible).map(avatar=>avatar.userData.visitor);
    const directory=[...online,...people];
    const matches = directory.filter(person=>[person.name,person.role || person.designation,districts[person.district ?? activeDistrict].name].join(' ').toLowerCase().includes(query));
    list.replaceChildren();
    for(const person of matches) {
      const item = document.createElement('li');
      const link = document.createElement('button');
      const description = document.createElement('small');
      description.textContent = person.story ? person.role+' · '+districts[person.district].name : (person.designation || 'Guest')+' · Live nearby';
      link.append(person.name,description);
      link.onclick = ()=>{
        if(person.story) { teleport(person.district); profile(person); }
        else visitorProfile(person);
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
  $('pause').focus();
};
function returnToTitle() {
  stopJoystick();
  leaveLiveWalk();
  walking = false;
  keys.clear();
  player.visible = false;
  $('intro').hidden = false;
  showDistrict(3);
  $('hud').hidden = true;
  enter.focus();
}
$('pause').onclick = pause;
$('find').onclick = search;
$('places').onclick = places;
interact.onclick = ()=>{
  if(!nearby) return;
  if(nearby.story) profile(nearby);
  else if(nearby.id) visitorProfile(nearby);
  else showLandmark(nearby);
};
picker.onchange = ()=>teleport(picker.selectedIndex);

window.addEventListener('keydown',event=>{
  const key = event.key.length===1 ? event.key.toLowerCase() : event.key;
  if(walking && !panel.open && key==='Escape' && !document.pointerLockElement && event.target!==picker) {
    event.preventDefault();
    pause();
    return;
  }
  if(!walking || panel.open || event.target===picker || event.ctrlKey || event.metaKey || event.altKey) return;
  if(key==='e' && !event.repeat && !interact.hidden) {
    interact.click();
    return;
  }
  if(key==='f' && !event.repeat) {
    event.preventDefault();
    search();
    return;
  }
  if(key!=='Shift' && !Object.hasOwn(directions,key)) return;
  event.preventDefault();
  keys.add(key);
});
window.addEventListener('keyup',event=>keys.delete(event.key.length===1 ? event.key.toLowerCase() : event.key));
window.addEventListener('blur',()=>keys.clear());
function walkRelative(x,z,step) {
  const cos = Math.cos(yaw), sin = Math.sin(yaw);
  move(x*cos+z*sin,-x*sin+z*cos,step);
}

const stick=$('joystick');
const knob=stick.firstElementChild;
const analog={x:0,z:0,id:null};
function stopJoystick() {
  analog.x=analog.z=0;
  analog.id=null;
  knob.style.transform='';
}
function steer(event) {
  if(analog.id!==event.pointerId) return;
  const rect=stick.getBoundingClientRect();
  const radius=rect.width*.32;
  const x=event.clientX-rect.left-rect.width/2;
  const z=event.clientY-rect.top-rect.height/2;
  const length=Math.max(radius,Math.hypot(x,z));
  analog.x=x/length;
  analog.z=z/length;
  knob.style.transform=`translate(${analog.x*radius}px,${analog.z*radius}px)`;
}
stick.addEventListener('pointerdown',event=>{
  if(analog.id!==null || event.button!==0) return;
  analog.id=event.pointerId;
  stick.setPointerCapture(event.pointerId);
  steer(event);
});
stick.addEventListener('pointermove',steer);
for(const type of ['pointerup','pointercancel','lostpointercapture']) {
  stick.addEventListener(type,event=>{if(analog.id===event.pointerId) stopJoystick();});
}
window.addEventListener('blur',stopJoystick);

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
  sun.position.set(x-38,44,14);
  sun.target.position.set(x,0,-24);
  renderer.shadowMap.needsUpdate = true;
}

let previous = 0;
function frame(time) {
  const dt = Math.min((time-previous)/1000,.05);
  previous = time;
  if (walking) {
    let x=analog.x,z=analog.z;
    for(const key of keys) {
      if(!directions[key]) continue;
      x += directions[key][0];
      z += directions[key][1];
    }
    const length = Math.hypot(x,z);
    if(length>.07 && !panel.open) walkRelative(x/Math.max(1,length),z/Math.max(1,length),dt*(keys.has('Shift')?13:7.2));
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
    for(const avatar of visitors.values()) {
      if(avatar.visible && position.distanceToSquared(avatar.position)<10.24) {
        nearby=avatar.userData.visitor;
        break;
      }
    }
    const place = landmarks[activeDistrict];
    if(!nearby && Math.hypot(position.x-district.x-place.x,position.z-place.z-8)<5.5) nearby = place;
    interact.hidden = !nearby || panel.open;
    if(nearby) {
      const caption = (nearby.story || nearby.id ? 'View profile · ' : 'Explore ') + nearby.name + ' · E';
      if (interact.textContent!==caption) interact.textContent = caption;
    }
  } else {
    const angle = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : Math.sin(time*.00011)*.1;
    camera.position.set(381+angle*30,26,-10);
    camera.lookAt(360,6,-67);
  }
  for(const character of characters) character.children.at(-2).rotation.y = time*.0014;
  for(const avatar of visitors.values()) {
    if(!avatar.visible) continue;
    const target=avatar.userData.target;
    const moving=avatar.position.distanceToSquared(target)>.012;
    avatar.position.lerp(target,1-Math.exp(-dt*6));
    avatar.userData.legs.forEach((leg,index)=>leg.rotation.x=moving ? Math.sin(time*.016+index*Math.PI)*.45 : 0);
  }
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
    if(document.pointerLockElement===canvas && walking && !panel.open) {
      yaw -=event.movementX*.004;
      pitch=THREE.MathUtils.clamp(pitch-event.movementY*.004,-.42,.65);
      return;
    }
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
    const liveAvatars=[...visitors.values()].filter(avatar=>avatar.visible);
    const hit = ray.intersectObjects([...visibleCharacters,...liveAvatars],true)[0];
    if(!hit) return;
    let target = hit.object;
    while(target.userData.profile===undefined && !target.userData.visitor) target = target.parent;
    if(target.userData.visitor) visitorProfile(target.userData.visitor);
    else profile(people[target.userData.profile]);
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
