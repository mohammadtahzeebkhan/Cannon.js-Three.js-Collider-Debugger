import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as CANNON from 'cannon-es';
import CannonDebugger from 'cannon-es-debugger';

import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

const renderer = new THREE.WebGLRenderer();



renderer.setSize(window.innerWidth, window.innerHeight);


document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
//scene.background = new THREE.Color(0xffffff);
const ambientLight = new THREE.AmbientLight(0x404040, 50); // Soft white light
scene.add(ambientLight);

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);


const loader = new GLTFLoader();




const dracoLoader = new DRACOLoader();

// Set the path to the Draco decoder files
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/'); // Update with the correct path

// Attach the DRACOLoader to the GLTFLoader
loader.setDRACOLoader(dracoLoader);

let BeeMesh, beemodelBody;
let BeeMeshmixer;
let playbackSpeed = .1;
loader.load('bee.glb', (gltf) => {
  BeeMesh = gltf.scene;
  console.log("beeee--------->", gltf)
  BeeMesh.traverse((child) => {
    if (child.isMesh) {
      child.material.wireframe = false; // Disable wireframe material
    }
  });

  // Set the location of BeeMesh
  BeeMesh.position.set(1, 2, 3); // Replace 1, 2, 3 with the desired coordinates

  // Set the size of BeeMesh
  BeeMesh.scale.set(0.5, 0.5, 0.5); // Replace 0.5, 0.5, 0.5 with the desired scale values

  // Add BeeMesh to the scene
  scene.add(BeeMesh);
  BeeMeshmixer = new THREE.AnimationMixer(BeeMesh);

  // Get the animations from the glTF file
  if (gltf.animations && gltf.animations.length > 0) {
    gltf.animations.forEach((clip) => {
      const action = BeeMeshmixer.clipAction(clip);
      action.play();
      action.setEffectiveTimeScale(playbackSpeed);
    });
  } else {
    console.error('No animations found in the loaded GLTF file.');
  }
});

/* loader.load('bee.glb', (gltf) => {
  BeeMesh = gltf.scene;
  console.log("beeeeeee",BeeMesh)
  BeeMesh.traverse((child) => {
    if (child.isMesh) {
      child.material.wireframe = false; // Apply wireframe material
    }
  });
  BeeMesh.scale.set(1, 1, 1);
  BeeMesh.position.set(0, 0, 0);
  scene.add(BeeMesh);

});
 */


let modelMesh, modelBody;

loader.load('Soldier.glb', (gltf) => {
  modelMesh = gltf.scene;
  modelMesh.traverse((child) => {
    if (child.isMesh) {
      child.material.wireframe = true; // Apply wireframe material
    }
  });
  scene.add(modelMesh);

  // Compute bounding box
  const bbox = new THREE.Box3().setFromObject(modelMesh);
  const size = bbox.getSize(new THREE.Vector3()).multiplyScalar(0.5);

  // Create Cannon.js body for the model
  const modelShape = new CANNON.Box(new CANNON.Vec3(size.x, size.y, size.z));
  modelBody = new CANNON.Body({
    mass: 1,
    position: new CANNON.Vec3(0, 2, 0),
    shape: modelShape,
  });
  world.addBody(modelBody);
});


let hallMesh, hallBody;
let modelSpeed = 0.2;
let mixer; // Animation mixer for the model
loader.load('hall.glb', (gltf) => {
  hallMesh = gltf.scene;
  hallMesh.traverse((child) => {
    if (child.isMesh) {
      child.material.wireframe = false; // Apply wireframe material
    }
  });
  scene.add(hallMesh);

  // Compute bounding box
  const bbox = new THREE.Box3().setFromObject(hallMesh);
  console.log("Box size", bbox)
  const size = bbox.getSize(new THREE.Vector3()).multiplyScalar(.2);

  // Create Cannon.js body for the model
  const modelHallShape = new CANNON.Box(new CANNON.Vec3(size.x, size.y, size.z));
  hallBody = new CANNON.Body({
    mass: 0,
    position: new CANNON.Vec3(0, 0, 0),
    shape: modelHallShape,
  });
  world.addBody(hallBody);
  // Create animation mixer for the model
  // mixer = new THREE.AnimationMixer(modelMesh);
  // console.log("SOLDIER ANIMATION",mixer)
  //const clipAction = mixer.clipAction(gltf.animations[0]); // Assuming the first animation is the desired one
  // clipAction.play();
});




