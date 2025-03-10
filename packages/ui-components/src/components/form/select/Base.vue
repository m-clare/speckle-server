<template>
  <div>
    <Listbox
      v-model="wrappedValue"
      :name="name"
      :multiple="multiple"
      :by="by"
      :disabled="isDisabled"
      as="div"
    >
      <ListboxLabel
        class="block label text-foreground"
        :class="{ 'sr-only': !showLabel }"
      >
        {{ label }}
      </ListboxLabel>
      <div :class="buttonsWrapperClasses">
        <!-- <div class="relative flex"> -->
        <ListboxButton v-slot="{ open }" :class="buttonClasses">
          <div class="flex items-center justify-between w-full">
            <div class="block truncate grow text-left">
              <template
                v-if="!wrappedValue || (isArray(wrappedValue) && !wrappedValue.length)"
              >
                <slot name="nothing-selected">
                  {{ label }}
                </slot>
              </template>
              <template v-else>
                <slot name="something-selected" :value="wrappedValue">
                  {{ simpleDisplayText(wrappedValue) }}
                </slot>
              </template>
            </div>
            <div class="pointer-events-none shrink-0 ml-1 flex items-center">
              <ChevronUpIcon
                v-if="open"
                class="h-4 w-4 text-foreground"
                aria-hidden="true"
              />
              <ChevronDownIcon
                v-else
                class="h-4 w-4 text-foreground"
                aria-hidden="true"
              />
            </div>
          </div>
        </ListboxButton>
        <!-- </div> -->
        <!-- Clear Button -->
        <button
          v-if="renderClearButton"
          v-tippy="'Clear'"
          :class="clearButtonClasses"
          :disabled="disabled"
          @click="clearValue()"
        >
          <XMarkIcon class="w-3 h-3" />
        </button>
        <Transition
          leave-active-class="transition ease-in duration-100"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <ListboxOptions
            class="absolute top-[100%] z-10 mt-1 w-full rounded-md bg-foundation-2 py-1 label label--light outline outline-2 outline-primary-muted focus:outline-none shadow"
            @focus="searchInput?.focus()"
          >
            <label v-if="hasSearch" class="flex flex-col mx-1 mb-1">
              <span class="sr-only label text-foreground">Search</span>
              <div class="relative">
                <div
                  class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2"
                >
                  <MagnifyingGlassIcon class="h-5 w-5 text-foreground" />
                </div>
                <input
                  ref="searchInput"
                  v-model="searchValue"
                  type="text"
                  class="pl-9 w-full border-0 bg-foundation-page rounded placeholder:font-normal normal placeholder:text-foreground-2 focus:outline-none focus:ring-1 focus:border-outline-1 focus:ring-outline-1"
                  :placeholder="searchPlaceholder"
                  @keydown.stop
                />
              </div>
            </label>
            <div
              class="overflow-auto simple-scrollbar"
              :class="[hasSearch ? 'max-h-52' : 'max-h-60']"
            >
              <div v-if="isAsyncSearchMode && isAsyncLoading" class="px-1">
                <CommonLoadingBar :loading="true" />
              </div>
              <div v-else-if="isAsyncSearchMode && !currentItems.length">
                <slot name="nothing-found">
                  <div class="text-foreground-2 text-center">Nothing found 🤷‍♂️</div>
                </slot>
              </div>
              <template v-if="!isAsyncSearchMode || !isAsyncLoading">
                <ListboxOption
                  v-for="item in finalItems"
                  :key="itemKey(item)"
                  v-slot="{ active, selected }: { active: boolean, selected: boolean }"
                  :value="item"
                >
                  <li
                    :class="[
                      active ? 'text-primary' : 'text-foreground',
                      'relative transition cursor-pointer select-none py-1.5 pl-3',
                      !hideCheckmarks ? 'pr-9' : ''
                    ]"
                  >
                    <span :class="['block truncate']">
                      <slot
                        name="option"
                        :item="item"
                        :active="active"
                        :selected="selected"
                      >
                        {{ simpleDisplayText(item) }}
                      </slot>
                    </span>

                    <span
                      v-if="!hideCheckmarks && selected"
                      :class="[
                        active ? 'text-primary' : 'text-foreground',
                        'absolute inset-y-0 right-0 flex items-center pr-4'
                      ]"
                    >
                      <CheckIcon class="h-5 w-5" aria-hidden="true" />
                    </span>
                  </li>
                </ListboxOption>
              </template>
            </div>
          </ListboxOptions>
        </Transition>
      </div>
    </Listbox>
    <p
      v-if="helpTipId"
      :id="helpTipId"
      class="mt-2 ml-3 text-sm"
      :class="helpTipClasses"
    >
      {{ helpTip }}
    </p>
  </div>
