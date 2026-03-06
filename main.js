let canvas;
let gl;
let program;
let port = 6767;

let numTimesToSubdivide = 3;

let index = 0;


let nucleusPositions = [
  vec3(0, 0, 0), vec3(0, 0, 1.5), vec3(1.5, 0, 0), vec3(-1.5, 0, 0), vec3(0, 1.5, 0), vec3(0, -1.5, 0), vec3(0, 0, -1.5),

  vec3(0, 1.06, 1.06), vec3(-0.92, -0.53, 1.06), vec3(0.92, -0.53, 1.06),
  vec3(1.06, -1.06, 0), vec3(1.06, 0.53, -0.92), vec3(1.06, 0.53, 0.92),
  vec3(-1.06, -1.06, 0), vec3(-1.06, 0.53, -0.92), vec3(-1.06, 0.53, 0.92),
  vec3(1.06, 1.06, 0), vec3(-0.53, 1.06, -0.92), vec3(-0.53, 1.06, 0.92),
  vec3(1.06, -1.06, 0), vec3(-0.53, -1.06, -0.92), vec3(-0.53, -1.06, 0.92),
  vec3(0, 1.06, -1.06), vec3(-0.92, -0.53, -1.06), vec3(0.92, -0.53, -1.06)
];

let numNeutrons = 10;
let numProtons = 10;

let rootChildren = 6;
let branchChildren = 3;
let nucleus;

let electronPositions = [
  //vec3(5, 0, 0), vec3(-5, 0, 0),

  vec3(10, 0, 0), vec3(-10, 0, 0), vec3(15,0,0), vec3(-15,0,0),
  vec3(0,15,0), vec3(0,-15,0), vec3(10.6,10.6,0), vec3(-10.6,-10.6,0),
  vec3(10.6,-10.6,0), vec3(-10.6,10.6,0)
];
let electronSize = 0.5;

let isAnimating = true;
let theta = 0;
let alpha = 0;
let beta = 0;
let cameraAnimation = false;
let cameraTheta = 0;

let satelliteTheta = 0;
let satelliteX = -10;
let satelliteY = -10;
let spaceshipX = 30;
let spaceshipY = 0;

let skyboxPoints = [];
let skyboxTexCoords = [];
let skyboxSize = 70.0;

let pointsArray = [];
let normalsArray = [];

//Make sure these are set properly,
//or sphere could appear black
let near = 0.1;
let far = 150;

let va = vec4(0.0, 0.0, -1.0, 1);
let vb = vec4(0.0, 0.942809, 0.333333, 1);
let vc = vec4(-0.816497, -0.471405, 0.333333, 1);
let vd = vec4(0.816497, -0.471405, 0.333333, 1);

let lightPosition = vec4(0.0, 10.0, 0.0, 1.0);  //eye coordinates
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

let shadowsEnabled = true;
let lightingEnabled = true;
let topDownView = false;

const SHADOW_SIZE = 512;
let shadowFB = null;
let shadowColorTex = null;
let shadowDepthTex = [];

let lightViewProj = [];
let textureMatrixFace = [];

let pointLightPosWorld = vec3(0.0, 2.0, 0.0);
let shadowNear = 0.1;
let shadowFar = 40.0;

const FACE_DIRS = [
  { dir: vec3( 1, 0, 0), up: vec3(0,-1, 0) },
  { dir: vec3(-1, 0, 0), up: vec3(0,-1, 0) },
  { dir: vec3( 0, 1, 0), up: vec3(0, 0, 1) },
  { dir: vec3( 0,-1, 0), up: vec3(0, 0,-1) },
  { dir: vec3( 0, 0, 1), up: vec3(0,-1, 0) },
  { dir: vec3( 0, 0,-1), up: vec3(0,-1, 0) },
];

let translationLoc;
let baseColorLoc;

let uShadowPassLoc;
let uLightViewProjLoc;
let textureMatrixLoc;
let shadowMapLoc;

let uShadowsEnabledLoc;
let uLightingEnabledLoc;

let uPointLightPosWorldLoc;


let uSpotPosWorldLoc, uSpotDirWorldLoc, uSpotCosCutoffLoc, uSpotExponentLoc, uSpotColorLoc;
let uSpotPosEyeLoc, uSpotDirEyeLoc;


let isSkyboxLoc;
let isObjectLoc;


let isShadowPass = false;

