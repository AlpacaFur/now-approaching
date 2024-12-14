export const FRAGMENT_SHADER = `
uniform sampler2D u_texture;
uniform vec2 u_output_resolution;
uniform float PITCH;
uniform float RADIUS;
uniform float BRIGHTEN;
uniform float BLUR_DISTANCE;
uniform float SECOND_BLUR_DISTANCE;
uniform float WIPE_POSITION;

varying vec2 v_uv;

const vec4 OFF_CELL = vec4(.08, .08, .08, 1.0);

float se_dist(vec2 center, vec2 outer) {
    vec2 adjusted = outer - center;
    return sqrt(pow(adjusted.x, 2.0) + pow(adjusted.y, 2.0));
}

vec4 colorContributionFromCell(vec2 cellCenter, vec2 coord) {
    vec2 uv = cellCenter/u_output_resolution;
    vec4 tex = texture(u_texture, uv);
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
    vec4 tex = texture(u_texture, uv);
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


float wiggle(float value) {
    return max(0.0, value + (sin(value) * 50.0));
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
    vec2 uv = v_uv;
    vec2 coord = vec2(u_output_resolution.x*uv.x, u_output_resolution.y*uv.y);

    vec2 cellTopLeft = vec2(floor(coord.x / PITCH) * PITCH, floor(coord.y / PITCH) * PITCH);
    vec2 cellCenter = cellTopLeft + PITCH/2.0;
    vec4 tex = texture(u_texture, cellCenter/u_output_resolution);

    if (withinWipe(coord)) {
        gl_FragColor = vec4(tex.rgb, 1.0);
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
