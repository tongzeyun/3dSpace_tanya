// 盒形面索引
export const ENUM_Box_Faces : Record<number, string> = {
  0: 'left',
  1: 'back', 
  2: 'right',
  3: 'front',
  4: 'bottom',
  5: 'top'
} as const;

// 柱形面索引
export const ENUM_Box_Sides : Record<number, string> ={
  4: 'bottom',
  5: 'top',
  2: 'side'
} as const;
