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
  PlaneGeometry,
  Matrix4,
  
} from 'three';

// XR Emulator
import { DevUI } from '@iwer/devui';
import { XRDevice, metaQuest3 } from 'iwer';
import { gsap } from 'gsap';

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
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';import {
  GLTFLoader
} from 'three/addons/loaders/GLTFLoader.js';
import { getRndInteger, updateScore,isLookingAt,calculateDistance } from './utils';
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
const raycaster = new Raycaster();
var nb_sperm = 20;
var spermSpeed = 0.1;
var spermArr = [];
var BoxArr = [];
var explosionArr=[];

const viseurcss = document.getElementById("viseurcss");
var dirs = [];
var parts = [];
const explosionDuration = 4;
let elapsedTime = 0;
let explosionFinished = false;

const clock = new Clock();

var spermatozoide;
let currentScore = 0;
const fontLoader = new FontLoader();
let scoreMesh;  // Mesh pour afficher le texte du score
//get the center of the camera and if the position of the center og the camera is the same as the object then kill it



function spermGenerate(sperm){
  var sperm = sperm.clone();
  //add sperm random position


    var sideZ= getRndInteger(-1,1);
    var sideX = getRndInteger(-1,1);
    sperm.scale.set(0.01,0.01,0.01);
    sperm.position.set(sideX*getRndInteger(1.2,2.5),getRndInteger(-1,2) , sideZ*getRndInteger(1.2,2.5));//.applyMatrix4(controller.matrixWorld);
    sperm.quaternion.setFromRotationMatrix(controller.matrixWorld);
    sperm.lookAt(center_position);
    //sperm.rotation.y-=Math.PI/3;
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





function checkHit(time) {
  for (let i = 0; i<spermArr.length; i++)
  {

    if (isLookingAt(camera.position,spermArr[i][0].position,camera.getWorldDirection(cameraVector)))// si le sperm est dans la ligne de vue de la caméra
    {
      if(spermArr[i][1]>= 20) // si le sperm meurt
      {
        createScoreText(currentScore+1);
        currentScore+=1;
        var sideZ= getRndInteger(-1,1);
        var sideX = getRndInteger(-1,1);
        parts.push(new ExplodeAnimation(spermArr[i][0].position.x,spermArr[i][0].position.y,spermArr[i][0].position.z));
        //scene.remove(spermArr[i][0]);
        
        spermArr[i][0].position.set(sideX*getRndInteger(1.2,2.5),getRndInteger(-1,2) , sideZ*getRndInteger(1.2,2.5)).applyMatrix4(controller.matrixWorld);
        spermArr[i][0].traverse(function(child) {
          if (child.isMesh) {
              child.material = new MeshPhongMaterial({ color: 0xffffff * Math.random() });
          }
        });
        //spermArr.splice(i, 1);

      }
      else{ // si le sperm est touché
        spermArr[i][0].traverse(function(child) {
          if (child.isMesh) {
              child.material = new MeshPhongMaterial({ color: 0xffffff * Math.random() });
          }
        });
        spermArr[i][1]+=1;
      }
    }
    if (calculateDistance(spermArr[i][0].position.x,spermArr[i][0].position.z,camera.position.x,camera.position.z)<0.09)// si un sperm touche la caméra
    {
      
      console.log('lost');
      createEndMessage();
      createReplayButton();
      for(let i = 0;i<spermArr.length;i++)
        {
          scene.remove(spermArr[i][0]);
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

//score

function createScoreText(score) {
  if(score ==30)
  {
    console.log('win');
    for(let i = 0;i<spermArr.length;i++)
    {
      scene.remove(spermArr[i][0]);
    }
    createEndMessage();
    createReplayButton();

  }
  fontLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function (font) {
    // Créer la géométrie du texte avec le score
    const textGeometry = new TextGeometry(`Score: ${score}`, {
      font: font,
      size: 1,        // Taille du texte
      depth: 0.2,    // Profondeur du texte
    });

    const textMaterial = new MeshBasicMaterial({ color: 0xee82ee });
    
    // Si un ancien score existe, on le supprime
    if (scoreMesh) {
      scene.remove(scoreMesh);
    }

    // Créer un mesh pour le score et l'ajouter à la scène
    scoreMesh = new Mesh(textGeometry, textMaterial);
    
    // Positionner le texte dans la scène (devant la caméra)
    scoreMesh.position.set(0, 2.5, -6);

    scene.add(scoreMesh);
  });
}
const tempMatrix = new Matrix4();  // Stocke la transformation du contrôleur

// Création du bouton 3D
let buttonMesh;
let controller1;
const loader = new FontLoader();
let group;




function createEndMessage() {
  loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function (font) {
    const textGeometry = new TextGeometry('Fin', {
      font: font,
      size: 1,
      height: 0.2,
    });
    const textMaterial = new MeshBasicMaterial({ color: 0xff0000 });
    const textMesh = new Mesh(textGeometry, textMaterial);
    textMesh.position.set(-2, 1.2, -3);  // Centrer le texte
    scene.add(textMesh);
  });
}
// Fonction pour créer un bouton 3D cliquable "Replay"
function createReplayButton() {
  
  scene.add(buttonMesh);
  scene.add(group);
}


function onButtonClick() {
  console.log("Replay button clicked!");
  buttonMesh.material.color.set(0xff0000);  // Changer la couleur du bouton pour indiquer le clic
}


//explosion
function ExplodeAnimation(x, y, z) {
  var movementSpeed = 80;       // Vitesse de mouvement des particules
  var totalObjects = 1000;      // Nombre total de particules
  var objectSize = 10;          // Taille des particules
  var sizeRandomness = 4000;    // Aléatoire pour les distances
  var colors = [0xFF0FFF, 0xCCFF00, 0xFF000F, 0x996600, 0xFFFFFF];  // Couleurs des particules

  // Créer une BufferGeometry pour les particules
  const geometry = new BufferGeometry();

  // Tableaux pour les positions des particules
  const positions = new Float32Array(totalObjects * 3);  // 3 coordonnées pour chaque particule

  // Initialiser les positions et les directions des particules
  for (let i = 0; i < totalObjects; i++) {
    const index = i * 3;
    positions[index] = x + (Math.random() - 0.5) * sizeRandomness;   // Position X avec aléatoire
    positions[index + 1] = y + (Math.random() - 0.5) * sizeRandomness; // Position Y avec aléatoire
    positions[index + 2] = z + (Math.random() - 0.5) * sizeRandomness; // Position Z avec aléatoire

    // Stocker les directions aléatoires pour chaque particule
    dirs.push({
      x: (Math.random() * movementSpeed) - (movementSpeed / 2),   // Direction X
      y: (Math.random() * movementSpeed) - (movementSpeed / 2),   // Direction Y
      z: (Math.random() * movementSpeed) - (movementSpeed / 2)    // Direction Z
    });
  }

  // Attribuer les positions à la géométrie
  geometry.setAttribute('position', new BufferAttribute(positions, 3));

  // Créer le matériau des particules
  const material = new PointsMaterial({
    size: objectSize,
    color: colors[Math.floor(Math.random() * colors.length)]  // Couleur aléatoire parmi les choix
  });

  // Créer un système de particules
  const particles = new Points(geometry, material);

  // Ajouter l'objet à la scène
  this.object = particles;
  this.status = true;
  scene.add(this.object);

  // Méthode de mise à jour pour animer l'explosion
  this.update = function () {
    if (this.status === true) {
      const positions = this.object.geometry.attributes.position.array;
      
      // Mettre à jour les positions des particules
      for (let i = 0; i < totalObjects; i++) {
        const index = i * 3;
        
        // Mettre à jour les coordonnées des particules
        positions[index] += dirs[i].x;
        positions[index + 1] += dirs[i].y;
        positions[index + 2] += dirs[i].z;
      }

      // Indiquer que les positions des particules ont été mises à jour
      this.object.geometry.attributes.position.needsUpdate = true;
    }
  }
}
//croix-

//laser
let laserMesh;


// Fonction pour mettre à jour la position et la direction du laser
function updateLaser() {
  // Positionner le laser à la position de la caméra
  laserMesh.position.copy(camera.position);

  // Calculer la direction dans laquelle la caméra regarde
  const laserDirection = new Vector3();
  camera.getWorldDirection(laserDirection);

  // Positionner l'extrémité du laser dans la direction de la caméra
  const laserEndPosition = new Vector3();
  laserEndPosition.copy(laserDirection).multiplyScalar(2.5).add(camera.position);

  // Ajuster la position et la rotation du laser pour qu'il pointe dans la bonne direction
  laserMesh.lookAt(laserEndPosition);
}
// Main loop
const animate = (time) => {
  //console.log(camera.getWorldDirection(cameraVector));
  const delta = clock.getDelta();
  const elapsed = clock.getElapsedTime();
  updateLaser();
  checkHit(time);
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

function afterThreeSeconds() {
  console.log('3 secondes se sont écoulées!');
}

// Utiliser setTimeout pour attendre 3 secondes (3000 millisecondes)

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
  createScoreText(0);
  
  

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
  group = new Group();
  
  const buttonGeometry = new BoxGeometry(0.3, 0.2, 0.1);
  const buttonMaterial = new MeshBasicMaterial({ color: 0x00ff00 });
  buttonMesh = new Mesh(buttonGeometry, buttonMaterial);
  group.add(buttonMesh);
  controller1 = renderer.xr.getController(0);
  scene.add(controller1);
  const controllerModelFactory = new XRControllerModelFactory();
  const controllerGrip1 = renderer.xr.getControllerGrip(0);
  controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
  scene.add(controllerGrip1);
  buttonMesh.position.set(0, 1, -1);  // Positionner sous le texte

  const laserGeometry = new CylinderGeometry(0.02, 0.02, 5, 32);  // Un cylindre long et fin
  const laserMaterial = new MeshBasicMaterial({ color: 0xff0000 });
  laserMesh = new Mesh(laserGeometry, laserMaterial);

  // Rotation du laser pour qu'il soit aligné avec l'axe Z
  laserMesh.rotation.x = Math.PI / 2;  // Tourne de 90 degrés
  scene.add(laserMesh);  // Ajoute le laser à la scène





  //spermtest.quaternion.setFromRotationMatrix(controller.matrixWorld);
  //spermArr.push([spermtest,0]);
 // scene.add(spermtest);

  const ovule = new Mesh(new BoxGeometry( 0.1, 0.1, 0.1 ),new MeshBasicMaterial( {color: 0x00ff00} ));
  ovule.position.set(0,1.7,-1);

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
controller1.addEventListener('selectstart', function () {
  // Utiliser un raycaster pour vérifier l'intersection entre le bouton et le contrôleur
  tempMatrix.identity().extractRotation(controller1.matrixWorld);
  raycaster.ray.origin.setFromMatrixPosition(controller1.matrixWorld);
  raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

  const intersects = raycaster.intersectObject(buttonMesh);

  if (intersects.length > 0) {
    onButtonClick();  // Appeler la fonction de clic si intersection
  }
});



function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

}
