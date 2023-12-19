import "./style.css";

import vertex from "./Shaders/basic.vert";
import weirdtex from "./Shaders/morph.vert";
import smokeFragment from "./Shaders/post.frag";
import screenFragment from "./Shaders/screen.frag";
import cfdFragment from "./Shaders/cfd.frag";
import displaceFragment from "./Shaders/displace.frag";
import gradientFragment from "./Shaders/lava.frag";

import imgUrl from "/comp6.png?url";

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";

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

//Mouse
const mouse = new THREE.Vector2();

/**
 * Objects
 */

const lavaMaterial = new THREE.ShaderMaterial({
  uniforms: {
    inputTexture: { type: "t", value: null },
    // noiseTexture: { value: dataTexture },
    // uTexture: { value: imgTexture },
    uTime: { value: 0.0 },
    uRes: { value: new THREE.Vector2(sizes.width, sizes.height) },
    // uMouse: { value: mouse },
  },
  vertexShader: weirdtex,
  fragmentShader: gradientFragment,
  wireframe: false,
  transparent: true,
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
camera.position.set(0, 0, 1.25);
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
 * Textures
 */
const dataTexture = createDataTexture();
const textureLoader = new THREE.TextureLoader();
const imgTexture = textureLoader.load(imgUrl);

/**
 * Off Screen Render
 */

const fullScreenPlane = new THREE.PlaneGeometry(sizes.width, sizes.height);

const bufferMaterial = new THREE.ShaderMaterial({
  uniforms: {
    inputTexture: { value: null },
    // noiseTexture: { value: dataTexture },
    // uTexture: { value: imgTexture },
    uTime: { value: 0.0 },
    uRes: { value: new THREE.Vector2(0.0, 0.0) },
    uMouse: { value: new THREE.Vector2(0.0, 0.0) },
  },
  vertexShader: vertex,
  fragmentShader: displaceFragment,
  wireframe: false,
  transparent: true,
});

//Screen Material
const resultMaterial = new THREE.ShaderMaterial({
  uniforms: {
    //The screen will receive it's texture from our off screen framebuffer
    inputTexture: { value: null },
    uRes: { value: new THREE.Vector2(sizes.width, sizes.height) },
    uTime: { value: 0.0 },
  },
  vertexShader: vertex,
  fragmentShader: displaceFragment,
  wireframe: false,
  // side: THREE.DoubleSide,
});

// Meshes for Post Processing
const bufferPlane = new THREE.Mesh(fullScreenPlane, bufferMaterial);
// const resultMaterial = new THREE.MeshBasicMaterial({ map: null });
const resultPlane = new THREE.Mesh(fullScreenPlane, resultMaterial);
bufferScene.add(bufferPlane);

let renderBufferA = new THREE.WebGLRenderTarget(sizes.width, sizes.height, {
  minFilter: THREE.LinearFilter,
  magFilter: THREE.NearestFilter,
  format: THREE.RGBAFormat,
  type: THREE.FloatType,
  stencilBuffer: false,
});

let renderBufferB = new THREE.WebGLRenderTarget(sizes.width, sizes.height, {
  minFilter: THREE.LinearFilter,
  magFilter: THREE.LinearFilter,
  format: THREE.RGBAFormat,
  type: THREE.FloatType,
  stencilBuffer: false,
});

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
 * EFFECT COMPOSER STUFF
 */

// Create a render pass
const renderPass = new RenderPass(scene, camera);

// Create a custom shader
const customShader = {
  uniforms: {
    tDiffuse: { value: null },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    varying vec2 vUv;
    void main() {
      vec4 texel = texture2D(tDiffuse, vUv);
      vec3 fadeColor = vec3(0.0, 0.0, 0.0);

      vec3 color = texel.rgb;
      float fadeFactor = 0.06;

      color = mix(color, fadeColor, fadeFactor);
      color =

      gl_FragColor = vec4(color, 1.0);

    }
  `,
};

// Create a custom shader pass
const customPass = new ShaderPass(customShader);

// Create an effect composer and add passes
const composer = new EffectComposer(renderer);
composer.addPass(renderPass);
composer.addPass(customPass);

/**
 * Resize
 */

const onWindowResize = () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  //Shader
  bufferMaterial.uniforms.uRes.value.x = sizes.width;
  bufferMaterial.uniforms.uRes.value.y = sizes.height;

  //update perspective camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
  //update ortho camera
  orthoCam.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  composer.setSize(sizes.width, sizes.height);
};

/**
 * Mouse Interactivity
 */
function UpdateMousePosition(X, Y) {
  var mouseX = X;
  var mouseY = sizes.height - Y;
  bufferMaterial.uniforms.uMouse.value.x = mouseX;
  bufferMaterial.uniforms.uMouse.value.y = mouseY;
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
  //this is for lava effect
  quad.material.uniforms.uTime.value = elapsedTime;

  renderer.autoClearColor = false;

  // Update controls
  controls.update();

  composer.render();
  // renderer.render(scene, camera);
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

// // renderer.autoClearColor = false;

// //this is for lava effect
// quad.material.uniforms.uTime.value = elapsedTime;

// //this is off screen
// bufferPlane.material.uniforms.uTime.value = elapsedTime;
// // bufferPlane.material.uniforms.inputTexture.value = renderBufferA.texture;
// renderer.setRenderTarget(renderBufferA);

// renderer.render(bufferScene, orthoCam);

// resultPlane.material.uniforms.inputTexture.value = renderBufferA.texture;

// // renderer.setRenderTarget(null);

// // renderer.render(scene, camera);

// // resultPlane.material.map = renderBufferB.texture;

// // const swap = renderBufferA;
// // renderBufferA = renderBufferB;
// // renderBufferB = swap;

// // resultPlane.material.uniforms.inputTexture.value = renderBufferB.texture;
