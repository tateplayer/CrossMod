#version 330

in vec3 N;
in vec3 tangent;
in vec3 bitangent;
in vec2 map1;
in vec4 colorSet1;
in vec4 colorSet5;
in vec2 bake1;
noperspective in vec3 edgeDistance;

uniform sampler2D colMap;
uniform sampler2D col2Map;
uniform sampler2D prmMap;
uniform sampler2D norMap;
uniform sampler2D emiMap;
uniform sampler2D gaoMap;
uniform sampler2D bakeLitMap;
uniform sampler2D projMap;

uniform sampler2D uvPattern;

uniform vec4 vec4Param;

uniform sampler2D iblLut;

uniform samplerCube diffusePbrCube;
uniform samplerCube specularPbrCube;

uniform vec4 renderChannels;
uniform int renderMode;

uniform int renderWireframe;
uniform int renderNormalMaps;

uniform mat4 mvp;
uniform vec3 V;

out vec4 fragColor;

// Defined in Wireframe.frag
float WireframeIntensity(vec3 distanceToEdges);

// Defined in NormalMap.frag.
vec3 GetBumpMapNormal(vec3 N, vec3 tangent, vec3 bitangent, vec4 norColor);

// Defined in Gamma.frag.
vec3 GetSrgb(vec3 linear);

float LambertShading(vec3 N, vec3 V)
{
	float lambert = max(dot(N, V), 0);
	return lambert;
}

vec3 FresnelSchlickRoughness(float cosTheta, vec3 F0, float roughness)
{
    return F0 + (max(vec3(1.0 - roughness), F0) - F0) * pow(1.0 - cosTheta, 5.0);
}

float GgxShading(vec3 N, vec3 H, float roughness)
{
	float a = roughness * roughness;
    float a2 = a * a;
    float nDotH = max(dot(N, H), 0.0);
    float nDotH2 = nDotH * nDotH;

    float numerator = a2;
    float denominator = (nDotH2 * (a2 - 1.0) + 1.0);
    denominator = 3.14159 * denominator * denominator;

    return numerator / denominator;
}

vec4 GetAlbedoColor()
{
    // Blend two diffuse layers based on alpha.
    // The second layer is set using the first layer if not present.
    vec4 albedoColor = texture(colMap, map1).rgba;
    vec4 albedoColor2 = texture(col2Map, map1).rgba;

    // Vertex color alpha is used for some stages.
    float blend = albedoColor2.a * colorSet5.a;

    albedoColor.rgb = mix(albedoColor.rgb, albedoColor2.rgb, blend);

    return albedoColor;
}

void main()
{
	vec4 norColor = texture(norMap, map1).xyzw;
    vec3 newNormal = N;
    if (renderNormalMaps == 1)
        newNormal = GetBumpMapNormal(N, tangent, bitangent, norColor);

	vec3 R = reflect(V, newNormal);

    // Get texture colors.
	vec4 albedoColor = GetAlbedoColor();
	vec4 prmColor = texture(prmMap, map1).xyzw;
	vec4 emiColor = texture(emiMap, map1).rgba;
	vec4 bakeLitColor = texture(bakeLitMap, bake1).rgba;
    vec4 gaoColor = texture(gaoMap, bake1).rgba;
    vec4 projColor = texture(projMap, map1).rgba;

	// Invert glossiness?
	float roughness = clamp(1 - prmColor.g, 0, 1);

    vec4 uvPatternColor = texture(uvPattern, map1).rgba;

	// Image based lighting.
	vec3 diffuseIbl = textureLod(diffusePbrCube, R, 0).rgb * 2.5;
	int maxLod = 10;
	vec3 specularIbl = textureLod(specularPbrCube, R, roughness * maxLod).rgb * 2.5;

	float metalness = prmColor.r;

	// Just gamma correct albedo maps.
	fragColor = vec4(1);
	switch (renderMode)
	{
        case 1:
            fragColor.rgb = vec3(0.218) * max(dot(newNormal, V), 0);
            fragColor.rgb = GetSrgb(fragColor.rgb);
            break;
		case 2:
			fragColor = albedoColor;
			fragColor.rgb = GetSrgb(fragColor.rgb);
			break;
		case 3:
			fragColor = prmColor;
			break;
		case 4:
			fragColor = norColor;
			break;
		case 5:
			fragColor = emiColor;
			fragColor.rgb = GetSrgb(fragColor.rgb);
			break;
		case 6:
			fragColor = bakeLitColor;
			fragColor.rgb = GetSrgb(fragColor.rgb);
			break;
        case 7:
            fragColor = gaoColor;
            fragColor.rgb = GetSrgb(fragColor.rgb);
            break;
        case 8:
            fragColor = projColor;
            fragColor.rgb = GetSrgb(fragColor.rgb);
            break;
		case 9:
			fragColor = colorSet1;
			break;
		case 10:
			fragColor = vec4(newNormal * 0.5 + 0.5, 1);
			break;
		case 11:
			fragColor = vec4(tangent * 0.5 + 0.5, 1);
			break;
        case 12:
            fragColor = vec4(bitangent * 0.5 + 0.5, 1);
            break;
		case 13:
			fragColor = vec4(bake1, 1, 1);
			break;
        case 14:
            fragColor = uvPatternColor;
            break;
		case 15:
			fragColor = vec4Param;
			break;
		default:
			fragColor = vec4(0, 0, 0, 1);
			break;
	}

    fragColor.rgb *= renderChannels.rgb;
    if (renderChannels.r == 1 && renderChannels.g == 0 && renderChannels.b == 0)
        fragColor.rgb = fragColor.rrr;
    else if (renderChannels.g == 1 && renderChannels.r == 0 && renderChannels.b == 0)
        fragColor.rgb = fragColor.ggg;
    else if (renderChannels.b == 1 && renderChannels.r == 0 && renderChannels.g == 0)
        fragColor.rgb = fragColor.bbb;

    if (renderChannels.a == 1 && renderChannels.r == 0 && renderChannels.g == 0 && renderChannels.b == 0)
        fragColor = vec4(fragColor.aaa, 1);

	// Don't use alpha blending with debug shading.
	fragColor.a = 1;

	if (renderWireframe == 1)
	{
		vec3 edgeColor = vec3(1);
		float intensity = WireframeIntensity(edgeDistance);
		fragColor.rgb = mix(fragColor.rgb, edgeColor, intensity);
	}
}