let models = [];
let modelVecs = [];

function Tree(root) {
    this.root = root;
}
function Particle(matrix, type) {
    this.children = [];
    this.matrix = matrix;
    this.type = type;
}

function quad(a, b, c, d) {
  let minT = 0.0;
  let maxT = 1.0;

  let texCoord = [
    vec2(minT, minT),
    vec2(minT, maxT),
    vec2(maxT, maxT),
    vec2(maxT, minT)
  ];


  let vertices = [
    vec4( -skyboxSize, -skyboxSize,  skyboxSize, 1.0 ),
    vec4( -skyboxSize,  skyboxSize,  skyboxSize, 1.0 ),
    vec4( skyboxSize,  skyboxSize,  skyboxSize, 1.0 ),
    vec4( skyboxSize, -skyboxSize,  skyboxSize, 1.0 ),
    vec4( -skyboxSize, -skyboxSize, -skyboxSize, 1.0 ),
    vec4( -skyboxSize,  skyboxSize, -skyboxSize, 1.0 ),
    vec4( skyboxSize,  skyboxSize, -skyboxSize, 1.0 ),
    vec4( skyboxSize, -skyboxSize, -skyboxSize, 1.0 )
  ];

  skyboxPoints.push(vertices[a]);
  skyboxTexCoords.push(texCoord[0]);

  skyboxPoints.push(vertices[b]);
  skyboxTexCoords.push(texCoord[1]);

  skyboxPoints.push(vertices[c]);
  skyboxTexCoords.push(texCoord[2]);

  skyboxPoints.push(vertices[a]);
  skyboxTexCoords.push(texCoord[0]);

  skyboxPoints.push(vertices[c]);
  skyboxTexCoords.push(texCoord[2]);

  skyboxPoints.push(vertices[d]);
  skyboxTexCoords.push(texCoord[3]);
}

function colorCube()
{
  // Note the vertex order. This is important
  // to ensure our texture is oriented correctly
  // when it's mapped to the cube.
  quad( 1, 0, 3, 2 );
  quad( 2, 3, 7, 6 );
  quad( 0, 4, 7, 3);
  quad( 5, 1, 2, 6 );
  quad( 6, 7, 4, 5 );
  quad( 5, 4, 0, 1 );
}

let texCoordsArray = [];
let vTexCoordLoc;
let uUseTextureLoc;
let protonTexture;
let tex11Loc;

function triangle(a, b, c) {
  pointsArray.push(a);
  pointsArray.push(b);
  pointsArray.push(c);

  normalsArray.push(a[0], a[1], a[2], 0.0);
  normalsArray.push(b[0], b[1], b[2], 0.0);
  normalsArray.push(c[0], c[1], c[2], 0.0);

  texCoordsArray.push(sphereUV(a));
  texCoordsArray.push(sphereUV(b));
  texCoordsArray.push(sphereUV(c));

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
  if (evt.repeat) return;

  let key = evt.key.toLowerCase();

  if (key === "a") {
    isAnimating = !isAnimating;
  } else if (key === "s") {
    shadowsEnabled = !shadowsEnabled;
  } else if (key === "l") {
    lightingEnabled = !lightingEnabled;
  } else if (key === "t") {
    topDownView = !topDownView;
  } else if (key === "c") {
    cameraAnimation = !cameraAnimation;
  } else {
    return;
  }

  evt.preventDefault();
}

function configureDefaultCubeMap() {
  let cubeMap = gl.createTexture();
  gl.activeTexture(gl.TEXTURE8);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMap);

  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  let red = new Uint8Array([255, 0, 0, 255]);
  let green = new Uint8Array([0, 255, 0, 255]);
  let blue = new Uint8Array([0, 0, 255, 255]);
  let cyan = new Uint8Array([0, 255, 255, 255]);
  let magenta = new Uint8Array([255, 0, 255, 255]);
  let yellow = new Uint8Array([255, 255, 0, 255]);

  gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, red);
  gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, yellow);
  gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, green);
  gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, cyan);
  gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, blue);
  gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, magenta);

  gl.uniform1i(gl.getUniformLocation(program, "texMap"), 8);
}

function configureCubeMap(image) {
  let cubeMap = gl.createTexture();
  gl.activeTexture(gl.TEXTURE8);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMap);

  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

  gl.uniform1i(gl.getUniformLocation(program, "texMap"), 8);
}

