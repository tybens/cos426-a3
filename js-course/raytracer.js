"use strict";

/** @namespace */
var Raytracer = Raytracer || {};

// counter for light ids
Raytracer.lightIdCounter = 0;

// material types (how to light the surface)
Raytracer.MATERIAL_TYPES = {
  BASIC_MATERIAL: 1,
  PHONG_MATERIAL: 2,
  LAMBERT_MATERIAL: 3,
};

// texture types (special materials)
Raytracer.SPECIAL_MATERIALS = {
  NONE: 0,
  CHECKERBOARD: 1,
  MY_SPECIAL: 2,
};

// reflect types (how to bounce rays)
Raytracer.REFLECT_TYPES = {
  NONE_REFLECT: 1,
  MIRROR_REFLECT: 2,
  GLASS_REFLECT: 3,
};

// animation
Raytracer.animated = false;
Raytracer.animationPaused = false;
Raytracer.frame = 0;
Raytracer.needsToDraw = true;

// wrapper around `glMatrix.mat4`
class RotationMatrix {
  constructor() {
    this.matrix = glMatrix.mat4.create();
  }

  /**
   * Multiplies this matrix with another one.
   * @param {!RotationMatrix} matrix
   * @returns {!RotationMatrix} Itself for chaining.
   */
  multiply(matrix) {
    glMatrix.mat4.multiply(this.matrix, this.matrix, matrix.matrix);
    return this;
  }

  /**
   * Rotates this matrix by the given angle around the given axis.
   * @param {number} radians
   * @param {![number, number, number]} axis
   * @returns {!RotationMatrix} Itself for chaining.
   */
  rotate(radians, axis) {
    glMatrix.mat4.rotate(this.matrix, this.matrix, radians, axis);
    return this;
  }

  /**
   * Rotates this matrix around the x-, y-, and z-axes by the given angles.
   * @param {?number} x - The rotation angle around the x-axis.
   * @param {?number} y - The rotation angle around the y-axis.
   * @param {?number} z - The rotation angle around the z-axis.
   * @returns {!RotationMatrix} Itself for chaining.
   */
  rotateXYZ(x = 0, y = 0, z = 0) {
    // only rotate if given and nonzero
    if (x) this.rotate(x, [1, 0, 0]);
    if (y) this.rotate(y, [0, 1, 0]);
    if (z) this.rotate(z, [0, 0, 1]);
    return this;
  }

  /**
   * Translates this matrix by the given offsets.
   * @param {number} dx
   * @param {number} dy
   * @param {number} dz
   * @returns {!RotationMatrix} Itself for chaining.
   */
  translate(dx = 0, dy = 0, dz = 0) {
    glMatrix.mat4.translate(this.matrix, this.matrix, [dx, dy, dz]);
    return this;
  }
}

Raytracer.setUniform = function (varType, varName, ...args) {
  const uniformName = "uniform" + varType;
  Raytracer.gl[uniformName](
    Raytracer.gl.getUniformLocation(Raytracer.program, varName),
    ...args
  );
};

Raytracer.initShader = function (program, shaderType, src, debug) {
  const shader = Raytracer.gl.createShader(shaderType);
  Raytracer.gl.shaderSource(shader, src);
  Raytracer.gl.compileShader(shader);

  // check compile status and report error
  const ok = Raytracer.gl.getShaderParameter(
    shader,
    Raytracer.gl.COMPILE_STATUS
  );

  if (debug || !ok) {
    const log = Raytracer.gl.getShaderInfoLog(shader);
    const msg = `shader type ${shaderType}: ${log}`;
    console.log(`Debug status of ${msg}`);
    if (!ok) {
      alert(`Compile error in ${msg}`);
    }
  }
  Raytracer.gl.attachShader(program, shader);
  return shader;
};

