<script lang="ts" setup>
import { Icon } from '@iconify/vue'
import { computed, defineEmits, defineProps, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

interface SelectOption {
  label: string
  value: string | number
  disabled?: boolean
}

const props = defineProps<{
  value?: string | number
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  clearable?: boolean
  searchable?: boolean
  size?: 'small' | 'medium' | 'large'
  fontFamily?: boolean
}>()

const emit = defineEmits<{
  change: [value: string | number, option: SelectOption]
  clear: []
}>()

// 响应式数据
const isOpen = ref(false)
const searchValue = ref('')
const selectedOption = ref<SelectOption | null>(null)
const dropdownRef = ref<HTMLDivElement>()
const inputRef = ref<HTMLInputElement>()

// 计算属性
const filteredOptions = computed(() => {
  if (!props.searchable || !searchValue.value) {
    return props.options
  }
  return props.options.filter(option =>
    option.label.toLowerCase().includes(searchValue.value.toLowerCase()),
  )
})

const displayValue = computed(() => {
  if (selectedOption.value) {
    return selectedOption.value.label
  }
  return ''
})

const sizeClass = computed(() => {
  return `select--${props.size || 'medium'}`
})

function fontFamilyClass(val: string | number) {
  if (!props.fontFamily)
    return
  return {
    'font-family': String(val),
  }
}

// 方法
function toggleDropdown() {
  if (props.disabled)
    return
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    nextTick(() => {
      inputRef.value?.focus()
    })
  }
  else {
    searchValue.value = ''
  }
}

function selectOption(option: SelectOption) {
  if (option.disabled)
    return

  selectedOption.value = option
  emit('change', option.value, option)
  isOpen.value = false
  searchValue.value = ''
}

function clearSelection() {
  selectedOption.value = null
  emit('clear')
}

function handleInputFocus() {
  if (props.searchable && isOpen.value) {
    inputRef.value?.select()
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (!isOpen.value) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      toggleDropdown()
    }
    return
  }

  switch (event.key) {
    case 'Escape':
      isOpen.value = false
      searchValue.value = ''
      break
    case 'Enter': {
      event.preventDefault()
      const firstOption = filteredOptions.value.find(option => !option.disabled)
      if (firstOption) {
        selectOption(firstOption)
      }
      break
    }
  }
}

// 监听外部点击关闭下拉框
function handleClickOutside(event: Event) {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isOpen.value = false
    searchValue.value = ''
  }
}

// 监听 value 变化
watch(() => props.value, (newValue) => {
  if (newValue !== undefined && newValue !== '') {
    const option = props.options.find(opt => opt.value === newValue)
    selectedOption.value = option || null
  }
  else {
    selectedOption.value = null
  }
}, { immediate: true })

// 生命周期
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div
    ref="dropdownRef"
    class="select-container"
    :class="[sizeClass, { 'select--disabled': disabled }]"
  >
    <div
      class="select-trigger"
      :class="{ 'select-trigger--open': isOpen }"
      tabindex="0"
      role="combobox"
      :aria-expanded="isOpen"
      :aria-haspopup="true"
      @click="toggleDropdown"
      @keydown="handleKeydown"
    >
      <div class="select-value">
        <span v-if="displayValue" class="select-value-text">
          {{ displayValue }}
        </span>
        <span v-else class="select-placeholder">
          {{ placeholder || '请选择' }}
        </span>
      </div>

      <div class="select-suffix">
        <Icon
          v-if="clearable && selectedOption"
          icon="material-symbols:close"
          class="select-clear"
          @click.stop="clearSelection"
        />
        <Icon
          icon="material-symbols:keyboard-arrow-down"
          class="select-arrow"
          :class="{ 'select-arrow--open': isOpen }"
        />
      </div>
    </div>

    <div
      v-if="isOpen"
      class="select-dropdown"
      :class="{ 'select-dropdown--searchable': searchable }"
    >
      <div v-if="searchable" class="select-search">
        <input
          ref="inputRef"
          v-model="searchValue"
          type="text"
          class="select-search-input"
          placeholder="搜索..."
          @focus="handleInputFocus"
        >
      </div>

      <div class="select-options">
        <div
          v-if="filteredOptions.length === 0"
          class="select-empty"
        >
          暂无数据
        </div>
        <div
          v-for="option in filteredOptions"
          :key="option.value"
          class="select-option"
          :class="{
            'select-option--selected': selectedOption?.value === option.value,
            'select-option--disabled': option.disabled,
          }"
          :style="fontFamilyClass(option.value)"
          @click="selectOption(option)"
        >
          {{ option.label }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.select-container {
  display: inline-block;
  position: relative;
  width: 100%;
  min-width: 120px;
}

.select-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;
  width: 100%;
  height: 32px;
  padding: 6px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  outline: none;
  background: #f0f0f0;
  cursor: pointer;
  transition: all 0.2s;
}

