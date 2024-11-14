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
  MeshBasicMaterial
} from 'three';

// XR Emulator
import { DevUI } from '@iwer/devui';
import { XRDevice, metaQuest3 } from 'iwer';

// XR
import { XRButton } from 'three/addons/webxr/XRButton.js';

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
import { getRndInteger, updateScore } from './utils';
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

const geometryCone = new CylinderGeometry(0, 0.05, 0.2, 32).rotateX(Math.PI / 2);

const materialCone = new MeshPhongMaterial({ color: 0xffffff * Math.random() });
var nb_sperm = 15;
var spermSpeed = 0.5;
var spermArr =[];


const clock = new Clock();

// Main loop
const animate = () => {

  const delta = clock.getDelta();
  const elapsed = clock.getElapsedTime();
  
  // can be used in shaders: uniforms.u_time.value = elapsed;
  for (let i = 0; i < spermArr.length; i++) {
    const direction = new Vector3().subVectors(new Vector3(0, 0, 0), spermArr[i].position);
    direction.normalize();  
    direction.multiplyScalar(spermSpeed * delta);
    spermArr[i].position.add(direction);
  }
  renderer.render(scene, camera);
};


const init = () => {
  scene = new Scene();

  const aspect = window.innerWidth / window.innerHeight;
  camera = new PerspectiveCamera(75, aspect, 0.1, 10); // meters
  camera.position.set(0, 1.6, 3);

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

  const controls = new OrbitControls(camera, renderer.domElement);
  //controls.listenToKeyEvents(window); // optional
  controls.target.set(0, 1.6, 0);
  controls.update();
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
  spermtest.position.set(0,0, -0.8).applyMatrix4(controller.matrixWorld);
  spermtest.lookAt(0,0,0);
  //spermtest.quaternion.setFromRotationMatrix(controller.matrixWorld);
  spermArr.push(spermtest);
  scene.add(spermtest);

  const ovule = new Mesh(new BoxGeometry( 1, 1, 1 ),new MeshBasicMaterial( {color: 0x00ff00} ));
  ovule.position.set(0,0,0);
  scene.add(ovule);

  //add sperm random position
  for (let i = 0; i <nb_sperm ; i++) {

    var sideZ= getRndInteger(-1,1);
    var sideX = getRndInteger(-1,1);
    var sperm = new Mesh(geometryCone, materialCone);
    sperm.position.set(sideX*getRndInteger(1.2,2.5),getRndInteger(-1,2) , sideZ*getRndInteger(1.2,2.5)).applyMatrix4(controller.matrixWorld);
    sperm.quaternion.setFromRotationMatrix(controller.matrixWorld);
    scene.add(sperm);
    spermArr.push(sperm);
  }
  window.addEventListener('resize', onWindowResize, false);
}
 
init();

//

/*
function loadData() {
  new GLTFLoader()
    .setPath('assets/models/')
    .load('test.glb', gltfReader);
}


function gltfReader(gltf) {
  let testModel = null;

  testModel = gltf.scene;

  if (testModel != null) {
    console.log("Model loaded:  " + testModel);
    scene.add(gltf.scene);
  } else {
    console.log("Load FAILED.  ");
  }
}

loadData();
*/


// camera.position.z = 3;




function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

}
