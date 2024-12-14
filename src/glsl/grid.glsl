const float SKEW = 10.0;
const float RADIUS = SKEW * 0.45;
const float SPEED = 100.0;
const float SHIFT = 100.0 / SPEED;

const float BLUR_RATIO = 1.0;
const float PI = 3.1415;

// const vec4 BRIGHTEN = vec4(1.5, 1.3, 1.4, 1.0);
const vec4 BRIGHTEN = vec4(1.0, 1.0, 1.0, 1.0);
const float BLUR_DISTANCE = SKEW / 3.0;

const vec4 OFF_CELL = vec4(.15, .15, .15, 1.0);
const vec4 ORANGE = vec4(.95, .58, .25, 1.0);

float contributionFromCell(vec2 cellCenter, vec2 coord) {
    vec2 uv = cellCenter/iChannelResolution[0].xy;
    vec4 tex = texture(iChannel0, uv / vec2(SKEW, SKEW));
    bool texPresent = tex.r > 0.0 || tex.g > 0.0 || tex.b > 0.0;
    if (!texPresent) {
        return 0.0;
    }
    
    float factor = (BLUR_DISTANCE - (distance(cellCenter, coord) - RADIUS)) / BLUR_DISTANCE;
    
    return 0.0;
    
    return max(0.0, asin(factor / 1.0));
}

vec3 colorContributionFromCell(vec2 cellCenter, vec2 coord) {
    vec2 uv = cellCenter/iChannelResolution[0].xy;
    vec4 tex = texture(iChannel0, uv / vec2(SKEW, SKEW));
    bool texPresent = tex.r > 0.0 || tex.g > 0.0 || tex.b > 0.0;
    if (!texPresent) {
        return vec3(0.0, 0.0, 0.0);
    }
    
    float factor = (BLUR_DISTANCE - (distance(cellCenter, coord) - RADIUS)) / BLUR_DISTANCE;
    
    return vec3(0.0, 0.0, 0.0);
}

float contributionFromAllNeighbors(vec2 cellCenter, vec2 coord) {
    float topLeft = contributionFromCell(cellCenter + vec2(-SKEW, -SKEW), coord);
    float topCenter = contributionFromCell(cellCenter + vec2(0.0, -SKEW), coord);
    float topRight = contributionFromCell(cellCenter + vec2(SKEW, -SKEW), coord);
    float centerLeft = contributionFromCell(cellCenter + vec2(-SKEW, 0.0), coord);
    float trueCenter = contributionFromCell(cellCenter + vec2(0.0, 0.0), coord);
    float centerRight = contributionFromCell(cellCenter + vec2(SKEW, 0.0), coord);
    float bottomLeft = contributionFromCell(cellCenter + vec2(-SKEW, SKEW), coord);
    float bottomCenter = contributionFromCell(cellCenter + vec2(0.0, SKEW), coord);
    float bottomRight = contributionFromCell(cellCenter + vec2(SKEW, SKEW), coord);
    
    // return 0.8;
    
    float sum = topLeft + topCenter + topRight + centerLeft + trueCenter + centerRight + bottomLeft + bottomCenter + bottomRight;
    
    return clamp(sum, 0.0, 1.0);
}

vec4 addAlphaColors(vec4 top, vec4 bottom) {
    vec3 colors = (top.rgb * top.a) + (bottom.rgb * clamp(bottom.a, 0.0, 1.0 - top.a));
    return vec4(colors, clamp(top.a + bottom.a, 0.0, 1.0));
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 timeCoord = vec2(float(iFrame) / SHIFT, float(iFrame) / SHIFT);
    vec2 coord = fragCoord + timeCoord;
    vec2 uv = coord/iChannelResolution[0].xy;
    vec4 tex = texture(iChannel0, uv / vec2(SKEW, SKEW));
    bool texPresent = tex.r > 0.0 || tex.g > 0.0 || tex.b > 0.0;
    
    vec2 cellTopLeft = vec2(floor(coord.x / SKEW) * SKEW, floor(coord.y / SKEW) * SKEW);
    vec2 cellCenter = cellTopLeft + SKEW/2.0;
    
    if (distance(coord, cellCenter) < RADIUS) {
        if (texPresent) {
            fragColor = vec4(tex.r, tex.g, tex.b, 1.0) * BRIGHTEN;
        } else {
            float val = contributionFromAllNeighbors(cellCenter, coord);
            vec4 color = addAlphaColors(vec4(ORANGE.rgb, val), OFF_CELL);
            fragColor = color * BRIGHTEN;
        }
    } else {
        float val = contributionFromAllNeighbors(cellCenter, coord);
        fragColor = vec4(val, val, val, 1.0) * ORANGE * BRIGHTEN;
    }    
}