function configureDefaultSkybox() {

  let tex = gl.createTexture();
  gl.activeTexture(gl.TEXTURE6);
  gl.bindTexture(gl.TEXTURE_2D, tex);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      skyboxSize*2,
      skyboxSize*2,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([0, 0, 255, 255, 255, 0, 0, 255, 0, 0, 255, 255, 0, 255, 0, 255])
  );

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  gl.uniform1i(gl.getUniformLocation(program, "skyboxTex"), 6);
}

function configureSkybox(image) {

  let tex = gl.createTexture();
  gl.activeTexture(gl.TEXTURE6);
  gl.bindTexture(gl.TEXTURE_2D, tex);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  gl.uniform1i(gl.getUniformLocation(program, "skyboxTex"), 6);
}

function makeColorAttachment(size) {
  const t = gl.createTexture();
  gl.activeTexture(gl.TEXTURE7);
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.bindTexture(gl.TEXTURE_2D, null);
  return t;
}

function makeDepthTexture(size) {
  const tex = gl.createTexture();
  gl.activeTexture(gl.TEXTURE7);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  gl.texImage2D(
    gl.TEXTURE_2D, 0,
    gl.DEPTH_COMPONENT,
    size, size, 0,
    gl.DEPTH_COMPONENT,
    gl.UNSIGNED_INT,
    null
  );

  gl.bindTexture(gl.TEXTURE_2D, null);
  return tex;
}

function updatePointLightShadowMatrices() {
  const proj = perspective(90, 1.0, shadowNear, shadowFar);

  for (let i = 0; i < 6; i++) {
    const target = add(pointLightPosWorld, FACE_DIRS[i].dir);
    const view = lookAt(pointLightPosWorld, target, FACE_DIRS[i].up);

    lightViewProj[i] = mult(proj, view);

    let tm = mult(proj, view);
    tm = mult(scalem(0.5, 0.5, 0.5), tm);
    tm = mult(translate(0.5, 0.5, 0.5), tm);
    textureMatrixFace[i] = tm;
  }
}

function pickShadowFace(v) {
  const ax = Math.abs(v[0]), ay = Math.abs(v[1]), az = Math.abs(v[2]);
  if (ax >= ay && ax >= az) return (v[0] >= 0) ? 0 : 1;
  if (ay >= ax && ay >= az) return (v[1] >= 0) ? 2 : 3;
  return (v[2] >= 0) ? 4 : 5;
}

function worldCenterFromModelMatrix(m) {
  return vec3(m[0][3], m[1][3], m[2][3]);
}

function bindShadowForObject(modelMatrix) {
  if (isShadowPass) return;
  if (!(shadowsEnabled && lightingEnabled)) return;

  const center = worldCenterFromModelMatrix(modelMatrix);
  const toCenter = subtract(center, pointLightPosWorld);
  const face = pickShadowFace(toCenter);

  gl.uniformMatrix4fv(textureMatrixLoc, false, flatten(textureMatrixFace[face]));
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, shadowDepthTex[face]);
}


function loadObject(objFile, mtlFile) {
  let objData, mtlData;

  let getOBJ = new XMLHttpRequest();
  let getMTL = new XMLHttpRequest();
  getOBJ.open("GET", "http://localhost:" + port + "/" + objFile, false);
  getOBJ.send();
  if (getOBJ.status === 200) objData = getOBJ.responseText;
  else throw "Unable to get " + objFile;

  getMTL.open("GET", "http://localhost:" + port + "/" + mtlFile, false);
  getMTL.send();
  if (getMTL.status === 200) mtlData = getMTL.responseText;
  else throw "Unable to get " + mtlFile;

  let out = new LearnWebglConsoleMessages();

  let modelMaterials = createObjModelMaterials(mtlData);
  models.push(createModelsFromOBJ(objData, modelMaterials, out));
}

function loadImage(file, onload) {
  let image = new Image();
  image.crossOrigin = "";
  image.src = "http://localhost:" + port + "/" + file;
  image.onload = function () {
    onload(image);
  };
  return image;
}

function loadTexture(url) {
  const texture = gl.createTexture();
  const image = new Image();

  gl.bindTexture(gl.TEXTURE_2D, texture);

  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    1,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    new Uint8Array([255, 255, 255, 255])
  );

  image.onload = function () {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  };

  image.src = url;
  return texture;
}


