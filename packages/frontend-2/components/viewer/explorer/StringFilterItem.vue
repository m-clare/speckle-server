<template>
  <div>
    <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events -->
    <div
      :class="`flex group pl-1 justify-between items-center w-full max-w-full overflow-hidden select-none space-x-2 rounded border-l-4 hover:bg-primary-muted hover:shadow-md transition-all ${
        availableTargetIds.length === 0
          ? 'text-foreground-2 cursor-auto'
          : 'text-foreground cursor-pointer'
      } ${isSelected ? 'border-primary bg-primary-muted' : 'border-transparent'}`"
      @click="setSelection()"
    >
      <div class="flex space-x-2 items-center flex-shrink truncate">
        <span
          v-if="color"
          class="w-3 h-3 rounded"
          :style="`background-color: #${color};`"
        ></span>
        <span class="truncate">
          {{ item.value.split('.').reverse()[0] || item.value || 'No Name' }}
        </span>
        <span class="text-xs text-foreground-2">({{ availableTargetIds.length }})</span>
      </div>
      <!-- 
        Note: not allowing for hiding/isolation CURRENTLY as there is a larger change needed. 
        Essentially, we need to have a two-state approach to visibility and isolation. 
        One is set by the explorer, and the other one by the filters - this would allow for us to 
        enable isolate this level, and from the remaining objects, isolate the doors only. 
        Requires a larger rework of the viewer state composable & filtering methods.

        There's v-if=false that's hiding the div below :)
      -->
      <div v-if="false" class="flex items-center flex-shrink-0">
        <button
          :class="`hover:text-primary px-1 py-2 opacity-0 transition group-hover:opacity-100 ${
            isHidden ? 'opacity-100' : ''
          }`"
          @click.stop="hideOrShowObject"
        >
          <EyeIcon v-if="!isHidden" class="h-3 w-3" />
          <EyeSlashIcon v-else class="h-3 w-3" />
        </button>
        <button
          :class="`hover:text-primary px-1 py-2 opacity-0 transition group-hover:opacity-100 ${
            isIsolated ? 'opacity-100' : ''
          }`"
          @click.stop="isolateOrUnisolateObject"
        >
          <FunnelIconOutline v-if="!isIsolated" class="h-3 w-3" />
          <FunnelIcon v-else class="h-3 w-3" />
        </button>
      </div>
    </div>
    <!-- Debugging info -->
    <!-- <div v-if="true" class="text-xs text-foreground-2">
      selected: {{ isSelected }}; isHidden {{ isHidden }}; isIsolated: {{ isIsolated }}
    </div> -->
  </div>
</template>
<script setup lang="ts">
import { EyeIcon, EyeSlashIcon, FunnelIcon } from '@heroicons/vue/24/solid'
import { FunnelIcon as FunnelIconOutline } from '@heroicons/vue/24/outline'
import { containsAll } from '~~/lib/common/helpers/utils'
import { useInjectedViewerState } from '~~/lib/viewer/composables/setup'
import { useSelectionUtilities } from '~~/lib/viewer/composables/ui'
// import { ViewerSceneExplorerStateKey } from '~~/lib/common/helpers/constants'

const props = defineProps<{
  item: {
    value: string
    ids: string[]
  }
}>()

const {
  ui: {
    filters: { isolatedObjectIds, hiddenObjectIds }
  },
  viewer: {
    metadata: { filteringState }
  }
} = useInjectedViewerState()
const { clearSelection, setSelectionFromObjectIds, objects } = useSelectionUtilities()

const isSelected = computed(() => {
  const selObjsIds = objects.value.map((o) => o.id as string)

  return selObjsIds.some((id: string) => props.item.ids.includes(id)) //containsAll(props.item.ids, selObjsIds)
})

const availableTargetIds = computed(() => {
  let targets = props.item.ids

  if (isolatedObjectIds.value.length)
    targets = props.item.ids.filter((id) => isolatedObjectIds.value.includes(id))

  if (hiddenObjectIds.value.length)
    targets = props.item.ids.filter((id) => !hiddenObjectIds.value.includes(id))
  return targets
})

const setSelection = () => {
  if (isSelected.value) return clearSelection()
  setSelectionFromObjectIds(availableTargetIds.value)
}

const isHidden = computed(() => {
  if (!hiddenObjectIds.value.length) return false
  const ids = props.item.ids
  return containsAll(ids, hiddenObjectIds.value)
})

const isIsolated = computed(() => {
  if (!isolatedObjectIds.value.length) return true
  const ids = props.item.ids
  return isolatedObjectIds.value.some((id) => ids.includes(id))
})

const color = computed(() => {
  return filteringState.value?.colorGroups?.find((gr) => gr.value === props.item.value)
    ?.color
})

const hideOrShowObject = () => {
  // const ids = props.item.ids
  // if (!isHidden.value) {
  //   // removeFromSelection(rawSpeckleData)
  //   filters.hideObjects(ids, stateKey, true)
  //   return
  // }
  // return filters.showObjects(ids, stateKey, true)
}

const isolateOrUnisolateObject = () => {
  // const ids = props.item.ids
  // if (!isIsolated.value) {
  //   filters.isolateObjects(ids, stateKey, true)
  //   return
  // }
  // return filters.unIsolateObjects(ids, stateKey, true)
}
</script>
