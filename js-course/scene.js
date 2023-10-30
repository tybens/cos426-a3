"use strict";

/** @namespace */
var Scene = Scene || {};

Scene.cameraPosition = [0.0, 0.0, -25.0];

Scene.defaultMaterial = {
  type: "LAMBERT_MATERIAL",
  color: [0.5, 0.5, 0.5],
  shininess: 10000,
  specular: [0.0, 0.0, 0.0],
  reflectType: "NONE_REFLECT",
  reflectivity: 0,
  refractionRatio: 0.8,
  special: "NONE",
};

Scene.setSceneName = function (sceneName) {
  Scene.sceneName = sceneName;
  Scene.sceneData = Parser.parseJsonFile(`scenes/${sceneName}.json`);
};

Scene.setUniforms = function () {
  if (Scene.sceneData.cameraAngle != null) {
    // set up camera angle
    Raytracer.setCamera(Scene.sceneData.cameraAngle);
  }
  // set up camera position
  Raytracer.setUniform("3f", "camera", ...Scene.cameraPosition);

  // set up lights
  for (const light of Scene.sceneData.lights) {
    Raytracer.addLight(
      light.pos[0],
      light.pos[1],
      light.pos[2],
      light.color[0],
      light.color[1],
      light.color[2],
      light.intensity,
      light.attenuate
    );
  }
  Raytracer.setUniform("1i", "num_lights", Scene.sceneData.lights.length);
};

/**
 * Constructs the GLSL code for `ray_intersect_scene` with the scene hardcoded
 * in (this is a performance/compatibility optimization).
 */
Scene.getIntersectFunction = function () {
  const MAX_TRIANGLES = 50;

  function vec3FromArray(array) {
    // only use the first 3 elements of the array (since it's a vec3)
    const [a, b, c] = array;
    return `vec3(${[a, b, c].join(", ")})`;
  }

  function roundToDigits(num, precision) {
    const base = 10 ** precision;
    return Math.round(num * base) / base;
  }

  function updateDistWithIntersection(shape, args) {
    args = ["ray", ...args, "intersect"];
    return `  cur_dist = find_intersection_with_${shape}(${args.join(", ")});`;
  }

  // to load any meshes
  const loader = new THREE.OBJLoader();

  const materialLines = [];
  const funcLines = [
    "float ray_intersect_scene(Ray ray, out Material out_mat, out Intersection out_intersect) {",
    "  float cur_dist;",
    "  float dist = INFINITY;",
    "  Intersection intersect;",
    "",
  ];

  // keep a global triangle counter to not exceed the maximum number of allowed
  // triangles from loaded meshes
  let numTriangles = 0;
  for (const [i, obj] of Array.enumerated(Scene.sceneData.objects)) {
    const materialName = `material${i}`;

    // get the material, with any missing properties using the default
    const material = Object.assign({}, Scene.defaultMaterial, obj.material);

    // use `toFixed` on numbers so that they are floats in GLSL
    // the order of these args must match the struct definition in
    // `fragmentShader.frag`
    const materialArgs = [
      Raytracer.MATERIAL_TYPES[material.type],
      vec3FromArray(material.color),
      material.shininess.toFixed(2),
      vec3FromArray(material.specular),
      Raytracer.REFLECT_TYPES[material.reflectType],
      material.reflectivity.toFixed(2),
      material.refractionRatio.toFixed(2),
      Raytracer.SPECIAL_MATERIALS[material.special],
    ];
    materialLines.push(
      `Material ${materialName} = Material(${materialArgs.join(", ")});`
    );

    const chooseBestIntersectionLines = [
      "  if (choose_closer_intersection(cur_dist, dist, intersect, out_intersect)) {",
      `    out_mat = ${materialName};`,
      "  }",
    ];

    // special case for mesh
    if (obj.type === "mesh") {
      // if this is true, immediately skip; a warning has already been logged
      if (numTriangles > MAX_TRIANGLES) continue;

      // load mesh
      const [vertexPositions, facesVertexIds] = loader.parse426Mesh(
        Parser.readFile(obj.objFile)
      );

      const offsetVector =
        obj.offset == null ? null : new THREE.Vector3(...obj.offset);

      const vertexVec3Positions = vertexPositions.map((vertex) => {
        if (obj.scale != null) {
          vertex.multiplyScalar(obj.scale);
        }
        if (offsetVector != null) {
          vertex.add(offsetVector);
        }
        return vec3FromArray(
          vertex.toArray().map((num) => roundToDigits(num, 2))
        );
      });

      // triangle each face and try to find intersections with triangles
      for (const faceVertexIds of facesVertexIds) {
        for (let j = 1; j < faceVertexIds.length - 1; j++) {
          if (numTriangles > MAX_TRIANGLES) break;
          // triangulate to 0, v, v+1
          const args = [0, j, j + 1].map(
            (index) => vertexVec3Positions[faceVertexIds[index]]
          );
          funcLines.push(updateDistWithIntersection("triangle", args));
          funcLines.push(...chooseBestIntersectionLines);
          numTriangles++;
        }
      }

      if (numTriangles > MAX_TRIANGLES) {
        // this is where it is first detected
        console.warn(
          "Loaded meshes have exceed the maximum number of triangles " +
            `(${MAX_TRIANGLES})`
        );
      }
      continue;
    }

    let args = null;
    switch (obj.type) {
      case "sphere": {
        args = [vec3FromArray(obj.center), obj.radius.toFixed(2)];
        break;
      }
      case "plane": {
        args = [vec3FromArray(obj.normal), obj.dist.toFixed(2)];
        break;
      }
      case "cylinder": {
        args = [
          vec3FromArray(obj.bottomCenter),
          vec3FromArray(obj.topCenter),
          obj.radius.toFixed(2),
        ];
        break;
      }
      case "cone": {
        args = [
          vec3FromArray(obj.bottomCenter),
          vec3FromArray(obj.topCenter),
          obj.radius.toFixed(2),
        ];
        break;
      }
      case "box": {
        args = [vec3FromArray(obj.minCorner), vec3FromArray(obj.maxCorner)];
        break;
      }
      case "triangle": {
        args = [
          vec3FromArray(obj.t1),
          vec3FromArray(obj.t2),
          vec3FromArray(obj.t3),
        ];
        break;
      }
      default: {
        console.warn("Unknown object type:", obj.type, obj);
        break;
      }
    }
    if (args != null) {
      funcLines.push(updateDistWithIntersection(obj.type, args));
      funcLines.push(...chooseBestIntersectionLines);
    }
  }
  funcLines.push("  return dist;", "}", "");

  return [...materialLines, "", ...funcLines].join("\n");
};
