#version 300 es

// Input variable received from the vertex shader for the fragment color.
in mediump vec4 fragColor;

// Output variable for the final color of the pixel.
out mediump vec4 finalColor;

void main() {
    // Output the vertex color as the final pixel color.
    finalColor = fragColor;
}
