import { onBeforeUnmount, onMounted, ref } from "vue"

export function useEventListener() {

    const isFocusEvent = ref(false)


    function onFocus() {
        isFocusEvent.value = true
    }

    function onBlur() {
        isFocusEvent.value = false
    }

    onMounted(() => {
        window.addEventListener('focus', onFocus, true)
        window.addEventListener('blur', onBlur, true)
    })

    onBeforeUnmount(() => {
        window.removeEventListener('focus', onFocus)
        window.removeEventListener('blur', onBlur)
    })

    return {
        isFocusEvent,
    }
}