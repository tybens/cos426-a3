// set the precision of the float values (necessary if using float)
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
precision mediump int;

// flag for using soft shadows
#define SOFT_SHADOWS 0
// number of soft shadow samples to take
#define SOFT_SAMPLING 5
// the radius of light "spheres" for soft shadows (feel free to change this)
#define LIGHT_RADIUS 1.0

// constants
#define INFINITY 1.0e+12
// EPS is for the precision issue
#define EPS 1.0e-3
#define PI2 2.0 * 3.1415926535

// maximum recursion depth for rays
#define MAX_RECURSION 8

// constants for scene setting
#define MAX_LIGHTS 10

// material types
#define BASIC_MATERIAL 1
#define PHONG_MATERIAL 2
#define LAMBERT_MATERIAL 3

// texture types (special materials)
#define NONE 0
#define CHECKERBOARD 1
#define MY_SPECIAL 2

// reflect types (how to bounce rays)
#define NONE_REFLECT 1
#define MIRROR_REFLECT 2
#define GLASS_REFLECT 3

// represents a Material
struct Material {
  int material_type;
  vec3 color;
  float shininess;
  vec3 specular;

  int reflect_type;
  float reflectivity;
  float refraction_ratio;
  int special;
};

// represents a Light
struct Light {
  vec3 position;
  vec3 color;
  float intensity;
  float attenuate;
};

// represents a Ray
struct Ray {
  vec3 origin;
  vec3 direction;
};

// represents an Intersection
struct Intersection {
  vec3 position;
  vec3 normal;
};

// uniform
uniform mat4 uMVMatrix;
uniform int frame;
uniform float height;
uniform float width;
uniform vec3 camera;
uniform int num_lights;
uniform Light lights[MAX_LIGHTS];

// varying
varying vec2 v_position;

/******************************************************************************
 * Helper functions                                                           *
 ******************************************************************************/

bool is_pos(float x) { return x > EPS; }

bool is_neg(float x) { return x < -EPS; }

bool is_zero(float x) { return !is_neg(x) && !is_pos(x); }

bool is_infinity(float x) { return x >= INFINITY; }

/**
 * Returns a random, uniformly distributed float in the range [0,1).
 * Accepts a `vec2` as a random "seed".
 *
 * Credit: https://www.shadertoy.com/view/4ssXRX
 */
