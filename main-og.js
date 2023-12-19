import "./style.css";

import vertex from "./Shaders/basic.vert";
import weirdtex from "./Shaders/morph.vert";
import bufferFragment from "./Shaders/smoke.frag";
import screenFragment from "./Shaders/screen.frag";
import cfdFragment from "./Shaders/cfd.frag";
import displaceFragment from "./Shaders/uvDisplace.frag";
import gradientFragment from "./Shaders/lava.frag";

import imgUrl from "/comp6.png?url";
import imgUrl2 from "/gradient.jpg?url";

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
const bufferScene2 = new THREE.Scene();

//Mouse
const mouse = new THREE.Vector2();

/**
 * Camera
 */

// Perspective cam
const perspectiveCamera = new THREE.PerspectiveCamera(
  70,
  sizes.width / sizes.height,
  0.001,
  10000
);
perspectiveCamera.position.set(0, 0, 2);

// Create an orthographic camera
const camera = new THREE.OrthographicCamera(
  sizes.width / -2,
  sizes.width / 2,
  sizes.height / 2,
  sizes.height / -2,
  0.1,
  10000
);
camera.position.z = 2;
camera.lookAt(new THREE.Vector3(0, 0, 0));

/**
 * Textures
 */
const dataTexture = createDataTexture();
const textureLoader = new THREE.TextureLoader();
const imgTexture = textureLoader.load(imgUrl2);

/**
 * Objects
 */

let renderBufferA = new THREE.WebGLRenderTarget(sizes.width, sizes.height, {
  minFilter: THREE.LinearFilter,
  magFilter: THREE.NearestFilter,
  format: THREE.RGBAFormat,
  type: THREE.FloatType,
  stencilBuffer: false,
});

const bufferMaterial = new THREE.ShaderMaterial({
  uniforms: {
    tDiffuse: { type: "t", value: null },
    noiseTexture: { value: dataTexture },
    uTexture: { value: imgTexture },
    uTime: { value: 0.0 },
    uRes: { value: new THREE.Vector2(sizes.width, sizes.height) },
    uMouseRaw: { value: new THREE.Vector2(0, 0) },
  },
  vertexShader: vertex,
  fragmentShader: bufferFragment,
  wireframe: false,
});

const lavaMaterial = new THREE.ShaderMaterial({
  uniforms: {
    inputTexture: { value: null },
    uTime: { value: 0.0 },
    uRes: { value: new THREE.Vector2(sizes.width, sizes.height) },
  },
  vertexShader: weirdtex,
  fragmentShader: gradientFragment,
  wireframe: false,
  transparent: true,
});

let renderBufferLava = new THREE.WebGLRenderTarget(sizes.width, sizes.height, {
  minFilter: THREE.LinearFilter,
  magFilter: THREE.NearestFilter,
  format: THREE.RGBAFormat,
  type: THREE.FloatType,
  stencilBuffer: false,
});

//Screen Material
const quadMaterial = new THREE.ShaderMaterial({
  uniforms: {
    //The screen will receive it's texture from our off screen framebuffer
    tDiffuse: { value: null },
    uRes: { value: new THREE.Vector2(sizes.width, sizes.height) },
    uTime: { value: 0.0 },
  },
  vertexShader: weirdtex,
  fragmentShader: screenFragment,
  wireframe: false,
  side: THREE.DoubleSide,
});

let renderBufferB = new THREE.WebGLRenderTarget(sizes.width, sizes.height, {
  minFilter: THREE.LinearFilter,
  magFilter: THREE.NearestFilter,
  format: THREE.RGBAFormat,
  type: THREE.FloatType,
  stencilBuffer: false,
});

const finalMaterial = new THREE.ShaderMaterial({
  uniforms: {
    tDiffuse: { type: "t", value: null },
    uTime: { value: 0.0 },
    uRes: { value: new THREE.Vector2(sizes.width, sizes.height) },
    uMouseRaw: { value: new THREE.Vector2(0, 0) },
    uTexture: { value: imgTexture },
  },
  vertexShader: vertex,
  fragmentShader: displaceFragment,
  wireframe: false,
});

const plane = new THREE.PlaneGeometry(sizes.width, sizes.height, 1, 1);
const lavaPlane = new THREE.PlaneGeometry(
  sizes.width,
  sizes.height,
  1000,
  1000
);
// const plane = new THREE.PlaneGeometry(600, 600, 100, 100);
const screenPlane = new THREE.PlaneGeometry(10, 10, 1000, 1000);

