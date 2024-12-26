export const FRAGMENT_FORK = `
precision highp float;

uniform sampler2D u_image;
uniform vec2 u_output_resolution;
uniform vec2 u_tex_resolution;
uniform float PITCH;
uniform float RADIUS;
uniform float BRIGHTEN;
uniform float BLUR_DISTANCE;
uniform float SECOND_BLUR_DISTANCE;
uniform float WIPE_POSITION;

const vec4 OFF_CELL = vec4(.08, .08, .08, 1.0);

vec4 getTex(vec2 coord) {
    vec2 pixel = floor(coord / PITCH) + 0.5;

    if (pixel.x > u_tex_resolution.x || pixel.y > u_tex_resolution.y) {
        return vec4(0.0, 0.0, 0.0, 0.0);
    }

    return texture2D(u_image, pixel / u_tex_resolution);
}

float se_dist(vec2 center, vec2 outer) {
    vec2 adjusted = outer - center;
    return sqrt(pow(adjusted.x, 2.0) + pow(adjusted.y, 2.0));
}

vec4 colorContributionFromCell(vec2 cellCenter, vec2 coord) {
    vec2 uv = cellCenter/u_output_resolution;
    vec4 tex = getTex(cellCenter);
    bool texPresent = tex.r > 0.0 || tex.g > 0.0 || tex.b > 0.0;
    if (!texPresent) {
        return vec4(0.0, 0.0, 0.0, 0.0);
    }
    
    float factor = (BLUR_DISTANCE - (se_dist(cellCenter, coord) - RADIUS)) / BLUR_DISTANCE;
    factor = clamp(factor, 0.0, 1.0);
    return vec4(tex.rgb * factor, factor);
}

vec4 blurContributionFromCell(vec2 cellCenter, vec2 coord) {
    vec2 uv = cellCenter/u_output_resolution;
    vec4 tex = getTex(cellCenter);
    // vec4 tex = texture2D(u_image, uv);

    bool texPresent = tex.r > 0.0 || tex.g > 0.0 || tex.b > 0.0;
    if (!texPresent) {
        return vec4(0.0, 0.0, 0.0, 0.0);
    }
    
    float factor = (SECOND_BLUR_DISTANCE - (se_dist(cellCenter, coord) - RADIUS)) / SECOND_BLUR_DISTANCE;
    factor = max(0.0, factor);
    
    return vec4(tex.rgb * pow(factor, 1.0), pow(factor, 4.0) * 0.4);
}

// https://stackoverflow.com/a/727339
vec4 addAlphaColorsReal(vec4 top, vec4 bottom) {
    vec4 result = vec4(0.0, 0.0, 0.0, 0.0);
    result.a = 1.0 - ((1.0 - top.a) * (1.0 - bottom.a));
    if (result.a < 1.0e-6) return vec4(0.0, 0.0, 0.0, 0.0); // Fully transparent -- R,G,B not important
    result.r = top.r * top.a / result.a + bottom.r * bottom.a * (1.0 - top.a) / result.a;
    result.g = top.g * top.a / result.a + bottom.g * bottom.a * (1.0 - top.a) / result.a;
    result.b = top.b * top.a / result.a + bottom.b * bottom.a * (1.0 - top.a) / result.a;
    return result;
}

vec4 colorContributionFromAllNeighbors(vec2 cellCenter, vec2 coord) {
    vec4 topLeft = blurContributionFromCell(cellCenter + vec2(-PITCH, -PITCH), coord);
    vec4 topCenter = blurContributionFromCell(cellCenter + vec2(0.0, -PITCH), coord);
    vec4 topRight = blurContributionFromCell(cellCenter + vec2(PITCH, -PITCH), coord);
    vec4 centerLeft = blurContributionFromCell(cellCenter + vec2(-PITCH, 0.0), coord);
    vec4 trueCenter = blurContributionFromCell(cellCenter + vec2(0.0, 0.0), coord);
    vec4 centerRight = blurContributionFromCell(cellCenter + vec2(PITCH, 0.0), coord);
    vec4 bottomLeft = blurContributionFromCell(cellCenter + vec2(-PITCH, PITCH), coord);
    vec4 bottomCenter = blurContributionFromCell(cellCenter + vec2(0.0, PITCH), coord);
    vec4 bottomRight = blurContributionFromCell(cellCenter + vec2(PITCH, PITCH), coord);
    
    vec3 sum = (topLeft.rgb * topLeft.a) + (topCenter.rgb * topCenter.a) + (topRight.rgb * topRight.a) + (centerLeft.rgb * centerLeft.a) + (trueCenter.rgb * trueCenter.a) + (centerRight.rgb * centerRight.a) + (bottomLeft.rgb * bottomLeft.a) + (bottomCenter.rgb * bottomCenter.a) + (bottomRight.rgb * bottomRight.a);
    float alphaSum = topLeft.a + topCenter.a + topRight.a + centerLeft.a + trueCenter.a + centerRight.a + bottomLeft.a + bottomCenter.a + bottomRight.a;
    return vec4(sum, alphaSum);
}

vec4 addAlphaColors(vec4 top, vec4 bottom) {
    vec3 colors = (top.rgb * top.a) + (bottom.rgb * clamp(bottom.a, 0.0, 1.0 - top.a));
    return vec4(colors, clamp(top.a + bottom.a, 0.0, 1.0));
}

bool withinWipe(vec2 coord) {
    float canvasHyp = distance(vec2(0.0, 0.0), u_output_resolution);
    vec2 center = u_output_resolution / 2.0;
    float radiusToFullyCoverCanvas = canvasHyp / 2.0;
    vec2 adjustedVector = coord - center;
    float angle = degrees(atan(adjustedVector.x/adjustedVector.y));
    float wave = sin(radians(angle * 10.0)) - 1.0;
    float bump = (wave * WIPE_POSITION * radiusToFullyCoverCanvas * 0.1);
    float dist = distance(center, coord);
    return (dist + bump) < WIPE_POSITION * radiusToFullyCoverCanvas;
}

void main()
{
    vec2 coord = gl_FragCoord.xy;

    vec2 cellTopLeft = vec2(floor(coord.x / PITCH) * PITCH, floor(coord.y / PITCH) * PITCH);
    vec2 cellCenter = cellTopLeft + PITCH/2.0;
    vec4 tex = getTex(coord);

    if (withinWipe(coord)) {
        float xLine = 0.0;
        // if (mod(coord.x, PITCH) < 1.0) {
        //     xLine = 0.2;
        // }
        // if (mod(coord.y, PITCH) < 1.0) {
        //     xLine = 0.2;
        // }

        // if (distance(coord, cellCenter) < 1.0) {
        //     gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);
        //     return;
        // }
        
        gl_FragColor = vec4(tex.rgb + xLine, 1.0);

        return;
    }
    bool texPresent = tex.r > 0.0 || tex.g > 0.0 || tex.b > 0.0;
    
    if (se_dist(cellCenter, coord) < (RADIUS + 0.0001)) {
        if (texPresent) {
          gl_FragColor = colorContributionFromCell(cellCenter, coord);
        } else {
          vec4 color = colorContributionFromAllNeighbors(cellCenter, coord);
          gl_FragColor = addAlphaColors(vec4(color.rgb, color.a), vec4(0.0,0.0,0.0,1.0));
          gl_FragColor = color + OFF_CELL;
        }
    } else {
      gl_FragColor = colorContributionFromAllNeighbors(cellCenter, coord);
    }
    
    gl_FragColor += (gl_FragColor * (BRIGHTEN - 1.0));
}
`
