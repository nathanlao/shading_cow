#version 300 es

// Input attribute for the vertex position.
in vec3 position;

// Input attribute for the vertex color.
in vec4 color;

// Input attribute for the vertex normal.
in vec3 normal;

// Output variables for the fragment shader to receive the data.
out vec4 fragColor;
out vec3 fragNormal;

// Uniform variable for the transformation matrix.
uniform mat4 transform;

void main() {
    // Transform the vertex position using the transformation matrix.
    gl_Position = transform * vec4(position, 1.0f);
    
    // Pass the vertex color to the fragment shader.
    fragColor = color;

    // Pass the vertex normal to the fragment shader.
    fragNormal = normal;
}
