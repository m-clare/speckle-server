<template>
  <div>
    <div
      class="absolute z-20 flex h-screen flex-col space-y-2 bg-green-300/0 px-2 pt-[4.2rem]"
    >
      <ViewerControlsButtonToggle
        v-tippy="modelsShortcut"
        :active="activeControl === 'models'"
        @click="toggleActiveControl('models')"
      >
        <CubeIcon class="h-5 w-5" />
      </ViewerControlsButtonToggle>
      <ViewerControlsButtonToggle
        v-tippy="explorerShortcut"
        :active="activeControl === 'explorer'"
        @click="toggleActiveControl('explorer')"
      >
        <IconFileExplorer class="h-5 w-5" />
      </ViewerControlsButtonToggle>

      <!-- TODO -->
      <!-- <ViewerControlsButtonToggle
        :active="activeControl === 'filters'"
        @click="toggleActiveControl('filters')"
      >
        <FunnelIcon class="w-5 h-5" />
      </ViewerControlsButtonToggle> -->

      <!-- Comment threads -->
      <ViewerControlsButtonToggle
        v-tippy="discussionsShortcut"
        :active="activeControl === 'discussions'"
        @click="toggleActiveControl('discussions')"
      >
        <ChatBubbleLeftRightIcon class="h-5 w-5" />
      </ViewerControlsButtonToggle>

      <!-- TODO: direct add comment -->
      <!-- <ViewerCommentsDirectAddComment v-show="activeControl === 'comments'" /> -->

      <!-- Standard viewer controls -->
      <ViewerControlsButtonGroup>
        <!-- Zoom extents -->
        <ViewerControlsButtonToggle
          v-tippy="zoomExtentsShortcut"
          flat
          @click="zoomExtentsOrSelection()"
        >
          <ArrowsPointingOutIcon class="h-5 w-5" />
        </ViewerControlsButtonToggle>

        <!-- Projection type -->
        <!-- TODO (Question for fabs): How to persist state between page navigation? e.g., swap to iso mode, move out, move back, iso mode is still on in viewer but not in ui -->
        <ViewerControlsButtonToggle
          v-tippy="projectionShortcut"
          flat
          secondary
          :active="isOrthoProjection"
          @click="toggleProjection()"
        >
          <IconPerspective v-if="isOrthoProjection" class="h-4 w-4" />
          <IconPerspectiveMore v-else class="h-4 w-4" />
        </ViewerControlsButtonToggle>

        <!-- Section Box -->
        <ViewerControlsButtonToggle
          v-tippy="sectionBoxShortcut"
          flat
          secondary
          :active="isSectionBoxEnabled"
          @click="toggleSectionBox()"
        >
          <ScissorsIcon class="h-5 w-5" />
        </ViewerControlsButtonToggle>

        <!-- Sun and lights -->
        <ViewerSunMenu v-tippy="'Light Controls'" />

        <!-- Explosion -->
        <ViewerExplodeMenu v-tippy="'Explode'" />

        <!-- Views -->
        <ViewerViewsMenu v-tippy="'Views'" />

        <!-- Settings -->
        <ViewerSettingsMenu />
      </ViewerControlsButtonGroup>
    </div>
    <div
      ref="scrollableControlsContainer"
      :class="`simple-scrollbar absolute z-10 mx-14 mt-[4rem] mb-4 max-h-[calc(100vh-5.5rem)] w-72 overflow-y-auto px-[2px] py-[2px] transition ${
        activeControl !== 'none'
          ? 'translate-x-0 opacity-100'
          : '-translate-x-[100%] opacity-0'
      }`"
    >
      <div v-show="activeControl === 'models'">
        <KeepAlive>
          <ViewerResourcesList
            class="pointer-events-auto"
            @loaded-more="scrollControlsToBottom"
            @close="activeControl = 'none'"
          />
        </KeepAlive>
      </div>
      <div v-show="activeControl === 'explorer'">
        <KeepAlive>
          <ViewerExplorer class="pointer-events-auto" @close="activeControl = 'none'" />
        </KeepAlive>
      </div>
      <ViewerComments
        v-if="activeControl === 'discussions'"
        class="pointer-events-auto"
        @close="activeControl = 'none'"
      />
      <ViewerFilters v-if="activeControl === 'filters'" class="pointer-events-auto" />
    </div>
  </div>
</template>
<script setup lang="ts">
import {
  CubeIcon,
  ChatBubbleLeftRightIcon,
  ArrowsPointingOutIcon,
  ScissorsIcon
} from '@heroicons/vue/24/outline'
import { Nullable } from '@speckle/shared'
import {
  useCameraUtilities,
  useSectionBoxUtilities
} from '~~/lib/viewer/composables/ui'
import {
  onKeyboardShortcut,
  ModifierKeys,
  getKeyboardShortcutTitle
} from '@speckle/ui-components'

const {
  zoomExtentsOrSelection,
  toggleProjection,
  camera: { isOrthoProjection }
} = useCameraUtilities()
const { toggleSectionBox, isSectionBoxEnabled } = useSectionBoxUtilities()

type ActiveControl = 'none' | 'models' | 'explorer' | 'filters' | 'discussions'

const activeControl = ref<ActiveControl>('models')
const scrollableControlsContainer = ref(null as Nullable<HTMLDivElement>)

const modelsShortcut = ref(
  `Models (${getKeyboardShortcutTitle([ModifierKeys.AltOrOpt, 'm'])})`
)
const explorerShortcut = ref(
  `Scene Explorer (${getKeyboardShortcutTitle([ModifierKeys.AltOrOpt, 'e'])})`
)
const discussionsShortcut = ref(
  `Discussions (${getKeyboardShortcutTitle([ModifierKeys.AltOrOpt, 't'])})`
)
const zoomExtentsShortcut = ref(
  `Zoom Extents (${getKeyboardShortcutTitle([ModifierKeys.AltOrOpt, 'Space'])})`
)
const projectionShortcut = ref(
  `Projection (${getKeyboardShortcutTitle([ModifierKeys.AltOrOpt, 'p'])})`
)
const sectionBoxShortcut = ref(
  `Section Box (${getKeyboardShortcutTitle([ModifierKeys.AltOrOpt, 'b'])})`
)

const toggleActiveControl = (control: ActiveControl) =>
  activeControl.value === control
    ? (activeControl.value = 'none')
    : (activeControl.value = control)

onKeyboardShortcut([ModifierKeys.AltOrOpt], 'm', () => {
  toggleActiveControl('models')
})
onKeyboardShortcut([ModifierKeys.AltOrOpt], 'e', () => {
  toggleActiveControl('explorer')
})
onKeyboardShortcut([ModifierKeys.AltOrOpt], 'f', () => {
  toggleActiveControl('filters')
})
onKeyboardShortcut([ModifierKeys.AltOrOpt], ['t'], () => {
  toggleActiveControl('discussions')
})

// Viewer actions kbd shortcuts
onKeyboardShortcut([ModifierKeys.AltOrOpt], ' ', () => {
  zoomExtentsOrSelection()
})
onKeyboardShortcut([ModifierKeys.AltOrOpt], 'p', () => {
  toggleProjection()
})
onKeyboardShortcut([ModifierKeys.AltOrOpt], 'b', () => {
  toggleSectionBox()
})

const scrollControlsToBottom = () => {
  // TODO: Currently this will scroll to the very bottom, which doesn't make sense when there are multiple models loaded
  // if (scrollableControlsContainer.value)
  //   scrollToBottom(scrollableControlsContainer.value)
}
</script>
