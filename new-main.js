import "./style.css";

//For Screen
import weirdtex from "./Shaders/morph.vert";
import lavaFragment from "./Shaders/lava.frag";

//Vertex Ping Pong
import vertex from "./Shaders/basic.vert";

//Post processing fragments
import smokeFragment from "./Shaders/smoke.frag";
import displaceFragment from "./Shaders/uvDisplace.frag";

import { Pane } from "tweakpane";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

/**
 * Setup
 */

// Canvas
const canvas = document.querySelector("canvas.webgl");

/**
 * Sizes
 */
const sizes = {
  width: canvas.offsetWidth,
  height: canvas.offsetHeight,
};

const scene = new THREE.Scene();
const bufferScene = new THREE.Scene();
const bufferSceneBetween = new THREE.Scene();
const bufferSceneFinal = new THREE.Scene();

//Mouse
const mouse = new THREE.Vector2();
let prevMouseX = 0;
let prevMouseY = 0;

/**
 * Debug
 */
const PARAMS = {
  factor: 123,
  title: "hello",
  color: "#ff0055",
  noiseSpeed: 0.05,
  noiseFlow: 0.05,
  noiseStrength: 0.3,
  radius: 80,
  noiseY: 1.0,
  debugDisplace: false,
};

const pane = new Pane();

const displace = pane.addFolder({
  title: "Displace",
  expanded: true,
});

displace
  .addBinding(PARAMS, "radius", { min: 10, max: 200, step: 1 })
  .on("change", function (ev) {
    postProcessingMaterial.uniforms.uRadius.value = ev.value;
  });

displace.addBinding(PARAMS, "debugDisplace").on("change", function (ev) {
  displaceQuadMaterial.uniforms.uDebug.value = ev.value;
});

const noise = pane.addFolder({
  title: "Noise",
  expanded: true,
});

noise
  .addBinding(PARAMS, "noiseSpeed", { min: -1, max: 1, step: 0.01 })
  .on("change", function (ev) {
    lavaMaterial.uniforms.uNoiseSpeed.value = ev.value;
  });
noise
  .addBinding(PARAMS, "noiseFlow", { min: -1, max: 1, step: 0.01 })
  .on("change", function (ev) {
    lavaMaterial.uniforms.uNoiseFlow.value = ev.value;
  });
noise
  .addBinding(PARAMS, "noiseStrength", { min: 0, max: 1, step: 0.01 })
  .on("change", function (ev) {
    lavaMaterial.uniforms.uNoiseStrength.value = ev.value;
  });

noise
  .addBinding(PARAMS, "noiseY", { min: 1, max: 10, step: 0.1 })
  .on("change", function (ev) {
    lavaMaterial.uniforms.uNoiseY.value = ev.value;
  });

const colors = pane.addFolder({
  title: "Colors",
  expanded: true,
});

colors.addBinding(PARAMS, "factor");
colors.addBinding(PARAMS, "color");

pane.addBinding(PARAMS, "factor");
pane.addBinding(PARAMS, "title");
pane.addBinding(PARAMS, "color");

/**
 * Objects
 */

const lavaMaterial = new THREE.ShaderMaterial({
  uniforms: {
    inputTexture: { value: null },
    uNoiseSpeed: { value: PARAMS.noiseSpeed },
    uNoiseFlow: { value: PARAMS.noiseFlow },
    uNoiseY: { value: PARAMS.noiseY },
    uNoiseStrength: { value: PARAMS.noiseStrength },
    // uTexture: { value: imgTexture },
    uTime: { value: 0.0 },
    uRes: { value: new THREE.Vector2(sizes.width, sizes.height) },
    // uMouse: { value: mouse },
  },
  vertexShader: weirdtex,
  fragmentShader: lavaFragment,
  wireframe: false,
  transparent: true,
  side: THREE.DoubleSide,
});

//This is the geometry that's on screen
// const renderGeometry = new THREE.PlaneGeometry(1, 1, 200, 200);
const renderGeometry = new THREE.SphereGeometry(1, 200, 200);
// Meshes
const quad = new THREE.Mesh(renderGeometry, lavaMaterial);
scene.add(quad);

/**
 * Camera
 */

// Base Perspective cam
const camera = new THREE.PerspectiveCamera(
  70,
  sizes.width / sizes.height,
  0.001,
  10000
);
camera.position.set(0, 0, 1.2);
scene.add(camera);

// Create an orthographic camera
const orthoCam = new THREE.OrthographicCamera(
  sizes.width / -2,
  sizes.width / 2,
  sizes.height / 2,
  sizes.height / -2,
  0.1,
  10000
);
orthoCam.position.z = 2;
orthoCam.lookAt(new THREE.Vector3(0, 0, 0));

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  alpha: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Create OrbitControls
const controls = new OrbitControls(camera, canvas);

/**
 * Post Processing
 */

// Create a render target for the scene
let renderBufferA = new THREE.WebGLRenderTarget(sizes.width, sizes.height, {
  minFilter: THREE.LinearFilter,
  magFilter: THREE.LinearFilter,
  format: THREE.RGBAFormat,
  type: THREE.FloatType,
});
let renderBufferB = new THREE.WebGLRenderTarget(sizes.width, sizes.height, {
  minFilter: THREE.LinearFilter,
  magFilter: THREE.LinearFilter,
  format: THREE.RGBAFormat,
  type: THREE.FloatType,
});

