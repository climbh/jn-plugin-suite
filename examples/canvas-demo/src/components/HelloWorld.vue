<script lang="ts" setup>
import { inject } from 'vue'

const size = inject('size')
</script>

<template>
  <div>{{ size }}</div>
</template>

<style lang="scss" scoped></style>
