#version 300 es

// Input variables received from the vertex shader.
in mediump vec4 fragColor;
in mediump vec3 fragNormal;
in mediump vec3 fragPosition;

// Output variable for the final color of the pixel.
out mediump vec4 finalColor;

// Uniform variables for lighting properties.
uniform mediump vec3 lightPosition;
uniform mediump float shininess;
uniform mediump vec3 spotlight_direction;
uniform mediump vec3 spotlight_position;
uniform mediump float spotlightCutoff;
uniform mediump float spotlightExponent;

// Material properties for Phong reflection.
uniform mediump vec4 ambientProduct;
uniform mediump vec4 diffuseProduct;
uniform mediump vec4 specularProduct;

void main() {
    // Normalize the vertex normal
    mediump vec3 N = normalize(fragNormal);

    // Light vector from the fragment to the light source
    mediump vec3 L = normalize(fragPosition - lightPosition);

    // Ambient reflection.
    mediump vec3 ambient = ambientProduct.rgb * fragColor.rgb;

    // Diffuse reflection
    mediump float diffuseIntensity = max(dot(N, L), 0.0);
    mediump vec3 diffuse = diffuseProduct.rgb * fragColor.rgb * diffuseIntensity;

    // Specular reflection
    mediump vec3 R = reflect(-L, N);
    mediump vec3 V = normalize(vec3(0, 0, 30) - fragPosition);
    mediump float specularIntensity = pow(max(dot(R, V), 0.0), shininess);
    mediump vec3 specular = specularProduct.rgb * specularIntensity;

    // Spotlight calculations
    mediump vec3 L_spot = normalize(spotlight_position - fragPosition);
    mediump float spotEffect = dot(normalize(spotlight_direction), -L_spot);
    if(spotEffect > spotlightCutoff){
        spotEffect = pow(spotEffect, spotlightExponent);
    }else{
        spotEffect = 0.0;
    }

    // Apply cube spotlight 
    mediump vec3 spotlight = spotEffect * vec3(0.6, 0.706, 0.455); 

    // Combine all components
    mediump vec3 finalReflection = ambient + diffuse + specular + spotlight;
    finalColor = vec4(finalReflection, fragColor.a);
}
