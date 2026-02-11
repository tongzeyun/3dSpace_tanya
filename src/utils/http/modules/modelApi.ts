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
  updatePump(id:any,data:any) {
    return http.patch(`/pumps/${id}/`, data)
  },
  deletePump(id:number) {
    return http.delete(`/pumps/${id}/`)
  },
  getPublicValveList() {
    return http.get('/valves/')
  }
}

export default modelApi