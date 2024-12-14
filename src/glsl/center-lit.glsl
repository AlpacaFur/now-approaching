const float SKEW = 10.0;
const float RADIUS = SKEW * 1.4;
const float SPEED = 100.0;
const float SHIFT = 100.0 / SPEED;

const float PI = 3.1415;

const vec4 BRIGHTEN = vec4(1.5, 1.3, 1.4, 1.0);
//const vec4 BRIGHTEN = vec4(1.0, 1.0, 1.0, 1.0);
const float BLUR_DISTANCE = SKEW * 1.0;

const vec4 OFF_CELL = vec4(.15, .15, .15, 1.0);
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
    
    // return 0.0;
    
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
    // float factor = clamp(se_dist(cellCenter, coord)/10000000000.0, 0.0, 1.0);
    // float factor = 0.5;
   
    
    return vec4(tex.rgb * factor, factor);
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

vec4 colorContributionFromAllNeighbors(vec2 cellCenterOrig, vec2 coord) {
    vec2 cellCenter = cellCenterOrig - vec2(SKEW / 2.0, SKEW / 2.0);
    vec4 topLeft = colorContributionFromCell(cellCenter + vec2(-SKEW, -SKEW), coord);
    vec4 topCenter = colorContributionFromCell(cellCenter + vec2(0.0, -SKEW), coord);
    vec4 topRight = colorContributionFromCell(cellCenter + vec2(SKEW, -SKEW), coord);
    vec4 centerLeft = colorContributionFromCell(cellCenter + vec2(-SKEW, 0.0), coord);
    vec4 trueCenter = colorContributionFromCell(cellCenter + vec2(0.0, 0.0), coord);
    vec4 centerRight = colorContributionFromCell(cellCenter + vec2(SKEW, 0.0), coord);
    vec4 bottomLeft = colorContributionFromCell(cellCenter + vec2(-SKEW, SKEW), coord);
    vec4 bottomCenter = colorContributionFromCell(cellCenter + vec2(0.0, SKEW), coord);
    vec4 bottomRight = colorContributionFromCell(cellCenter + vec2(SKEW, SKEW), coord);
    
    return (topLeft + topCenter + topRight)/3.0;
    
    return addAlphaColorsReal(topLeft,
addAlphaColorsReal(topCenter,
addAlphaColorsReal(topRight,
addAlphaColorsReal(centerLeft,
addAlphaColorsReal(trueCenter,
addAlphaColorsReal(centerRight,
addAlphaColorsReal(bottomLeft,
addAlphaColorsReal(bottomCenter,
bottomRight))))))));
    
    vec3 weightedColorSum = (topLeft.rgb * topLeft.a) + (topCenter.rgb * topLeft.a) + (topRight.rgb * topLeft.a) + (centerLeft.rgb * topLeft.a) + (trueCenter.rgb * topLeft.a) + (centerRight.rgb * topLeft.a) + (bottomLeft.rgb * topLeft.a) + (bottomCenter.rgb * topLeft.a) + (bottomRight.rgb * topLeft.a);
    float alphaSum = topLeft.a + topCenter.a + topRight.a + centerLeft.a + trueCenter.a + centerRight.a + bottomLeft.a + bottomCenter.a + bottomRight.a;
    
    return clamp(vec4(weightedColorSum / alphaSum, clamp(alphaSum, 0.0, 1.0)), vec4(0.0, 0.0, 0.0, 0.0), vec4(1.0, 1.0, 1.0, 1.0));
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
    
    //float fac = contributionFromCell(cellCenter, coord);
    vec4 color = colorContributionFromCell(cellCenter, coord);
    fragColor = color;
    return;
    
    if (se_dist(cellCenter, coord) < RADIUS) {
        if (texPresent) {
            fragColor = vec4(tex.rgb, 1.0) * BRIGHTEN;
        } else {
            float val = contributionFromAllNeighbors(cellCenter, coord);
            vec4 contribColor = colorContributionFromAllNeighbors(cellCenter, coord);
            vec4 color = addAlphaColorsReal(contribColor, OFF_CELL);
            // vec4 color = addAlphaColorsReal(vec4(ORANGE.rgb, val), OFF_CELL);
            fragColor = color * BRIGHTEN;
        }
    } else {
        float val = contributionFromAllNeighbors(cellCenter, coord);
        //fragColor = vec4(val, val, val, 1.0) * ORANGE * BRIGHTEN;
        fragColor = colorContributionFromAllNeighbors(cellCenter, coord);
    }    
}