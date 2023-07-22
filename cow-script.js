// The WebGL context
var gl;
var canvas;

// Variables for spinning the cow
var angle;
var angularSpeed;

// Vertex positions and colors of the cow model
var positions = [];
var colors = [];

// Buffer objects
var position_buffer;
var color_buffer;

// Shader sources
var vs_source;
var fs_source;

// Cow's translation
var translationX = 0.0;
var translationY = 0.0;
var translationZ = 0.0;

// Cow's rotation
var rotationX = 0.0;
var rotationY = 0.0;
var rotationZ = 0.0;

/*
 * Initialization
 */

function initializeContext() {
    // Get and store the WebGL context from the canvas.
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { 
        alert( "WebGL isn't available" ); 
    }

    gl.viewport( 0, 0, canvas.width, canvas.height );

	gl.clearColor( 0.5, 0.5, 0.5, 1.0 ); // grey background color
    
    // Enable depth testing.
    gl.enable(gl.DEPTH_TEST);

    logMessage("WebGL initialized.");
}

function createCowData() { 
    // Get the cow vertex positions and vertex indices.
    var vertices = get_vertices();
    var faces = get_faces();

    // Populate the positions and colors arrays.
    for (var i = 0; i < faces.length; i++) {
        var face = faces[i];

        var v1 = vertices[face[0] - 1];
        var v2 = vertices[face[1] - 1];
        var v3 = vertices[face[2] - 1];

        positions.push(v1[0], v1[1], v1[2]);
        positions.push(v2[0], v2[1], v2[2]);
        positions.push(v3[0], v3[1], v3[2]);

        // black uniform color for each vertex.
        colors.push(0.067, 0.039, 0.012, 1.0);
        colors.push(0.067, 0.039, 0.012, 1.0);
        colors.push(0.067, 0.039, 0.012, 1.0);
    }
}

// Used to represent the light source.
var lightPositions = [
    vec3(8, 6, 0),   // Light source 1 position
    vec3(-1, 10, 0)  // Light source 2 position 
];

function createLightSourceData() {
    const coneHeight = 1;
    const coneRadius = 0.3;
    const coneSegments = 20;

    for (var i = 0; i < lightPositions.length; i++) {
        var lightPos = lightPositions[i];

        // Create vertices for the cone centered at the light position
        for (var j = 0; j < coneSegments; j++) {
            var angle = (j * 2 * Math.PI) / coneSegments;
            var nextAngle = ((j + 1) * 2 * Math.PI) / coneSegments;

            var x1 = lightPos[0] + coneRadius * Math.cos(angle);
            var y1 = lightPos[1];
            var z1 = lightPos[2] + coneRadius * Math.sin(angle);

            var x2 = lightPos[0] + coneRadius * Math.cos(nextAngle);
            var y2 = lightPos[1];
            var z2 = lightPos[2] + coneRadius * Math.sin(nextAngle);

            var x3 = lightPos[0];
            var y3 = lightPos[1] + coneHeight;
            var z3 = lightPos[2];

            // Base triangle
            positions.push(x1, y1, z1);
            positions.push(x2, y2, z2);
            positions.push(x3, y3, z3);

            // Yellow color for each vertex
            colors.push(1.0, 1.0, 0.0, 1.0);
            colors.push(1.0, 1.0, 0.0, 1.0);
            colors.push(1.0, 1.0, 0.0, 1.0);

            // Side triangle
            positions.push(lightPos[0], lightPos[1], lightPos[2]);
            positions.push(x1, y1, z1);
            positions.push(x2, y2, z2);

            // Yellow color for each vertex
            colors.push(1.0, 1.0, 0.0, 1.0);
            colors.push(1.0, 1.0, 0.0, 1.0);
            colors.push(1.0, 1.0, 0.0, 1.0);
        }
    }
}

// Creates buffers using provided data.
function createBuffers() {
    // Create a position buffer for the vertices.
    position_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, position_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    // Repeat for the color vertex data.
    color_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    logMessage("Created buffers.");
}

function loadShaderFile(url) {
    return fetch(url).then(response => response.text());
}

