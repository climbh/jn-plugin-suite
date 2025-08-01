# Select 组件

一个功能完整的下拉选择器组件，支持搜索、清除、键盘操作等功能，样式接近原生。

## 特性

- ✅ 支持搜索过滤
- ✅ 支持清除选择
- ✅ 支持键盘操作（Enter、Escape、空格）
- ✅ 支持禁用状态
- ✅ 支持不同尺寸
- ✅ 支持滚动列表
- ✅ 样式接近原生
- ✅ 完全类型安全

## 基础用法

```vue
<script setup lang="ts">
import { ref } from 'vue'
import Select from './Select.vue'

interface SelectOption {
  label: string
  value: string | number
  disabled?: boolean
}

const selectedValue = ref<string>('')

const options: SelectOption[] = [
  { label: '选项 1', value: 'option1' },
  { label: '选项 2', value: 'option2' },
  { label: '选项 3', value: 'option3' },
]

function handleChange(value: string | number, option: SelectOption) {
  console.log('选择变化:', value, option)
}
</script>

<template>
  <Select
    v-model="selectedValue"
    :options="options"
    placeholder="请选择一个选项"
    @change="handleChange"
  />
</template>
```

## 可搜索用法

```vue
<template>
  <Select
    v-model="selectedValue"
    :options="options"
    :searchable="true"
    placeholder="请搜索并选择一个选项"
  />
</template>
```

## 可清除用法

```vue
<script setup>
function handleClear() {
  console.log('清除选择')
}
</script>

<template>
  <Select
    v-model="selectedValue"
    :options="options"
    :clearable="true"
    @clear="handleClear"
  />
</template>
```

## 不同尺寸

```vue
<template>
  <!-- 小尺寸 -->
  <Select :options="options" size="small" />

  <!-- 默认尺寸 -->
  <Select :options="options" />

  <!-- 大尺寸 -->
  <Select :options="options" size="large" />
</template>
```

## 禁用状态

```vue
<template>
  <Select :options="options" :disabled="true" />
</template>
```

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| modelValue | `string \| number` | - | 绑定值 |
| options | `SelectOption[]` | `[]` | 选项列表 |
| placeholder | `string` | `'请选择'` | 占位符文本 |
| disabled | `boolean` | `false` | 是否禁用 |
| clearable | `boolean` | `false` | 是否可清除 |
| searchable | `boolean` | `false` | 是否可搜索 |
| size | `'small' \| 'medium' \| 'large'` | `'medium'` | 尺寸大小 |

## Events

| 事件名 | 参数 | 说明 |
|--------|------|------|
| update:modelValue | `(value: string \| number)` | 值变化时触发 |
| change | `(value: string \| number, option: SelectOption)` | 选择变化时触发 |
| clear | - | 清除选择时触发 |

## 类型定义

```typescript
interface SelectOption {
  label: string // 显示文本
  value: string | number // 选项值
  disabled?: boolean // 是否禁用
}
```

## 键盘操作

- `Enter` / `空格`: 打开/关闭下拉框
- `Escape`: 关闭下拉框
- `Enter`: 选择第一个可用选项（在下拉框打开时）

## 样式定制

组件使用 CSS 变量，可以通过以下方式定制样式：

```css
.select-container {
  --select-border-color: #d9d9d9;
  --select-hover-border-color: #40a9ff;
  --select-focus-border-color: #1890ff;
  --select-focus-shadow-color: rgba(24, 144, 255, 0.2);
}
```

## 注意事项

1. 组件依赖 `@iconify/vue` 图标库
2. 搜索功能支持中文和英文
3. 选项列表最大高度为 200px，超出部分可滚动
4. 组件会自动处理外部点击关闭下拉框
5. 支持无障碍访问（ARIA 属性）
