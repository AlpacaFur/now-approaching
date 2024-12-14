const float SKEW = 10.0;
const float RADIUS = pow(SKEW, 2.0) * 0.2;
const float SPEED = 40.0;
const float SHIFT = 100.0 / SPEED;

const float BRIGHTEN = 1.5;
const float BLUR_DISTANCE = SKEW * 1.0;
const float SECOND_BLUR_DISTANCE = pow(SKEW, 2.0) * 0.3;

const vec4 OFF_CELL = vec4(.13, .13, .13, 1.0);
const vec4 ORANGE = vec4(.95, .58, .25, 1.0);

float se_dist(vec2 center, vec2 outer) {
    vec2 adjusted = outer - center;
    return sqrt(pow(adjusted.x, 4.0) + pow(adjusted.y, 4.0));
}

float contributionFromCell(vec2 cellCenter, vec2 coord) {
    vec2 uv = cellCenter/iChannelResolution[0].xy;
    vec4 tex = texture(iChannel0, uv / vec2(SKEW, SKEW));
    bool texPresent = tex.r > 0.0 || tex.g > 0.0 || tex.b > 0.0;
    if (!texPresent) {
        return 0.0;
    }
    
    float factor = (BLUR_DISTANCE - (se_dist(cellCenter, coord) - RADIUS)) / BLUR_DISTANCE;
    
    return max(0.0, asin(factor / 1.0));
}

vec4 colorContributionFromCell(vec2 cellCenter, vec2 coord) {
    vec2 uv = cellCenter/iChannelResolution[0].xy;
    vec4 tex = texture(iChannel0, uv / vec2(SKEW, SKEW));
    bool texPresent = tex.r > 0.0 || tex.g > 0.0 || tex.b > 0.0;
    if (!texPresent) {
        return vec4(0.0, 0.0, 0.0, 0.0);
    }
    
    float factor = (BLUR_DISTANCE - (se_dist(cellCenter, coord) - RADIUS)) / BLUR_DISTANCE;
    return vec4(tex.rgb * factor, factor);
}

vec4 blurContributionFromCell(vec2 cellCenter, vec2 coord) {
    vec2 uv = cellCenter/iChannelResolution[0].xy;
    vec4 tex = texture(iChannel0, uv / vec2(SKEW, SKEW));
    bool texPresent = tex.r > 0.0 || tex.g > 0.0 || tex.b > 0.0;
    if (!texPresent) {
        return vec4(0.0, 0.0, 0.0, 0.0);
    }
    
    float factor = (SECOND_BLUR_DISTANCE - (se_dist(cellCenter, coord) - RADIUS)) / SECOND_BLUR_DISTANCE;
    factor = max(0.0, factor);
    
    return vec4(tex.rgb * pow(factor, 4.0), factor);
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
    
    float sum = topLeft + topCenter + topRight + centerLeft + trueCenter + centerRight + bottomLeft + bottomCenter + bottomRight;
    
    return clamp(sum, 0.0, 1.0);
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
    vec4 topLeft = blurContributionFromCell(cellCenter + vec2(-SKEW, -SKEW), coord);
    vec4 topCenter = blurContributionFromCell(cellCenter + vec2(0.0, -SKEW), coord);
    vec4 topRight = blurContributionFromCell(cellCenter + vec2(SKEW, -SKEW), coord);
    vec4 centerLeft = blurContributionFromCell(cellCenter + vec2(-SKEW, 0.0), coord);
    vec4 trueCenter = blurContributionFromCell(cellCenter + vec2(0.0, 0.0), coord);
    vec4 centerRight = blurContributionFromCell(cellCenter + vec2(SKEW, 0.0), coord);
    vec4 bottomLeft = blurContributionFromCell(cellCenter + vec2(-SKEW, SKEW), coord);
    vec4 bottomCenter = blurContributionFromCell(cellCenter + vec2(0.0, SKEW), coord);
    vec4 bottomRight = blurContributionFromCell(cellCenter + vec2(SKEW, SKEW), coord);
    
    return topCenter + trueCenter + bottomCenter + centerLeft + centerRight + topLeft + topRight + bottomLeft + bottomRight;
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
    
    if (se_dist(cellCenter, coord) < RADIUS) {
        if (texPresent) {
            fragColor = colorContributionFromCell(cellCenter, coord);
        } else {
            vec4 color = colorContributionFromAllNeighbors(cellCenter, coord);
            fragColor = addAlphaColorsReal(color, OFF_CELL);
        }
    } else {
        fragColor = colorContributionFromAllNeighbors(cellCenter, coord);
    }
    
    fragColor += (fragColor * (BRIGHTEN - 1.0));
}