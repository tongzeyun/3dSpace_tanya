import {http} from '../request'

const modelApi = {
  getPumpList(data:any) {
    return http.get('/pumps/', data)
  },
  createPump(data:any) {
    return http.post('/pumps/', data)
  },
  
}

export default modelApi