// Loads the shader data from the files.
async function loadShaders() {
    // Specify shader URLs for your local web server.
    const shaderURLs = [
        './main.vert',
        './main.frag'
    ];

    // Load shader files.
    const shader_files = await Promise.all(shaderURLs.map(loadShaderFile));

    // Assign shader sources.
    vs_source = shader_files[0];
    fs_source = shader_files[1];

    // logMessage(vs_source);
    // logMessage(fs_source);

    logMessage("Shader files loaded.")
}

// Shader handles
var vs;
var fs;
var prog;

// Compile the GLSL shader stages and combine them into a shader program.
function compileShaders() {
    // vertex shader
    vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, vs_source);
    gl.compileShader(vs);
    
    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
        logError(gl.getShaderInfoLog(vs));
        gl.deleteShader(vs);
    }

    // Repeat for the fragment shader.
    fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, fs_source);
    gl.compileShader(fs);

    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
        logError(gl.getShaderInfoLog(fs));
        gl.deleteShader(fs);
    }

    // Create a shader program.
    prog = gl.createProgram();

    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);

    // Link the program.
    gl.linkProgram(prog);

    // Check the LINK_STATUS using getProgramParameter.
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        logError(gl.getProgramInfoLog(prog));
    }

    logMessage("Shader program compiled successfully.");
}

// Sets the uniform variables in the shader program
function setUniformVariables() {
    const matrix = [
        1.0, 0.0, 0.0, 0.0,
        0.0, 1.0, 0.0, 0.0,
        0.0, 0.0, 1.0, 0.0,
        0.0, 0.0, 0.0, 1.0
    ];

    gl.useProgram(prog);

    // Get the location of the uniform variable in the shader.
    var transform_loc = gl.getUniformLocation(prog, "transform");

    // Create a translation matrix (x y z).
    var translateMatrix = mat4(
        1.0, 0.0, 0.0, translationX,
        0.0, 1.0, 0.0, translationY,
        0.0, 0.0, 1.0, translationZ,
        0.0, 0.0, 0.0, 1.0
    );
    
    // Apply rotation and translation to the 3D model.
    var model = mult(rotate(angle, [0.0, 1.0, 0.0]), translateMatrix);
    
    // Apply X, Y, and Z rotations to the model matrix
    model = mult(model, rotate(rotationX, [1.0, 0.0, 0.0]));
    model = mult(model, rotate(rotationY, [0.0, 1.0, 0.0]));
    model = mult(model, rotate(rotationZ, [0.0, 0.0, 1.0]));

    // Define the camera location.
    var eye = vec3(0, 0, 30);

    // Define the target position.
    var target = vec3(0, 0, 0);

    // Define the up direction.
    var up = vec3(0, 1, 0);

    // Create view matrix.
    var view = lookAt(eye, target, up);

    // Aspect ratio
    var aspect = canvas.width / canvas.height;

    // field of view = 45, near plane = 0.1, far plane = 1000.0
    var projection = perspective(45.0, aspect, 0.1, 1000.0);

    var transform = mult(projection, mult(view, model));

    gl.uniformMatrix4fv(transform_loc, false, flatten(transform));
}

// Handle for the vertex array object
var vao;

