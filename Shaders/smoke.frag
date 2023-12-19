precision highp float;

#include utils/curlNoise;

uniform float uTime;
uniform float uRadius;
uniform vec2 uRes; // Screen resolution
uniform vec2 uMouse;
uniform vec2 uMouseRaw;      // Mouse position in normalized coordinates [-1, 1]    
uniform vec2 uMouseDiff;
uniform sampler2D tDiffuse;

uniform bool uHasMouseMoved;

uniform sampler2D uTexture;

varying vec2 vUv;

void main() {

    //new uv coordinfates for distortion
    vec2 st = vUv;

    vec3 cpos = vec3(vUv * 20.0, uTime * 1.25);
    vec3 curly = curlNoise(cpos);

    st += curly.xy * 0.008;

    vec3 color = vec3(0.0);

    vec4 tex = texture2D(tDiffuse, st) * 0.99;

    float dist = distance(uMouseRaw.xy, gl_FragCoord.xy);
    float dist2 = distance(uMouse.xy, vUv.xy);

    color = tex.rgb;

    float smoothFactor = 0.1;

    if(!uHasMouseMoved) {
        smoothFactor = 0.0;
    }

    color += smoothFactor * max(uRadius - dist, 0.0);
    // color += smoothFactor * max(0.2 - dist2, 0.0);

     //SMOKE DIFFUSE

    float xPixel = 1.0 / uRes.x; //The size of a single pixel

    float yPixel = 1.0 / uRes.y;

    vec4 rightColor = texture2D(tDiffuse, vec2(vUv.x + xPixel, vUv.y));

    vec4 leftColor = texture2D(tDiffuse, vec2(vUv.x - xPixel, vUv.y));

    vec4 upColor = texture2D(tDiffuse, vec2(vUv.x, vUv.y + yPixel));

    vec4 downColor = texture2D(tDiffuse, vec2(vUv.x, vUv.y - yPixel));

    //Handle the bottom boundary

    if(vUv.y <= yPixel) {
        downColor.rgb = vec3(0.0);
    }

    float factor = 8.0 * 0.016 * (leftColor.r + rightColor.r + downColor.r * 3.0 + upColor.r - 6.1 * color.r);

//We have to account for the low precision of texels

    float minimum = 0.03;

    if(factor >= -minimum && factor < 0.0)
        factor = -minimum;

    color += factor;

    // color = texture2D(tDiffuse, vUv).rgb;
    // color.rg = vUv;
    // color.b = 0.0;

    gl_FragColor = vec4(color, 1.0);

}
