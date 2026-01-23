import {http} from '../request'

const pocApi = {
  getPocList(data:any) {
    return http.get('/projects/', data)
  },
  createPoc(data:any) {
    return http.post('/projects/', data)
  },
  getPocById(data:any) {
    return http.get('/projects/', data)
  },
  updatePocById(data:any) {
    return http.put(`/projects/${data.id}/`, data)
  },
  delPocById(id:any) {
    return http.delete(`/projects/${id}/`)
  },
  calcPoc(data:any) {
    return http.post(`/projects/${data.id}/calculate/`, data)
  },
}

export default pocApi