const keys = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false,
};

window.addEventListener('keydown', (event) => {
  if (event.key in keys) {
    keys[event.key] = true;
  }
});

window.addEventListener('keyup', (event) => {
  if (event.key in keys) {
    keys[event.key] = false;
  }
});

const orbit = new OrbitControls(camera, renderer.domElement);

camera.position.set(0, 20, -30);
orbit.update();

const boxGeo = new THREE.BoxGeometry(2, 2, 2);
const boxMat = new THREE.MeshBasicMaterial({
  color: 0x00ff00,
  wireframe: true
});
const boxMesh = new THREE.Mesh(boxGeo, boxMat);
scene.add(boxMesh);

const sphereGeo = new THREE.SphereGeometry(2);
const sphereMat = new THREE.MeshBasicMaterial({
  color: 0xff0000,
  wireframe: true,
});
const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
//scene.add(sphereMesh);

const groundGeo = new THREE.PlaneGeometry(30, 30);
const groundMat = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  side: THREE.DoubleSide,
  wireframe: true
});
const groundMesh = new THREE.Mesh(groundGeo, groundMat);
scene.add(groundMesh);

const world = new CANNON.World({
  gravity: new CANNON.Vec3(0, -9.81, 0)
});

const groundPhysMat = new CANNON.Material();

const groundBody = new CANNON.Body({
  //shape: new CANNON.Plane(),
  //mass: 10
  shape: new CANNON.Box(new CANNON.Vec3(15, 15, 0.1)),
  type: CANNON.Body.STATIC,
  material: groundPhysMat
});
world.addBody(groundBody);
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);

const boxPhysMat = new CANNON.Material();

const boxBody = new CANNON.Body({
  mass: 100,
  shape: new CANNON.Box(new CANNON.Vec3(4, 4, 4)),
  position: new CANNON.Vec3(2, 2, 0),
  material: boxPhysMat
});
world.addBody(boxBody);

boxBody.angularVelocity.set(0, 10, 0);
boxBody.angularDamping = 0.5;

const groundBoxContactMat = new CANNON.ContactMaterial(
  groundPhysMat,
  boxPhysMat,
  { friction: 0.04 }
);

world.addContactMaterial(groundBoxContactMat);

const spherePhysMat = new CANNON.Material();

const sphereBody = new CANNON.Body({
  mass: 4,
  shape: new CANNON.Sphere(2),
  position: new CANNON.Vec3(0, 10, 0),
  material: spherePhysMat
});
world.addBody(sphereBody);

sphereBody.linearDamping = 0.21

const groundSphereContactMat = new CANNON.ContactMaterial(
  groundPhysMat,
  spherePhysMat,
  { restitution: 0.9 }
);

world.addContactMaterial(groundSphereContactMat);

const timeStep = 1 / 60;

const CannonDebu = new CannonDebugger(scene, world, {
  color: "red"
})
// Animation loop
const clock = new THREE.Clock();
function animate() {
  world.step(timeStep);

  groundMesh.position.copy(groundBody.position);
  groundMesh.quaternion.copy(groundBody.quaternion);

  boxMesh.position.copy(boxBody.position);
  boxMesh.quaternion.copy(boxBody.quaternion);

  sphereMesh.position.copy(sphereBody.position);
  sphereMesh.quaternion.copy(sphereBody.quaternion);

  if (modelMesh && modelBody) {
    modelMesh.position.copy(modelBody.position);
    modelMesh.quaternion.copy(modelBody.quaternion);
  }
  if (modelMesh && modelBody) {
    if (keys.ArrowUp) {
      modelBody.position.z -= modelSpeed;
    }
    if (keys.ArrowDown) {
      modelBody.position.z += modelSpeed;
    }
    if (keys.ArrowLeft) {
      modelBody.position.x -= modelSpeed;
    }
    if (keys.ArrowRight) {
      modelBody.position.x += modelSpeed;
    }

    modelMesh.position.copy(modelBody.position);
    modelMesh.quaternion.copy(modelBody.quaternion);
  }

  if (modelMesh && modelBody) {
    modelMesh.position.copy(modelBody.position);
    modelMesh.quaternion.copy(modelBody.quaternion);
  }
  const delta = clock.getDelta();
  if (BeeMeshmixer) BeeMeshmixer.update(delta);
  CannonDebu.update()
  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

window.addEventListener('resize', function () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}); 
