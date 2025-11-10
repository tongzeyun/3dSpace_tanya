export interface Chamber {
  type :string;
  name :string;
  cType :string | number;
  x_size?: string | number,
  y_size?: string | number,
  z_size?: string | number,
  d_size?: string | number,
  h_size?: string | number,
  position : {x:string | number, y:string | number, z:string | number}
  rotation : {x:string | number, y:string | number, z:string | number}
  scale : {x:string | number, y:string | number, z:string | number}
  thickness: string | number;
  hole_location_x : string | number
  hole_location_y : string | number
  hole_location_h : string | number
  hole_location_r : string | number
}