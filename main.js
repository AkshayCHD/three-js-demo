/*

Three.js video tutorial explaining the source code

Youtube: https://youtu.be/JhgBwJn1bQw

In the tutorial, we go through the source code of this game. We cover, how to set up a Three.js scene with box objects, how to add lights, how to set up the camera, how to add animation and event handlers. We also add textures with HTML Canvas and learn how to draw 2D shapes in Three.js then how to turn them into extruded geometries.

Comparing to the tutorial this version has some extra features:
- trucks also pop up on the other track
- the extruded geometry also has a texture
- there are trees around the track
- shadows
- the game reacts to window resizing

Check out my YouTube channel for other game tutorials: https://www.youtube.com/channel/UCxhgW0Q5XLvIoXHAfQXg9oQ

*/
import * as THREE from 'three'

window.focus(); // Capture keys right away (by default focus is on editor)

// Pick a random value from an array
function pickRandom(array) {
  return array[Math.floor(Math.random() * array.length)];
}


const vehicleColors = [
  0xa52523,
  0xef2d56,
  0x0ad3ff,
  0xff9f1c /*0xa52523, 0xbdb638, 0x78b14b*/
];



const config = {
  showHitZones: false,
  shadows: true, // Use shadow
  trees: true, // Add trees to the map
  curbs: true, // Show texture on the extruded geometry
  grid: false // Show grid helper
};

let score;
const speed = 0.0017;

const playerAngleInitial = Math.PI;
let playerAngleMoved;
let accelerate = false; // Is the player accelerating
let decelerate = false; // Is the player decelerating

let otherVehicles = [];
let ready;
let lastTimestamp;

const trackRadius = 225;
const trackWidth = 45;
const innerTrackRadius = trackRadius - trackWidth;
const outerTrackRadius = trackRadius + trackWidth;

const arcAngle1 = (1 / 3) * Math.PI; // 60 degrees

const deltaY = Math.sin(arcAngle1) * innerTrackRadius;
const arcAngle2 = Math.asin(deltaY / outerTrackRadius);

let globalPlayerX = 10;
let globalPlayerY = 10;
const arcCenterX =
  (Math.cos(arcAngle1) * innerTrackRadius +
    Math.cos(arcAngle2) * outerTrackRadius) /
  2;

const directionTypes = {
  LEFT: "left",
  RIGHT: "right",
  UP: "up",
  DOWN: "down"
}
let direction = "left";

const scoreElement = document.getElementById("score");
const buttonsElement = document.getElementById("buttons");
const instructionsElement = document.getElementById("instructions");
const resultsElement = document.getElementById("results");
const accelerateButton = document.getElementById("accelerate");
const decelerateButton = document.getElementById("decelerate");
const youtubeLogo = document.getElementById("youtube-main");

setTimeout(() => {
  if (ready) instructionsElement.style.opacity = 1;
  buttonsElement.style.opacity = 1;
  youtubeLogo.style.opacity = 1;
}, 4000);

// Initialize ThreeJs
// Set up camera
const aspectRatio = window.innerWidth / window.innerHeight;
const cameraWidth = 960;
const cameraHeight = cameraWidth / aspectRatio;

const camera = new THREE.OrthographicCamera(
  cameraWidth / -2, // left
  cameraWidth / 2, // right
  cameraHeight / 2, // top
  cameraHeight / -2, // bottom
  50, // near plane
  700 // far plane
);

camera.position.set(0, -210, 300);
camera.lookAt(0, 0, 0);

const scene = new THREE.Scene();

const playerCar = Car();
scene.add(playerCar);

renderMap(cameraWidth, cameraHeight * 2); // The map height is higher because we look at the map from an angle

// Set up lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
dirLight.position.set(100, -300, 300);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 1024;
dirLight.shadow.mapSize.height = 1024;
dirLight.shadow.camera.left = -400;
dirLight.shadow.camera.right = 350;
dirLight.shadow.camera.top = 400;
dirLight.shadow.camera.bottom = -300;
dirLight.shadow.camera.near = 100;
dirLight.shadow.camera.far = 800;
scene.add(dirLight);

// const cameraHelper = new THREE.CameraHelper(dirLight.shadow.camera);
// scene.add(cameraHelper);

if (config.grid) {
  const gridHelper = new THREE.GridHelper(80, 8);
  gridHelper.rotation.x = Math.PI / 2;
  scene.add(gridHelper);
}

// Set up renderer
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: "high-performance"
});
renderer.setSize(window.innerWidth, window.innerHeight);
if (config.shadows) renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

reset();

function reset() {
  // Reset position and score
  playerAngleMoved = 0;
  score = 0;
  scoreElement.innerText = "Press UP";

  // Remove other vehicles
  otherVehicles.forEach((vehicle) => {
    // Remove the vehicle from the scene
    scene.remove(vehicle.mesh);

    // If it has hit-zone helpers then remove them as well
    if (vehicle.mesh.userData.hitZone1)
      scene.remove(vehicle.mesh.userData.hitZone1);
    if (vehicle.mesh.userData.hitZone2)
      scene.remove(vehicle.mesh.userData.hitZone2);
    if (vehicle.mesh.userData.hitZone3)
      scene.remove(vehicle.mesh.userData.hitZone3);
  });
  otherVehicles = [];

  resultsElement.style.display = "none";

  lastTimestamp = undefined;

  // Place the player's car to the starting position
  movePlayerCar(0);

  // Render the scene
  renderer.render(scene, camera);

  ready = true;
}

function startGame() {
  if (ready) {
    ready = false;
    scoreElement.innerText = 0;
    buttonsElement.style.opacity = 1;
    instructionsElement.style.opacity = 0;
    youtubeLogo.style.opacity = 1;
    renderer.setAnimationLoop(animation);
  }
}