function sphereUV(p) {
  let x = p[0];
  let y = p[1];
  let z = p[2];

  let u = 0.5 + Math.atan2(z, x) / (2.0 * Math.PI);
  let v = 0.5 - Math.asin(y) / Math.PI;

  return vec2(u, v);
}


window.onload = function init() {
  canvas = document.getElementById("gl-canvas");

  gl = WebGLUtils.setupWebGL(canvas);
  if (!gl) {
    alert("WebGL isn't available");
    return;
  }

  const ext = gl.getExtension("WEBGL_depth_texture");
  if (!ext) {
    alert("WEBGL_depth_texture not supported on this browser/GPU");
    return;
  }

  gl.viewport(0, 0, canvas.width, canvas.height);
  program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  gl.enable(gl.DEPTH_TEST);
  //gl.enable(gl.CULL_FACE);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  window.addEventListener("keydown", handleKey);


  loadObject("objects/Satellite/Satellite.obj", "objects/Satellite/Satellite.mtl");
  loadObject("objects/Spaceship/SpaceShipDetailed.obj", "objects/Spaceship/SpaceShipDetailed.mtl");

  for (let i = 0; i < models.length; i++) {
    let object = models[i];
    let numModels = object['number_models'];

    for (let j = 0; j < numModels; j++) {
      let model = object[j];
      let triangles = model.triangles;

      let vertices = [];
      let normals = [];

      for (let k = 0; k < triangles.vertices.length; k += 3) {
        vertices.push(vec4(triangles.vertices[k], triangles.vertices[k + 1], triangles.vertices[k + 2], 1));
        normals.push(vec4(triangles.flat_normals[k], triangles.flat_normals[k + 1], triangles.flat_normals[k + 2], 0));
      }

      modelVecs.push([vertices, normals, triangles.material]);
    }
  }

  tetrahedron(va, vb, vc, vd, numTimesToSubdivide);

 protonTexture = loadTexture("textures/Civil_Ensign_of_Switzerland_(Pantone).png");
  buildNucleus();

  modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
  modelViewInverseMatrixLoc = gl.getUniformLocation(program, "modelViewInverseMatrix");
  projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");

  translationLoc = gl.getUniformLocation(program, "translation");
  baseColorLoc = gl.getUniformLocation(program, "baseColor");

  uShadowPassLoc = gl.getUniformLocation(program, "uShadowPass");
  uLightViewProjLoc = gl.getUniformLocation(program, "uLightViewProj");

  textureMatrixLoc = gl.getUniformLocation(program, "textureMatrix");
  shadowMapLoc = gl.getUniformLocation(program, "shadowMap");

  uShadowsEnabledLoc = gl.getUniformLocation(program, "uShadowsEnabled");
  uLightingEnabledLoc = gl.getUniformLocation(program, "uLightingEnabled");

  uPointLightPosWorldLoc = gl.getUniformLocation(program, "uPointLightPosWorld");

  uSpotPosWorldLoc = gl.getUniformLocation(program, "uSpotPosWorld");
  uSpotDirWorldLoc = gl.getUniformLocation(program, "uSpotDirWorld");
  uSpotCosCutoffLoc = gl.getUniformLocation(program, "uSpotCosCutoff");
  uSpotExponentLoc = gl.getUniformLocation(program, "uSpotExponent");
  uSpotColorLoc = gl.getUniformLocation(program, "uSpotColor");

  uSpotPosEyeLoc = gl.getUniformLocation(program, "uSpotPosEye");
  uSpotDirEyeLoc = gl.getUniformLocation(program, "uSpotDirEye");

  isSkyboxLoc = gl.getUniformLocation(program, "isSkybox");
  isObjectLoc = gl.getUniformLocation(program, "isObject");


  gl.uniform4fv(gl.getUniformLocation(program, "lightDiffuse"), flatten(lightDiffuse));
  gl.uniform4fv(gl.getUniformLocation(program, "lightSpecular"), flatten(lightSpecular));
  gl.uniform4fv(gl.getUniformLocation(program, "lightAmbient"), flatten(lightAmbient));
  gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition));

  gl.uniform1i(shadowMapLoc, 0);

  colorCube();

  configureDefaultSkybox();
  configureDefaultCubeMap();
  loadImage("textures/skybox.jpg", configureSkybox);
  loadImage("textures/sun.webp", configureCubeMap);

 vTexCoordLoc = gl.getAttribLocation(program, "vTexCoord");
 uUseTextureLoc = gl.getUniformLocation(program, "uUseTexture");
  tex11Loc = gl.getUniformLocation(program, "tex11");
  shadowFB = gl.createFramebuffer();
  shadowColorTex = makeColorAttachment(SHADOW_SIZE);

  gl.uniform1i(tex11Loc, 11);

  gl.bindFramebuffer(gl.FRAMEBUFFER, shadowFB);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, shadowColorTex, 0);

  for (let i = 0; i < 6; i++) shadowDepthTex[i] = makeDepthTexture(SHADOW_SIZE);

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  updatePointLightShadowMatrices();

  render();
};