.select-trigger:hover {
  border-color: #40a9ff;
}

.select-trigger--open {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.select-trigger:focus {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.select-value {
  display: flex;
  overflow: hidden;
  align-items: center;
  flex: 1;
  height: 100%;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.select-value-text {
  color: #000000;
  font-size: 14px;
  line-height: 1;
}

.select-placeholder {
  color: #bfbfbf;
  font-size: 14px;
  line-height: 1;
}

.select-suffix {
  display: flex;
  align-items: center;
  margin-left: 8px;

  gap: 4px;
}

.select-clear {
  width: 16px;
  height: 16px;
  color: #bfbfbf;
  cursor: pointer;
  transition: color 0.2s;
}

.select-clear:hover {
  color: #666666;
}

.select-arrow {
  width: 16px;
  height: 16px;
  color: #bfbfbf;
  transition: transform 0.2s;
}

.select-arrow--open {
  transform: rotate(180deg);
}

.select-dropdown {
  position: absolute;
  z-index: 1000;
  top: 100%;
  right: 0;
  left: 0;
  margin-top: 4px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  animation: selectFadeIn 0.2s ease-out;
}

.select-search {
  display: flex;
  align-items: center;
  padding: 12px 6px;
  border-bottom: 1px solid #f0f0f0;
}

.select-search-input {
  box-sizing: border-box;
  width: 100%;
  height: 24px;
  padding: 4px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  outline: none;
  font-size: 13px;
  line-height: 1;
}

.select-search-input:focus {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.select-options {
  overflow-y: auto;
  max-height: 200px;
  padding: 4px 0;
}

.select-option {
  padding: 8px 12px;
  font-size: 14px;
  line-height: 1.4;
  cursor: pointer;
  transition: background-color 0.2s;
}

.select-option:hover {
  background-color: #f5f5f5;
}

.select-option--selected {
  color: #1890ff;
  background-color: #e6f7ff;
}

.select-option--selected:hover {
  background-color: #bae7ff;
}

.select-option--disabled {
  color: #bfbfbf;
  background-color: #fafafa;
  cursor: not-allowed;
}

.select-option--disabled:hover {
  background-color: #fafafa;
}

.select-empty {
  padding: 12px;
  color: #bfbfbf;
  font-size: 14px;
  text-align: center;
}

/* 尺寸变体 */
.select--small .select-trigger {
  height: 24px;
  padding: 4px 8px;
  font-size: 12px;
}

.select--small .select-option {
  padding: 6px 8px;
  font-size: 12px;
}

.select--large .select-trigger {
  height: 40px;
  padding: 8px 16px;
  font-size: 16px;
}

.select--large .select-option {
  padding: 12px 16px;
  font-size: 16px;
}

/* 禁用状态 */
.select--disabled .select-trigger {
  color: #bfbfbf;
  border-color: #d9d9d9;
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.select--disabled .select-trigger:hover {
  border-color: #d9d9d9;
}

/* 滚动条样式 */
.select-options::-webkit-scrollbar {
  width: 6px;
}

.select-options::-webkit-scrollbar-track {
  border-radius: 3px;
  background: #f1f1f1;
}

.select-options::-webkit-scrollbar-thumb {
  border-radius: 3px;
  background: #c1c1c1;
}

.select-options::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

@keyframes selectFadeIn {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