function positionScoreElement() {
  const arcCenterXinPixels = (arcCenterX / cameraWidth) * window.innerWidth;
  scoreElement.style.cssText = `
    left: ${window.innerWidth / 2 - arcCenterXinPixels * 1.3}px;
    top: ${window.innerHeight / 2}px
  `;
}


function renderMap(mapWidth, mapHeight) {




  positionScoreElement();

}

function getCarFrontTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 32;
  const context = canvas.getContext("2d");

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, 64, 32);

  context.fillStyle = "#666666";
  context.fillRect(8, 8, 48, 24);

  return new THREE.CanvasTexture(canvas);
}

function getCarSideTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 32;
  const context = canvas.getContext("2d");

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, 128, 32);

  context.fillStyle = "#666666";
  context.fillRect(10, 8, 38, 24);
  context.fillRect(58, 8, 60, 24);

  return new THREE.CanvasTexture(canvas);
}

function Car() {
  const car = new THREE.Group();

  const color = pickRandom(vehicleColors);

  const main = new THREE.Mesh(
    new THREE.BoxBufferGeometry(60, 30, 15),
    new THREE.MeshLambertMaterial({ color })
  );
  main.position.z = 12;
  main.castShadow = true;
  main.receiveShadow = true;
  car.add(main);

  const carFrontTexture = getCarFrontTexture();
  carFrontTexture.center = new THREE.Vector2(0.5, 0.5);
  carFrontTexture.rotation = Math.PI / 2;

  const carBackTexture = getCarFrontTexture();
  carBackTexture.center = new THREE.Vector2(0.5, 0.5);
  carBackTexture.rotation = -Math.PI / 2;

  const carLeftSideTexture = getCarSideTexture();
  carLeftSideTexture.flipY = false;

  const carRightSideTexture = getCarSideTexture();

  const cabin = new THREE.Mesh(new THREE.BoxBufferGeometry(33, 24, 12), [
    new THREE.MeshLambertMaterial({ map: carFrontTexture }),
    new THREE.MeshLambertMaterial({ map: carBackTexture }),
    new THREE.MeshLambertMaterial({ map: carLeftSideTexture }),
    new THREE.MeshLambertMaterial({ map: carRightSideTexture }),
    new THREE.MeshLambertMaterial({ color: 0xffffff }), // top
    new THREE.MeshLambertMaterial({ color: 0xffffff }) // bottom
  ]);
  cabin.position.x = -6;
  cabin.position.z = 25.5;
  cabin.castShadow = true;
  cabin.receiveShadow = true;
  car.add(cabin);

  if (config.showHitZones) {
    car.userData.hitZone1 = HitZone();
    car.userData.hitZone2 = HitZone();
  }

  return car;
}

accelerateButton.addEventListener("mousedown", function () {
  startGame();
  accelerate = true;
});
decelerateButton.addEventListener("mousedown", function () {
  startGame();
  decelerate = true;
});
accelerateButton.addEventListener("mouseup", function () {
  accelerate = false;
});
decelerateButton.addEventListener("mouseup", function () {
  decelerate = false;
});
window.addEventListener("keydown", function (event) {
  console.log(event.key)
  if (event.key == "ArrowUp") {
    startGame();
    accelerate = true;
    direction = directionTypes.UP;
    return;
  }
  if (event.key == "ArrowDown") {
    decelerate = true;
    direction = directionTypes.DOWN;
    return;
  }
  if(event.key == "ArrowLeft") {
    direction = directionTypes.LEFT;
    return;
  }
  if(event.key == "ArrowRight") {
    direction = directionTypes.RIGHT;
    return;
  }
  if (event.key == "R" || event.key == "r") {
    reset();
    return;
  }
});
window.addEventListener("keyup", function (event) {
  if (event.key == "ArrowUp") {
    accelerate = false;
    return;
  }
  if (event.key == "ArrowDown") {
    decelerate = false;
    return;
  }
});

function animation(timestamp) {
  if (!lastTimestamp) {
    lastTimestamp = timestamp;
    return;
  }

  const timeDelta = timestamp - lastTimestamp;

  movePlayerCar(timeDelta);

  renderer.render(scene, camera);
  lastTimestamp = timestamp;
}

function movePlayerCar(timeDelta) {
  const playerSpeed = getPlayerSpeed();
  playerAngleMoved -= playerSpeed * timeDelta;

  // const totalPlayerAngle = playerAngleInitial + playerAngleMoved;

  if(direction === 'left') {
    globalPlayerX -= 2; 
    playerCar.rotation.z = Math.PI -  Math.PI * 2;
  } else if(direction === "right") {
    globalPlayerX += 2;
    playerCar.rotation.z = 0;
  } else if(direction === "up") {
    globalPlayerY += 2;
    playerCar.rotation.z = Math.PI * 2 + Math.PI / 2;
  } else if(direction === "down") {
    globalPlayerY -= 2;
    playerCar.rotation.z = Math.PI * 2 - Math.PI / 2;
  }
  playerCar.position.y = globalPlayerY;
  playerCar.position.x = globalPlayerX;

}

function getPlayerSpeed() {
  if (accelerate) return speed * 2;
  if (decelerate) return speed * 0.5;
  return speed;
}

window.addEventListener("resize", () => {
  console.log("resize", window.innerWidth, window.innerHeight);

  // Adjust camera
  const newAspectRatio = window.innerWidth / window.innerHeight;
  const adjustedCameraHeight = cameraWidth / newAspectRatio;

  camera.top = adjustedCameraHeight / 2;
  camera.bottom = adjustedCameraHeight / -2;
  camera.updateProjectionMatrix(); // Must be called after change

  positionScoreElement();

  // Reset renderer
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.render(scene, camera);
});