function render() {
  if (isAnimating) {
    theta += 0.5;
    alpha += 0.3;
    beta += 0.2;


    satelliteTheta += 0.6;
    satelliteX += 0.025;
    if (satelliteX > 60) satelliteX = -60;

    satelliteY -= 0.015;
    if (satelliteY < -60) satelliteY = 60;

    spaceshipX -= 0.026;
    if (spaceshipX < -70) spaceshipX = 90;

    spaceshipY -= 0.01;
    if (spaceshipY < -70) spaceshipY = 80;
  }
  if (cameraAnimation) {
    cameraTheta += 0.03;
  }

  if (shadowsEnabled && lightingEnabled) {
    isShadowPass = true;

    gl.bindFramebuffer(gl.FRAMEBUFFER, shadowFB);
    gl.viewport(0, 0, SHADOW_SIZE, SHADOW_SIZE);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, null);

    gl.uniform1i(uShadowPassLoc, 1);

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mat4()));
    gl.uniformMatrix4fv(modelViewInverseMatrixLoc, false, flatten(mat4()));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(mat4()));

    gl.disable(gl.BLEND);
    gl.depthMask(true);

    if (isSkyboxLoc) gl.uniform1i(isSkyboxLoc, 0);

    for (let face = 0; face < 6; face++) {
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, shadowDepthTex[face], 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      gl.uniformMatrix4fv(uLightViewProjLoc, false, flatten(lightViewProj[face]));

      drawObjects();
      drawElectrons();
      drawNucleus();
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  isShadowPass = false;

  if (topDownView) {
    eye = vec3(0, 10, 0);
    at = vec3(0, 0, 0);
    up = vec3(0, 0, -1);
  } else {
    eye = vec3(Math.sin(cameraTheta) * 20.0, 0, Math.cos(cameraTheta) * 20.0);
    at = vec3(0, 0, 0);
    up = vec3(0, 1, 0);
  }

  modelViewMatrix = lookAt(eye, at, up);
  projectionMatrix = perspective(90, 1, near, far);

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.uniform1i(uShadowPassLoc, 0);

  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
  gl.uniformMatrix4fv(modelViewInverseMatrixLoc, false, flatten(inverse(modelViewMatrix)));
  gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

  if (uShadowsEnabledLoc) gl.uniform1i(uShadowsEnabledLoc, (shadowsEnabled && lightingEnabled) ? 1 : 0);
  if (uLightingEnabledLoc) gl.uniform1i(uLightingEnabledLoc, lightingEnabled ? 1 : 0);

  if (uPointLightPosWorldLoc) gl.uniform3fv(uPointLightPosWorldLoc, flatten(pointLightPosWorld));

  let spotPosWorld = eye;
  let spotDirWorld = normalize(subtract(at, eye));

  if (uSpotPosWorldLoc) gl.uniform3fv(uSpotPosWorldLoc, flatten(spotPosWorld));
  if (uSpotDirWorldLoc) gl.uniform3fv(uSpotDirWorldLoc, flatten(spotDirWorld));
  if (uSpotCosCutoffLoc) gl.uniform1f(uSpotCosCutoffLoc, Math.cos(18 * Math.PI / 180));
  if (uSpotExponentLoc) gl.uniform1f(uSpotExponentLoc, 40.0);
  if (uSpotColorLoc) gl.uniform4fv(uSpotColorLoc, flatten(vec4(1, 1, 1, 1)));

  let spotPosEye4 = mult(modelViewMatrix, vec4(spotPosWorld[0], spotPosWorld[1], spotPosWorld[2], 1.0));
  let spotPosEye = vec3(spotPosEye4[0], spotPosEye4[1], spotPosEye4[2]);
  let spotDirEye4 = mult(modelViewMatrix, vec4(spotDirWorld[0], spotDirWorld[1], spotDirWorld[2], 0.0));
  let spotDirEye = normalize(vec3(spotDirEye4[0], spotDirEye4[1], spotDirEye4[2]));

  if (uSpotPosEyeLoc) gl.uniform3fv(uSpotPosEyeLoc, flatten(spotPosEye));
  if (uSpotDirEyeLoc) gl.uniform3fv(uSpotDirEyeLoc, flatten(spotDirEye));

  if (isSkyboxLoc) gl.uniform1i(isSkyboxLoc, 0);

  drawObjects();
  drawNucleus();
  drawSkybox();

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.depthMask(false);
  drawElectrons();
  gl.depthMask(true);
  gl.disable(gl.BLEND);

  requestAnimFrame(render);
}


