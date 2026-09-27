// Flutter / SkSL fragment shader

uniform float iTime;
uniform vec2 iResolution;

vec3 firePalette(float i){
    float T = 1400. + 1300.*i;
    vec3 L = vec3(7.4, 5.6, 4.4);
    L = pow(L, vec3(5.0)) * (exp(1.43876719683e5/(T*L)) - 1.0);
    return 1.0 - exp(-5e8/L);
}

vec3 hash33(vec3 p){
    float n = sin(dot(p, vec3(7.0, 157.0, 113.0)));
    return fract(vec3(2097152.0, 262144.0, 32768.0)*n);
}

float voronoi(vec3 p){
    vec3 b, r, g = floor(p);
    p = fract(p);

    float d = 1.0;

    for(int j = -1; j <= 1; j++) {
        for(int i = -1; i <= 1; i++) {

            b = vec3(float(i), float(j), -1.0);
            r = b - p + hash33(g+b);
            d = min(d, dot(r,r));

            b.z = 0.0;
            r = b - p + hash33(g+b);
            d = min(d, dot(r,r));

            b.z = 1.0;
            r = b - p + hash33(g+b);
            d = min(d, dot(r,r));
        }
    }

    return d;
}

float noiseLayers(vec3 p) {
    vec3 t = vec3(0.0, 0.0, p.z + iTime*1.5);

    float tot = 0.0;
    float sum = 0.0;
    float amp = 1.0;

    for (int i = 0; i < 5; i++) {
        tot += voronoi(p + t) * amp;
        p *= 2.0;
        t *= 1.5;
        sum += amp;
        amp *= 0.5;
    }

    return tot / sum;
}

half4 main(vec2 fragCoord) {

    vec2 uv = (fragCoord - iResolution * 0.5) / iResolution.y;

    uv += vec2(sin(iTime*0.5)*0.25, cos(iTime*0.5)*0.125);

    vec3 rd = normalize(vec3(uv.x, uv.y, 3.14159265/8.0));

    float cs = cos(iTime*0.25);
    float si = sin(iTime*0.25);
    rd.xy = mat2(cs, -si, si, cs) * rd.xy;

    float c = noiseLayers(rd * 2.0);

    c = max(c + dot(hash33(rd)*2.0 - 1.0, vec3(0.015)), 0.0);

    c *= sqrt(c)*1.5;

    vec3 col = firePalette(c);

    col = mix(col, col.zyx*0.15 + c*0.85,
    min(pow(dot(rd.xy, rd.xy)*1.2, 1.5), 1.0));

    col = pow(col, vec3(1.25));

    return half4(sqrt(clamp(col, 0.0, 1.0)), 1.0);
}