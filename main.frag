#version 300 es

// Input variables received from the vertex shader.
in mediump vec4 fragColor;
in mediump vec3 fragNormal;

// Output variable for the final color of the pixel.
out mediump vec4 finalColor;

// Uniform variables for lighting properties.
uniform mediump vec3 lightPosition;
// uniform mediump vec3 lightColor;
// uniform mediump vec3 ambientColor;
uniform mediump float shininess;

// Material properties for Phong reflection.
uniform mediump vec4 ambientProduct;
uniform mediump vec4 diffuseProduct;
uniform mediump vec4 specularProduct;

void main() {
    // Normalize the vertex normal
    mediump vec3 N = normalize(fragNormal);

    // Light vector from the fragment to the light source
    mediump vec3 L = normalize(lightPosition - gl_FragCoord.xyz);

    // Reflection vector
    mediump vec3 R = reflect(-L, N);

    // the view vector from the fragment to the camera (eye) at (0, 0, 30)
    mediump vec3 V = normalize(vec3(0.0, 0.0, 30.0) - gl_FragCoord.xyz);

    // Ambient reflection.
    mediump vec3 ambient = ambientProduct.rgb * fragColor.rgb;

    // Diffuse reflection using Lambertian reflection model
    mediump float diffuseIntensity = max(dot(N, L), 0.0);
    mediump vec3 diffuse = diffuseProduct.rgb * fragColor.rgb * diffuseIntensity;

    // Specular reflection using Phong reflection model
    mediump float specularIntensity = pow(max(dot(R, V), 0.0), shininess);
    mediump vec3 specular = specularProduct.rgb * specularIntensity;

    // Combine to get the final color
    mediump vec3 finalReflection = ambient + diffuse + specular;

    // Output the final color of the pixel
    finalColor = vec4(finalReflection, fragColor.a);
}
