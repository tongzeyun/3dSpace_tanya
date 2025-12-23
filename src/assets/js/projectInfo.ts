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
]

export const pipeDiaOptions = [
  {id:0,title:'16mm',value:0.016},
  {id:1,title:'25mm',value:0.025},
  {id:2,title:'40mm',value:0.040},
  {id:3,title:'63mm',value:0.063},
  {id:4,title:'100mm',value:0.100},
  {id:5,title:'160mm',value:0.160},
  {id:6,title:'250mm',value:0.250},
]