#version 300 es

// Input attribute for the vertex position.
in vec3 position;

// Input attribute for the vertex color.
in vec4 color;

// Output variable for the fragment shader to receive the color data.
out vec4 fragColor;

// Uniform variable for the transformation matrix.
uniform mat4 transform;

void main() {
    // Transform the vertex position using the transformation matrix.
    gl_Position = transform * vec4(position, 1.0f);
    
    // Pass the vertex color to the fragment shader.
    fragColor = color;
}
