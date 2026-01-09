/**
 * @Author: Travis
 * @Date: 2026-01-09 16:28:27
 * @Description: 
 * @LastEditTime: 2026-01-09 16:28:27
 * @LastEditors: Travis
 */
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