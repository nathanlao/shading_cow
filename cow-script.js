// The WebGL context
var gl;
var canvas;

// Variables for spinning the cow
var angle;
var angularSpeed;

// Vertex positions and colors of the cow model
var positions = [];
var colors = [];
var normals = [];

// Buffer objects
var position_buffer;
var color_buffer;
var normal_buffer;

// Handle for the vertex array object
var vao;

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

// Variables for the light cube
var cubePositions = [];
var cubeColors = [];
var cubePositionBuffer;
var cubeColorBuffer;
var cubeVAO;

var cubeTranslationX = 0.0;
var cubeTranslationY = 0.0;
var cubeTranslationZ = 0.0;

var cubeRotationSpeed; 
var cubePointLightEnabled; 
var lightAngle;

// The cube's initial position
var cubePosition = vec3(8, 5, 5); 

// Variables for spotlight cone
var conePositions = [];
var coneColors = [];

// The cone's position
var conePosition = vec3(0, 8, 0); 

// Buffer objects for spotlight cone
var conePositionBuffer;
var coneColorBuffer;
var coneVAO;

// Variables for spotlight cone panning
var coneAngle; 
var coneSpeed;
var conePanning; 
var coneDirection;

var coneTranslationX = 0.0;
var coneTranslationY = 0.0;
var coneTranslationZ = 0.0;

// Light properties
var lightAmbient = vec4(0.8, 0.8, 0.8, 1.0);
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

var materialAmbient = vec4(0.578, 0.416, 0.259, 1.0); 
var materialDiffuse = vec4(0.658, 0.496, 0.289, 1.0);  
var materialSpecular = vec4(0.9, 0.9, 0.9, 1.0); 
var materialShininess = 10.0; 


function createCowData() { 
    // Get the cow vertex positions and vertex indices.
    var vertices = get_vertices();
    var faces = get_faces();

    // Compute vertex normals.
    var vertexNormals = computeVertexNormals();

    // Populate the positions, colors, and normals arrays.
    for (var i = 0; i < faces.length; i++) {
        var face = faces[i];

        var v1 = vertices[face[0] - 1];
        var v2 = vertices[face[1] - 1];
        var v3 = vertices[face[2] - 1];

        positions.push(v1[0], v1[1], v1[2]);
        positions.push(v2[0], v2[1], v2[2]);
        positions.push(v3[0], v3[1], v3[2]);

        // Color for each vertex.
        colors.push(0.578, 0.416, 0.259, 1.0); 
        colors.push(0.578, 0.416, 0.259, 1.0); 
        colors.push(0.578, 0.416, 0.259, 1.0); 

        // Add vertex normals to the array.
        normals.push(vertexNormals[face[0] - 1][0]);
        normals.push(vertexNormals[face[0] - 1][1]);
        normals.push(vertexNormals[face[0] - 1][2]);

        normals.push(vertexNormals[face[1] - 1][0]); 
        normals.push(vertexNormals[face[1] - 1][1]); 
        normals.push(vertexNormals[face[1] - 1][2]); 

        normals.push(vertexNormals[face[2] - 1][0]); 
        normals.push(vertexNormals[face[2] - 1][1]); 
        normals.push(vertexNormals[face[2] - 1][2]); 
    }
}

// Vertex data for a wireframe cube
function createCubeData() {
    // Vertex positions
    var cubeVertices = [
        vec3(-1, -1, -1), vec3(1, -1, -1), vec3(1, 1, -1), vec3(-1, 1, -1),
        vec3(-1, -1, 1), vec3(1, -1, 1), vec3(1, 1, 1), vec3(-1, 1, 1),
        vec3(-1, -1, -1), vec3(-1, 1, -1), vec3(-1, 1, 1), vec3(-1, -1, 1),
        vec3(1, -1, -1), vec3(1, 1, -1), vec3(1, 1, 1), vec3(1, -1, 1),
        vec3(-1, -1, -1), vec3(-1, -1, 1), vec3(1, -1, 1), vec3(1, -1, -1),
        vec3(-1, 1, -1), vec3(-1, 1, 1), vec3(1, 1, 1), vec3(1, 1, -1)
    ];

    // Apply translation to each vertex of the cube
    for(let i=0; i<cubeVertices.length; i++) {
        var translatedVertex = add(cubePosition, cubeVertices[i]);
        cubePositions.push(translatedVertex[0], translatedVertex[1], translatedVertex[2]);
    }

    // Vertex colors (black)
    cubeColors = Array(24).fill([0.067, 0.039, 0.012, 1.0]).flat();
}