// Meshes
const testMaterial = new THREE.MeshBasicMaterial({
  color: 0xff00dd,
});
const quad = new THREE.Mesh(screenPlane, quadMaterial);
const testQuad = new THREE.Mesh(screenPlane, lavaMaterial);
// scene.add(quad);
scene.add(testQuad);

// Meshes
const bufferMesh = new THREE.Mesh(plane, bufferMaterial);
bufferScene.add(bufferMesh);

const bufferMesh2 = new THREE.Mesh(plane, finalMaterial);
bufferScene2.add(bufferMesh2);

const bufferScene3 = new THREE.Scene();
const lavaMesh = new THREE.Mesh(lavaPlane, lavaMaterial);
bufferScene3.add(lavaMesh);

// //Draw textureB to screen
// const finalMaterial = new THREE.MeshBasicMaterial({
//   map: framebuffer2.texture,
// });
// const quad = new THREE.Mesh(plane, finalMaterial);

// console.log(framebuffer2.texture);
// scene.add(quad);
/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  alpha: true,
  precision: "highp",
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Create OrbitControls
const controls = new OrbitControls(perspectiveCamera, canvas);
/**
 * Resize
 */

const onWindowResize = () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  camera.updateProjectionMatrix();

  perspectiveCamera.aspect = sizes.width / sizes.height;
  perspectiveCamera.updateProjectionMatrix();

  //Shader
  bufferMaterial.uniforms.uRes.value.x = sizes.width;
  bufferMaterial.uniforms.uRes.value.y = sizes.height;

  // Update camera
  // orthoCam.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
};

/**
 * Mouse Interactivity
 */
function UpdateMousePosition(X, Y) {
  var mouseX = X;
  var mouseY = sizes.height - Y;
  bufferMaterial.uniforms.uMouseRaw.value.x = mouseX;
  bufferMaterial.uniforms.uMouseRaw.value.y = mouseY;

  console.log(bufferMaterial.uniforms.uMouse);
}

document.onmousemove = function (event) {
  UpdateMousePosition(event.clientX, event.clientY);
};

/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  bufferMaterial.uniforms.uTime.value = elapsedTime;
  lavaMaterial.uniforms.uTime.value = elapsedTime;
  // quad.material.uniforms.uTime.value = elapsedTime;
  // renderer.autoClearColor = false;
  // Update controls
  controls.update();

  //Draw to textureA
  renderer.setRenderTarget(renderBufferA);
  // This will the off-screen texture
  renderer.render(bufferScene, camera);

  bufferMaterial.uniforms.tDiffuse.value = renderBufferA.texture;

  finalMaterial.uniforms.tDiffuse.value = renderBufferA.texture;

  renderer.setRenderTarget(renderBufferB);
  renderer.render(bufferScene2, camera);

  quad.material.map = renderBufferB.texture;
  quad.material.uniforms.tDiffuse.value = renderBufferB.texture;

  renderer.setRenderTarget(renderBufferLava);
  renderer.render(bufferScene3, camera);
  finalMaterial.uniforms.uTexture.value = renderBufferLava.texture;

  //This will set the default framebuffer (i.e. the screen) back to being the output
  renderer.setRenderTarget(null);
  //Render to screen
  renderer.render(scene, perspectiveCamera);

  //PING PONG
  const temp = renderBufferA;
  renderBufferA = renderBufferB;
  renderBufferB = temp;
  bufferMaterial.uniforms.tDiffuse.value = renderBufferB.texture;

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();

window.addEventListener("resize", () => {
  onWindowResize();
});

/**
 * CREATE RANDOM NOISY TEXTURE
 */

function createDataTexture() {
  // create a buffer with color data

  var size = sizes.width * sizes.height;
  var data = new Uint8Array(4 * size);

  for (var i = 0; i < size; i++) {
    var stride = i * 4;

    if (Math.random() < 0.5) {
      data[stride] = 255;
      data[stride + 1] = 255;
      data[stride + 2] = 255;
      data[stride + 3] = 255;
    } else {
      data[stride] = 0;
      data[stride + 1] = 0;
      data[stride + 2] = 0;
      data[stride + 3] = 255;
    }
  }

  // used the buffer to create a DataTexture

  console.log(data);
  var texture = new THREE.DataTexture(
    data,
    sizes.width,
    sizes.height,
    THREE.RGBAFormat
  );

  // just a weird thing that Three.js wants you to do after you set the data for the texture
  texture.needsUpdate = true;

  return texture;
}
