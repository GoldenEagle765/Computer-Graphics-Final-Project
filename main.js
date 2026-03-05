let canvas;
let gl;
let program;

let numTimesToSubdivide = 4;

let index = 0;

let nucleusPositions = [vec3(0, 0, 0), vec3(0, 0, 1.5), vec3(1.5, 0, 0), vec3(-1.5, 0, 0), vec3(0, 1.5, 0), vec3(0, -1.5, 0), vec3(0, 0, -1.5)];
let nucleusTypes = [0,0,1,1]; // 0 is neutron, 1 is proton
let rootChildren = 6;
let branchChildren = 3;
let nucleus;

let electronPositions = [vec3(5, 0, 0), vec3(-5, 0, 0)];
let electronSize = 0.5;

let electronTransform;
let isAnimating = true;
let theta = 0;
let alpha = 0;
let beta = 0;

let pointsArray = [];
let normalsArray = [];

//Make sure these are set properly, 
//or sphere could appear black
let near = 0.1;
let far = 100;

let left = -10;
let right = 10;
let ytop = 10;
let bottom = -10;

let va = vec4(0.0, 0.0, -1.0, 1);
let vb = vec4(0.0, 0.942809, 0.333333, 1);
let vc = vec4(-0.816497, -0.471405, 0.333333, 1);
let vd = vec4(0.816497, -0.471405, 0.333333, 1);

let lightPosition = vec4(1.0, 0.0, -1.0, 1.0);  //eye coordinates
let lightAmbient = vec4(0.2, 0.2, 0.2, 1.0);
let lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
let lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

let materialAmbient = vec4(1.0, 0.0, 1.0, 1.0);
let materialDiffuse = vec4(1.0, 1.0, 0.0, 1.0);
let materialSpecular = vec4(1.0, 1.0, 1.0, 1.0);
let materialShininess = 20.0;

let modelViewMatrix, projectionMatrix;
let modelViewMatrixLoc, projectionMatrixLoc;

let eye;
let at = vec3(0.0, 0.0, 0.0);
let up = vec3(0.0, 1.0, 0.0);

function Tree(root) {
    this.root = root;
}

function Particle(matrix, type) {
    this.children = [];
    this.matrix = matrix;
    this.type = type;
}

function triangle(a, b, c) {


    pointsArray.push(a);
    pointsArray.push(b);
    pointsArray.push(c);

    // normals are vectors but where w = 0.0,
    // since normals do not have a homogeneous coordinate
    normalsArray.push(a[0], a[1], a[2], 0.0);
    normalsArray.push(b[0], b[1], b[2], 0.0);
    normalsArray.push(c[0], c[1], c[2], 0.0);

    index += 3;

}


function divideTriangle(a, b, c, count) {
    if (count > 0) {

        let ab = mix(a, b, 0.5);
        let ac = mix(a, c, 0.5);
        let bc = mix(b, c, 0.5);

        ab = normalize(ab, true);
        ac = normalize(ac, true);
        bc = normalize(bc, true);

        divideTriangle(a, ab, ac, count - 1);
        divideTriangle(ab, b, bc, count - 1);
        divideTriangle(bc, c, ac, count - 1);
        divideTriangle(ab, bc, ac, count - 1);
    } else {
        triangle(a, b, c);
    }
}


function tetrahedron(a, b, c, d, n) {
    divideTriangle(a, b, c, n);
    divideTriangle(d, c, b, n);
    divideTriangle(a, d, b, n);
    divideTriangle(a, c, d, n);
}

function handleKey(evt) {
    console.log("a");
    let key = evt.key.toLowerCase();

    if (key == "a") {
        isAnimating = !isAnimating;
    } else if (key == "s") {

    } else if (key == "l") {

    } else if (key == "t") {

    }

}

window.onload = function init() {

    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available");
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);
    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    //
    //  Load shaders and initialize attribute buffers
    //

    window.addEventListener("keydown", handleKey);

    tetrahedron(va, vb, vc, vd, numTimesToSubdivide);

    // Build nucleus hierarchy
    buildNucleus();

    //Pass in transformation matrices
    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");

    //Pass in parameters for lighting equations
    gl.uniform4fv(gl.getUniformLocation(program, "lightDiffuse"), flatten(lightDiffuse));
    gl.uniform4fv(gl.getUniformLocation(program, "materialDiffuse"), flatten(materialDiffuse));
    gl.uniform4fv(gl.getUniformLocation(program, "lightSpecular"), flatten(lightSpecular));
    gl.uniform4fv(gl.getUniformLocation(program, "materialSpecular"), flatten(materialSpecular));
    gl.uniform4fv(gl.getUniformLocation(program, "lightAmbient"), flatten(lightAmbient));
    gl.uniform4fv(gl.getUniformLocation(program, "materialAmbient"), flatten(materialAmbient));

    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition));
    gl.uniform1f(gl.getUniformLocation(program, "shininess"), materialShininess);

    render();
}


function render() {

    if (isAnimating) {
        theta += 0.5;
        alpha += 0.3;
        beta += 0.2;
    }

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    eye = vec3(0, 0, 10.0);

    modelViewMatrix = lookAt(eye, at, up);
    projectionMatrix = perspective(90, 1, near, far);

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));


    drawElectrons();
    drawNucleus();

    requestAnimFrame(render);
}

function buildNucleus() {
    shuffle(nucleusTypes);
    let root = new Particle(translate(nucleusPositions[0][0], nucleusPositions[0][1], nucleusPositions[0][2]), nucleusTypes[0]);
    nucleus = new Tree(root);
    let queue = []

    for (let i = 0; i < rootChildren; i++) queue.push(root);

    for (let i = 1; i < nucleusTypes.length; i++) {
        let type = nucleusTypes[i];
        let parent = queue.shift();
        let matrix = translate(nucleusPositions[i][0], nucleusPositions[i][1], nucleusPositions[i][2]);

        let p = new Particle(matrix, type);
        parent.children.push(p);

        for (let j = 0; j < branchChildren; j++) queue.push(p);
    }
}

function drawElectrons() {
    for (let j = 0; j < electronPositions.length; j++) {
        pushSphere();

        let translation = translate(electronPositions[j][0], electronPositions[j][1], electronPositions[j][2]);
        translation = mult(rotateZ(theta),
            mult(translation,
                scalem(electronSize, electronSize, electronSize)));

        let translationU = gl.getUniformLocation(program, "translation");
        gl.uniformMatrix4fv(translationU, false, flatten(translation));

        gl.drawArrays(gl.TRIANGLES, 0, pointsArray.length);

    }
}

function drawNucleus() {
    let rotationMatrix = mult(rotateX(alpha), rotateY(beta))
    let queueMatrix = [translate(0,0,0)];
    let queueParticle = [nucleus.root];

    while (queueParticle.length > 0) {
        let particle = queueParticle.shift();
        let prevMatrix = queueMatrix.shift();

        pushSphere();

        matrix = mult(rotationMatrix,
            mult(prevMatrix, particle.matrix));

        let translationU = gl.getUniformLocation(program, "translation");
        gl.uniformMatrix4fv(translationU, false, flatten(matrix));
        gl.drawArrays(gl.TRIANGLES, 0, pointsArray.length);

        for (let i = 0; i < particle.children.length; i++) {
            queueMatrix.push(particle.matrix);
            queueParticle.push(particle.children[i])
        }
    }
}

function shuffle(array) {
    let currentIndex = array.length;

    while (currentIndex !== 0) {

        let randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }
}

function pushSphere() {
    let vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    let vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    //Pass in normal data
    let vNormal = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vNormal);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);

    let vNormalPosition = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormalPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormalPosition);
}