// Vertex data for a wireframe cone
function createConeData() {
    const coneHeight = 2.0;
    const coneRadius = 1.0; 
    const coneSegments = 8; 

    conePositions = [];
    coneColors = [];

    // Base of the cone
    for (var i = 0; i < coneSegments; i++) {
        var angle = (i / coneSegments) * 360.0;
        var x = coneRadius * Math.cos(radians(angle));
        var z = coneRadius * Math.sin(radians(angle));
        conePositions.push(conePosition[0] + x, conePosition[1] - coneHeight, conePosition[2] + z);
    }

    conePositions.push(conePositions[0], conePositions[1], conePositions[2]);

    // Lines of the cone
    for (var i = 0; i < coneSegments; i++) {
        var posIndex = i * 3;
        conePositions.push(conePosition[0], conePosition[1], conePosition[2]);
        conePositions.push(conePositions[posIndex], conePositions[posIndex + 1], conePositions[posIndex + 2]);
    }

    coneColors = Array(conePositions.length / 3).fill([0.067, 0.039, 0.012, 1.0]).flat();
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

    // Create a normal buffer for the vertex normals.
    normal_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normal_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

    logMessage("Created buffers.");
}

// Create buffers for the cube data.
function createCubeBuffers() {
    cubePositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubePositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubePositions), gl.STATIC_DRAW);

    cubeColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeColors), gl.STATIC_DRAW);
}

// Create buffers for the spotlight cone data.
function createConeBuffers() {
    conePositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, conePositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(conePositions), gl.STATIC_DRAW);

    coneColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, coneColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(coneColors), gl.STATIC_DRAW);

}

// Sets the uniform variables in the shader program
function setUniformVariables() {
    
    gl.useProgram(prog);

    // Get the location of the uniform variable in the shader.
    var transform_loc = gl.getUniformLocation(prog, "transform");
    var shininess_loc = gl.getUniformLocation(prog, "shininess");

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

    // Product of light properties and material properties for Phong reflection.
    var ambientProduct = mult(lightAmbient, materialAmbient); 
    var diffuseProduct = mult(lightDiffuse, materialDiffuse);
    var specularProduct = mult(lightSpecular, materialSpecular);
    
    gl.uniform4fv(gl.getUniformLocation(prog, "ambientProduct"), flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(prog, "diffuseProduct"), flatten(diffuseProduct));
    gl.uniform4fv(gl.getUniformLocation(prog, "specularProduct"), flatten(specularProduct));
    gl.uniform1f(shininess_loc, materialShininess);
}

function setCubeUniformVariables() {
    gl.useProgram(prog);

    var transform_loc = gl.getUniformLocation(prog, "transform");

    var translateMatrix = mat4(
        1.0, 0.0, 0.0, cubeTranslationX,
        0.0, 1.0, 0.0, cubeTranslationY,
        0.0, 0.0, 1.0, cubeTranslationZ,
        0.0, 0.0, 0.0, 1.0
    );
    
    // Apply rotation to the cube.
    var cubeModel = mult(rotate(lightAngle, [0.0, 1.0, 0.0]), translateMatrix);

    var eye = vec3(0, 0, 30);
    var target = vec3(0, 0, 0);
    var up = vec3(0, 1, 0);
    var view = lookAt(eye, target, up);
    var aspect = canvas.width / canvas.height;
    var projection = perspective(45.0, aspect, 0.1, 1000.0);
    var cubeTransform = mult(projection, mult(view, cubeModel));

    gl.uniformMatrix4fv(transform_loc, false, flatten(cubeTransform));

    gl.uniform3fv(gl.getUniformLocation(prog, "lightPosition"), flatten(cubePosition));
}

