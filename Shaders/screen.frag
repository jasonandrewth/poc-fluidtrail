precision highp float;

//Our input texture
uniform sampler2D tDiffuse;
varying vec2 vUv;

void main() {
    //special method to sample from texture
    vec4 initTexture = texture2D(tDiffuse, vUv);

    vec3 color = initTexture.rgb;
    // color.rg = vUv;

    gl_FragColor = vec4(color, 1.0);
    gl_FragColor.r += 0.01;
}