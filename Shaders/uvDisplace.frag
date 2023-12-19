precision highp float;

#include utils/curlNoise;

uniform float uTime;
uniform sampler2D tDisplace;
uniform sampler2D tDiffuse;
uniform bool uDebug;

varying vec2 vUv;

float PI = 3.141592653589793238;

void main() {

    vec4 displacement = texture2D(tDisplace, vUv);
    displacement.rgb *= smoothstep(0.0, 0.1, displacement.r);
    displacement.r = clamp(displacement.r, 0.0, 0.9);
    displacement.g = clamp(displacement.g, 0.0, 0.9);
    displacement.b = clamp(displacement.b, 0.0, 0.9);

    float theta = displacement.r * 2. * PI;
    vec2 dir = vec2(sin(theta), cos(theta));

    vec2 uv = vUv + dir * displacement.r * 0.1;

    // vec2 uv = vUv + displacement.r * 0.4;

    vec4 color = displacement;

    //Displace input Texture

    if(!uDebug) {
        color = texture2D(tDiffuse, uv);
    }

    // color.rg = uv;
    // color.b = 0.0;

    gl_FragColor = color;
}