// Function to set uniform variables for spotlight
function setConeUniformVariables() {
    gl.useProgram(prog);

    var transform_loc = gl.getUniformLocation(prog, "transform");

    var translateMatrix = mat4(
        1.0, 0.0, 0.0, coneTranslationX,
        0.0, 1.0, 0.0, coneTranslationY,
        0.0, 0.0, 1.0, coneTranslationZ,
        0.0, 0.0, 0.0, 1.0
    );
    
    // Apply rotation to the cone.
    var coneModel = mult(rotate(coneAngle, [0.0, 1.0, 0.0]), translateMatrix);

    var eye = vec3(0, 0, 30);
    var target = vec3(0, 0, 0);
    var up = vec3(0, 1, 0);
    var view = lookAt(eye, target, up);
    var aspect = canvas.width / canvas.height;
    var projection = perspective(45.0, aspect, 0.1, 1000.0);
    var coneTransform = mult(projection, mult(view, coneModel));

    gl.uniformMatrix4fv(transform_loc, false, flatten(coneTransform));

    // Set the spotlight position
    var spotlightDirection_loc = gl.getUniformLocation(prog, "spotlight_direction");
    var spotlightPosition_loc = gl.getUniformLocation(prog, "spotlight_position");
    var spotlightCutoff_loc = gl.getUniformLocation(prog, "spotlightCutoff");
    var spotlightExponent_loc = gl.getUniformLocation(prog, "spotlightExponent");

    // Set the spotlight direction, position, and cutoff angle.
    var spotlightDirection = vec3(Math.cos(radians(coneAngle)), 0.0, Math.sin(radians(coneAngle)));
    var spotlightCutoff = Math.cos(radians(10)); 

    gl.uniform3fv(spotlightDirection_loc, flatten(spotlightDirection));
    gl.uniform3fv(spotlightPosition_loc, flatten(conePosition));
    gl.uniform1f(spotlightCutoff_loc, spotlightCutoff);
    gl.uniform1f(spotlightExponent_loc, 1.0); // Angular attenuation coefficient 
}

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

    // Bind normal buffer and set the attribute pointer for normal.
    var normal_idx = gl.getAttribLocation(prog, "normal");
    gl.bindBuffer(gl.ARRAY_BUFFER, normal_buffer);
    gl.vertexAttribPointer(normal_idx, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(normal_idx);

    gl.bindVertexArray(null);

    logMessage("Created VAOs.");
}

