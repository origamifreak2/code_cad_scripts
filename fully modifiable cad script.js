const { drawCircle, draw, makePlane } = replicad;

const polarCopies = (shape, count, radius) => {
  const base = shape.translate(0, radius);
  const angle = 360 / count;

  const copies = [];
  for (let i = 0; i < count; i++) {
    copies.push(base.clone().rotate(i * angle, [0, 0, 0], [1, 0, 0]));
    //return shape.rotate(45, [0, 0, 0], [1, 0, 0]);
  }
  return copies;
};

const fuseAll = (shapes) => {
  let result = shapes[0];
  shapes.slice(1).forEach((shape) => {
    result = result.fuse(shape);
  });
  return result;
};

function toRadians (angle) {
  return angle * (Math.PI / 180);
}

function main(){
  /*
    //calculate the dimensions of a "unit" triangle
      //get the angles of the triangle from the user's input (number_of_rays, intersect_angle)
      //assuming that the side of the triangle opposite the ray angle is 1 unit, calculate the other edges of the triangle
    //get the scale down factor between the two sides that are not 1 unit long
      //longer-side / shorter-side
    //calculate the point positions of a "unit" profile
      //calculate the dimensions of the triangle to take off the top of the "unit" triangle (the next smaller triangle between the same two rays). This will make a quadrilateral
        //base triangle dimensions x (scale down factor ^ number of rays)
      //assume that the two bottom points of the quadrilateral are at (0,0) and (1,0)
      //calculate the positions of the two top points of the quadrilateral using right triangles formed by vertical lines through the two points
        // the two points should be horizontal to each other, so you may want to average out their y coordinates
  */

  // variables that can be modified by the user
  const number_of_rays = 15; // number of equiangular rays from the center of a circle
  const intersect_angle = toRadians(83); // angle the line from one ray to another intersects the second ray. must be between ?? and ??
  const base_scale = 20; // scaling of the base segment
  const center_hole_diameter = 4;
  const outer_hole_diameter = 2;
  const segment_count = 25;

  // Mathematical Constants//
  const circle_degrees = toRadians(360);
  const tri_degrees_sum = toRadians(180);

  // base / unit triangle
  const tri_center_angle = circle_degrees / number_of_rays;
  const tri_third_angle = tri_degrees_sum - tri_center_angle - intersect_angle;
  const tri_base = 1;
  const upright_a = tri_base * Math.sin(intersect_angle)/Math.sin(tri_center_angle);
  const upright_b = tri_base * Math.sin(tri_third_angle)/Math.sin(tri_center_angle);
  const scale_down_factor = upright_b / upright_a;

  let segments = [];
  for (let i = 0; i < segment_count; i++) {
    const current_scale_down = Math.pow(scale_down_factor, i);
    const current_total_scale = base_scale * current_scale_down;

    const current_tri = {
      'side_a': upright_a * current_total_scale,
      'side_b': upright_b * current_total_scale,
      'side_c': tri_base * current_total_scale
    };

    const minus_tri_scale = Math.pow(scale_down_factor, number_of_rays);
    const minus_tri = {
      'side_a': current_tri.side_a * minus_tri_scale,
      'side_b': current_tri.side_b * minus_tri_scale,
      'side_c': current_tri.side_c * minus_tri_scale
    };

    const cur_prof_left_length = current_tri.side_b - minus_tri.side_b;
    //const cur_prof_left_tri_3rd_angle = tri_degrees_sum - 90 - intersect_angle;
    const cur_prof_left_tri_base = Math.cos(intersect_angle) * cur_prof_left_length;
    const cur_prof_left_tri_height = Math.sin(intersect_angle) * cur_prof_left_length;

    const cur_prof_right_length = current_tri.side_a - minus_tri.side_a;
    //const cur_prof_right_tri_3rd_angle = tri_degrees_sum - 90 - tri_third_angle;
    const cur_prof_right_tri_base = Math.cos(tri_third_angle) * cur_prof_right_length;
    const cur_prof_right_tri_height = Math.sin(tri_third_angle) * cur_prof_right_length;

    const current_profile_points = {
      'bottom_left': [0,0],
      'bottom_right': [current_tri.side_c, 0],
      'top_left': [cur_prof_left_tri_base, cur_prof_left_tri_height],
      'top_right': [current_tri.side_c - cur_prof_right_tri_base, cur_prof_right_tri_height]
    }

    let main_body = draw()
      .hLine(current_profile_points.bottom_right[0])
      .lineTo(current_profile_points.top_right)
      .lineTo(current_profile_points.top_left)
      .close().sketchOnPlane("XY").revolve([1, 0, 0]);

    let center_hole = drawCircle(center_hole_diameter / 2).sketchOnPlane(makePlane("YZ")).extrude(current_profile_points.bottom_right[0]);
    
    let distance_from_center = cur_prof_left_tri_height * Math.pow(scale_down_factor, 7);
    let outer_hole = drawCircle(outer_hole_diameter / 2).sketchOnPlane(makePlane("YZ")).extrude(current_profile_points.bottom_right[0]);
    let outer_holes = fuseAll(polarCopies(outer_hole, 3, distance_from_center));
    segments.push(main_body.cut(outer_holes).cut(center_hole));
  }

  return segments;

}