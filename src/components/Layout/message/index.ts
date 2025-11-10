import { App, createVNode, VNode, render } from 'vue'
import message from './message.vue'

export default {
  install(app: App) {
    // 将组件转换为虚拟DOM
    const mesVnode: VNode = createVNode(message)
    // const mesContainer = document.createElement('div')
    // document.body.appendChild(mesContainer)
    // 将虚拟DOM挂载到页面节点上
    // render(mesVnode, document.body)
    render(mesVnode, document.createElement('div'))
    // 将插件的主要方法挂载到 app.config.globalProperties 上，这里的 $message 是自定义的
    app.config.globalProperties.$message = {
      // 这里仅挂载了一个 show 方法到 $message 上
      show(str: string | number, type:string ,time?: number) {
        mesVnode.component?.exposed?.show(str, type ,time)
      },
    }
  },
}