function buildNucleus() {
  let nucleusTypes =[];
  let total = numNeutrons + numProtons;

  for (let i = 0; i < total; i++) {
    let roll = Math.random() * (numNeutrons + numProtons);
    if (roll > numNeutrons) { nucleusTypes.push(1); numProtons--; }
    else { nucleusTypes.push(0); numNeutrons--; }
  }

  let root = new Particle(translate(nucleusPositions[0][0], nucleusPositions[0][1], nucleusPositions[0][2]), nucleusTypes[0]);
  nucleus = new Tree(root);

  let queue = [];
  for (let i = 0; i < rootChildren; i++) queue.push(root);

  for (let i = 1; i < nucleusTypes.length && i < nucleusPositions.length; i++) {
    let type = nucleusTypes[i];
    let parent = queue.shift();
    let matrix = translate(nucleusPositions[i][0], nucleusPositions[i][1], nucleusPositions[i][2]);

    let p = new Particle(matrix, type);
    parent.children.push(p);

    for (let j = 0; j < branchChildren; j++) queue.push(p);
  }
}

function drawObjects() {
  if (isSkyboxLoc) gl.uniform1i(isSkyboxLoc, 0);
  if (isObjectLoc) gl.uniform1f(isObjectLoc, 1.0);
  if (uUseTextureLoc) gl.uniform1i(uUseTextureLoc, 0);
  let modelCount = 0;

  for (let i = 0; i < models.length; i++) {
    let object = models[i];
    let numModels = object['number_models'];

    for (let j = 0; j < numModels; j++) {
      let vertices = modelVecs[modelCount][0];
      let normals = modelVecs[modelCount][1];
      let mat = modelVecs[modelCount][2];

      let vBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

      let vPosition = gl.getAttribLocation(program, "vPosition");
      gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(vPosition);

      let vNormal = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vNormal);
      gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);

      let vNormalPosition = gl.getAttribLocation(program, "vNormal");
      gl.vertexAttribPointer(vNormalPosition, 4, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(vNormalPosition);


      gl.uniform4fv(gl.getUniformLocation(program, "materialDiffuse"), flatten(mat.Kd));
      gl.uniform4fv(gl.getUniformLocation(program, "materialSpecular"), flatten(mat.Ks));
      gl.uniform4fv(gl.getUniformLocation(program, "materialAmbient"), flatten(mat.Ka));
      gl.uniform1f(gl.getUniformLocation(program, "shininess"), mat.Ns);


      gl.uniform4fv(baseColorLoc, flatten(vec4(1, 1, 1, 1)));

      let translation = translate(0, 0, 0);

      if (i === 0) {
        translation = mult(translate(satelliteX, satelliteY, -30.0),
          mult(rotateY(-40), rotateX(satelliteTheta)));
      } else if (i === 1) {
        translation = mult(translate(spaceshipX, spaceshipY, -40.0),
          mult(rotateZ(20), scalem(0.1, 0.1, 0.1)));
      }

      gl.uniformMatrix4fv(translationLoc, false, flatten(translation));
      bindShadowForObject(translation);

      gl.drawArrays(gl.TRIANGLES, 0, vertices.length);

      modelCount++;
    }
  }

  if (isObjectLoc) gl.uniform1i(isObjectLoc, 0);
}

