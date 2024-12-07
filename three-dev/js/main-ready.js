import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { VRButton } from "three/examples/jsm/Addons.js";
import { XRControllerModelFactory } from "three/addons/webxr/XRControllerModelFactory.js";

let container, camera, scene, renderer, controls;

let controller1, controller2;
let controllerGrip1, controllerGrip2;

let raycaster;

const intersected = [];
const tempMatrix = new THREE.Matrix4();

let group = new THREE.Group();
group.name = "Interaction-Group";

// initialize marker for teleport and referencespace of headset
// initialize the INTERSECTION array for teleport
let marker, baseReferenceSpace;
let INTERSECTION;

// create a new empty group to include imported models you want
// to teleport with
let teleportgroup = new THREE.Group();
teleportgroup.name = "Teleport-Group";

init();

function init() {
  // Scene and Camera Setup
  scene = new THREE.Scene();
  scene.add(group);
  // add the empty group to the scene
  scene.add(teleportgroup);
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  // renderer.setAnimationLoop(animate);
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
  marker = new THREE.Mesh(
    new THREE.CircleGeometry(0.25, 32).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0x808080 })
  );
  scene.add(marker);
  loadmodels();
  //  initSecondScene();
  initVR();
}

/*function initSecondScene() {
  const secondContainer = document.createElement("div");
  secondContainer.style.width = "50%";
  secondContainer.style.height = "50%";
  secondContainer.style.position = "absolute";
  secondContainer.style.top = "10px";
  secondContainer.style.right = "10px";
  secondContainer.style.border = "1px solid black";
  document.body.appendChild(secondContainer);

  const secondScene = new THREE.Scene();
  const secondCamera = new THREE.PerspectiveCamera(
    75,
    secondContainer.clientWidth / secondContainer.clientHeight,
    0.1,
    1000
  );
  secondCamera.position.set(3, 3, 3);
  secondCamera.lookAt(new THREE.Vector3(0, 0, 0));

  const secondRenderer = new THREE.WebGLRenderer({ antialias: true });
  secondRenderer.setSize(
    secondContainer.clientWidth,
    secondContainer.clientHeight
  );
  secondContainer.appendChild(secondRenderer.domElement);

  const secondControls = new OrbitControls(
    secondCamera,
    secondRenderer.domElement
  );
  secondControls.enableDamping = true;
  secondControls.dampingFactor = 0.05;
  secondControls.minDistance = 1;
  secondControls.maxDistance = 100;

  const axesHelper = new THREE.AxesHelper(5);
  secondScene.add(axesHelper);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(5, 5, 5);
  secondScene.add(directionalLight);

  const ambientLight = new THREE.AmbientLight(0x404040);
  secondScene.add(ambientLight);

  const loader = new GLTFLoader().setPath("barrel/");
  loader.load("barrel.glb", function (gltf) {
    const secondModel = gltf.scene;
    secondModel.scale.set(1, 1, 1);
    secondModel.position.set(0, 0, 0);
    secondScene.add(secondModel);
  });

  function animateSecondScene() {
    requestAnimationFrame(animateSecondScene);

    secondControls.update();

    secondRenderer.render(secondScene, secondCamera);
  }
  animateSecondScene();
}*/

function initVR() {
  document.body.appendChild(VRButton.createButton(renderer));
  renderer.xr.enabled = true;

  renderer.xr.addEventListener(
    "sessionstart",
    () => (baseReferenceSpace = renderer.xr.getReferenceSpace())
  );

  // controllers

  controller1 = renderer.xr.getController(0);
  controller1.addEventListener("selectstart", onSelectStart);
  controller1.addEventListener("selectend", onSelectEnd);

  controller1.addEventListener("squeezestart", onSqueezeStart);
  controller1.addEventListener("squeezeend", onSqueezeEnd);

  scene.add(controller1);

  controller2 = renderer.xr.getController(1);
  controller2.addEventListener("selectstart", onSelectStart);
  controller2.addEventListener("selectend", onSelectEnd);

  controller2.addEventListener("squeezestart", onSqueezeStart);
  controller2.addEventListener("squeezeend", onSqueezeEnd);

  scene.add(controller2);

  const controllerModelFactory = new XRControllerModelFactory();

  controllerGrip1 = renderer.xr.getControllerGrip(0);
  controllerGrip1.add(
    controllerModelFactory.createControllerModel(controllerGrip1)
  );
  scene.add(controllerGrip1);

  controllerGrip2 = renderer.xr.getControllerGrip(1);
  // controllerGrip2.add( controllerModelFactory.createControllerModel( controllerGrip2 ) );
  const loader = new GLTFLoader().setPath("gundy/");
  loader.load("scene.gltf", async function (gltf) {
    gltf.scene.scale.set(0.0003, 0.0003, 0.0003);
    let mymodel = gltf.scene;
    mymodel.rotation.y = THREE.MathUtils.degToRad(180);
    mymodel.rotation.x = THREE.MathUtils.degToRad(-36.5);
    mymodel.position.set(0, 0.01, 0);
    controllerGrip2.add(mymodel);
  });
  scene.add(controllerGrip2);

  //

  const geometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, -1),
  ]);

  const line = new THREE.Line(geometry);
  line.name = "line";
  line.scale.z = 5;

  controller1.add(line.clone());
  controller2.add(line.clone());

  raycaster = new THREE.Raycaster();
}

