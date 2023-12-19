import * as THREE from "three";

//@author Omar Shehata. 2015.
//We are loading the Three.js library from the cdn here: https://cdnjs.com/libraries/three.js/
var scene;
var camera;
var renderer;

function scene_setup() {
  //This is the basic scene setup
  scene = new THREE.Scene();
  var width = window.innerWidth;
  var height = window.innerHeight;
  //Note that we're using an orthographic camera here rather than a prespective
  camera = new THREE.OrthographicCamera(
    width / -2,
    width / 2,
    height / 2,
    height / -2,
    1,
    1000
  );
  camera.position.z = 2;

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
}

//Initialize the Threejs scene
scene_setup();

var bufferScene;
var textureA;
var textureB;
var bufferMaterial;
var plane;
var bufferObject;
var finalMaterial;
var quad;

function buffer_texture_setup() {
  //Create buffer scene
  bufferScene = new THREE.Scene();
  //Create 2 buffer textures
  textureA = new THREE.WebGLRenderTarget(
    window.innerWidth,
    window.innerHeight,
    { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter }
  );
  textureB = new THREE.WebGLRenderTarget(
    window.innerWidth,
    window.innerHeight,
    { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter }
  );
  //Pass textureA to shader
  bufferMaterial = new THREE.ShaderMaterial({
    uniforms: {
      bufferTexture: { type: "t", value: textureA },
      res: {
        type: "v2",
        value: new THREE.Vector2(window.innerWidth, window.innerHeight),
      }, //Keeps the resolution
      smokeSource: { type: "v3", value: new THREE.Vector3(0, 0, 0) }, ///This keeps the position of the mouse and whether it was clicked or not
    },
    fragmentShader: document.getElementById("fragShader").innerHTML,
  });
  plane = new THREE.PlaneBufferGeometry(window.innerWidth, window.innerHeight);
  bufferObject = new THREE.Mesh(plane, bufferMaterial);
  bufferScene.add(bufferObject);

  //Draw textureB to screen
  finalMaterial = new THREE.MeshBasicMaterial({ map: textureB });
  quad = new THREE.Mesh(plane, finalMaterial);
  scene.add(quad);
}
buffer_texture_setup();

//Send position of smoke source with value
var mouseDown = false;
function UpdateMousePosition(X, Y) {
  var mouseX = X;
  var mouseY = window.innerHeight - Y;
  bufferMaterial.uniforms.smokeSource.value.x = mouseX;
  bufferMaterial.uniforms.smokeSource.value.y = mouseY;
}
document.onmousemove = function (event) {
  UpdateMousePosition(event.clientX, event.clientY);
};

document.onmousedown = function (event) {
  mouseDown = true;
  bufferMaterial.uniforms.smokeSource.value.z = 0.1;
};
document.onmouseup = function (event) {
  mouseDown = false;
  bufferMaterial.uniforms.smokeSource.value.z = 0;
};

//Render everything!
function render() {
  requestAnimationFrame(render);

  //Draw to textureB
  renderer.render(bufferScene, camera, textureB, true);

  //Swap textureA and B
  var t = textureA;
  textureA = textureB;
  textureB = t;
  quad.material.map = textureB;
  bufferMaterial.uniforms.bufferTexture.value = textureA;

  //Finally, draw to the screen
  renderer.render(scene, camera);
}
render();