// Creates VAOs for vertex attributes
function createVertexArrayObjects() {

    vao = gl.createVertexArray();

    gl.bindVertexArray(vao);

    var pos_idx = gl.getAttribLocation(prog, "position");
    gl.bindBuffer(gl.ARRAY_BUFFER, position_buffer);
    gl.vertexAttribPointer(pos_idx, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(pos_idx);

    var col_idx = gl.getAttribLocation(prog, "color");
    gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
    gl.vertexAttribPointer(col_idx, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(col_idx);

    gl.bindVertexArray(null);

    logMessage("Created VAOs.");
}

var previousTimestamp;

function updateAngle(timestamp) {
    // Initialize previousTimestamp the first time this is called.
    if (previousTimestamp === undefined) {
        previousTimestamp = timestamp;
    }

    // Calculate the change in time in seconds.
    var delta = (timestamp - previousTimestamp) / 1000;

    // Update the angle using angularSpeed and the change in time.
    angle += angularSpeed * delta;
    angle -= Math.floor(angle / 360.0) * 360.0;

    // Decrease the angular speed using the change in time.
    angularSpeed = Math.max(angularSpeed - 100.0 * delta, 0.0);

    // Update previousTimestamp.
    previousTimestamp = timestamp;
}

// Draws the vertex data.
function render(timestamp) {
    // Clear the color and depth buffers.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Set the rendering state to use the shader program.
    gl.useProgram(prog);

    // Call updateAngle.
    updateAngle(timestamp);

    // Update uniforms.
    setUniformVariables();

    // Bind the VAO.
    gl.bindVertexArray(vao);

    // Draw the correct number of vertices using the TRIANGLES mode.
    gl.drawArrays(gl.TRIANGLES, 0, positions.length / 3);

    // Call this function repeatedly with requestAnimationFrame.
    requestAnimationFrame(render);
}

async function setup() {
    // Initialize the context.
    initializeContext();
    
    // Set event listeners
    setEventListeners(canvas);

    // Create cow data.
    createCowData();

    // Create light source data.
    createLightSourceData();

    // Create vertex buffer data.
    createBuffers();

    // Load shader files.
    await loadShaders();

    // Compile the shaders.
    compileShaders();

    // Create vertex array objects.
    createVertexArrayObjects();

    // Initialize angle and angularSpeed.
    angle = 0.0;
    angularSpeed = 0.0;

    // Draw!
    requestAnimationFrame(render);
}

window.onload = setup;

function setEventListeners(canvas) {

    // Prevent the context menu from showing when the right mouse button is clicked
    canvas.addEventListener("contextmenu", function (event) {
        event.preventDefault();
    });

    canvas.addEventListener("mousedown", function (event) {
        // Left mouse button press to handle X and Y translation.
        if (event.button === 0) { 
            // console.log("left click");

            var startX = event.clientX;
            var startY = event.clientY;
    
            function handleMouseMove(event) {
                var currentX = event.clientX;
                var currentY = event.clientY;
    
                // Movement in X and Y directions.
                var deltaX = currentX - startX;
                var deltaY = currentY - startY;
    
                // Update the translation values based on mouse movement.
                translationX += deltaX * 0.01;
                translationY -= deltaY * 0.01;
    
                // Reset
                startX = currentX;
                startY = currentY;
            }
             // Right mouse button press to handle X and Y Rotation.
        } else if (event.button === 2) { 
            // console.log("right click");

            var startX = event.clientX;
            var startY = event.clientY;

            function handleMouseMove(event) {
                var currentX = event.clientX;
                var currentY = event.clientY;

                // X, Y directions.
                var deltaX = currentX - startX;
                var deltaY = currentY - startY;

                // Update the rotation angles.
                rotationY += deltaX * 0.5;
                rotationX += deltaY * 0.5;

                // Reset
                startX = currentX;
                startY = currentY;
            }
        }

        function handleMouseUp() {
            // Button released
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        }

        // Attach event listeners to handle mouse movement and release.
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    });

    // Wheel to handle Z translation.
    canvas.addEventListener("wheel", function (event) {
        if (event.deltaY < 0) {
            // Wheel scroll up.
            translationZ -= 0.1;
        } else if (event.deltaY > 0) {
            // Wheel scroll down.
            translationZ += 0.1;
        }
    }, {passive : true});

    // Arrow left and right to handle Z rotation.
    window.addEventListener("keydown", function(event) {
        if (event.key === "ArrowLeft") {
            // counterclockwise
            rotationZ += 5.0;
        } else if (event.key === "ArrowRight") {
            // clockwise
            rotationZ -= 5.0;
        }
    });

    // Press r to reset initial location and orientation.
    window.addEventListener("keydown", function (event) {
        if (event.key === 'r') { 
            // console.log("Key Press:" + event.key);
            resetCow()
        }
    })
}

function resetCow() {
    translationX = 0.0;
    translationY = 0.0;
    translationZ = 0.0;
    rotationX = 0.0;
    rotationY = 0.0;
    rotationZ = 0.0;
}

// Logging
function logMessage(message) {
    console.log(`[msg]: ${message}\n`);
}

function logError(message) {
    console.log(`[err]: ${message}\n`);
}

function logObject(obj) {
    let message = JSON.stringify(obj, null, 2);
    console.log(`[obj]:\n${message}\n\n`);
}