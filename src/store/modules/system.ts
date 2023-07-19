import { defineStore } from 'pinia'

export const useSystemStore = defineStore('system', {
  state: () => ({
    userData: {
      url: 'video.deteam.cn',
      username: '',
      password: '',
      powerId: '0',
      publicIp: '',
      serverName: '',
      serverDesc: ''
    }
  }),
  persist: {
    key: 'system',
    storage: localStorage,
    paths: [
      'userData.url',
      'userData.username',
      'userData.password',
      'userData.serverName',
      'userData.serverDesc'
    ]
  }
})
