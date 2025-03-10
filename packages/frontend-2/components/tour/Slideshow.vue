<template>
  <div
    ref="parentEl"
    class="fixed z-30 left-0 top-0 w-screen h-screen pointer-events-none overflow-hidden"
  >
    <!--     
      Tour Slideshow 
    -->
    <TourComment
      v-for="(item, index) in slideshowItems.slice(0, tourItems.length)"
      :key="index"
      :item="item"
      :index="index"
      class="absolute"
      :style="{ ...item.style }"
      :show-controls="item.showControls"
      @skip="finishSlideshow()"
    >
      <Component :is="tourItems[index]" />
    </TourComment>
    <!-- In case the bubble is closed by the user, we need to display something -->
    <Transition
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
      enter-active-class="transition duration-300"
      leave-active-class="transition duration-300"
    >
      <div
        v-show="!hasOpenComments"
        class="fixed bottom-0 left-0 w-full h-28 flex align-center p-10 items-center justify-center space-x-2 pointer-events-auto"
      >
        <FormButton size="xs" color="invert" rounded @click="finishSlideshow()">
          Skip
        </FormButton>
        <FormButton
          size="xl"
          :icon-right="ArrowRightIcon"
          rounded
          class="shadow-md"
          @click="resumeSlideshow()"
        >
          Resume Tour
        </FormButton>
      </div>
    </Transition>
  </div>
</template>
<script setup lang="ts">
// Disclaimer, not the cleanest code.
import { Nullable } from '@speckle/shared'
import { Vector3 } from 'three'
import { items as slideshowItemsRaw } from '~~/lib/tour/slideshowItems'
import { ArrowRightIcon } from '@heroicons/vue/24/solid'
import { useViewerAnchoredPoints } from '~~/lib/viewer/composables/anchorPoints'

// Slideshow component imports
import FirstTip from '~~/components/tour/content/FirstTip.vue'
import BasicViewerNavigation from '~~/components/tour/content/BasicViewerNavigation.vue'
import OverlayModel from '~~/components/tour/content/OverlayModel.vue'
import { useCameraUtilities } from '~~/lib/viewer/composables/ui'

const emit = defineEmits(['next'])

const tourStage = useTourStageState()
const { zoom, setView } = useCameraUtilities()

// Drives the amount of slideshow items
const tourItems = [FirstTip, BasicViewerNavigation, OverlayModel /* , LastTip */]

// Ensuring we don't have more 3d points than actual tips by slicing the array
// TODO: should check the other way around, but since this part is so handcrafted
// doesn't make much sense.
const slideshowItems = ref(slideshowItemsRaw.slice(0, tourItems.length))
provide('slideshowItems', slideshowItems)

const lastOpenIndex = ref(0)
const next = (currentIndex: number) => {
  if (currentIndex + 1 >= slideshowItems.value.length) {
    finishSlideshow()
    return
  }
  slideshowItems.value[currentIndex].expanded = false
  slideshowItems.value[currentIndex].viewed = true
  slideshowItems.value[currentIndex + 1].expanded = true
  lastOpenIndex.value = currentIndex + 1
}
const prev = (currentIndex: number) => {
  if (currentIndex - 1 < 0) return
  slideshowItems.value[currentIndex].expanded = false
  slideshowItems.value[currentIndex - 1].expanded = true
  lastOpenIndex.value = currentIndex - 1
}
const toggle = (index: number) => {
  if (!slideshowItems.value[index]) return
  slideshowItems.value[index].expanded = !slideshowItems.value[index].expanded
  if (slideshowItems.value[index].expanded) lastOpenIndex.value = index
}

provide('slideshowActions', { next, prev, toggle })

const hasOpenComments = computed(() => {
  return slideshowItems.value.some((item) => item.expanded === true)
})

const parentEl = ref(null as Nullable<HTMLElement>)
useViewerAnchoredPoints({
  parentEl,
  points: slideshowItems,
  pointLocationGetter: (c) => c.location as Vector3,
  updatePositionCallback: (c, res) => {
    c.style = {
      ...c.style,
      ...res.style,
      display: 'inline-block',
      transition: 'all 0.1s ease'
    }
  }
})

const finishSlideshow = () => {
  zoom()
  setView('left')
  tourStage.value.showNavbar = true
  tourStage.value.showViewerControls = true
  emit('next')
}

const resumeSlideshow = () => {
  slideshowItems.value[lastOpenIndex.value].expanded = true
}
</script>
