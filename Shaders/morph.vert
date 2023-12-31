precision highp float;

uniform vec2 uMouse;
uniform vec2 uRes; // Screen resolution
uniform float uTime;
uniform float uNoiseSpeed;
uniform float uNoiseFlow;
uniform float uNoiseY;
uniform float uNoiseStrength;

varying vec2 pixels;
varying vec2 vUv;
varying vec3 vPositon;
varying vec3 vColor;

const float PI = 3.14159265359;

//	Simplex 3D Noise 
//	by Ian McEwan, Ashima Arts
//
vec4 permute(vec4 x) {
    return mod(((x * 34.0) + 1.0) * x, 289.0);
}
vec4 taylorInvSqrt(vec4 r) {
    return 1.79284291400159 - 0.85373472095314 * r;
}

float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

// First corner
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

// Other corners
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

  //  x0 = x0 - 0. + 0.0 * C 
    vec3 x1 = x0 - i1 + 1.0 * C.xxx;
    vec3 x2 = x0 - i2 + 2.0 * C.xxx;
    vec3 x3 = x0 - 1. + 3.0 * C.xxx;

// Permutations
    i = mod(i, 289.0);
    vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));

// Gradients
// ( N*N points uniformly over a square, mapped onto an octahedron.)
    float n_ = 1.0 / 7.0; // N=7
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,N*N)

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);    // mod(j,N)

    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

//Normalise gradients
    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

// Mix final noise value
    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

vec2 ratio(in vec2 v, in vec2 s) {
    return mix(vec2((v.x * s.x / s.y) - (s.x * .5 - s.y * .5) / s.y, v.y), vec2(v.x, v.y * (s.y / s.x) - (s.y * .5 - s.x * .5) / s.x), step(s.x, s.y));
}

vec3 cosPalette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
    return a + b * cos(6.28318 * (c * t + d));
}

void main() {

    vec2 noiseCoords = uv * vec2(3.0, 4.0);

    float tilt = uv.y * 0.8;

    float incline = uv.x * 0.5;
    float offset = incline * mix(-0.25, 0.25, uv.y);

    float noise = snoise(vec3(noiseCoords.x - uTime * uNoiseFlow, noiseCoords.y * uNoiseY, uTime * uNoiseSpeed + 10.0));
    // noise = max(0.0, noise);

    // float newZ = position.z + noise * 0.03 - tilt + incline + offset;
    float newZ = position.z + normal.z * noise * uNoiseStrength;

    vec3 pos = vec3(position.x, position.y, newZ);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);

    vUv = uv;
    vPositon = pos;
    // vColor = vec3(0.57, 0.41, 0.65);
    vec3 color = vec3(0.95, 0.58, 0.72);

    // vColor = gradient;

    float noiseSpeed = 0.05;
    float noiseSeed = 1.0 * 10.0;

    // noise = snoise(vec3(noiseCoords.x + uTime * uNoiseFlow, noiseCoords.y, uTime * uNoiseSpeed + noiseSeed));

    vec3 gradient = cosPalette(noise, vec3(0.5, 0.5, 0.5), // brightness
    vec3(0.5, 0.5, 0.5), // contrast
    vec3(1.0, 1.0, 1.0), // oscillation
    vec3(0.0, 0.05, 0.1) // phase
    );

    vec3 gradient2 = cosPalette(noise, vec3(0.8, 0.5, 0.4), // brightness
    vec3(0.2, 0.4, 0.2), // contrast
    vec3(2.0, 1.0, 1.0), // oscillation
    vec3(0.0, 0.25, 0.25) // phase
    );

    vec3 gradient3 = cosPalette(noise, vec3(0.5, 0.5, 0.5), // brightness
    vec3(0.5, 0.5, 0.5), // contrast
    vec3(1.0, 1.0, 1.0), // oscillation
    vec3(0.3, 0.2, 0.2) // phase
    );

    vColor = gradient;

}