function onSqueezeStart() {
  this.userData.isSqueezing = true;
  console.log("Controller squeeze started");
}
function onSqueezeEnd() {
  this.userData.isSqueezing = false;
  console.log("squeezeend");
  if (INTERSECTION) {
    const offsetPosition = {
      x: -INTERSECTION.x,
      y: -INTERSECTION.y,
      z: -INTERSECTION.z,
      w: 1,
    };
    const offsetRotation = new THREE.Quaternion();
    const transform = new XRRigidTransform(offsetPosition, offsetRotation);
    const teleportSpaceOffset =
      baseReferenceSpace.getOffsetReferenceSpace(transform);
    renderer.xr.setReferenceSpace(teleportSpaceOffset);
  }
}

function onSelectStart(event) {
  const controller = event.target;

  const intersections = getIntersections(controller);

  if (intersections.length > 0) {
    const intersection = intersections[0];

    const object = intersection.object;
    // object.material.emissive.b = 1;

    controller.attach(object);

    controller.userData.selected = object;
  }

  controller.userData.targetRayMode = event.data.targetRayMode;
}

function onSelectEnd(event) {
  const controller = event.target;

  if (controller.userData.selected !== undefined) {
    const object = controller.userData.selected;
    // object.material.emissive.b = 0;
    group.attach(object);

    controller.userData.selected = undefined;
  }
}

function getIntersections(controller) {
  controller.updateMatrixWorld();

  raycaster.setFromXRController(controller);

  return raycaster.intersectObjects(group.children, true);
}

function intersectObjects(controller) {
  // Do not highlight in mobile-ar

  if (controller.userData.targetRayMode === "screen") return;

  // Do not highlight when already selected

  if (controller.userData.selected !== undefined) return;

  const line = controller.getObjectByName("line");
  const intersections = getIntersections(controller);

  if (intersections.length > 0) {
    const intersection = intersections[0];

    const object = intersection.object;
    // object.material.emissive.r = 1;
    object.traverse(function (node) {
      if (node.material) {
        node.material.transparent = true;
        node.material.opacity = 0.5;
      }
    });

    intersected.push(object);

    line.scale.z = intersection.distance;
  } else {
    line.scale.z = 5;
  }
}

function cleanIntersected() {
  while (intersected.length) {
    const object = intersected.pop();
    object.traverse(function (node) {
      if (node.material) {
        node.material.transparent = false;
        node.material.opacity = 1;
      }
    });
    // object.material.emissive.r = 0;
  }
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
      const loader = new GLTFLoader().setPath("nolandscape/");
      loader.load("nolandscape.glb", async function (gltf) {
        const model = gltf.scene;

        console.log("GLTF model loaded");

        // wait until the model can be added to the scene without blocking due to shader compilation
        await renderer.compileAsync(model, camera, scene);

        model.position.set(0, 0, 0); // Adjust position if necessary
        group.add(model);

        console.log("Model added to scene");
      });

      // model2
      const loader2 = new GLTFLoader().setPath("world-only-land/");
      loader2.load("world-only-land.glb", async function (gltf) {
        const model = gltf.scene;

        console.log("GLTF model loaded");

        // wait until the model can be added to the scene without blocking due to shader compilation
        await renderer.compileAsync(model, camera, scene);

        model.position.set(0, 0, 0); // Adjust position if necessary
        teleportgroup.add(model);

        console.log("Model added to scene");
      });
    });
}

renderer.setAnimationLoop(function () {
  controls.update();
  cleanIntersected();
  intersectObjects(controller1);
  intersectObjects(controller2);
  moveMarker();

  renderer.render(scene, camera);
});

function moveMarker() {
  INTERSECTION = undefined;
  if (controller1.userData.isSqueezing === true) {
    tempMatrix.identity().extractRotation(controller1.matrixWorld);
    raycaster.ray.origin.setFromMatrixPosition(controller1.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
    //const intersects = raycaster.intersectObjects([floor]);
    const intersects = raycaster.intersectObjects(teleportgroup.children, true);
    if (intersects.length > 0) {
      INTERSECTION = intersects[0].point;
      console.log(intersects[0]);
      console.log(INTERSECTION);
    }
  } else if (controller2.userData.isSqueezing === true) {
    tempMatrix.identity().extractRotation(controller2.matrixWorld);
    raycaster.ray.origin.setFromMatrixPosition(controller2.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
    // const intersects = raycaster.intersectObjects([floor]);
    const intersects = raycaster.intersectObjects(teleportgroup.children, true);
    if (intersects.length > 0) {
      INTERSECTION = intersects[0].point;
    }
  }
  if (INTERSECTION) marker.position.copy(INTERSECTION);
  marker.visible = INTERSECTION !== undefined;
}

window.addEventListener("resize", resize, false);

function resize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
