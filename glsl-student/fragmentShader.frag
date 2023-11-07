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

bool is_point_inside_box(const vec3 point, const vec3 pmin, const vec3 pmax) {
  return (point.x >= pmin.x - EPS && point.x <= pmax.x + EPS) &&
         (point.y >= pmin.y - EPS && point.y <= pmax.y + EPS) &&
         (point.z >= pmin.z - EPS && point.z <= pmax.z + EPS);
}

/// Function to interpolate between two points
float interpolate(float a, float b, float x) {
  float ft = x * 3.1415927;
  float f = (1.0 - cos(ft)) * 0.5;
  return a * (1.0 - f) + b * f;
}

// Pseudo Perlin noise implementation
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);

  // Four corners in 2D of a tile
  float a = rand(i);
  float b = rand(i + vec2(1.0, 0.0));
  float c = rand(i + vec2(0.0, 1.0));
  float d = rand(i + vec2(1.0, 1.0));

  // Smooth Interpolation
  vec2 u = f * f * (3.0 - 2.0 * f);
  return interpolate(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) +
         (d - b) * u.x * u.y;
}

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
  // using the optimized solution, this solution was helped by chatGPT.
  vec3 E1 = t2 - t1;
  vec3 E2 = t3 - t1;
  vec3 h = cross(ray.direction, E2);
  float a = dot(E1, h);

  if (a > -EPS && a < EPS)
    return INFINITY; // This means the ray is parallel to the triangle.

  float f = 1.0 / a;
  vec3 s = ray.origin - t1;
  float u = f * dot(s, h);

  if (is_neg(u) || u > 1.0)
    return INFINITY; // The intersection is outside of the triangle.

  vec3 q = cross(s, E1);
  float v = f * dot(ray.direction, q);

  if (is_neg(v) || (u + v) > 1.0)
    return INFINITY; // The intersection is outside of the triangle.

  // At this stage we can compute t to find out where the intersection point is
  // on the line.
  float t = f * dot(E2, q);

  if (t > EPS) { // Ray intersection
    vec3 intersectionPoint = ray.origin + ray.direction * t;
    intersect.position = intersectionPoint;
    vec3 norm = cross(E1, E2);
    if (is_pos(dot(ray.direction, norm))) {
      norm = -norm; // Make sure the normal is outward facing
    }
    intersect.normal = normalize(norm);
    return t;
  } else {
    return INFINITY; // This means that there is a line intersection but not a
                     // ray intersection.
  }

  // trying barycentric: code doesn't work bruh.
  // Because t1, t2, t3 are in clockwise order, normal is towards the ray
  // vec3 E1 = t1 - t3;
  // vec3 E2 = t2 - t3;
  // vec3 norm = normalize(cross(E1, E2));

  // float dist = dot(norm, t3);
  // Intersection planeIntersect;

  // float len = find_intersection_with_plane(ray, norm, dist, planeIntersect);

  // // Check if the ray is parallel
  // if (is_infinity(len)) {
  //   return INFINITY;
  // };

  // // Check if the intersection point is inside the triangle (barycentric)
  // vec3 P = planeIntersect.position;
  // float N_sq = dot(norm, norm);
  // float alpha = dot(norm, cross(t1 - P, t2 - P)) / N_sq;
  // float beta = dot(norm, cross(t3 - P, t1 - P)) / N_sq;

  // if (!((alpha >= 0.0) && (beta >= 0.0) && ((alpha + beta) <= 1.0))) {
  //   return INFINITY;
  // }

  // // return INFINITY;
  // intersect.position = planeIntersect.position;
  // intersect.normal = planeIntersect.normal;
  // return len;

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
  vec3 L = center - ray.origin;
  float tca = dot(L, ray.direction);
  if (is_zero(tca)) {
    return INFINITY;
  }

  float d2 = dot(L, L) - tca * tca;
  if (d2 > radius * radius) {
    return INFINITY;
  }

  float thc = sqrt(radius * radius - d2);

  float t0 = tca - thc;
  float t1 = tca + thc;
  // If t0 is positive, it's the closest intersection
  if (t0 > EPS) {
    vec3 pos = ray_get_offset(ray, t0);
    intersect.position = pos;
    intersect.normal = (pos - center) / length(pos - center);
    return t0;
  } else if (t1 > EPS) {
    vec3 pos = ray_get_offset(ray, t1);
    intersect.position = pos;
    intersect.normal = (pos - center) / length(pos - center);
    return t1;
  }

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
  // List of faces with their normals and representative points
  // Iterate over each side of the box
  float dist = INFINITY;
  for (int i = 0; i < 3; i++) {
    for (float sig = -1.0; sig < 2.0; sig += 2.0) {
      vec3 norm = vec3(0, 0, 0);
      norm[i] = sig;

      float planeDist;
      if (sig == -1.0) {
        planeDist = dot(norm, pmin);
      } else {
        planeDist = dot(norm, pmax);
      }

      Intersection tempIntersect;
      float t =
          find_intersection_with_plane(ray, norm, planeDist, tempIntersect);

      if (t < INFINITY &&
          is_point_inside_box(tempIntersect.position, pmin, pmax) && t > EPS) {
        choose_closer_intersection(t, dist, tempIntersect, intersect);
      }
    }
  }
  return dist;
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
  // -------------- STUDENT CODE BEGIN ---------------
  vec3 v_d = ray.origin - center;
  float phi = dot(v_d, axis);
  float theta = dot(ray.direction, axis);
  vec3 v_r_minus_theta_v_a = ray.direction - theta * axis;
  vec3 v_d_minus_phi_v_a = v_d - phi * axis;

  // Compute the coefficients of the quadratic equation
  float a = dot(v_r_minus_theta_v_a, v_r_minus_theta_v_a);
  float b = 2.0 * dot(v_r_minus_theta_v_a, v_d_minus_phi_v_a);
  float c = dot(v_d_minus_phi_v_a, v_d_minus_phi_v_a) - rad * rad;

  // Solve the quadratic equation
  float discriminant = b * b - 4.0 * a * c;

  if (is_neg(discriminant)) {
    return INFINITY; // No real roots, no intersection
  }

  float sqrt_discriminant = sqrt(discriminant);
  float t1 = (-b - sqrt_discriminant) / (2.0 * a);
  float t2 = (-b + sqrt_discriminant) / (2.0 * a);

  // Check if the intersection points are within the finite height of the
  // cylinder
  float t = INFINITY;
  vec2 t_candidates;
  float t_candidate;
  Intersection tempIntersect;
  t_candidates[0] = t1;
  t_candidates[1] = t2;
  for (int i = 0; i < 2; i++) {
    t_candidate = t_candidates[i];
    if (is_neg(t_candidate))
      continue; // Intersection behind the ray origin

    vec3 intersection_point = ray_get_offset(ray, t_candidate);
    tempIntersect.position = intersection_point;
    float distance_along_axis = dot(intersection_point - center, axis);
    tempIntersect.normal =
        normalize(intersection_point - (center + distance_along_axis * axis));

    if (distance_along_axis > 0.0 && distance_along_axis <= height) {
      choose_closer_intersection(t_candidate, t, tempIntersect, intersect);
    }
  }

  return t;
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
  Intersection tempIntersect;
  // Calculate the intersection t value for the ray with the plane
  float t =
      find_intersection_with_plane(ray, norm, dot(norm, center), tempIntersect);

  if (is_infinity(t)) {
    return INFINITY;
  }

  // If t is negative, the intersection is behind the ray's origin
  vec3 p = tempIntersect.position;

  // Check if the intersection point lies within the disc's radius
  vec3 vec_from_center = p - center;
  float dist = length(vec_from_center);

  if (dist < rad) {
    intersect.position = p;
    intersect.normal = tempIntersect.normal;
    return t;
  }

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
  vec3 vd = ray.origin - apex;
  float phi = dot(vd, axis);
  float theta = dot(ray.direction, axis);

  // Half-angle of the cone (alpha)
  float tanAlpha = radius / height;
  float cosAlpha2 = cos(atan(tanAlpha)) * cos(atan(tanAlpha));
  float sinAlpha2 = sin(atan(tanAlpha)) * sin(atan(tanAlpha));

  float a = dot(ray.direction - theta * axis, ray.direction - theta * axis) *
                cosAlpha2 -
            theta * theta * sinAlpha2;
  float b =
      2.0 * (dot(ray.direction - theta * axis, vd - phi * axis) * cosAlpha2 -
             theta * phi * sinAlpha2);
  float c =
      dot(vd - phi * axis, vd - phi * axis) * cosAlpha2 - phi * phi * sinAlpha2;

  float discriminant = b * b - 4.0 * a * c;

  if (is_neg(discriminant)) {
    return INFINITY; // No intersection
  }

  float t0 = (-b - sqrt(discriminant)) / (2.0 * a);
  float t1 = (-b + sqrt(discriminant)) / (2.0 * a);

  float t = INFINITY;
  vec3 q;

  // Check t0 for valid intersection within cone bounds
  if (is_pos(t0)) {
    q = ray_get_offset(ray, t0);
    if (is_pos(dot(axis, q - apex)) &&
        is_neg(dot(axis, q - (apex + height * axis)))) {
      t = t0;
      intersect.position = q;
      // Normal calculation for cone surface at point q
      vec3 normal = normalize(q - apex - dot(q - apex, axis) * axis);
      intersect.normal = is_neg(dot(normal, normalize(ray.direction)))
                             ? normal
                             : -normal; // Orienting normal
    }
  }

  // Check t1 for valid intersection within cone bounds
  if (is_pos(t1) && is_neg(t1 - t)) {
    q = ray_get_offset(ray, t1);
    if (is_pos(dot(axis, q - apex)) &&
        is_neg(dot(axis, q - (apex + height * axis)))) {
      t = t1;
      intersect.position = q;
      // Normal calculation for cone surface at point q

      vec3 normal = normalize(q - apex - dot(q - apex, axis) * axis);
      intersect.normal = is_neg(dot(normal, ray.direction))
                             ? normal
                             : -normal; // Orienting normal
    }
  }

  return t;
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
    // Optionally scale the position before flooring
    float scale = 4.0;
    // Add EPS to the position to prevent speckling at the boundaries
    vec3 pos_eps = intersection_pos + vec3(EPS, EPS, EPS);
    vec3 scaled_pos = pos_eps / scale;
    // Quantize it to the unit grid by flooring the position
    vec3 floored_pos = floor(scaled_pos);
    // Calculate the checkerboard pattern
    float checker = mod(floored_pos.x + floored_pos.y + floored_pos.z, 2.0);

    vec3 color = (checker < 1.0) ? mat.color : mat.color - vec3(0.3, 0.3, 0.3);
    return color;
    // --------------- STUDENT CODE END ----------------
  } else if (mat.special == MY_SPECIAL) {
    // -------------- STUDENT CODE BEGIN ---------------
    // Our reference solution uses 31 lines of code.
    // Find a vector that is not parallel to the normal
    vec3 nonParallel =
        abs(normal_vector.y) < 0.999 ? vec3(0, 1, 0) : vec3(1, 0, 0);

    // Create two tangent vectors
    vec3 tangent = normalize(cross(normal_vector, nonParallel));
    vec3 bitangent = cross(normal_vector, tangent);

    // Project the intersection point onto the tangent/bitangent plane
    vec2 planeProjection =
        vec2(dot(intersection_pos, tangent), dot(intersection_pos, bitangent));

    // Now we can use planeProjection as your 2D coordinates for noise
    float n =
        noise(planeProjection *
              2.0); // Adjust the 5.0 scaling as needed for your noise pattern
    // Use the noise to perturb the color
    vec3 color = mix(mat.color, mat.color * n, 0.5);

    return color;
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
  vec3 ray_dir = normalize(light_vector);

  // create a ray from the light and fire it off
  Ray shadow_ray;
  shadow_ray.origin = pos + EPS * ray_dir;
  shadow_ray.direction = ray_dir;

  Material hit_material;
  Intersection intersect;

  float t = ray_intersect_scene(shadow_ray, hit_material, intersect);
  if (abs(t) < EPS || is_infinity(t)) {
    return false;
  } else if (t < length(light_vector) + EPS) {
    return true;
  }

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
      // Calculate reflection vector
      vec3 reflect_dir = reflect(-light_vector, normal_vector);
      vec3 view_dir = normalize(eye_vector - intersection_pos);
      // Calculate specular component
      float spec =
          pow(min(max(dot(view_dir, reflect_dir), 0.0), 1.0), mat.shininess);
      phong_term = light.color * mat.specular * spec * diffuse_intensity /
                   attenuation; // Correctly apply attenuation
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
  for (int i = 0; i < MAX_LIGHTS; i++) {
    if (i >= num_lights) {
      break;
    }
    vec3 light_contribution =
        get_light_contribution(lights[i], mat, intersection_pos, normal_vector,
                               eye_vector, phong_only, diffuse_color);
    // Add diffuse contribution
    output_color += light_contribution;
  }
  return output_color;
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
  // Return mirror direction by default, so you can see something for
  // now.
  // TODO: check: use negative direction for reverse ray?
  float cos_theta_i = dot(-direction, normal_vector);
  float sin2_theta_i = max(0.0, 1.0 - cos_theta_i * cos_theta_i);
  float sin2_theta_r = eta * eta * sin2_theta_i;

  // Total internal reflection
  if (sin2_theta_r >= 1.0) {
    return vec3(0.0, 0.0, 0.0);
  }

  float cos_theta_r = sqrt(1.0 - sin2_theta_r);
  vec3 refracted_dir =
      eta * direction + (eta * cos_theta_i - cos_theta_r) * normal_vector;
  return normalize(refracted_dir);

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
    float t = ray_intersect_scene(ray, hit_material, intersect);
    if (abs(t) < EPS || t >= INFINITY) {
      break;
    }
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
    if (is_zero(hit_material.reflectivity)) {
      result_color += result_weight * output_color;
      break;
    }
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
    // (1)
    vec3 next_dir = calculate_reflection_vector(hit_material, ray.direction,
                                                normal_vector, is_inside_obj);
    // (2)
    ray.direction = normalize(next_dir);
    ray.origin = intersection_pos + EPS * ray.direction;
    // (3)
    result_color += result_weight * output_color;
    // (4) TODO: check this?
    result_weight *= hit_material.reflectivity;
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
