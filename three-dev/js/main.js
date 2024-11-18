import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";

let container, camera, scene, renderer, controls;

init();

function init() {
  // Scene and Camera Setup
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate);
  document.body.appendChild(renderer.domElement);
  renderer.toneMapping = THREE.LinearToneMapping;
  renderer.outputEncoding = THREE.sRGBEncoding;

  // Camera Position
  camera.position.set(2, 2, 2);

  // Axis Helper
  const axesHelper = new THREE.AxesHelper(5);
  scene.add(axesHelper);
  camera.lookAt(axesHelper.position);

  // Lights
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(5, 5, 5);
  scene.add(directionalLight);

  const ambientLight = new THREE.AmbientLight(0x404040);
  scene.add(ambientLight);

  // Orbit Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = false;
  controls.screenSpacePanning = false;
  controls.minDistance = 1;
  controls.maxDistance = 100;

  loadmodels();
}

function loadmodels() {
  new RGBELoader()
    .setPath("hdr/")
    .load("kloppenheim_02_4k.hdr", function (texture) {
      texture.mapping = THREE.EquirectangularReflectionMapping;

      scene.background = texture;
      scene.environment = texture;

      console.log("HDR texture loaded");

      // model
      const loader = new GLTFLoader().setPath("otter-world/");
      loader.load("otter-world.glb", async function (gltf) {
        const model = gltf.scene;

        console.log("GLTF model loaded");

        // wait until the model can be added to the scene without blocking due to shader compilation
        await renderer.compileAsync(model, camera, scene);

        model.position.set(0, 0, 0); // Adjust position if necessary
        scene.add(model);

        console.log("Model added to scene");
      });
    });
}

function animate() {
  controls.update();
  renderer.render(scene, camera);
}

window.addEventListener("resize", resize, false);

function resize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
