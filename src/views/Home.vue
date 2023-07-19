<template>
  <n-layout style="height: 100vh; width: 100vw">
    <n-layout-header
      position="absolute"
      style="height: 48px; width: 100%"
      class="flex items-center"
      bordered
    >
      <div class="flex flex-row mx-2">
        <div>
          <n-button
            @click="
              () => {
                if (ws) {
                  disconnect()
                } else {
                  showSignModal = true
                }
              }
            "
          >
            {{ ws ? '断开' : '连接' }}
          </n-button>
        </div>
        <div>
          <n-button
            class="ml-2"
            v-if="ws || systemStore.$state.userData.powerId === '12'"
            @click="showCreateRoomModal = true"
            >创建频道</n-button
          >
        </div>
        <div>
          <n-select
            class="ml-2"
            :disabled="ws || isRoomOwner === true || deviceList.length === 0"
            v-model:value="deviceSelectValue"
            :options="deviceSelectOptions"
            style="width: 200px"
          />
        </div>
      </div>
    </n-layout-header>
    <n-layout
      has-sider
      position="absolute"
      style="bottom: 48px; top: 48px; left: 0; right: 0"
      none-drag-region
    >
      <n-layout-sider bordered content-style="padding: 5px;">
        <n-list>
          <n-list-item
            v-for="item in menuOptions"
            @click="updateMenuValue(String(item.key))"
            class="px-2 rounded-xl"
            :class="{
              'bg-slate-200': item.key === menuValue
            }"
          >
            <span class="ml-3">{{ item.label }}</span>
            <template #suffix>
              <n-button
                class="mr-3"
                v-if="systemStore.$state.userData.powerId === '12'"
                @click="
                  (e:any) => {
                    e.preventDefault()
                    e.cancelBubble = true
                    deleteRoom(String(item.key))
                  }
                "
                strong
                secondary
              >
                X
              </n-button>
            </template>
          </n-list-item>
        </n-list>
      </n-layout-sider>
      <n-layout content-style="padding: 5px;" class="x">
        <div class="bg-white absolute z-50 w-full shadow-sm">
          <div v-if="ws">
            <div class="flex justify-center text-lg font-bold">
              {{ systemStore.$state.userData.serverName }}
            </div>
            <div class="text-sm text-gray-500 p-3">
              <n-ellipsis
                expand-trigger="click"
                line-clamp="2"
                :tooltip="false"
              >
                {{ systemStore.$state.userData.serverDesc }}
              </n-ellipsis>
            </div>
          </div>
        </div>
        <div>
          <n-grid class="z-50 mt-28" cols="1 400:2 600:3" :y-gap="8" :x-gap="8">
            <n-grid-item v-for="item in userList">
              <n-card :title="item.userName">
                <!-- <span
                  :class="{
                    'text-white': item.userName === signData.username
                  }"
                >
                  {{ item.userName }}
                </span> -->
                <template #header-extra>
                  <n-tag
                    :bordered="false"
                    round
                    v-if="
                      item.userName === systemStore.$state.userData.username
                    "
                    >自己</n-tag
                  >
                </template>
                <n-button
                  :disabled="!ws || isRoomOwner !== true"
                  @click="
                    () => {
                      if (
                        item.userName === systemStore.$state.userData.username
                      ) {
                        localBm()
                      } else {
                        bm(item.userName, item.isBm ? false : true)
                      }
                    }
                  "
                  type="error"
                  size="small"
                >
                  {{ item.isBm ? '开启麦克风' : '关闭麦克风' }}
                </n-button>
              </n-card>
            </n-grid-item>
          </n-grid>
        </div>
      </n-layout>
      <div
        ref="videoContainerRef"
        id="video-container"
        class="absolute -z-50"
      ></div>
    </n-layout>

    <n-layout-footer
      position="absolute"
      style="height: 40px"
      class="flex justify-center items-center"
      bordered
    >
      <div>
        <span class="text-gray-500 text-xs"
          >Copyright © 2023 DataElement. All rights reserved.</span
        >
      </div>
    </n-layout-footer>
  </n-layout>
  <n-modal
    v-model:show="showSignModal"
    preset="card"
    :style="{
      maxWidth: '600px'
    }"
    title="登录服务器"
    size="huge"
    :bordered="false"
  >
    <div class="flex flex-col items-center">
      <n-form ref="formRef" :model="systemStore.$state.userData">
        <n-form-item
          path="url"
          label="服务器地址"
          :rule="{
            required: true,
            message: `请输入服务器地址`,
            trigger: ['input', 'blur']
          }"
        >
          <n-input
            v-model:value="systemStore.$state.userData.url"
            placeholder="请输入服务器地址"
            style="width: 400px"
          />
        </n-form-item>
        <n-form-item
          path="username"
          label="连飞呼号"
          :rule="{
            required: true,
            message: `请输入连飞呼号`,
            trigger: ['input', 'blur']
          }"
        >
          <n-input
            v-model:value="systemStore.$state.userData.username"
            placeholder="请输入连飞呼号"
            style="width: 400px"
          />
        </n-form-item>
        <n-form-item
          path="password"
          label="连飞密码"
          :rule="{
            required: true,
            message: `请输入连飞密码`,
            trigger: ['input', 'blur']
          }"
        >
          <n-input
            type="password"
            v-model:value="systemStore.$state.userData.password"
            placeholder="请输入连飞密码"
            style="width: 400px"
          />
        </n-form-item>
      </n-form>
      <n-button @click="joinLine" type="primary" style="width: 100%">
        登录
      </n-button>
    </div>
  </n-modal>
  <n-modal
    v-model:show="showCreateRoomModal"
    preset="card"
    :style="{
      maxWidth: '600px'
    }"
    title="创建频道"
    size="huge"
    :bordered="false"
  >
    <div class="flex flex-col items-center">
      <n-form ref="formCreateRoomRef" :model="createRoomData">
        <n-form-item
          path="roomName"
          label="房间名称"
          :rule="{
            required: true,
            message: `请输入房间名称`,
            trigger: ['input', 'blur']
          }"
        >
          <n-input
            maxlength="20"
            show-count
            v-model:value="createRoomData.roomName"
            placeholder="请输入房间名称"
            style="width: 400px"
          />
        </n-form-item>
      </n-form>
      <n-button @click="createRoom" type="primary" style="width: 100%">
        添加
      </n-button>
    </div>
  </n-modal>