</template>
<script setup lang="ts">
// Vue components don't support generic props, so having to rely on any
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  ListboxLabel
} from '@headlessui/vue'
import {
  ChevronDownIcon,
  CheckIcon,
  ChevronUpIcon,
  MagnifyingGlassIcon,
  XMarkIcon
} from '@heroicons/vue/24/solid'
import { debounce, isArray } from 'lodash'
import { PropType, computed, onMounted, ref, unref, watch } from 'vue'
import { MaybeAsync, Nullable, Optional } from '@speckle/shared'
import { RuleExpression, useField } from 'vee-validate'
import { nanoid } from 'nanoid'
import CommonLoadingBar from '~~/src/components/common/loading/Bar.vue'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { directive as vTippy } from 'vue-tippy'

type ButtonStyle = 'base' | 'simple'
type SingleItem = any
type ValueType = SingleItem | SingleItem[] | undefined

defineEmits<{
  (e: 'update:modelValue', v: ValueType): void
}>()

const props = defineProps({
  multiple: {
    type: Boolean,
    default: false
  },
  items: {
    type: Array as PropType<SingleItem[]>,
    default: () => []
  },
  modelValue: {
    type: [Object, Array, String] as PropType<ValueType>,
    default: undefined
  },
  /**
   * Whether to enable the search bar. You must also set one of the following:
   * * filterPredicate - to allow filtering passed in `items` based on search bar
   * * getSearchResults - to allow asynchronously loading items from server (props.items no longer required in this case,
   *  but can be used to prefill initial values)
   */
  search: {
    type: Boolean,
    default: false
  },
  /**
   * If search=true and this is set, you can use this to filter passed in items based on whatever
   * the user enters in the search bar
   */
  filterPredicate: {
    type: Function as PropType<
      Optional<(item: SingleItem, searchString: string) => boolean>
    >,
    default: undefined
  },
  /**
   * If search=true and this is set, you can use this to load data asynchronously depending
   * on the search query
   */
  getSearchResults: {
    type: Function as PropType<
      Optional<(searchString: string) => MaybeAsync<SingleItem[]>>
    >,
    default: undefined
  },
  searchPlaceholder: {
    type: String,
    default: 'Search'
  },
  /**
   * Label is required at the very least for screen-readers
   */
  label: {
    type: String,
    required: true
  },
  /**
   * Whether to show the label visually
   */
  showLabel: {
    type: Boolean,
    default: false
  },
  name: {
    type: String,
    required: true
  },
  /**
   * Objects will be compared by the values in the specified prop
   */
  by: {
    type: String,
    required: false
  },
  disabled: {
    type: Boolean as PropType<Optional<boolean>>,
    default: false
  },
  buttonStyle: {
    type: String as PropType<Optional<ButtonStyle>>,
    default: 'base'
  },
  hideCheckmarks: {
    type: Boolean as PropType<Optional<boolean>>,
    default: false
  },
  allowUnset: {
    type: Boolean as PropType<Optional<boolean>>,
    default: true
  },
  clearable: {
    type: Boolean,
    default: false
  },
  /**
   * Validation stuff
   */
  rules: {
    type: [String, Object, Function, Array] as PropType<RuleExpression<string>>,
    default: undefined
  },
  /**
   * vee-validate validation() on component mount
   */
  validateOnMount: {
    type: Boolean,
    default: false
  },
  /**
   * Whether to trigger validation whenever the value changes
   */
  validateOnValueUpdate: {
    type: Boolean,
    default: false
  },
  /**
   * Will replace the generic "Value" text with the name of the input in error messages
   */
  useLabelInErrors: {
    type: Boolean,
    default: true
  },
  /**
   * Optional help text
   */
  help: {
    type: String as PropType<Optional<string>>,
    default: undefined
  },
  fixedHeight: {
    type: Boolean,
    default: false
  }
})

const { value, errorMessage: error } = useField<ValueType>(props.name, props.rules, {
  validateOnMount: props.validateOnMount,
  validateOnValueUpdate: props.validateOnValueUpdate,
  initialValue: props.modelValue
})

const searchInput = ref(null as Nullable<HTMLInputElement>)
const searchValue = ref('')
const currentItems = ref([] as SingleItem[])
const isAsyncLoading = ref(false)

const internalHelpTipId = ref(nanoid())

const title = computed(() => unref(props.label) || unref(props.name))
const errorMessage = computed(() => {
  const base = error.value
  if (!base || !unref(props.useLabelInErrors)) return base
  return base.replace('Value', title.value)
})
const helpTip = computed(() => errorMessage.value || unref(props.help))
const hasHelpTip = computed(() => !!helpTip.value)
const helpTipId = computed(() =>
  hasHelpTip.value ? `${unref(props.name)}-${internalHelpTipId.value}` : undefined
)
const helpTipClasses = computed((): string =>
  error.value ? 'text-danger' : 'text-foreground-2'
)

