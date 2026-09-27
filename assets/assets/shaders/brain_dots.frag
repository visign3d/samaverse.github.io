// Flutter / SkSL fragment shader for Brain Video Dot Clouds

uniform float iTime;
uniform vec2 iResolution;
uniform float iEntropy;

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float drawDot(vec2 center, vec2 uv, float radius) {
    return smoothstep(radius, radius - 0.005, length(uv - center));
}

half4 main(vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    vec2 st = (fragCoord - iResolution * 0.5) / min(iResolution.x, iResolution.y);

    float dotsOut = 0.0;
    vec3 dotColor = vec3(0.0);

    // Create a matrix grid of dots (representing video dot cloud data via GPU)
    float gridSize = 40.0 + (1.0 - iEntropy) * 40.0;
    vec2 ipos = floor(st * gridSize);
    vec2 fpos = fract(st * gridSize) - 0.5;

    // Brain structural shape envelope via mathematical lobes
    float d = length(st * vec2(1.2, 1.5));
    float brainEnvelope = smoothstep(0.45, 0.35, d);
    // Add cerebrum shape convolutions
    brainEnvelope *= smoothstep(-0.2, 0.2, st.y + sin(st.x * 8.0 + iTime) * 0.05);

    // Procedural multi-channel pseudo-video data stream matching Wikipedia fluctuations
    float videoStream = sin(ipos.x * 0.5 + iTime * 2.0) * cos(ipos.y * 0.5 - iTime * 1.5);
    videoStream = fract(videoStream * 5.0 + hash(ipos));

    // Entropy diffusion factor: spreads dots outwards randomly
    vec2 randomShift = vec2(hash(ipos), hash(ipos + 1.0)) * 2.0 - 1.0;
    vec2 dotCenter = mix(vec2(0.0), randomShift * 0.6, iEntropy);

    // Scale dot size based on the video intensity stream and alpha-clipped background
    float dotRadius = 0.15 * mix(videoStream, 1.0, 0.3) * mix(brainEnvelope, 1.0, iEntropy);

    if (drawDot(dotCenter, fpos, dotRadius) > 0.5) {
        dotsOut = 1.0;
        // Cyan-to-purple brain video stream spectral shift
        dotColor = mix(vec3(0.0, 1.0, 1.0), vec3(0.8, 0.2, 1.0), videoStream);
        // Dissipate coloring as entropy reaches maximum stability breakdown
        dotColor = mix(dotColor, vec3(1.0, 0.3, 0.3), iEntropy);
    }

    // Mathematical observer eyeball vector overlays inside the shader matrix
    if (iEntropy < 0.7) {
        float eyeLeft = length(st - vec2(-0.15, 0.05 + sin(iTime * 5.0) * 0.02));
        float eyeRight = length(st - vec2(0.15, 0.05 + sin(iTime * 5.0) * 0.02));
        float eyeMask = smoothstep(0.03, 0.02, eyeLeft) + smoothstep(0.03, 0.02, eyeRight);
        if (eyeMask > 0.5) {
            dotColor = mix(dotColor, vec3(1.0, 0.0, 0.0), sin(iTime * 20.0) * 0.5 + 0.5);
            dotsOut = 1.0;
        }
    }

    vec3 finalBackground = vec3(0.02, 0.02, 0.05) * (1.0 - dotsOut);
    vec3 finalColor = mix(finalBackground, dotColor, dotsOut);

    return half4(finalColor, 1.0);
}