</template>

<script setup lang="ts">
import {
  FormInst,
  MenuOption,
  useDialog,
  useMessage,
  useNotification
} from 'naive-ui'
import { ref, onMounted, Ref, onUnmounted } from 'vue'
import { useSystemStore } from '../store/modules/system'
// const collapsed = ref(false)
const message = useMessage()
const notifi = useNotification()
const dialog = useDialog()
const showSignModal = ref(false)
const showCreateRoomModal = ref(false)
const ws = ref(null) as Ref<WebSocket | null>
var localStream: MediaStream | null = null
const deviceList = ref<MediaDeviceInfo[]>([])
const roomName = ref<string>('')
const deviceSelectValue = ref('default')
const videoContainerRef = ref({}) as Ref<HTMLDivElement>
const isRoomOwner = ref(false)
const localPc = ref<RTCPeerConnection | null>(null)
const formRef = ref<FormInst | null>(null)
const formCreateRoomRef = ref<FormInst | null>(null)
const serverVersion = ref(0.03)
const systemStore = useSystemStore()
const isPong = ref(false)
const deleteRoom = (roomName: string) => {
  if (ws.value === null) {
    message.error('请先连接服务器')
  } else {
    dialog.warning({
      title: '警告',
      content: '你确定删除该房间吗？',
      positiveText: '确定',
      negativeText: '取消',
      onPositiveClick: () => {
        const str = JSON.stringify({
          type: 'deleteRoom',
          roomName: roomName
        })
        ws.value?.send(str)
      }
    })
  }
}
const localBm = () => {
  userList.value.forEach((item) => {
    if (item.userName === systemStore.$state.userData.username) {
      if (item.isBm) {
        if (localStream) {
          localStream.getAudioTracks().forEach((track) => {
            // 恢复声音
            track.enabled = true
          })
        }
        item.isBm = false
        message.success('开启麦克风成功')
      } else {
        if (localStream) {
          localStream.getAudioTracks().forEach((track) => {
            console.log('track', track)
            // 静音
            track.enabled = false
          })
        }
        item.isBm = true
        message.success('关闭麦克风成功')
      }
    }
  })
}
onMounted(() => {
  message.success('欢迎使用DeAudio FSD语音客户端')
  test()
})
// 关闭页面事件
onUnmounted(async () => {
  if (ws.value) {
    ws.value.close()
  }
})
const deviceSelectOptions = ref([
  {
    label: '默认',
    value: 'default'
  }
])
const userList = ref<
  {
    userName: string
    streamId: string
    isBm?: boolean
  }[]
