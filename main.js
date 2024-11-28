"use strict";

// Import only what you need, to help your bundler optimize final code size using tree shaking
// see https://developer.mozilla.org/en-US/docs/Glossary/Tree_shaking)

import {
  AmbientLight,
  BoxGeometry,
  Clock,
  Color,
  CylinderGeometry,
  HemisphereLight,
  Mesh,
  MeshNormalMaterial,
  MeshPhongMaterial,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  Vector3,
  MeshBasicMaterial,
  Box3,
  Raycaster,
  DoubleSide,
  LineBasicMaterial,
  BufferGeometry,
  Line,
  Group,
  BufferAttribute,
  PointsMaterial,
  TextureLoader,
  AdditiveBlending,
  Points,
  PlaneGeometry
} from 'three';

// XR Emulator
import { DevUI } from '@iwer/devui';
import { XRDevice, metaQuest3 } from 'iwer';

// XR
import { XRButton } from 'three/addons/webxr/XRButton.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

// If you prefer to import the whole library, with the THREE prefix, use the following line instead:
// import * as THREE from 'three'

// NOTE: three/addons alias is supported by Rollup: you can use it interchangeably with three/examples/jsm/  

// Importing Ammo can be tricky.
// Vite supports webassembly: https://vitejs.dev/guide/features.html#webassembly
// so in theory this should work:
//
// import ammoinit from 'three/addons/libs/ammo.wasm.js?init';
// ammoinit().then((AmmoLib) => {
//  Ammo = AmmoLib.exports.Ammo()
// })
//
// But the Ammo lib bundled with the THREE js examples does not seem to export modules properly.
// A solution is to treat this library as a standalone file and copy it using 'vite-plugin-static-copy'.
// See vite.config.js
// 
// Consider using alternatives like Oimo or cannon-es

import {
  OrbitControls,

} from 'three/addons/controls/OrbitControls.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import {
  GLTFLoader
} from 'three/addons/loaders/GLTFLoader.js';
import { getRndInteger, updateScore,isLookingAt } from './utils';
import { checkCollision } from './utils';
import { winOrNot } from './utils';
import { rotateObject,moveSperm } from './movement';

// Example of hard link to official repo for data, if needed
// const MODEL_PATH = 'https://raw.githubusercontent.com/mrdoob/js/r148/examples/models/gltf/LeePerrySmith/LeePerrySmith.glb';

async function setupXR(xrMode) {

  if (xrMode !== 'immersive-vr') return;

  // iwer setup: emulate vr session
  let nativeWebXRSupport = false;
  if (navigator.xr) {
    nativeWebXRSupport = await navigator.xr.isSessionSupported(xrMode);
  }

  if (!nativeWebXRSupport) {
    const xrDevice = new XRDevice(metaQuest3);
    xrDevice.installRuntime();
    xrDevice.fovy = (75 / 180) * Math.PI;
    xrDevice.ipd = 0;
    window.xrdevice = xrDevice;
    xrDevice.controllers.right.position.set(0.15649, 1.43474, -0.38368);
    xrDevice.controllers.right.quaternion.set(
      0.14766305685043335,
      0.02471366710960865,
      -0.0037767395842820406,
      0.9887216687202454,
    );
    xrDevice.controllers.left.position.set(-0.15649, 1.43474, -0.38368);
    xrDevice.controllers.left.quaternion.set(
      0.14766305685043335,
      0.02471366710960865,
      -0.0037767395842820406,
      0.9887216687202454,
    );
    new DevUI(xrDevice);
  }
}

await setupXR('immersive-ar');



// INSERT CODE HERE
let camera, scene, renderer;
let controller;

var center_position = new Vector3(0,0,0);
const cameraVector = new Vector3(); // create once and reuse it!

const geometryCone = new CylinderGeometry(0, 0.05, 0.2, 32).rotateX(Math.PI / 2);

const materialCone = new MeshPhongMaterial({ color: 0xffffff * Math.random() });
//const raycaster = new Raycaster();
var nb_sperm = 8;
var spermSpeed = 0.1;
var spermArr = [];
var BoxArr = [];

const viseurcss = document.getElementById("viseurcss");


const clock = new Clock();

var spermatozoide;

//get the center of the camera and if the position of the center og the camera is the same as the object then kill it