Raytracer.init = function (width, height, animated = false, debug = false) {
  if (animated) {
    Raytracer.animated = true;
  }

  // create and add raytracer canvas
  const canvas = document.createElement("canvas");
  $(document.body).append(canvas);
  Raytracer._canvas = canvas;

  Raytracer.gl = canvas.getContext("experimental-webgl", {
    preserveDrawingBuffer: true,
  });
  canvas.width = width;
  canvas.height = height;

  Raytracer.gl.viewportWidth = canvas.width;
  Raytracer.gl.viewportHeight = canvas.height;

  Raytracer.gl.viewport(
    0,
    0,
    Raytracer.gl.drawingBufferWidth,
    Raytracer.gl.drawingBufferHeight
  );

  Raytracer.gl.clearColor(0.0, 0.0, 0.0, 1.0);
  Raytracer.gl.clear(Raytracer.gl.COLOR_BUFFER_BIT);

  const fragmentShaderSrc =
    Parser.readFile("glsl-student/fragmentShader.frag") +
    Scene.getIntersectFunction();
  const vertexShaderSrc = Parser.readFile("glsl-student/vertexShader.vert");

  Raytracer.program = Raytracer.gl.createProgram();

  // compile shaders
  const compileStartTime = performance.now();
  Raytracer.initShader(
    Raytracer.program,
    Raytracer.gl.VERTEX_SHADER,
    vertexShaderSrc,
    debug
  );
  Raytracer.initShader(
    Raytracer.program,
    Raytracer.gl.FRAGMENT_SHADER,
    fragmentShaderSrc,
    debug
  );
  const compileTime = Math.round(performance.now() - compileStartTime);
  console.log(`Shader compilation completed in ${compileTime} ms.`);

  Raytracer.gl.linkProgram(Raytracer.program);
  Raytracer.gl.useProgram(Raytracer.program);

  Raytracer.setUniform("1f", "width", width);
  Raytracer.setUniform("1f", "height", height);

  const positionLocation = Raytracer.gl.getAttribLocation(
    Raytracer.program,
    "a_position"
  );
  Raytracer.gl.enableVertexAttribArray(positionLocation);

  const bufferGeom = new Float32Array([
    -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0,
  ]);
  const buffer = Raytracer.gl.createBuffer();
  buffer.itemSize = 2;
  buffer.numItems = 6;

  Raytracer.gl.bindBuffer(Raytracer.gl.ARRAY_BUFFER, buffer);
  Raytracer.gl.bufferData(
    Raytracer.gl.ARRAY_BUFFER,
    bufferGeom,
    Raytracer.gl.STATIC_DRAW
  );
  Raytracer.gl.vertexAttribPointer(
    positionLocation,
    2,
    Raytracer.gl.FLOAT,
    false,
    0,
    0
  );

  Raytracer.setUniform("1i", "frame", Raytracer.frame);

  Raytracer.rotationMatrix = new RotationMatrix();

  // handle moving the camera
  Raytracer.lastMousePos = new THREE.Vector2();
  Raytracer.isMouseDown = false;
  $(canvas).on("mousedown", Raytracer.handleMouseDown);
  $(window).on("mouseup", Raytracer.handleMouseUp);
  $(window).on("mousemove", Raytracer.handleMouseMove);

  // use scroll wheel to zoom in and out
  $(canvas).on("wheel", Raytracer.handleWheel);

  // use arrows to zoom in and out
  $(window).on("keydown", (event) => {
    const key = event.key;
    if (key === "ArrowUp") {
      // zoom in
      Raytracer.handleZoom(1.0);
    } else if (key === "ArrowDown") {
      // zoom out
      Raytracer.handleZoom(-1.0);
    }
  });

  if (Raytracer.animated) {
    $(window).on("keyup", (event) => {
      // use "keyup" event so that holding down the key doesn't trigger this
      // multiple times in a row
      const key = event.key;
      if (key === " ") {
        // if animated, pause the animation when spacebar is pressed
        Raytracer.animationPaused = !Raytracer.animationPaused;
      }
    });
  }
};

Raytracer.handleMouseDown = function (event) {
  Raytracer.isMouseDown = true;
  Raytracer.lastMousePos.set(event.clientX, event.clientY);
};

Raytracer.handleMouseUp = function (event) {
  Raytracer.isMouseDown = false;
};

Raytracer.handleMouseMove = function (event) {
  if (!Raytracer.isMouseDown) return;

  const mousePos = new THREE.Vector2(event.clientX, event.clientY);
  const delta = new THREE.Vector2().subVectors(
    mousePos,
    Raytracer.lastMousePos
  );
  const moved = !(delta.x === 0 && delta.y === 0);
  if (!moved) return;

  function degToRad(degrees) {
    // javascript doesn't have this builtin...
    return (degrees * Math.PI) / 180;
  }

  Raytracer.rotationMatrix = new RotationMatrix()
    .rotateXYZ(degToRad(delta.y / 10), degToRad(delta.x / 10), 0)
    .multiply(Raytracer.rotationMatrix);

  Raytracer.lastMousePos.copy(mousePos);
  Raytracer.needsToDraw = true;
};

Raytracer.handleZoom = function (delta) {
  Raytracer.rotationMatrix.translate(0, 0, 0.5 * delta);
  Raytracer.needsToDraw = true;
};

Raytracer.handleWheel = function (event) {
  const delta = event.originalEvent.deltaY;
  if (delta === 0) return;
  // use the sign of the scroll delta
  Raytracer.handleZoom(delta > 0 ? 1 : -1);
};

Raytracer.setCamera = function (cameraAngle) {
  // create new rotation matrix
  Raytracer.rotationMatrix = new RotationMatrix()
    .rotateXYZ(...cameraAngle.map((angle) => angle * Math.PI))
    .multiply(Raytracer.rotationMatrix);
};

Raytracer.addLight = function (px, py, pz, cr, cg, cb, intensity, attenuate) {
  const lightId = `lights[${Raytracer.lightIdCounter++}]`;
  Raytracer.setUniform("3f", `${lightId}.position`, px, py, pz);
  Raytracer.setUniform("3f", `${lightId}.color`, cr, cg, cb);
  Raytracer.setUniform("1f", `${lightId}.intensity`, intensity);
  Raytracer.setUniform("1f", `${lightId}.attenuate`, attenuate);
};

Raytracer.render = function () {
  if (Raytracer.animated && Raytracer.animationPaused) return;

  Raytracer.frame++;

  if (Raytracer.animated) {
    Raytracer.setUniform("1i", "frame", Raytracer.frame);
  }

  // rotation matrix
  Raytracer.setUniform(
    "Matrix4fv",
    "uMVMatrix",
    false,
    Raytracer.rotationMatrix.matrix
  );

  if (Raytracer.needsToDraw || Raytracer.animated) {
    Raytracer.gl.drawArrays(Raytracer.gl.TRIANGLES, 0, 6);
    Raytracer.needsToDraw = false;
  }
};

Raytracer.saveSnapshot = function () {
  Downloader.exportCanvas({ canvas: Raytracer._canvas });
};

/** Starts animating the raytracer. */
Raytracer.animate = function () {
  function updateRenderer(timestamp) {
    Raytracer.render();
    window.requestAnimationFrame(updateRenderer);
  }

  window.requestAnimationFrame(updateRenderer);
};
