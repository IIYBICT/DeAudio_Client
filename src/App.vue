<script setup lang="ts">
import Home from './views/Home.vue'
import { zhCN, dateZhCN, GlobalThemeOverrides, NConfigProvider } from 'naive-ui'
const themeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#329ea3',
    primaryColorHover: '#329ea3a0',
    primaryColorPressed: '#329ea3a0',
    borderRadius: '12px'
  },
  Dialog: {
    borderRadius: '12px'
  }
}
</script>

<template>
  <n-config-provider
    :locale="zhCN"
    :theme-overrides="themeOverrides"
    :date-locale="dateZhCN"
  >
    <n-message-provider>
      <n-dialog-provider>
        <n-notification-provider>
          <Home />
        </n-notification-provider>
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<style scoped></style>