>([])
const pcList = ref<
  {
    userName: string
    pc: RTCPeerConnection
  }[]
>([])
const menuOptions = ref<MenuOption[]>([])
const createRoomData = ref({
  roomName: ''
})
const createRoom = (e: MouseEvent) => {
  e.preventDefault()
  formCreateRoomRef.value?.validate((errors) => {
    if (!errors) {
      const str = JSON.stringify({
        type: 'createRoom',
        roomName: createRoomData.value.roomName,
        userName: systemStore.$state.userData.username
      })
      ws.value?.send(str)
    }
  })
}
const menuValue = ref<string | null>('1')

const updateMenuValue = (value: string) => {
  if (value === menuValue.value) {
    return
  }
  closeRoom()
  menuValue.value = value
  roomName.value = value
  joinRoom()
}
const wsMessage = () => {
  if (ws.value === null) {
    return
  }
  ws.value.onmessage = (event: any) => {
    const str = event.data.toString()
    const json = JSON.parse(str)
    switch (json.type) {
      case 'pong':
        if (json.userName === systemStore.$state.userData.username) {
          isPong.value = true
        }
        break
      case 'conn':
        menuOptions.value = []
        isRoomOwner.value = false
        if (json.isLogin) {
          showSignModal.value = false
          json.roomList.forEach((element: any) => {
            menuOptions.value.push({
              label: element.Name,
              key: String(element.ID)
            })
          })
          if (
            !json.serverVersion ||
            Number(json.serverVersion) < serverVersion.value
          ) {
            notifi.warning({
              title: '提示',
              content: '服务器版本过低，请联系管理员更新后使用',
              duration: 3000
            })
            disconnect()
            break
          }
          if (menuOptions.value.length > 0) {
            menuValue.value = String(menuOptions.value[0].key)
            roomName.value = String(menuOptions.value[0].key)
            joinRoom()
          }
          console.log('menuOptions', menuOptions.value)
          notifi.success({
            title: '提示',
            content: '连接成功',
            duration: 3000
          })
          systemStore.$state.userData.publicIp = json.publicIp
          systemStore.$state.userData.powerId = json.powerId
          systemStore.$state.userData.serverName = json.serverName
          systemStore.$state.userData.serverDesc = json.serverDesc
        } else {
          notifi.error({
            title: '提示',
            content: '连接失败' + (json.message ? '：' + json.message : ''),
            duration: 3000
          })
          ws.value?.close()
          ws.value = null
        }
        break
      case 'room':
        if (json.isJoin) {
          isRoomOwner.value = true
          // 返回房间内所有用户
          sendRoomUser(json.roomUserList, 0)
        } else {
          closeRoom()
          notifi.error({
            title: '提示',
            content: '加入房间失败' + (json.message ? '：' + json.message : ''),
            duration: 3000
          })
        }
        break
      case 'signalOffer':
        // 收到信令Offer
        signalOffer(json)
        break
      case 'signalAnswer':
        // 收到信令Answer
        signalAnswer(json)
        break
      case 'iceOffer':
        // 收到iceOffer
        addIceCandidates(json)
        break
      case 'close':
        // 收到房间内用户离开
        closeRoomUser(json)
        break
      case 'createRoom':
        // 创建房间
        if (json.isCreate) {
          menuOptions.value = []
          json.roomList.forEach((element: any) => {
            menuOptions.value.push({
              label: element.Name,
              key: String(element.ID)
            })
          })
          if (json.userName === systemStore.$state.userData.username) {
            notifi.success({
              title: '提示',
              content: '创建房间成功',
              duration: 3000
            })
            createRoomData.value.roomName = ''
            showCreateRoomModal.value = false
          }
        } else {
          notifi.error({
            title: '提示',
            content: '创建房间失败' + (json.message ? '：' + json.message : ''),
            duration: 3000
          })
        }
        break
      case 'deleteRoom':
        // 删除房间
        if (json.isDelete) {
          menuOptions.value = []
          json.roomList.forEach((element: any) => {
            menuOptions.value.push({
              label: element.Name,
              key: String(element.ID)
            })
          })
          if (json.userName === systemStore.$state.userData.username) {
            notifi.success({
              title: '提示',
              content: '删除房间成功',
              duration: 3000
            })
          }
        } else {
          notifi.error({
            title: '提示',
            content: '删除房间失败' + (json.message ? '：' + json.message : ''),
            duration: 3000
          })
        }
        break
      default:
        break
    }
  }
}
const joinRoom = () => {
  const audioDevice =
    deviceSelectValue.value !== 'default'
      ? {
          deviceId:
            deviceSelectValue.value === 'default'
              ? undefined
              : deviceSelectValue.value
        }
      : true
  const medias = navigator.mediaDevices.getUserMedia({
    audio: audioDevice,
    video: false
  })
  medias.then((stream) => {
    localStream = stream
    addUserItem(systemStore.$state.userData.username, stream.id, stream)
    const str = JSON.stringify({
      type: 'room',
      roomName: roomName.value,
      streamId: stream.id
    })
    ws.value?.send(str)
    isRoomOwner.value = true
  })
}
const joinLine = async () => {
  formRef.value?.validate((errors) => {
    if (!errors) {
      // creatWebSocket(signData.value.url)
      // 获取域名头协议
      const protocol =
        window.location.protocol === 'https:' ? 'wss://' : 'ws://'
      ws.value = new WebSocket(protocol + systemStore.$state.userData.url)
      ws.value.onopen = () => {
        const str = JSON.stringify({
          type: 'conn',
          userName: systemStore.$state.userData.username,
          password: systemStore.$state.userData.password
        })
        ws.value?.send(str)
        wsMessage()
        heartCheck()
      }

      ws.value.onerror = () => {
        notifi.error({
          title: '提示',
          content: '连接失败',
          duration: 3000
        })
        userList.value = []
        pcList.value = []
        ws.value?.close()
        ws.value = null
        localStream = null
        localPc.value = null
      }
    }
  })
}
const heartCheckTimeOut = 5000 // 心跳检测间隔
const heartCheckServerTimeOut = 10000 // 服务器超时时间
let heartCheckTimeOutId: any = null
let heartCheckServerTimeOutId: any = null
// 心跳检测
const heartCheck = () => {
  heartCheckTimeOutId = setTimeout(() => {
    if (ws.value?.readyState === 1) {
      const str = JSON.stringify({
        type: 'ping',
        userName: systemStore.$state.userData.username
      })
      ws.value?.send(str)
      heartCheckServerTimeOutId = setTimeout(() => {
        if (isPong.value === false) {
          disconnect()
          message.error('服务器连接超时')
        } else {
          isPong.value = false
        }
      }, heartCheckServerTimeOut)
    }
    heartCheck()
  }, heartCheckTimeOut)
}
const closeRoom = () => {
  const str = JSON.stringify({
    type: 'close'
  })
  ws.value?.send(str)
  const videoContainer: any = document.getElementById('video-container')
  if (localStream) {
    localStream.getTracks().forEach((track) => track.stop())
    localStream = null
  }
  pcList.value.forEach((element) => {
    element.pc.close()
  })
  pcList.value = []
  userList.value = []
  isRoomOwner.value = false
  videoContainer.innerHTML = ''
}
const addUserItem = (
  userName: string,
  mediaStreamId: string,
  src: MediaProvider | null = null
) => {
  const audio = document.createElement('audio')
  audio.id = mediaStreamId
  audio.className = 'video-play hide'
  audio.controls = false
  audio.autoplay = true
  audio.muted = userName === systemStore.$state.userData.username ? true : false

  src && (audio.srcObject = src)
  audio.onloadedmetadata = () => audio.play()
  userList.value.push({
    userName,
    streamId: mediaStreamId
  })
  // div.appendChild(video)
  videoContainerRef.value.appendChild(audio)
}
// 接收 Offer 请求信令
function signalOffer(json: any) {
  const { offer, sourceName, streamId } = json
  addUserItem(sourceName, streamId)
  localPc.value = createWebRTC(sourceName)
  localPc.value.setRemoteDescription(new RTCSessionDescription(offer)) // 设置远端描述
  // 创建 Answer 请求
  localPc.value.createAnswer().then(function (answer) {
    localPc.value?.setLocalDescription(answer) // 设置本地 Answer 描述
    const str = JSON.stringify({
      type: 'signalAnswer',
      answer,
      userName: sourceName
    })
    ws.value?.send(str) // 发送 Answer 请求信令
  })

  localPc.value.ontrack = (event: any) => {
    const dd = document.getElementById(event.streams[0].id) as HTMLVideoElement
    dd.srcObject = event.streams[0] // 播放远端视频流
  }

  // 监听 ice
  localPc.value.addEventListener('icecandidate', function (event) {
    const iceCandidate = event.candidate
    if (iceCandidate) {
      // 发送 iceOffer 请求
      const str = JSON.stringify({
        type: 'iceOffer',
        iceCandidate,
        userName: sourceName
      })
      ws.value?.send(str)
    }
  })
}

