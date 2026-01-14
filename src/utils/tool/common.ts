/**
 * @Author: Travis
 * @Date: 2026-01-09 16:28:27
 * @Description: 公用函数
 * @LastEditTime: 2026-01-09 16:28:27
 * @LastEditors: Travis
 */
// 下载文件
export const downloadFile = (data:any) => {
  try {
    // const json = JSON.stringify(projectStore.projectInfo, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'projectData_' + new Date().getTime() +'.json'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    // ElMessage.success('已生成并开始下载 JSON 文件')
    // ElMessage.success({ message: '已生成并开始下载 JSON 文件'})
  } catch (e) {
    console.error(e)
    // ElMessage.error('导出 JSON 失败')
  }
}

/**
 * 简易防抖，默认 300ms，可自定义延时
 * 返回的函数自带 cancel 方法可手动清除
 */
export const debounce = <T extends (...args: any[]) => any>(fn: T, delay = 300) => {
  let timer: number | undefined
  const wrapped = function (this: any, ...args: Parameters<T>) {
    if (timer) window.clearTimeout(timer)
    timer = window.setTimeout(() => {
      timer = undefined
      fn.apply(this, args)
    }, delay)
  }
  wrapped.cancel = () => {
    if (timer) {
      window.clearTimeout(timer)
      timer = undefined
    }
  }
  return wrapped as T & { cancel: () => void }
}

/**
 * 节流函数：间隔 delay 执行一次，默认 300ms
 * 返回的函数自带 cancel 方法可取消排队调用
 */
export const throttle = <T extends (...args: any[]) => any>(fn: T, delay = 300) => {
  let last = 0
  let timer: number | undefined

  const wrapped = function (this: any, ...args: Parameters<T>) {
    const now = Date.now()
    const remain = delay - (now - last)
    if (remain <= 0) {
      if (timer) {
        window.clearTimeout(timer)
        timer = undefined
      }
      last = now
      fn.apply(this, args)
    } else if (!timer) {
      timer = window.setTimeout(() => {
        timer = undefined
        last = Date.now()
        fn.apply(wrapped, args)
      }, remain)
    }
  }

  wrapped.cancel = () => {
    if (timer) {
      window.clearTimeout(timer)
      timer = undefined
    }
    last = 0
  }

  return wrapped as T & { cancel: () => void }
}
