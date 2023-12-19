uniform sampler2D inputTexture;
uniform sampler2D imageSrcTexture;
uniform sampler2D noiseTexture;
uniform vec2 uMouse;
uniform vec2 uRes; // Screen resolution

varying vec2 vUv;

#define RotNum 5
#define angRnd 1.0
#define posRnd 0.0

// float RotNum = 5.0;

const float ang = 2.0 * 3.1415926535 / float(RotNum);
mat2 m = mat2(cos(ang), sin(ang), -sin(ang), cos(ang));

float hash(float seed) {
    return fract(sin(seed) * 158.5453);
}
vec4 getRand4(float seed) {
    return vec4(hash(seed), hash(seed + 123.21), hash(seed + 234.32), hash(seed + 453.54));
}
vec4 randS(vec2 uv) {
    //return getRand4(uv.y+uv.x*1234.567)-vec4(0.5);
    return texture2D(noiseTexture, uv * 1.0) - vec4(0.5);
}

float getRot(vec2 uv, float sc) {
    float ang2 = angRnd * randS(uv).x * ang;
    vec2 p = vec2(cos(ang2), sin(ang2));
    float rot = 0.0;
    for(int i = 0; i < RotNum; i++) {
        vec2 p2 = (p + posRnd * randS(uv + p * sc).xy) * sc;
        vec2 v = texture2D(inputTexture, fract(uv + p2)).xy - vec2(0.5);
        rot += cross(vec3(v, 0.0), vec3(p2, 0.0)).z / dot(p2, p2);
        p = m * p;
    }
    rot /= float(RotNum);
    return rot;
}

void init(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = vUv;
    fragColor = texture2D(noiseTexture, uv);
}

void main() {
    vec2 uv = vUv;
    vec2 scr = uv * 2.0 - vec2(1.0);

    float sc = 1.0 / max(uRes.x, uRes.y);
    vec2 v = vec2(0.0);
    for(int level = 0; level < 20; level++) {
        if(sc > 0.7)
            break;
        float ang2 = angRnd * ang * randS(uv).y;
        vec2 p = vec2(cos(ang2), sin(ang2));
        for(int i = 0; i < RotNum; i++) {
            vec2 p2 = p * sc;
            float rot = getRot(uv + p2, sc);
            //v+=cross(vec3(0,0,rot),vec3(p2,0.0)).xy;
            v += p2.yx * rot * vec2(-1, 1); //maybe faster than above
            p = m * p;
        }
        sc *= 2.0;
    }

    //v.y+=scr.y*0.1;

    //v.x+=(1.0-scr.y*scr.y)*0.8;

    //v/=float(RotNum)/3.0;

    gl_FragColor = texture2D(inputTexture, fract(uv + v * 3.0 / uRes.x));

    // gl_FragColor = texture2D(noiseTexture, gl_FragColor.xy);

    // add a little "motor" in the center
    gl_FragColor.xy += (0.01 * scr.xy / (dot(scr, scr) / 0.1 + 0.3));

}