import {http} from '../request'

const userApi = {
  // 用户登录
  login(data:any) {
    return http.post('/users/token/',data)
  },
  // 用户注册
  register(data:any) {
    return http.post('/users/register/',data)
  },
  // 重新获取token
  refreshToken() {
    return http.post('/users/token/refresh/')
  },
  // 获取用户信息
  getUserInfo() {
    return http.get(`/users/me/`)
  },
  // 更新用户信息
  updateUser(data:any) {
    return http.put('/users/',data)
  },
}

export default userApi