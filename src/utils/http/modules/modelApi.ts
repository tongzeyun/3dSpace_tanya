import {http} from '../request'

const modelApi = {
  getPublicPumpList() {
    return http.get('/pumps/public/')
  },
  getPumpList(data:any) {
    return http.get('/pumps/', data)
  },
  createPump(data:any) {
    return http.post('/pumps/', data)
  },
  
}

export default modelApi