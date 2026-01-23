export const menuData = [
  {
    title:'添加直管',
    type:'0'
  },
  {
    title:'添加弯管',
    type:'1'
  },
  {
    title:'添加三通管',
    type:'2',
    isShow:false,
    subMenu:[
      {type:'0',title:'主支管入'},
      {type:'1',title:'分支管入'}
    ]
  },
  {
    title:'添加四通管',
    type:'3',
    isShow:false,
  },
  {
    title:'添加斜切管',
    type:'4',
    isShow: false,
  },
  {
    title: '添加异径管',
    type: '5',
    isShow: false,
  },
  {
    title:'添加阀门',
    type:'7',
    isShow: false,
  },
  {
    title: '添加泵',
    type: '6',
    isShow: false,
    subMenu:[
      {type:'0',title:'干泵'},
      {type:'1',title:'分子泵'},
      {type:'2',title:'离子泵'},
      {type:'3',title:'油泵'}
    ]
  },
  {
    title: '添加自定义元件',
    type: '8',
    isShow: false,
  },
]

export const flangeDiameterOptions = [
  { id:0, label: 'DN16', value: 0.016 },
  { id:1, label: 'DN25', value: 0.025 },
  { id:2, label: 'DN40', value: 0.040 },
  { id:3, label: 'DN63', value: 0.063 },
  { id:4, label: 'DN100', value: 0.100 },
  { id:5, label: 'DN160', value: 0.160 },
  { id:6, label: 'DN250', value: 0.250 },
]

export const gasTypeOptions = [
  {id:0,title:'空气',value:'air'},
  {id:1,title:'氮气',value:'nitrogen'},
  {id:2,title:'氢气',value:'hydrogen'},
  {id:3,title:'氦气',value:'helium'},
  {id:4,title:'氧气',value:'oxygen'},
  {id:5,title:'二氧化碳',value:'carbonDioxide'},
]