function spermGenerate(sperm){
  var sperm = sperm.clone();
  //add sperm random position


    var sideZ= getRndInteger(-1,1);
    var sideX = getRndInteger(-1,1);
    sperm.scale.set(0.01,0.01,0.01);
    sperm.position.set(sideX*getRndInteger(1.2,2.5),getRndInteger(-1,2) , sideZ*getRndInteger(1.2,2.5)).applyMatrix4(controller.matrixWorld);
    sperm.quaternion.setFromRotationMatrix(controller.matrixWorld);
    sperm.lookAt(center_position);
    sperm.rotation.y-=Math.PI/3;
    sperm.traverse(function(child) {
      if (child.isMesh) {
          child.material = new MeshPhongMaterial({ color: 0xffffff });
          child.material.side = DoubleSide;
          }});
    scene.add(sperm);
    spermArr.push([sperm,0]);
    
    BoxArr.push((new Box3(new Vector3(), new Vector3())).setFromObject(sperm));
  
}
function gltfReader(gltf) {
  for(let i =0;i<nb_sperm;i++)
  {
    spermGenerate(gltf.scene);
  }
  renderer.render(scene,camera);
}

function loadData() {
  if(window.location.host=="gregoiremlly.github.io")
  {
    new GLTFLoader()
    .setPath('./assets/models/')
    .load('spermatozoide.gltf', gltfReader);
  }
  else{
    new GLTFLoader()
    .setPath('./zugotepages/assets/models/')
    .load('spermatozoide.gltf', gltfReader);
  }
  
}




loadData();


function checkHit() {
  for (let i = 0; i<spermArr.length; i++)
  {
    if (isLookingAt(camera.position,spermArr[i][0].position,camera.getWorldDirection(cameraVector)))
    {
      //console.log(spermArr[i]);
      if(spermArr[i][1]>= 20)
      {
        console.log('explosion at ');
        console.log(spermArr[i][0].position);
        const explosionCenter = spermArr[i][0].position;
        // Créer un effet d'explosion
        const explosion = createExplosionEffect(explosionCenter);
        // Ajouter l'explosion à la scène
        scene.add(explosion.particles);
       /* spermArr[i][0].traverse(function(child) { // mort du sperm
          if (child.isMesh) {
              // Position de l'explosion
             

              //child.material = new MeshPhongMaterial({ color: 0x000000 });
          }
        });*/
      }
      else{
        spermArr[i][0].traverse(function(child) {
          if (child.isMesh) {
              child.material = new MeshPhongMaterial({ color: 0xffffff * Math.random() });
          }
        });
        spermArr[i][1]+=1;
      }
      
    }
  }
  /*
  // Raycast from the controller position and direction
  raycaster.setFromCamera(controller.position, camera);

  // Check if the ray intersects with the cube (or other models)
  const intersects = raycaster.intersectObjects(scene.children);

  // Handle the intersection
  if (intersects.length > 0) {
    const intersectedObject = intersects[0].object;
    //console.log('Model touched:', intersectedObject);
    // You can now trigger an event or effect, such as changing color
    intersectedObject.material.color.set( {color: 0xffffff * Math.random()});  // Change color to red on touch
  }*/
}
//croix-
/*
const geometryviseur = new PlaneGeometry(0.001, 0.01);
const geometryviseur2 = new PlaneGeometry(0.01, 0.001);
  // Définir un matériau noir
const materialviseur = new MeshBasicMaterial({ color: 0x00ff00, side: DoubleSide });

  // Créer le mesh (rectangle) à partir de la géométrie et du matériau
const viseur = new Mesh(geometryviseur, materialviseur);
const viseur2 = new Mesh(geometryviseur2,materialviseur);*/
function createExplosionEffect(center, numParticles = 100, radius = 3) {
  const geometry = new BufferGeometry();
  const positions = new Float32Array(numParticles * 3); // x, y, z pour chaque particule
  const velocities = new Float32Array(numParticles * 3); // Vitesse de chaque particule (déplacement)

  // Générer des positions aléatoires autour du centre de l'explosion
  for (let i = 0; i < numParticles; i++) {
    const angle = Math.random() * Math.PI * 2;
    const elevation = Math.random() * Math.PI - Math.PI / 2;
    const distance = Math.random() * radius;

    // Positions 3D des particules
    positions[i * 3] = center.x + distance * Math.cos(elevation) * Math.cos(angle);
    positions[i * 3 + 1] = center.y + distance * Math.sin(elevation);
    positions[i * 3 + 2] = center.z + distance * Math.cos(elevation) * Math.sin(angle);

    // Vitesse des particules
    velocities[i * 3] = Math.random() * 0.1 - 0.05; // x
    velocities[i * 3 + 1] = Math.random() * 0.1 - 0.05; // y
    velocities[i * 3 + 2] = Math.random() * 0.1 - 0.05; // z
  }
  geometry.setAttribute('position', new BufferAttribute(positions, 3));

  // Matériau des particules (effet de feu d'artifice)
  const material = new PointsMaterial({
    color: 0xffa500,  // Orange (peut être modifié pour un autre effet)
    size: 0.1,       // Taille des particules
    map: new TextureLoader().load('https://threejs.org/examples/textures/sprites/spark1.png'),
    blending: AdditiveBlending, // Effet lumineux
    transparent: true,
  });
    // Créer l'objet Points qui représente l'explosion
    const particles = new Points(geometry, material);

    return { particles, velocities };
  }






