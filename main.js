let canvas;
let gl;
let program;
let port = 6767;

let numTimesToSubdivide = 3;

let index = 0;

let nucleusPositions = [vec3(0, 0, 0), vec3(0, 0, 1.5), vec3(1.5, 0, 0), vec3(-1.5, 0, 0), vec3(0, 1.5, 0), vec3(0, -1.5, 0), vec3(0, 0, -1.5),
                              vec3(0, 1.06, 1.06), vec3(-0.92, -0.53, 1.06), vec3(0.92, -0.53, 1.06), vec3(1.06, -1.06, 0), vec3(1.06, 0.53, -0.92), vec3(1.06, 0.53, 0.92),
                              vec3(-1.06, -1.06, 0), vec3(-1.06, 0.53, -0.92), vec3(-1.06, 0.53, 0.92), vec3(1.06, 1.06, 0), vec3(-0.53, 1.06, -0.92), vec3(-0.53, 1.06, 0.92),
                              vec3(1.06, -1.06, 0), vec3(-0.53, -1.06, -0.92), vec3(-0.53, -1.06, 0.92), vec3(0, 1.06, -1.06), vec3(-0.92, -0.53, -1.06), vec3(0.92, -0.53, -1.06)];
let numNeutrons = 10;
let numProtons = 10;
let rootChildren = 6;
let branchChildren = 3;
let nucleus;

let electronPositions = [vec3(10, 0, 0), vec3(-10, 0, 0), vec3(15,0,0), vec3(-15,0,0), vec3(0,15,0), vec3(0,-15,0), vec3(10.6,10.6,0), vec3(-10.6,-10.6,0), vec3(10.6,-10.6,0), vec3(-10.6,10.6,0)];
let electronSize = 0.5;

let electronTransform;
let isAnimating = true;
let theta = 0;
let alpha = 0;
let beta = 0;
let satelliteTheta = 0;
let satelliteX = -10;
let satelliteY = -10;
let spaceshipX = 30;
let spaceshipY = 0;

let pointsArray = [];
let normalsArray = [];
let models = [];
let modelVecs = []

//Make sure these are set properly, 
//or sphere could appear black
let near = 0.1;
let far = 100;

let va = vec4(0.0, 0.0, -1.0, 1);
let vb = vec4(0.0, 0.942809, 0.333333, 1);
let vc = vec4(-0.816497, -0.471405, 0.333333, 1);
let vd = vec4(0.816497, -0.471405, 0.333333, 1);

let lightPosition = vec4(0.0, 0.0, 5.0, 1.0);  //eye coordinates
let lightAmbient = vec4(0.2, 0.2, 0.2, 1.0);
let lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
let lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

let materialAmbient = vec4(1.0, 0.0, 1.0, 1.0);
let materialDiffuse = vec4(1.0, 1.0, 0.0, 1.0);
let materialSpecular = vec4(1.0, 1.0, 1.0, 1.0);
let materialShininess = 20.0;

let modelViewMatrix, projectionMatrix;
let modelViewMatrixLoc, projectionMatrixLoc;

var texCoordsArray = [];
var texture;

let eye;
let at = vec3(0.0, 0.0, 0.0);
let up = vec3(0.0, 1.0, 0.0);

var minT = 0.0;
var maxT = 1.0;

var texCoord = [
    vec2(minT, minT),
    vec2(minT, maxT),
    vec2(maxT, maxT),
    vec2(maxT, minT)
];

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
        triangle(c, b, a);
    }
}


function tetrahedron(a, b, c, d, n) {
    divideTriangle(a, b, c, n);
    divideTriangle(d, c, b, n);
    divideTriangle(a, d, b, n);
    divideTriangle(a, c, d, n);
}

function handleKey(evt) {
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
    gl.enable(gl.CULL_FACE);
   // configureDefaultTexture();
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    //
    //  Load shaders and initialize attribute buffers
    //
    
    window.addEventListener("keydown", handleKey);

    // Load objects
    loadObject("objects/Satellite/Satellite.obj", "objects/Satellite/Satellite.mtl");
    loadObject("objects/Spaceship/SpaceShipDetailed.obj", "objects/Spaceship/SpaceShipDetailed.mtl");
    console.log(models);

    for (let i = 0; i < models.length; i++) {
        let object = models[i];
        let numModels = object['number_models'];

        for (let j = 0; j < numModels; j++) {
            let model = object[j];
            let triangles = model.triangles;

            let vertices = [];
            let normals = [];

            for (let k = 0; k < triangles.vertices.length; k += 3) {
                vertices.push(vec4(triangles.vertices[k], triangles.vertices[k + 1], triangles.vertices[k+2], 1));
                normals.push(vec4(triangles.flat_normals[k], triangles.flat_normals[k + 1], triangles.flat_normals[k + 2], 0));
            }

            modelVecs.push([vertices, normals]);
        }
    }

    tetrahedron(va, vb, vc, vd, numTimesToSubdivide);

    // Build nucleus hierarchy
    buildNucleus();

    //Pass in transformation matrices
    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");

    //Pass in parameters for lighting equations
    gl.uniform4fv(gl.getUniformLocation(program, "lightDiffuse"), flatten(lightDiffuse));
    gl.uniform4fv(gl.getUniformLocation(program, "lightSpecular"), flatten(lightSpecular));
    gl.uniform4fv(gl.getUniformLocation(program, "lightAmbient"), flatten(lightAmbient));

    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition));

    //var vTexCoord = gl.getAttribLocation( program, "vTexCoord" );
    //gl.vertexAttribPointer( vTexCoord, 2, gl.FLOAT, false, 0, 0 );
    //gl.enableVertexAttribArray( vTexCoord );

    render();
}


