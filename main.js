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
  ConeGeometry,
  AudioListener,
  PositionalAudio,
  AudioLoader,
  DirectionalLight,
  
  
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
import { remove } from 'three/examples/jsm/libs/tween.module.js';

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
const explosionCenter = new Vector3(0, 0, 0);

// Créer un effet d'explosion
const explosion = createExplosionEffect(explosionCenter);
var center_position = new Vector3(0,0,0);
const cameraVector = new Vector3(); // create once and reuse it!

const geometryCone = new CylinderGeometry(0, 0.05, 0.2, 32).rotateX(Math.PI / 2);

const materialCone = new MeshPhongMaterial({ color: 0xffffff * Math.random() });
const raycaster = new Raycaster();
var nb_sperm = 25;
var spermSpeed = 0.055;
var spermArr = [];
var BoxArr = [];
var explosionArr=[];

const viseurcss = document.getElementById("viseurcss");
var dirs = [];
var parts = [];
let gtlfglobal;
const explosionDuration = 4;
let elapsedTime = 0;
let explosionFinished = false;
let textMesh;

const clock = new Clock();

var spermatozoide;
let currentScore = 29;
const fontLoader = new FontLoader();
let scoreMesh;  // Mesh pour afficher le texte du score
//get the center of the camera and if the position of the center og the camera is the same as the object then kill it



function spermGenerate(sperm){
  var sperm = sperm.clone();
  //add sperm random position


    var sideZ= getRndInteger(-1,1);
    var sideX = getRndInteger(-1,1);
    sperm.scale.set(0.01,0.01,0.01);
    var x = sideX*getRndInteger(1.2,2.5);
    var y = getRndInteger(0,2);
    var z = sideZ*getRndInteger(1.2,2.5);
    sperm.position.set(x,y ,z).applyMatrix4(controller.matrixWorld);
    sperm.quaternion.setFromRotationMatrix(controller.matrixWorld);
    sperm.rotation.y+=Math.PI/2;
    if ((x>=2 || x<=2) && z<=0.8 && z>=-0.8)
    {
      if(x>=2)
      {
        sperm.rotation.y+=Math.PI;
        sperm.rotation.y+=Math.PI/2;
      }
      else{
        sperm.rotation.y+=Math.PI/2
      }
    }
    else{
      if((z>=2||z<=2)&& x>=0.8 && x<=0.8 )
        {
          if(z>=2)
          {
            sperm.rotation.y-=Math.PI/2;
            //sperm.rotation.y+=Math.PI;
          }
          else{
            sperm.rotation.y-=Math.PI/2;
          }
        }
        else{
          if (x>0.8 && z>0.8){
            sperm.rotation.y-=2*Math.PI/6;// - 2pi/3

          }
          if(x>0.8 && z < -0.8)
          {
            sperm.rotation.y-=Math.PI/3;
          }
          if(x<-0.8 && z<-0.8)
          {
            sperm.rotation.y+=Math.PI/3;
          }
          if(x<-0.8 && z >0.8)
          {
            sperm.rotation.y-=Math.PI/3;
            sperm.rotation.y+=Math.PI;
          }
        }
        
    }
    
    //sperm.lookAt(camera.position);
    
   
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
  gtlfglobal = gltf;
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
///musique


const listener = new AudioListener();
// L'audio sera écouté depuis la perspective de la caméra

// Créer un PositionalAudio pour placer le son à une position donnée dans la scène
const sound = new PositionalAudio(listener);

// Charger un fichier audio (par exemple, 'music.mp3')
const audioLoader = new AudioLoader();
if(window.location.host=="gregoiremlly.github.io")
  {
    audioLoader.load('./assets/musique/musique-epique-de-skyrim_SCyFcdcI.mp3', function(buffer) {
      // Une fois le fichier chargé, attribuer le buffer au son et le jouer
      sound.setBuffer(buffer);
      sound.setRefDistance(10);  // Distance de référence pour l'atténuation du son
      sound.setLoop(true);  // Boucle si tu veux que la musique continue
             // Jouer la musique
    });
  }
  else{
    audioLoader.load('/zugotepages/public/assets/musique/musique-epique-de-skyrim_SCyFcdcI.mp3', function(buffer) {
      // Une fois le fichier chargé, attribuer le buffer au son et le jouer
      sound.setBuffer(buffer);
      sound.setRefDistance(10);  // Distance de référence pour l'atténuation du son
      sound.setLoop(true);  // Boucle si tu veux que la musique continue
             // Jouer la musique
    });
  }






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
        //parts.push(new ExplodeAnimation(spermArr[i][0].position.x,spermArr[i][0].position.y,spermArr[i][0].position.z));
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

// Ajouter l'explosion à la scène
    scene.add(explosion.particles);
      createEndMessage("Lost replay ?");
      createReplayButton();
      for(let i = 0;i<spermArr.length;i++)
        {
          scene.remove(spermArr[i][0]);
        }
        spermArr = [];
        break;
    }
    spermArr[i][0].rotation.x+=1.5;
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
    createEndMessage("Win Replay ?");
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
    scoreMesh.position.set(2, 3.5, -6);

    scene.add(scoreMesh);
  });
}
const tempMatrix = new Matrix4();  // Stocke la transformation du contrôleur