// Create a vertex array object for the cube data.
function createCubeVAO() {
    cubeVAO = gl.createVertexArray();
    gl.bindVertexArray(cubeVAO);

    var pos_idx = gl.getAttribLocation(prog, "position");
    gl.bindBuffer(gl.ARRAY_BUFFER, cubePositionBuffer);
    gl.vertexAttribPointer(pos_idx, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(pos_idx);

    var col_idx = gl.getAttribLocation(prog, "color");
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeColorBuffer);
    gl.vertexAttribPointer(col_idx, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(col_idx);

    gl.bindVertexArray(null);
}

// Create a vertex array object for the spotlight cone data.
function createConeVAO() {
    coneVAO = gl.createVertexArray();
    gl.bindVertexArray(coneVAO);

    var pos_idx = gl.getAttribLocation(prog, "position");
    gl.bindBuffer(gl.ARRAY_BUFFER, conePositionBuffer);
    gl.vertexAttribPointer(pos_idx, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(pos_idx);

    var col_idx = gl.getAttribLocation(prog, "color");
    gl.bindBuffer(gl.ARRAY_BUFFER, coneColorBuffer);
    gl.vertexAttribPointer(col_idx, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(col_idx);

    gl.bindVertexArray(null);
}

var previousTimestamp;
var previousTimestampCube;
var previousTimestampCone;

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

// Function to update the light cube position for auto-rotation.
function updateCubePosition(timestamp) {
    if (!cubePointLightEnabled) return;

    // Initialize previousTimestampLight the first time this is called.
    if (previousTimestampCube === undefined) {
        previousTimestampCube = timestamp;
    }

    var delta = (timestamp - previousTimestampCube) / 1000;

    lightAngle += cubeRotationSpeed * delta;
    lightAngle -= Math.floor(lightAngle / 360.0) * 360.0;

    // New light position based on the angle.
    var radius = 5.0; 
    var lightX = radius * Math.cos(radians(lightAngle));
    var lightZ = radius * Math.sin(radians(lightAngle));
    cubePosition = vec3(lightX, 5.0, lightZ);

    previousTimestampCube = timestamp;
}

// Function to update spotlight angle for auto panning
function updateConeAngle(timestamp) {
    if (!conePanning) return;

    if (previousTimestampCone === undefined) {
        previousTimestampCone = timestamp;
    }

    var delta = (timestamp - previousTimestampCone) / 1000;

    coneAngle += coneSpeed * delta;

    if (coneAngle > 100.0 || coneAngle < -100.0) {
        coneSpeed = -coneSpeed;
    }

    coneDirection = vec3(Math.cos(radians(coneAngle)), 0.0, Math.sin(radians(coneAngle)));

    previousTimestampCone = timestamp;
}


// Draws the vertex data.
function render(timestamp) {
    // Clear the color and depth buffers.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Set the rendering state to use the shader program.
    gl.useProgram(prog);

    // Update angle for cow, cube and cone
    updateAngle(timestamp);
    updateCubePosition(timestamp);
    updateConeAngle(timestamp);

    // Update uniforms, bind vao and draw cow
    setUniformVariables();
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.TRIANGLES, 0, positions.length / 3);
    
    // Bind the cube VAO and draw cube
    setCubeUniformVariables();
    gl.bindVertexArray(cubeVAO);
    gl.drawArrays(gl.LINES, 0, cubePositions.length / 3);

    // Update uniforms for cone, bind vao and draw cone.
    setConeUniformVariables();
    gl.bindVertexArray(coneVAO);
    gl.drawArrays(gl.LINE_LOOP, 0, conePositions.length / 3);

    // Call this function repeatedly with requestAnimationFrame.
    requestAnimationFrame(render);
}

async function setup() {
    // Initialize the context.
    initializeContext();
    
    // Set event listeners
    setEventListeners(canvas);

    // Create cow, cube, cone data.
    createCowData();
    createCubeData();
    createConeData();

    // Create cow, cube, cone buffers.
    createBuffers();
    createCubeBuffers();
    createConeBuffers();

    // Load shader files.
    await loadShaders();
    // Compile the shaders.
    compileShaders();

    // Create vertex array objects.
    createVertexArrayObjects();
    // Create cube VAO.
    createCubeVAO();
    // Create spotlight cone VAO.
    createConeVAO();

    // Initialize angle and angularSpeed.
    angle = 0.0;
    angularSpeed = 0.0;

    cubePointLightEnabled = true;
    lightAngle = 0.0;
    cubeRotationSpeed = 30.0;

    // Initialize spotlight angle and spotlightOn.
    coneAngle = 0.0;
    coneSpeed = 30.0;
    conePanning = true;

    // Draw!
    requestAnimationFrame(render);
}

window.onload = setup;

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

        // Press r to reset initial location and orientation.
        if (event.key === 'r') { 
            // console.log("Key Press:" + event.key);
            resetCow()
        }
        // Press p to turn on and off the rotation of light
        if (event.key === 'p') {
            console.log("press p: ")
            cubePointLightEnabled = !cubePointLightEnabled
        }
        //Press s to turn on and off the panning cone
        if (event.key === 's') {
            console.log("press s: ")
            conePanning = !conePanning;
        }
    });   
}

function resetCow() {
    translationX = 0.0;
    translationY = 0.0;
    translationZ = 0.0;
    rotationX = 0.0;
    rotationY = 0.0;
    rotationZ = 0.0;
}

// Function to compute vertex normals.
function computeVertexNormals() {
    var vertices = get_vertices();
    var faces = get_faces();
    var vertexNormals = new Array(vertices.length).fill(vec3(0.0, 0.0, 0.0));

    for (var i = 0; i < faces.length; i++) {
        var face = faces[i];

        var v1 = vertices[face[0] - 1];
        var v2 = vertices[face[1] - 1];
        var v3 = vertices[face[2] - 1];

        var normal = normalize(cross(subtract(v2, v1), subtract(v3, v1)));

        // Accumulate face normals to each vertex normal.
        vertexNormals[face[0] - 1] = add(vertexNormals[face[0] - 1], normal);
        vertexNormals[face[1] - 1] = add(vertexNormals[face[1] - 1], normal);
        vertexNormals[face[2] - 1] = add(vertexNormals[face[2] - 1], normal);
    }

    // Normalize all vertex normals.
    for (var i = 0; i < vertexNormals.length; i++) {
        vertexNormals[i] = normalize(vertexNormals[i]);
    }

    return vertexNormals;
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