//Scene only
let renderBufferClean = new THREE.WebGLRenderTarget(sizes.width, sizes.height, {
  minFilter: THREE.LinearFilter,
  magFilter: THREE.LinearFilter,
  format: THREE.RGBAFormat,
  type: THREE.FloatType,
});

//Plane for post processing
const postProcessingGeometry = new THREE.PlaneGeometry(
  sizes.width,
  sizes.height
);
const postProcessingMaterial = new THREE.ShaderMaterial({
  uniforms: {
    tDiffuse: { value: null },
    tDisplace: { value: null },
    uTime: { value: 0.0 },
    uRadius: { value: PARAMS.radius },
    uHasMouseMoved: { value: false },
    uRes: {
      value: new THREE.Vector2(sizes.width, sizes.height),
    },
    uMouse: {
      value: new THREE.Vector2(0.5, 0.5),
    },
    uMouseRaw: { value: new THREE.Vector2(-10, -10) },
  },
  vertexShader: vertex,
  fragmentShader: smokeFragment,
});

const postProcessingPlane = new THREE.Mesh(
  postProcessingGeometry,
  postProcessingMaterial
);
bufferScene.add(postProcessingPlane);

//Quad that just gets both the perspective scene and the displacement texture stuff
const displaceQuadMaterial = new THREE.ShaderMaterial({
  uniforms: {
    //The screen will receive it's texture from our off screen framebuffer
    tDiffuse: { value: null },
    tDisplace: { value: null },
    uRes: { value: new THREE.Vector2(sizes.width, sizes.height) },
    uTime: { value: 0.0 },
    uDebug: { value: PARAMS.debugDisplace },
  },
  vertexShader: vertex,
  fragmentShader: displaceFragment,
  wireframe: false,
});

const displacePlane = new THREE.Mesh(
  postProcessingGeometry,
  displaceQuadMaterial
);
bufferSceneBetween.add(displacePlane);

const finalMaterial = new THREE.MeshBasicMaterial({
  map: null,
});
const finalQuad = new THREE.Mesh(postProcessingGeometry, finalMaterial);
bufferSceneFinal.add(finalQuad);

/**
 * Resize
 */

const onWindowResize = () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  postProcessingMaterial.uniforms.uRes.value.x = sizes.width;
  postProcessingMaterial.uniforms.uRes.value.y = sizes.height;

  //update perspective camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
  //update ortho camera
  orthoCam.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  //Render Buffers
  renderBufferA.setSize(sizes.width, sizes.height);
  renderBufferB.setSize(sizes.width, sizes.height);
  renderBufferClean.setSize(sizes.width, sizes.height);

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
};

/**
 * Mouse Interactivity
 */

function UpdateMousePosition(X, Y) {
  var mouseX = X;
  var mouseY = sizes.height - Y;

  // Normalize mouse coordinates to range [0, 1]
  mouse.x = mouseX / sizes.width;
  mouse.y = mouseY / sizes.height;

  postProcessingMaterial.uniforms.uMouse.value.x = mouse.x;
  postProcessingMaterial.uniforms.uMouse.value.y = mouse.y;

  postProcessingMaterial.uniforms.uMouseRaw.value.x = mouseX;
  postProcessingMaterial.uniforms.uMouseRaw.value.y = mouseY;

  console.log(postProcessingMaterial.uniforms.uMouse.value);
}

document.onmousemove = function (event) {
  prevMouseX = mouse.x;
  prevMouseY = mouse.y;

  UpdateMousePosition(event.clientX, event.clientY);

  // Calculate the difference in mouse position
  //   const diffX = mouse.x - prevMouseX;
  //   const diffY = mouse.x - prevMouseY;

  postProcessingMaterial.uniforms.uHasMouseMoved.value = true;
};

/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  //this is for lava effect
  quad.material.uniforms.uTime.value = elapsedTime;

  //this is for post processing
  postProcessingMaterial.uniforms.uTime.value = elapsedTime;

  renderer.autoClearColor = false;

  // Update controls
  controls.update();

  // Set Framebuffer B as active WebGL framebuffer to render to
  renderer.setRenderTarget(renderBufferB);

  // Render the image buffer associated with Framebuffer A to Framebuffer B
  postProcessingPlane.material.uniforms.tDiffuse.value = renderBufferA.texture;

  renderer.render(bufferScene, orthoCam);

  renderer.setRenderTarget(renderBufferClean);

  renderer.clearColor();
  // Render our basic scene to separate Framebuffer
  renderer.render(scene, camera);

  // Set the Default Framebuffer (device screen) represented by null as active WebGL framebuffer to render to.
  renderer.setRenderTarget(null);
  // Copy the pixel contents of Framebuffer B by passing them as a texture to resultPlane and rendering it to the Default Framebuffer (device screen)
  // finalQuad.material.map = renderBufferClean.texture;

  displacePlane.material.uniforms.tDisplace.value = renderBufferB.texture;
  displacePlane.material.uniforms.tDiffuse.value = renderBufferClean.texture;
  renderer.render(bufferSceneBetween, orthoCam);

  // Swap Framebuffer A and Framebuffer B
  const swap = renderBufferA;
  renderBufferA = renderBufferB;
  renderBufferB = swap;

  // Reset the boolean uniform
  if (postProcessingMaterial.uniforms.uHasMouseMoved.value) {
    postProcessingMaterial.uniforms.uHasMouseMoved.value = false;
  }

  window.requestAnimationFrame(tick);
};

tick();

window.addEventListener("resize", () => {
  onWindowResize();
});
