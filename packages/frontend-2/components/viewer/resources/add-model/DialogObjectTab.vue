<template>
  <div class="flex flex-col space-y-4">
    <div class="text-foreground normal">
      Add objects from the current project by their IDs or an Object URL.
    </div>
    <form
      class="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:space-x-4 w-full"
      @submit="onSubmit"
    >
      <FormTextInput
        name="objectIdsOrUrl"
        label="Value"
        full-width
        size="lg"
        :custom-icon="CubeIcon"
        :rules="[isRequired, isValidValue]"
        placeholder="Comma-delimited object IDs or an URL to an object(-s)"
        auto-focus
      />
      <FormButton :icon-left="PlusIcon" size="lg" submit>Add</FormButton>
    </form>
  </div>
</template>
<script setup lang="ts">
import { RuleExpression, useForm } from 'vee-validate'
import { PlusIcon, CubeIcon } from '@heroicons/vue/24/solid'
import { isRequired } from '~~/lib/common/helpers/validation'
import { isObjectId } from '~~/lib/common/helpers/resources'
import { useInjectedViewerLoadedResources } from '~~/lib/viewer/composables/setup'
import { difference } from 'lodash-es'

const emit = defineEmits<{
  (e: 'chosen', val: { objectIds: string[] }): void
}>()

type FormPayload = { objectIdsOrUrl: string }
const urlRegexp = /\/models\/([a-zA-Z0-_9,@$]+)$/i

const { handleSubmit } = useForm<FormPayload>()
const { resourceItems } = useInjectedViewerLoadedResources()

const explodeValidatedObjectIds = (commaDelimitedIdList: string) => {
  const idParts = commaDelimitedIdList.split(',')
  const areIdsValid = !idParts.some((id) => !isObjectId(id))
  if (areIdsValid) return idParts
  return null
}

const extractObjectIds = (urlOrObjectIds: string) => {
  const [, idsString] = urlOrObjectIds.match(urlRegexp) || []
  if (idsString) {
    const listedIds = explodeValidatedObjectIds(idsString)
    if (listedIds?.length) return listedIds
  } else {
    const listedIds = explodeValidatedObjectIds(urlOrObjectIds)
    if (listedIds?.length) return listedIds
  }

  return null
}

const removeRedundantIds = (objectIds: string[]) => {
  const loadedObjectIds = resourceItems.value.map((i) => i.objectId)
  const newIds = difference(objectIds, loadedObjectIds)
  return newIds.length ? newIds : null
}

const isValidValue: RuleExpression<string> = (newVal) => {
  const ids = extractObjectIds(newVal)
  if (!ids)
    return 'Value must consist of comma-delimited object IDs or an URL to an object viewer page'

  const newIds = removeRedundantIds(ids)
  if (!newIds) return 'All specified objects are already loaded in the viewer'

  return true
}

const onSubmit = handleSubmit((payload) => {
  const { objectIdsOrUrl } = payload
  const ids = removeRedundantIds(extractObjectIds(objectIdsOrUrl) || [])
  if (!ids?.length) return

  emit('chosen', { objectIds: ids })
})
</script>