function render() {

    if (isAnimating) {
        theta += 0.5;
        alpha += 0.3;
        beta += 0.2;
        satelliteTheta += 0.6;
        satelliteX += 0.025;
        if (satelliteX > 60) {
            satelliteX = -60
        }
        satelliteY -= 0.015;
        if (satelliteY < -60) {
            satelliteY = 60
        }
        spaceshipX -= 0.026;
        if (spaceshipX < -70) {
            spaceshipX = 90
        }
        spaceshipY -= 0.01;
        if (spaceshipY < -70) {
            spaceshipY = 80
        }
    }

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    eye = vec3(0, 0, 20.0);

    modelViewMatrix = lookAt(eye, at, up);
    projectionMatrix = perspective(90, 1, near, far);

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

    gl.disableVertexAttribArray();

    gl.uniform1i(gl.getUniformLocation(program, "isSkybox"), 0);

    drawObjects();

    //Pass in parameters for lighting equations
    gl.uniform4fv(gl.getUniformLocation(program, "materialDiffuse"), flatten(materialDiffuse));
    gl.uniform4fv(gl.getUniformLocation(program, "materialSpecular"), flatten(materialSpecular));
    gl.uniform4fv(gl.getUniformLocation(program, "materialAmbient"), flatten(materialAmbient));
    gl.uniform1f(gl.getUniformLocation(program, "shininess"), materialShininess);

    gl.uniform1f(gl.getUniformLocation(program, "isObject"), 0.0);

    drawElectrons();
    drawNucleus();
    //drawSkybox();

    requestAnimFrame(render);
}

function buildNucleus() {
    let nucleusTypes = [];
    let numParticles = numNeutrons + numProtons;

    for (let i = 0; i < numParticles; i++) {
        let roll = Math.random() * (numNeutrons + numProtons);
        if (roll > numNeutrons) {
            nucleusTypes.push(1);
            numProtons--;
        } else {
            nucleusTypes.push(0);
            numNeutrons--;
        }
    }

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

function drawObjects() {
    let modelCount = 0;
    for (let i = 0; i < models.length; i++) {
        let object = models[i];
        let numModels = object['number_models'];

        for (let j = 0; j < numModels; j++) {
            let triangles = object[j].triangles;
            let vertices = modelVecs[modelCount][0]
            let normals = modelVecs[modelCount][1]

            let vBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

            let vPosition = gl.getAttribLocation(program, "vPosition");
            gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(vPosition);

            //Pass in normal data
            let vNormal = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, vNormal);
            gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);

            let vNormalPosition = gl.getAttribLocation(program, "vNormal");
            gl.vertexAttribPointer(vNormalPosition, 4, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(vNormalPosition);

            //Pass in parameters for lighting equations

            gl.uniform4fv(gl.getUniformLocation(program, "materialDiffuse"), flatten(triangles.material.Kd));
            gl.uniform4fv(gl.getUniformLocation(program, "materialSpecular"), flatten(triangles.material.Ks));
            gl.uniform4fv(gl.getUniformLocation(program, "materialAmbient"), flatten(triangles.material.Ka));
            gl.uniform1f(gl.getUniformLocation(program, "shininess"), triangles.material.Ns);

            let translation = translate(0,0,0);

            if (i === 0) {
                translation = mult(translate(satelliteX, satelliteY, -30.0),
                    mult(rotateY(-40),
                        rotateX(satelliteTheta)));
            } else if (i === 1) {
                translation = mult(translate(spaceshipX, spaceshipY, -40.0),
                    mult(rotateZ(20),
                        scalem(0.1, 0.1, 0.1)));
            }

            let translationU = gl.getUniformLocation(program, "translation");
            gl.uniformMatrix4fv(translationU, false, flatten(translation));

            gl.drawArrays(gl.TRIANGLES, 0, vertices.length);

            modelCount++;
        }
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

function drawSkybox() {
    gl.enableVertexAttribArray(vTexCoord);
    gl.disableVertexAttribArray(vNormal);

    gl.uniform1i(gl.getUniformLocation(program, "isSkybox"), 1);

    let vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArrayCube), gl.STATIC_DRAW);
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);

    gl.drawArrays( gl.TRIANGLES, 0, pointsArrayCube.length );
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

function loadObject(objFile, mtlFile) {
    let objData, mtlData;

    let getOBJ = new XMLHttpRequest();
    let getMTL = new XMLHttpRequest();
    getOBJ.open("GET", "http://localhost:" + port + "/" + objFile, false);
    getOBJ.send();
    if (getOBJ.status === 200) {
        objData = getOBJ.responseText;
    } else {
        throw "Unable to get " + objFile;
    }

    getMTL.open("GET", "http://localhost:" + port + "/" + mtlFile, false);
    getMTL.send();
    if (getMTL.status === 200) {
        mtlData = getMTL.responseText;
    } else {
        throw "Unable to get " + mtlFile;
    }

    let out = new LearnWebglConsoleMessages();

    let modelMaterials = createObjModelMaterials(mtlData);
    models.push(createModelsFromOBJ(objData, modelMaterials, out));
}

function configureDefaultTexture() {

    let tex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        2,
        2,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        new Uint8Array([255, 0, 0, 0, 255, 0, 0, 0, 255, 255, 255, 0, 0, 255, 0, 255])
    );

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
}


function configureTexture(image) {

    let tex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, tex);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    gl.uniform1i(gl.getUniformLocation(program, "tex0"), 0);
}
