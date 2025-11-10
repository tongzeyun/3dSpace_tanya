import { App, createVNode, VNode, render } from 'vue'
import msgBox from './msgBox.vue'

export default {
  install(app: App) {
    // 将组件转换为虚拟DOM
    const msgBoxVnode: VNode = createVNode(msgBox)
    // const mesboxContainer = document.createElement('div')
    // document.body.appendChild(mesboxContainer)
    // 将虚拟DOM挂载到页面节点上
    render(msgBoxVnode, document.createElement('div'))
    
    // 将插件的主要方法挂载到 app.config.globalProperties 上，这里的 $msgBox 是自定义的
    app.config.globalProperties.$msgBox = {
      // 这里仅挂载了一个 show 方法到 $msgBox 上
      messageBox(data:any,callBack:Function) {
        msgBoxVnode.component?.exposed?.messageBox(data, callBack)
      },
    }
  },
}