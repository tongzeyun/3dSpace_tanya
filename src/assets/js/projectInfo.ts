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
    subMenu:[
      {type:'0',title:'主支管入'},
      {type:'1',title:'分支管入'}
    ]
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
    title: '添加泵',
    type: '6',
    isShow: false,
  },
]