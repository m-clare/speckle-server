<template>
  <NuxtLink
    class="flex items-center justify-center rounded bg-foundation h-8 w-8 shadow cursor-pointer text-foreground"
    @click="onClick"
  >
    <Component :is="currentIcon" class="h-6 w-6" />
  </NuxtLink>
</template>
<script setup lang="ts">
import { Bars3Icon, Squares2X2Icon } from '@heroicons/vue/24/solid'
import { GridListToggleValue } from '~~/lib/layout/helpers/components'

const emit = defineEmits<{
  (e: 'click', v: MouseEvent): void
  (e: 'update:modelValue', v: GridListToggleValue): void
}>()

const props = defineProps<{
  modelValue?: GridListToggleValue
}>()

const value = computed({
  get: () => props.modelValue || GridListToggleValue.Grid,
  set: (newVal) => emit('update:modelValue', newVal)
})

const currentIcon = computed(() =>
  value.value === GridListToggleValue.Grid ? Bars3Icon : Squares2X2Icon
)

const onClick = (e: MouseEvent) => {
  emit('click', e)

  const newVal =
    value.value === GridListToggleValue.Grid
      ? GridListToggleValue.List
      : GridListToggleValue.Grid
  value.value = newVal
}
</script>