const renderClearButton = computed(
  () => props.buttonStyle !== 'simple' && props.clearable && !props.disabled
)

const buttonsWrapperClasses = computed(() => {
  const classParts: string[] = ['relative flex group', props.showLabel ? 'mt-1' : '']

  if (props.buttonStyle !== 'simple') {
    classParts.push('hover:shadow rounded-md')
    classParts.push('outline outline-2 outline-primary-muted')
  }

  if (props.fixedHeight) {
    classParts.push('h-8')
  }

  return classParts.join(' ')
})

const commonButtonClasses = computed(() => {
  const classParts: string[] = []

  if (props.buttonStyle !== 'simple') {
    // classParts.push('group-hover:shadow')
    // classParts.push('outline outline-2 outline-primary-muted ')
    classParts.push(
      isDisabled.value ? 'bg-foundation-disabled text-foreground-disabled' : ''
    )
  }

  if (isDisabled.value) classParts.push('cursor-not-allowed')

  return classParts.join(' ')
})

const clearButtonClasses = computed(() => {
  const classParts = [
    'relative z-[1]',
    'flex items-center justify-center text-center shrink-0',
    'rounded-r-md overflow-hidden transition-all',
    hasValueSelected.value ? `w-6 ${commonButtonClasses.value}` : 'w-0'
  ]

  if (!isDisabled.value) {
    classParts.push(
      'bg-primary-muted hover:bg-primary hover:text-foreground-on-primary'
    )
  }

  return classParts.join(' ')
})

const buttonClasses = computed(() => {
  const classParts = [
    'relative z-[2]',
    'normal rounded-md cursor-pointer transition truncate flex-1',
    'flex items-center',
    commonButtonClasses.value
  ]

  if (props.buttonStyle !== 'simple') {
    classParts.push('py-2 px-3')

    if (!isDisabled.value) {
      classParts.push('bg-foundation text-foreground')
    }
  }

  if (renderClearButton.value && hasValueSelected.value) {
    classParts.push('rounded-r-none')
  }

  return classParts.join(' ')
})

const hasSearch = computed(
  () => !!(props.search && (props.filterPredicate || props.getSearchResults))
)
const isAsyncSearchMode = computed(() => hasSearch.value && props.getSearchResults)
const isDisabled = computed(
  () => props.disabled || (!props.items.length && !isAsyncSearchMode.value)
)

const wrappedValue = computed({
  get: () => {
    const currentValue = value.value
    if (props.multiple) {
      return isArray(currentValue) ? currentValue : []
    } else {
      return isArray(currentValue) ? undefined : currentValue
    }
  },
  set: (newVal) => {
    if (props.multiple && !isArray(newVal)) {
      console.warn('Attempting to set non-array value in selector w/ multiple=true')
      return
    } else if (!props.multiple && isArray(newVal)) {
      console.warn('Attempting to set array value in selector w/ multiple=false')
      return
    }

    if (props.multiple) {
      value.value = newVal || []
    } else {
      const currentVal = value.value
      const isUnset =
        props.allowUnset &&
        currentVal &&
        newVal &&
        itemKey(currentVal as SingleItem) === itemKey(newVal as SingleItem)
      value.value = isUnset ? undefined : newVal
    }
  }
})

const hasValueSelected = computed(() => {
  if (props.multiple) return wrappedValue.value.length !== 0
  else return !!wrappedValue.value
})

const clearValue = () => {
  if (props.multiple) wrappedValue.value = []
  else wrappedValue.value = undefined
}

const finalItems = computed(() => {
  const searchVal = searchValue.value
  if (!hasSearch.value || !searchVal?.length) return currentItems.value

  if (props.filterPredicate) {
    return currentItems.value.filter(
      (i) => props.filterPredicate?.(i, searchVal) || false
    )
  }

  return currentItems.value
})

const simpleDisplayText = (v: ValueType) => JSON.stringify(v)
const itemKey = (v: SingleItem): string | number =>
  props.by ? (v[props.by] as string) : v

const triggerSearch = async () => {
  console.log('triggerSearch')
  if (!isAsyncSearchMode.value || !props.getSearchResults) return

  isAsyncLoading.value = true
  try {
    currentItems.value = await props.getSearchResults(searchValue.value)
  } finally {
    isAsyncLoading.value = false
  }
}
const debouncedSearch = debounce(triggerSearch, 1000)

watch(
  () => props.items,
  (newItems) => {
    currentItems.value = newItems.slice()
  },
  { immediate: true }
)

watch(searchValue, () => {
  if (!isAsyncSearchMode.value) return
  debouncedSearch()
})

onMounted(() => {
  if (isAsyncSearchMode.value && !props.items.length) {
    triggerSearch()
  }
})
</script>
