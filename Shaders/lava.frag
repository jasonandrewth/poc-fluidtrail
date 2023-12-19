precision highp float;

uniform float uTime;
uniform vec2 uRes; // Screen resolution
uniform vec2 uMouse;      // Mouse position in normalized coordinates [-1, 1]    
uniform sampler2D uvTexture;

varying vec2 vUv;
varying vec3 vColor;

void main() {

  vec3 color = vec3(0.0);

  // color = texture2D(uvTexture, vUv).rgb;
  vec2 newUv = vUv * 2.0 - vec2(0.5);

  color.rg = newUv;
  color.b = 0.;

  color = vColor;
  // color.rg *= newUv;

  // Output the final color
  gl_FragColor = vec4(color, 1.0);
}