// Main loop
const animate = () => {
  //console.log(camera.getWorldDirection(cameraVector));
  const delta = clock.getDelta();
  const elapsed = clock.getElapsedTime();
  checkHit();
  // can be used in shaders: uniforms.u_time.value = elapsed;
  for (let i = 0; i < spermArr.length; i++) {
    const direction = new Vector3().subVectors(center_position, spermArr[i][0].position);
    direction.normalize();  
    direction.multiplyScalar(spermSpeed * delta);
    spermArr[i][0].position.add(direction);
    //spermArr[i].rotation.x+=0.1;
  }
  //viseur.position.set(camera.position.x,camera.position.y,camera.position.z-0.1);
  //viseur2.position.set(camera.position.x,camera.position.y,camera.position.z-0.1);
  renderer.render(scene, camera);

};



const init = () => {
  scene = new Scene();

  const aspect = window.innerWidth / window.innerHeight;
  camera = new PerspectiveCamera(75, aspect, 0.1, 10); // meters
  camera.position.set(0, 0, 0);
  center_position = camera.position;

  const light = new AmbientLight(0xffffff, 1.0); // soft white light
  scene.add(light);

  const hemiLight = new HemisphereLight(0xffffff, 0xbbbbff, 3);
  hemiLight.position.set(0.5, 1, 0.25);
  scene.add(hemiLight);

  renderer = new WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate); // requestAnimationFrame() replacement, compatible with XR 
  renderer.xr.enabled = true;
  document.body.appendChild(renderer.domElement);

  
  

  const xrButton = XRButton.createButton(renderer, {});
  xrButton.style.backgroundColor = 'skyblue';
  document.body.appendChild(xrButton);

  //const controls = new OrbitControls(camera, renderer.domElement);
  //controls.listenToKeyEvents(window); // optional
  //controls.target.set(0, 1.6, 0);
  //controls.update();
  // Handle input: see THREE.js webxr_ar_sperms
//y = hauteur
//z = profonderu
//x = horizontal
  const onSelect = (event) => {

    //sperm.position.set(0, 0, -0.3).applyMatrix4(controller.matrixWorld);
    //sperm.quaternion.setFromRotationMatrix(controller.matrixWorld);
    //scene.add(sperm);

  }
  controller = renderer.xr.getController(0);
  controller.addEventListener('select', onSelect);
  scene.add(controller);
  var spermtest = new Mesh(geometryCone, materialCone);
  spermtest.position.set(0,0, -2).applyMatrix4(controller.matrixWorld);
  spermtest.lookAt(center_position);
  //spermtest.quaternion.setFromRotationMatrix(controller.matrixWorld);
  spermArr.push([spermtest,0]);
  scene.add(spermtest);

  const ovule = new Mesh(new BoxGeometry( 0.1, 0.1, 0.1 ),new MeshBasicMaterial( {color: 0x00ff00} ));
  ovule.position.set(0,1.7,-1);
  viseurcss.style.display = "block";
  //scene.add(ovule);
  
  //viseur.position.set(camera.position.x,camera.position.y+1.6,camera.position.z-0.1);
  //viseur2.position.set(camera.position.x,camera.position.y+1.6,camera.position.z-0.1);
  //rectangle.position.z -=0.5;
  
  //scene.add(viseur);
  //scene.add(viseur2);

  //add sperm random position

  window.addEventListener('resize', onWindowResize, false);
}


 
init();




function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

}