// Création du bouton 3D
let buttonMesh;
let controller1;
const loader = new FontLoader();
let group;




function createEndMessage(msg) {
  loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function (font) {
    const textGeometry = new TextGeometry(msg, {
      font: font,
      size: 0.7,
      depth: 0.2,
    });
    const textMaterial = new MeshBasicMaterial({ color: 0xff0000 });
    textMesh = new Mesh(textGeometry, textMaterial);
    textMesh.position.set(-2.5, 0.5, -3);  // Centrer le texte
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
  currentScore = 0;
  createScoreText(0);
  spermArr=[];
  for(let i =0;i<nb_sperm;i++)
    {
      spermGenerate(gtlfglobal.scene);
    }
  //buttonMesh.material.color.set(0x000000);  // Changer la couleur du bouton pour indiquer le clic
  scene.remove(buttonMesh);
  scene.remove(textMesh);
  scene.remove(explosion.particles);
  //scene.remove(group);
}


//explosion
function createExplosionEffect(center, numParticles = 1000, radius = 3) {
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

  // Ajouter les positions à la géométrie
  geometry.setAttribute('position', new BufferAttribute(positions, 3));

  // Matériau des particules (effet de feu d'artifice)
  const material = new PointsMaterial({
    color: 0xffa500,  // Orange (peut être modifié pour un autre effet)
    size: 0.3,       // Taille des particules
    map: new TextureLoader().load('https://threejs.org/examples/textures/sprites/spark1.png'),
    blending: AdditiveBlending, // Effet lumineux
    transparent: true,
  });

  // Créer l'objet Points qui représente l'explosion
  const particles = new Points(geometry, material);

  return { particles, velocities };
}

//croix-

//laser
/*
let laserMesh;


// Fonction pour mettre à jour la position et la direction du laser
function updateLaser() {
  // Positionner le laser à la position de la caméra
  laserMesh.position.copy(camera.position);
  laserMesh.position.y-=0.07;
  laserMesh.position.z-=0.1;


  // Calculer la direction dans laquelle la caméra regarde
  const laserDirection = new Vector3();
  camera.getWorldDirection(laserDirection);

  // Positionner l'extrémité du laser dans la direction de la caméra
  const laserEndPosition = new Vector3();
  laserEndPosition.copy(laserDirection).multiplyScalar(-5).add(camera.position);  // Multiplier pour allonger le laser
 laserEndPosition.y-=1;
 
  // Ajuster la position et la rotation du laser pour qu'il pointe dans la bonne direction
  laserMesh.lookAt(camera.getWorldDirection(laserEndPosition));
  laserMesh.rotation.y+=1;
}*/
// Main loop
const animate = (time) => {
  //console.log(camera.getWorldDirection(cameraVector));
  const delta = clock.getDelta();
  const elapsed = clock.getElapsedTime();
  //updateLaser();
  checkHit(time);
  // can be used in shaders: uniforms.u_time.value = elapsed;
  for (let i = 0; i < spermArr.length; i++) {
    const direction = new Vector3().subVectors(center_position, spermArr[i][0].position);
    direction.normalize();  
    direction.multiplyScalar(spermSpeed * delta);
    spermArr[i][0].position.add(direction);
    //spermArr[i][0].lookAt(camera.position);
    //spermArr[i][0].rotation.y+=Math.PI/2;
    //spermArr[i][0].rotation.x+=Math.PI/2;
  }
  //viseur.position.set(camera.position.x,camera.position.y,camera.position.z-0.1);
  //viseur2.position.set(camera.position.x,camera.position.y,camera.position.z-0.1);
  center_position = camera.position;
  sound.position.set(0, 0, 0);
  scene.add(sound);

  const positions = explosion.particles.geometry.attributes.position.array;
  const velocities = explosion.velocities;

  for (let i = 0; i < positions.length / 3; i++) {
    positions[i * 3] += velocities[i * 3];
    positions[i * 3 + 1] += velocities[i * 3 + 1];
    positions[i * 3 + 2] += velocities[i * 3 + 2];

    // Réduire la vitesse au fil du temps (simuler la dissipation)
    velocities[i * 3] *= 0.99;
    velocities[i * 3 + 1] *= 0.99;
    velocities[i * 3 + 2] *= 0.99;
  }

  // Mettre à jour la géométrie des particules après modification des positions
  explosion.particles.geometry.attributes.position.needsUpdate = true;

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

  const sunlight = new DirectionalLight(0xffffff, 10);
  scene.add(sunlight);
  sunlight.position.set(5, 5, 5);  // Position de la lumière (comme un soleil lointain)
  sunlight.castShadow = true;

  const hemiLight = new HemisphereLight(0xffffff, 0xbbbbff, 3);
  hemiLight.position.set(0.5, 1, 0.25);
  //scene.add(hemiLight);

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
  sound.play(); 
  //sperm.position.set(0, 0, -0.3).applyMatrix4(controller.matrixWorld);
  //sperm.quaternion.setFromRotationMatrix(controller.matrixWorld);
  //scene.add(sperm);

}
camera.add(listener);  
  controller = renderer.xr.getController(0);
  controller.addEventListener('select', onSelect);
  scene.add(controller);
  var spermtest = new Mesh(geometryCone, materialCone);
  spermtest.position.set(0,0, -2).applyMatrix4(controller.matrixWorld);
  spermtest.lookAt(center_position);
  group = new Group();
  
  const buttonGeometry = new BoxGeometry(5, 1, 0.1);
  const buttonMaterial = new MeshBasicMaterial({ color: 0x00ff00 });
  buttonMesh = new Mesh(buttonGeometry, buttonMaterial);
  group.add(buttonMesh);
  controller1 = renderer.xr.getController(0);
  scene.add(controller1);
  const controllerModelFactory = new XRControllerModelFactory();
  const controllerGrip1 = renderer.xr.getControllerGrip(0);
  controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
  scene.add(controllerGrip1);
  buttonMesh.position.set(-0.7, 1, -3.1);  // Positionner sous le texte
/*
  //const laserGeometry = new CylinderGeometry(0.01, 0.01, 5, 32);  // Petit rayon, grande longueur
  const laserGeometry = new ConeGeometry(0.05, 2, 32);  // Base de rayon 0.05, hauteur 2
  const laserMaterial = new MeshBasicMaterial({ color: 0xff0000 });
  laserMesh = new Mesh(laserGeometry, laserMaterial);
  laserMesh.side = DoubleSide;
  // Rotation pour aligner le laser dans l'axe Z
  laserMesh.rotation.x = Math.PI / 2;  // Aligné avec l'axe de la caméra
  scene.add(laserMesh);  // Ajouter le laser à la scène
*/




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