function drawElectrons() {
  if (isSkyboxLoc) gl.uniform1i(isSkyboxLoc, 0);
  if (isObjectLoc) gl.uniform1i(isObjectLoc, 0);
  if (uUseTextureLoc) gl.uniform1i(uUseTextureLoc, 0);

  for (let j = 0; j < electronPositions.length; j++) {
    pushSphere();

    let translation = translate(electronPositions[j][0], electronPositions[j][1], electronPositions[j][2]);
    translation = mult(rotateZ(theta),
      mult(translation, scalem(electronSize, electronSize, electronSize)));

    gl.uniformMatrix4fv(translationLoc, false, flatten(translation));

    if (isShadowPass) gl.uniform4fv(baseColorLoc, flatten(vec4(0, 0, 1, 1)));
    else gl.uniform4fv(baseColorLoc, flatten(vec4(0, 0, 1, 0.35)));

    bindShadowForObject(translation);

    gl.uniform4fv(gl.getUniformLocation(program, "materialDiffuse"), flatten(materialDiffuse));
    gl.uniform4fv(gl.getUniformLocation(program, "materialSpecular"), flatten(materialSpecular));
    gl.uniform4fv(gl.getUniformLocation(program, "materialAmbient"), flatten(materialAmbient));
    gl.uniform1f(gl.getUniformLocation(program, "shininess"), materialShininess);

    gl.drawArrays(gl.TRIANGLES, 0, pointsArray.length);
  }
}

function drawNucleus() {
  if (isSkyboxLoc) gl.uniform1i(isSkyboxLoc, 0);
  if (isObjectLoc) gl.uniform1i(isObjectLoc, 0);

  let rotationMatrix = mult(rotateX(alpha), rotateY(beta));
  let queueMatrix = [translate(0, 0, 0)];
  let queueParticle = [nucleus.root];

  while (queueParticle.length > 0) {
    let particle = queueParticle.shift();
    let prevMatrix = queueMatrix.shift();

    pushSphere();

    let matrix = mult(rotationMatrix, mult(prevMatrix, particle.matrix));

    gl.uniformMatrix4fv(translationLoc, false, flatten(matrix));

    if (particle.type === 1) {
    gl.uniform1i(uUseTextureLoc, 1);

    gl.activeTexture(gl.TEXTURE11);
    gl.bindTexture(gl.TEXTURE_2D, protonTexture);

    gl.uniform4fv(baseColorLoc, flatten(vec4(1, 1, 1, 1)));
    } else {
    gl.uniform1i(uUseTextureLoc, 0);
    gl.uniform4fv(baseColorLoc, flatten(vec4(1, 1, 1, 1)));
    }

    bindShadowForObject(matrix);

    gl.uniform4fv(gl.getUniformLocation(program, "materialDiffuse"), flatten(materialDiffuse));
    gl.uniform4fv(gl.getUniformLocation(program, "materialSpecular"), flatten(materialSpecular));
    gl.uniform4fv(gl.getUniformLocation(program, "materialAmbient"), flatten(materialAmbient));
    gl.uniform1f(gl.getUniformLocation(program, "shininess"), materialShininess);

    gl.drawArrays(gl.TRIANGLES, 0, pointsArray.length);

    for (let i = 0; i < particle.children.length; i++) {
      queueMatrix.push(mult(prevMatrix, particle.matrix));
      queueParticle.push(particle.children[i]);
    }
  }
}

function drawSkybox() {
    let vPosition = gl.getAttribLocation(program, "vPosition");
    let vNormal = gl.getAttribLocation( program, "vNormal" );
    if (isSkyboxLoc) gl.uniform1i(isSkyboxLoc, 1);
    if (isObjectLoc) gl.uniform1i(isObjectLoc, 0);
    gl.disableVertexAttribArray( vNormal);

    let vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(skyboxPoints), gl.STATIC_DRAW);

    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);

    let vTexCoord = gl.getAttribLocation( program, "vTexCoord" );
    let tBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(skyboxTexCoords), gl.STATIC_DRAW );

    gl.vertexAttribPointer( vTexCoord, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vTexCoord );

    let translation = translate(0, 0, 0);
    gl.uniformMatrix4fv(translationLoc, false, flatten(translation));

    gl.drawArrays( gl.TRIANGLES, 0, skyboxPoints.length );
}

function pushSphere() {
  let vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

  let vPosition = gl.getAttribLocation(program, "vPosition");
  gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  let nBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);

  let vNormal = gl.getAttribLocation(program, "vNormal");
  gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vNormal);

  let tBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW);

  gl.vertexAttribPointer(vTexCoordLoc, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vTexCoordLoc);
}