const getSb = () => {
  navigator.mediaDevices
    .enumerateDevices()
    .then((devices) => {
      console.log('devices', devices)
      const list: MediaDeviceInfo[] = []
      const listOptions: any[] = []
      devices.forEach((device) => {
        if (device.kind === 'audioinput') {
          list.push(device)
          listOptions.push({
            label: device.label,
            value: device.deviceId
          })
        }
      })
      deviceList.value = list
      deviceSelectOptions.value = listOptions
      if (list.length > 0) {
        deviceSelectValue.value = list[0].deviceId
      }
      console.log('deviceList', list)
    })
    .catch((err) => {
      message.error('获取设备失败' + err.message)
    })
}

// 接收 Answer 请求信令
function signalAnswer(json: any) {
  const { answer, sourceName, streamId } = json
  addUserItem(sourceName, streamId)
  const item = pcList.value.find((i) => i.userName === sourceName)
  if (item) {
    const { pc } = item
    pc.setRemoteDescription(new RTCSessionDescription(answer)) // 设置远端描述

    pc.ontrack = (event) => {
      console.log('event2')
      const dd: any = document.getElementById(event.streams[0].id)
      dd.srcObject = event.streams[0] // 播放远端视频流
    }
  }
}

// 接收ice并添加
function addIceCandidates(json: any) {
  console.log('接收ice并添加', json)
  const { iceCandidate, sourceName } = json
  const item = pcList.value.find((i) => i.userName === sourceName)
  console.log('接收ice并添加item', item)

  if (item) {
    const { pc } = item
    pc.addIceCandidate(new RTCIceCandidate(iceCandidate))
  }
}
const bm = (userCall: string, isBm: boolean) => {
  userList.value.forEach((item) => {
    if (item.userName === userCall) {
      const audio = document.getElementById(
        String(item.streamId)
      ) as HTMLAudioElement
      audio.muted = isBm
      item.isBm = isBm
      message.success(isBm ? '静音成功' : '取消静音成功')
    }
  })
}
// 房间内用户离开
function closeRoomUser(json: any) {
  const { sourceName, streamId } = json
  const index = pcList.value.findIndex((i) => i.userName === sourceName)
  if (index > -1) {
    pcList.value.splice(index, 1)
  }
  userList.value = userList.value.filter((i) => i.streamId !== streamId)
  removeUserItem(streamId)
}
function removeUserItem(streamId: string) {
  videoContainerRef.value.removeChild(
    document.getElementById(streamId) as HTMLVideoElement
  )
  userList.value = userList.value.filter((i) => i.streamId !== streamId)
}