float rand(vec2 seed) {
  return fract(sin(dot(seed.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

/**
 * Returns a random, uniformly distributed float in the range [0,1).
 * Accepts an integer which is a sample number at the current pixel location.
 */
float rand(int i) {
  // Reduce the three floats into a single random float
  // - Pixel location (x and y components)
  // - Sample number (as a float)
  vec2 seed = vec2(rand(v_position), float(i));
  return rand(seed);
}

/** Returns the position some distance along a ray. */
vec3 ray_get_offset(Ray ray, float dist) {
  return ray.origin + (dist * ray.direction);
}

/**
 * Saves the closer intersection point.
 *
 * If `dist` is closer than `best_dist` (the best distance found so far),
 * `best_dist` will be updated, `best_intersect` will be updated with the values
 * of `intersect`, and `true` will be returned. Otherwise, nothing will happen
 * and `false` will be returned.
 */
bool choose_closer_intersection(float dist, inout float best_dist,
                                inout Intersection intersect,
                                inout Intersection best_intersect) {
  if (best_dist <= dist) {
    return false;
  }
  best_dist = dist;
  best_intersect.position = intersect.position;
  best_intersect.normal = intersect.normal;
  return true;
}

// -------------- STUDENT CODE BEGIN ---------------
// Our reference solution uses 117 lines of code.
// You may use this space for any general convenience functions.
// --------------- STUDENT CODE END ----------------

// forward declaration
float ray_intersect_scene(Ray ray, out Material out_mat,
                          out Intersection out_intersect);

/******************************************************************************
 * INTERSECTIONS                                                              *
 ******************************************************************************/

/**
 * Finds the intersection of a ray with a plane, defined by its normal and
 * distance from the origin.
 *
 * This function can be used for plane, triangle, and box.
 */
float find_intersection_with_plane(Ray ray, vec3 norm, float dist,
                                   out Intersection intersect) {
  float a = dot(ray.direction, norm);
  float b = dot(ray.origin, norm) - dist;

  if (is_zero(a)) {
    return INFINITY;
  }

  float len = -b / a;
  if (!is_pos(len)) {
    return INFINITY;
  }

  intersect.position = ray_get_offset(ray, len);
  intersect.normal = norm;
  return len;
}

/**
 * Finds the intersection of a ray with a triangle, defined by its vertices.
 */
float find_intersection_with_triangle(Ray ray, vec3 t1, vec3 t2, vec3 t3,
                                      out Intersection intersect) {
  // -------------- STUDENT CODE BEGIN ---------------
  // Our reference solution uses 29 lines of code.
  // currently reports no intersection
  return INFINITY;
  // --------------- STUDENT CODE END ----------------
}

/**
 * Finds the intersection of a ray with a sphere, defined by its center and
 * radius.
 */
float find_intersection_with_sphere(Ray ray, vec3 center, float radius,
                                    out Intersection intersect) {
  // -------------- STUDENT CODE BEGIN ---------------
  // Our reference solution uses 28 lines of code.
  // currently reports no intersection
  return INFINITY;
  // --------------- STUDENT CODE END ----------------
}

/**
 * Finds the intersection of a ray with a box, defined by its min and max
 * corners.
 */
float find_intersection_with_box(Ray ray, vec3 pmin, vec3 pmax,
                                 out Intersection intersect) {
  // pmin and pmax represent two bounding points of the box
  // pmin stores [xmin, ymin, zmin] and pmax stores [xmax, ymax, zmax]
  // -------------- STUDENT CODE BEGIN ---------------
  // Our reference solution uses 39 lines of code.
  // currently reports no intersection
  return INFINITY;
  // --------------- STUDENT CODE END ----------------
}

/**
 * Finds the intersection of a ray with an open cylinder (no top or bottom),
 * defined by its center, axis direction (normalized), height, and radius.
 */
float get_intersect_open_cylinder(Ray ray, vec3 center, vec3 axis, float height,
                                  float rad, out Intersection intersect) {
  // -------------- STUDENT CODE BEGIN ---------------
  // Our reference solution uses 36 lines of code.
  // currently reports no intersection
  return INFINITY;
  // --------------- STUDENT CODE END ----------------
}

/**
 * Finds the intersection of a ray with a disc, defined by its center, normal,
 * and radius.
 */
float get_intersect_disc(Ray ray, vec3 center, vec3 norm, float rad,
                         out Intersection intersect) {
  // -------------- STUDENT CODE BEGIN ---------------
  // Our reference solution uses 19 lines of code.
  // currently reports no intersection
  return INFINITY;
  // --------------- STUDENT CODE END ----------------
}

/**
 * Finds the intersection of a ray with a cylinder, defined by the center of the
 * bottom, the center of the top, and the radius.
 */
float find_intersection_with_cylinder(Ray ray, vec3 center, vec3 apex,
                                      float radius,
                                      out Intersection intersect) {
  vec3 axis = apex - center;
  float height = length(axis);
  axis = normalize(axis);

  float best_dist = INFINITY;
  float dist;
  Intersection temp_intersect;

  // -- open cylinder
  dist = get_intersect_open_cylinder(ray, center, axis, height, radius,
                                     temp_intersect);
  choose_closer_intersection(dist, best_dist, temp_intersect, intersect);

  // -- two caps
  dist = get_intersect_disc(ray, center, -axis, radius, temp_intersect);
  choose_closer_intersection(dist, best_dist, temp_intersect, intersect);
  dist = get_intersect_disc(ray, apex, axis, radius, temp_intersect);
  choose_closer_intersection(dist, best_dist, temp_intersect, intersect);

  return best_dist;
}

/**
 * Finds the intersection of a ray with an open cone (no bottom), defined by its
 * apex (tip), axis direction (normalized), height, and radius.
 */
float get_intersect_open_cone(Ray ray, vec3 apex, vec3 axis, float height,
                              float radius, out Intersection intersect) {
  // -------------- STUDENT CODE BEGIN ---------------
  // Our reference solution uses 47 lines of code.
  // currently reports no intersection
  return INFINITY;
  // --------------- STUDENT CODE END ----------------
}

/**
 * Finds the intersection of a ray with a cone, defined by the center of the
 * bottom, the apex (tip), and the radius.
 */
float find_intersection_with_cone(Ray ray, vec3 center, vec3 apex, float radius,
                                  out Intersection intersect) {
  vec3 axis = center - apex;
  float height = length(axis);
  axis = normalize(axis);

  float best_dist = INFINITY;
  float dist;
  Intersection temp_intersect;

  // -- open cone
  dist =
      get_intersect_open_cone(ray, apex, axis, height, radius, temp_intersect);
  choose_closer_intersection(dist, best_dist, temp_intersect, intersect);

  // -- bottom cap
  dist = get_intersect_disc(ray, center, axis, radius, temp_intersect);
  choose_closer_intersection(dist, best_dist, temp_intersect, intersect);

  return best_dist;
}

/******************************************************************************
 * COLOR                                                                      *
 ******************************************************************************/

/** Calculates the color of special materials at an intersection point. */
vec3 calculate_special_diffuse_color(Material mat, vec3 intersection_pos,
                                     vec3 normal_vector) {
  if (mat.special == CHECKERBOARD) {
    // -------------- STUDENT CODE BEGIN ---------------
    // Our reference solution uses 7 lines of code.
    // --------------- STUDENT CODE END ----------------
  } else if (mat.special == MY_SPECIAL) {
    // -------------- STUDENT CODE BEGIN ---------------
    // Our reference solution uses 31 lines of code.
    // --------------- STUDENT CODE END ----------------
  }

  // If not a special material (or something is not implemented), just use
  // material color.
  return mat.color;
}

/** Calculates the color of a material at an intersection point. */
vec3 calculate_diffuse_color(Material mat, vec3 intersection_pos,
                             vec3 normal_vector) {
  // Special colors
  if (mat.special != NONE) {
    return calculate_special_diffuse_color(mat, intersection_pos,
                                           normal_vector);
  }
  return vec3(mat.color);
}

/**
 * Checks if the given position is in shadow with respect to the given light.
 */
bool point_in_shadow(vec3 pos, vec3 light_vector) {
  // `light_vector` is the vector from `pos` to the light. It is not normalized,
  // so its length is the distance from the position to the light.
  // -------------- STUDENT CODE BEGIN ---------------
  // Our reference solution uses 14 lines of code.
  // nothing is in shadow
  return false;
  // --------------- STUDENT CODE END ----------------
}

/**
 * Returns a ratio that represents the fractional contribution of the given
 * light to the given position.
 */
float soft_shadow_ratio(vec3 pos, vec3 light_vector) {
  // `light_vector` is the vector from `pos` to the light. It is not normalized,
  // so its length is the distance from the position to the light.

  // See: https://mathworld.wolfram.com/SpherePointPicking.html
  // -------------- STUDENT CODE BEGIN ---------------
  // Our reference solution uses 25 lines of code.
  // nothing is in shadow
  return 0.0;
  // --------------- STUDENT CODE END ----------------
}

/**
 * Calculates the color contribution of the given light at the given
 * intersection point on the given material.
 */
vec3 get_light_contribution(Light light, Material mat, vec3 intersection_pos,
                            vec3 normal_vector, vec3 eye_vector,
                            bool phong_only, vec3 diffuse_color) {
  vec3 light_vector = light.position - intersection_pos;

  float ratio = 1.0; // default to 1.0 for hard shadows
  if (SOFT_SHADOWS == 1) {
    // if using soft shadows, use fractional light contribution
    ratio = soft_shadow_ratio(intersection_pos, light_vector);
  } else {
    // check if point is in shadow with light vector
    if (point_in_shadow(intersection_pos, light_vector)) {
      return vec3(0.0, 0.0, 0.0);
    }
  }

  // Slight optimization for soft shadows
  if (!is_pos(ratio)) {
    return vec3(0.0, 0.0, 0.0);
  }

  // normalize the light vector for the computations below
  float dist_to_light = length(light_vector);
  light_vector /= dist_to_light;

  if (mat.material_type == PHONG_MATERIAL ||
      mat.material_type == LAMBERT_MATERIAL) {
    vec3 contribution = vec3(0.0, 0.0, 0.0);

    // get light attenuation
    float attenuation = light.attenuate * dist_to_light;
    float diffuse_intensity =
        max(0.0, dot(normal_vector, light_vector)) * light.intensity;

    // glass and mirror objects have specular highlights but no diffuse lighting
    if (!phong_only) {
      contribution +=
          diffuse_color * diffuse_intensity * light.color / attenuation;
    }

    if (mat.material_type == PHONG_MATERIAL) {
      // Start with just black by default (i.e. no Phong term contribution)
      vec3 phong_term = vec3(0.0, 0.0, 0.0);
      // -------------- STUDENT CODE BEGIN ---------------
      // Our reference solution uses 5 lines of code.
      // --------------- STUDENT CODE END ----------------
      contribution += phong_term;
    }

    return ratio * contribution;
  }

  return ratio * diffuse_color;
}

/** Calculates the color of the material at the given intersection point. */
vec3 calculate_color(Material mat, vec3 intersection_pos, vec3 normal_vector,
                     vec3 eye_vector, bool phong_only) {
  // The diffuse color of the material at the point of intersection
  // Needed to compute the color when accounting for the lights in the scene
  vec3 diffuse_color =
      calculate_diffuse_color(mat, intersection_pos, normal_vector);

  // color defaults to black when there are no lights
  vec3 output_color = vec3(0.0, 0.0, 0.0);

  // Loop over the `MAX_LIGHTS` different lights, taking care not to exceed
  // `num_lights` (GLSL restriction), and accumulate each light's contribution
  // to the point of intersection in the scene.
  // -------------- STUDENT CODE BEGIN ---------------
  // Our reference solution uses 9 lines of code.
  // Return diffuse color by default, so you can see something for now.
  return diffuse_color;
  // return output_color;
  // --------------- STUDENT CODE END ----------------
}

/******************************************************************************
 * TRACE RAY                                                                  *
 ******************************************************************************/

/**
 * Calculates the reflection or refraction direction (depending on the material
 * type).
 */
vec3 calculate_reflection_vector(Material material, vec3 direction,
                                 vec3 normal_vector, bool is_inside_obj) {
  if (material.reflect_type == MIRROR_REFLECT) {
    return reflect(direction, normal_vector);
  }
  // If it's not mirror, then it is a refractive material like glass.

  // This eta is eta_i/eta_r
  float eta = (is_inside_obj) ? 1.0 / material.refraction_ratio
                              : material.refraction_ratio;

  // Compute the refraction direction.
  // See lecture 13 slide (lighting) on Snell's law.
  // -------------- STUDENT CODE BEGIN ---------------
  // Our reference solution uses 6 lines of code.
  // Return mirror direction by default, so you can see something for now.
  return reflect(direction, normal_vector);
  // --------------- STUDENT CODE END ----------------
}

/** Traces a ray into the scene and returns a color. */
vec3 trace_ray(Ray ray) {
  // Accumulate the final color from tracing this ray into `result_color`.
  vec3 result_color = vec3(0.0, 0.0, 0.0);

  // Accumulate a weight from tracing this ray through different materials based
  // on their BRDFs. Initially all 1.0s (i.e. scales the initial ray's RGB color
  // by 1.0 across all color channels). This captures the BRDFs of the materials
  // intersected by the ray's journey through the scene.
  vec3 result_weight = vec3(1.0, 1.0, 1.0);

  // Flag for whether the ray is currently inside of an object.
  bool is_inside_obj = false;

  // Iteratively trace the ray through the scene up to MAX_RECURSION bounces.
  for (int depth = 0; depth < MAX_RECURSION; depth++) {
    // Fire the ray into the scene and find an intersection, if one exists.

    // To do so, trace the ray using the `ray_intersect_scene` function, which
    // also accepts a Material struct and an Intersection struct to store
    // information about the point of intersection. The function returns a
    // distance of how far the ray traveled before it intersected an object.

    // Then, check whether or not the ray actually intersected with the scene.
    // A ray does not intersect the scene if it intersects at a distance "equal
    // to zero" or far beyond the bounds of the scene. If so, break out of the
    // loop and do not trace the ray any further.
    // (Hint: You should probably use EPS and INFINITY.)

    Material hit_material;
    Intersection intersect;
    // -------------- STUDENT CODE BEGIN ---------------
    // Our reference solution uses 4 lines of code.
    // --------------- STUDENT CODE END ----------------

    // Compute the vector from the ray towards the intersection.
    vec3 intersection_pos = intersect.position;
    vec3 normal_vector = intersect.normal;

    vec3 eye_vector = normalize(ray.origin - intersection_pos);

    // Determine whether we are inside an object using the dot product with the
    // intersection's normal vector
    if (dot(eye_vector, normal_vector) < 0.0) {
      normal_vector = -normal_vector;
      is_inside_obj = true;
    } else {
      is_inside_obj = false;
    }

    // Material is reflective if it is either mirror or glass in this assignment
    bool is_reflective = (hit_material.reflect_type == MIRROR_REFLECT ||
                          hit_material.reflect_type == GLASS_REFLECT);

    // Compute the color at the intersection point based on its material
    // and the lighting in the scene
    vec3 output_color =
        calculate_color(hit_material, intersection_pos, normal_vector,
                        eye_vector, is_reflective);

    // A material has a reflection type (as seen above) and a reflectivity
    // attribute. A reflectivity "equal to zero" indicates that the material is
    // neither reflective nor refractive.

    // If a material is neither reflective nor refractive...
    // (1) Scale the output color by the current weight and add it into the
    //     accumulated color.
    // (2) Then break out of the loop (i.e. do not trace the ray any further).
    // -------------- STUDENT CODE BEGIN ---------------
    // Our reference solution uses 4 lines of code.
    // --------------- STUDENT CODE END ----------------

    // If the material is reflective or refractive...
    // (1) Use `calculate_reflection_vector` to compute the direction of the
    //     next bounce of this ray.
    // (2) Update the ray object with the next starting position and direction
    //     to prepare for the next bounce. You should modify the ray's origin
    //     and direction attributes. Be sure to normalize the direction vector.
    // (3) Scale the output color by the current weight and add it into the
    //     accumulated color.
    // (4) Update the current weight using the material's reflectivity so that
    //     it is the appropriate weight for the next ray's color.
    // -------------- STUDENT CODE BEGIN ---------------
    // Our reference solution uses 8 lines of code.
    // --------------- STUDENT CODE END ----------------
  }

  return result_color;
}

void main() {
  float camera_fov = 0.8;
  vec3 direction = vec3(v_position.x * camera_fov * width / height,
                        v_position.y * camera_fov, 1.0);

  Ray ray;
  ray.origin = vec3(uMVMatrix * vec4(camera, 1.0));
  ray.direction = normalize(vec3(uMVMatrix * vec4(direction, 0.0)));

  // trace the ray for this pixel
  vec3 res = trace_ray(ray);

  // paint the resulting color into this pixel
  gl_FragColor = vec4(res.x, res.y, res.z, 1.0);
}
