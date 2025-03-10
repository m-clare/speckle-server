<!-- eslint-disable vuejs-accessibility/no-autofocus -->
<template>
  <div
    v-if="modelValue.isVisible"
    class="absolute pointer-events-auto"
    :style="{
      ...modelValue.style,
      opacity: 1
    }"
  >
    <div class="relative">
      <button
        v-tippy="!modelValue.isExpanded ? 'New Comment' : 'Close'"
        :class="`bg-foundation-2 ${
          modelValue.isExpanded ? 'outline outline-2 outline-primary' : ''
        } rounded-tr-full rounded-tl-full rounded-br-full w-8 h-8 -top-10 absolute flex justify-center items-center hover:shadow-md`"
        @click="onThreadClick"
      >
        <PlusIcon
          :class="`w-5 h-5 text-primary ${
            modelValue.isExpanded ? 'rotate-45' : ''
          } transition`"
        />
      </button>
      <div
        v-if="modelValue.isExpanded"
        ref="threadContainer"
        class="absolute hover:bg-foundation transition bg-white/80 dark:bg-neutral-800/90 dark:hover:bg-neutral-800 backdrop-blur-sm rounded-lg shadow-md"
      >
        <div class="relative">
          <ViewerCommentsEditor
            ref="editor"
            v-model="commentValue"
            prompt="Press enter to comment"
            max-height="300px"
            autofocus
            @submit="() => onSubmit()"
            @update:model-value="onInputUpdated"
          />
          <div class="w-full flex justify-end p-2 space-x-2">
            <div class="space-x-2">
              <FormButton
                v-tippy="'Attach'"
                :icon-left="PaperClipIcon"
                hide-text
                text
                @click="editor?.openFilePicker"
              />

              <FormButton
                :icon-left="PaperAirplaneIcon"
                hide-text
                @click="() => onSubmit()"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { PlusIcon, PaperAirplaneIcon, PaperClipIcon } from '@heroicons/vue/24/solid'
import { Nullable } from '@speckle/shared'
import { onKeyDown } from '@vueuse/core'
import {
  useIsTypingUpdateEmitter,
  ViewerNewThreadBubbleModel
} from '~~/lib/viewer/composables/commentBubbles'
import {
  CommentEditorValue,
  useSubmitComment
} from '~~/lib/viewer/composables/commentManagement'
import {
  isValidCommentContentInput,
  convertCommentEditorValueToInput
} from '~~/lib/viewer/helpers/comments'
import { useInjectedViewerInterfaceState } from '~~/lib/viewer/composables/setup'

const emit = defineEmits<{
  (e: 'update:modelValue', v: ViewerNewThreadBubbleModel): void
  (e: 'close'): void
}>()

const props = defineProps<{
  modelValue: ViewerNewThreadBubbleModel
}>()

const ui = useInjectedViewerInterfaceState()
const { onInputUpdated, updateIsTyping } = useIsTypingUpdateEmitter()

const editor = ref(null as Nullable<{ openFilePicker: () => void }>)
const commentValue = ref(<CommentEditorValue>{ doc: undefined, attachments: undefined })
const threadContainer = ref(null as Nullable<HTMLElement>)

// const { style } = useExpandedThreadResponsiveLocation({
//   threadContainer,
//   width: 320
// })
const createThread = useSubmitComment()

const onThreadClick = () => {
  const newIsExpanded = !props.modelValue.isExpanded
  if (!newIsExpanded) {
    updateIsTyping(false)
  }
  emit('update:modelValue', {
    ...props.modelValue,
    isExpanded: newIsExpanded
  })
}

// NOTE: will be used later, keep
// const submitEmoji = (emoji: string) =>
//   onSubmit({ doc: RichTextEditor.convertBasicStringToDocument(emoji) })

const onSubmit = (comment?: CommentEditorValue) => {
  comment ||= comment || commentValue.value
  if (!comment?.doc) return

  const content = convertCommentEditorValueToInput(commentValue.value)
  if (!isValidCommentContentInput(content)) return

  // Intentionally not awaiting so that we emit close immediately
  // createThread(content, props.modelValue.clickLocation)
  createThread(content)
  updateIsTyping(false)

  // Marking all uploads as in use to prevent cleanup
  comment.attachments?.forEach((a) => {
    a.inUse = true
  })

  emit('close')
}

onKeyDown('Escape', () => {
  if (props.modelValue.isExpanded) {
    onThreadClick()
  }
})

watch(
  () => props.modelValue.isExpanded,
  (newVal) => {
    if (newVal) {
      ui.threads.closeAllThreads()
    }
    commentValue.value = {
      doc: undefined,
      attachments: undefined
    }
  }
)
</script>