const offerOptions = {
  offerToReceiveVideo: false,
  offerToReceiveAudio: true
}
const createWebRTC = (userName: string, isOffer: boolean = false) => {
  var config = {
    iceServers: [
      {
        urls: ['stun:' + systemStore.$state.userData.publicIp + ':9765']
      },
      {
        urls: ['turn:' + systemStore.$state.userData.publicIp + ':9765'],
        username: 'deteam',
        credential: 'hhuiopasbdhasbd'
      }
    ]
  }
  const pc = new RTCPeerConnection(config)
  pcList.value.push({ userName, pc })
  localStream
    ?.getTracks()
    .forEach((track) => pc.addTrack(track, localStream as MediaStream))
  if (isOffer) {
    pc.createOffer(offerOptions).then(function (offer) {
      pc.setLocalDescription(offer) // 设置本地 Offer 描述，（设置描述之后会触发ice事件）
      const str = JSON.stringify({ type: 'signalOffer', offer, userName })
      ws.value?.send(str) // 发送 Offer 请求信令
    })
    // 监听 ice
    pc.addEventListener('icecandidate', function (event) {
      const iceCandidate = event.candidate
      if (iceCandidate) {
        // 发送 iceOffer 请求
        const str = JSON.stringify({
          type: 'iceOffer',
          iceCandidate,
          userName
        })
        ws.value?.send(str)
      }
    })
  }
  return pc
}
// 为每个房间用户创建RTCPeerConnection
function sendRoomUser(list: string | any[], index: number) {
  createWebRTC(list[index], true)
  index++
  if (list.length > index) {
    sendRoomUser(list, index)
  }
}

// 断开连接
const disconnect = () => {
  if (localStream) {
    localStream.getTracks().forEach((track) => track.stop())
    localStream = null
  }
  pcList.value.forEach((element) => {
    element.pc.close()
  })
  pcList.value = []
  userList.value = []
  videoContainerRef.value.innerHTML = ''
  isRoomOwner.value = false
  systemStore.$state.userData.powerId = '0'
  systemStore.$state.userData.publicIp = ''
  systemStore.$state.userData.serverName = ''
  systemStore.$state.userData.serverDesc = ''
  heartCheckServerTimeOutId && clearTimeout(heartCheckServerTimeOutId)
  heartCheckTimeOutId && clearTimeout(heartCheckTimeOutId)
  ws.value?.close()
  ws.value = null
  menuOptions.value = []
}

const test = async () => {
  // 判断是否给予声音权限
  await navigator.mediaDevices
    .getUserMedia({ audio: true, video: false })
    .then(() => {
      getSb()
    })
    .catch(() => {
      message.error('请允许麦克风权限')
    })
}
</script>

<style scoped>
.video-container {
  display: flex;
  justify-content: center;
}
.video-item {
  width: 400px;
  margin-right: 10px;
}

.video-play {
  width: 0;
  height: 0;
}
</style>
