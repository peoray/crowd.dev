<template>
  <app-drawer
    v-model="isVisible"
    custom-class="integration-confluence-drawer"
    title="Confluence"
    pre-title="Integration"
    has-border
    @close="cancel"
  >
    <template #beforeTitle>
      <img class="min-w-6 h-6 mr-2" :src="logoUrl" alt="Confluence logo" />
    </template>
    <template #content>
      <div class="text-gray-900 text-sm font-medium">
        Remote URL
      </div>
      <div class="text-2xs text-gray-500">
        Connect remote Confluence space.
      </div>

      <el-form class="mt-2" @submit.prevent>
        <el-input
          id="url"
          v-model="form.url"
          class="text-green-500"
          spellcheck="false"
          placeholder="Enter Organization URL"
        />
        <app-array-input
          v-for="(_, index) of form.spaces"
          :id="`spaceKey-${index}`"
          :key="index"
          v-model="form.spaces[index]"
          class="text-green-500 mt-2"
          placeholder="Enter Space key"
        >
          <template #after>
            <lf-button
              type="primary-link"
              size="medium"
              class="w-10 h-10"
              icon-only
              @click="removeSpaceKey(index)"
            >
              <lf-icon name="trash-can" :size="20" />
            </lf-button>
          </template>
        </app-array-input>

        <lf-button type="primary-link" @click="addSpaceKey()">
          + Add Space Key
        </lf-button>
      </el-form>
    </template>

    <template #footer>
      <div>
        <lf-button
          type="secondary-gray"
          size="medium"
          class="mr-4"
          :disabled="loading"
          @click="cancel"
        >
          Cancel
        </lf-button>
        <lf-button
          id="confluenceConnect"
          type="primary"
          size="medium"
          :disabled="$v.$invalid || !hasFormChanged || loading"
          :loading="loading"
          @click="connect"
        >
          {{ integration?.settings ? 'Update' : 'Connect' }}
        </lf-button>
      </div>
    </template>
  </app-drawer>
</template>

<script setup lang="ts">
import useVuelidate from '@vuelidate/core';
import {
  computed, onMounted, reactive, ref,
} from 'vue';
import confluence from '@/config/integrations/confluence/config';
import formChangeDetector from '@/shared/form/form-change';
import { mapActions } from '@/shared/vuex/vuex.helpers';
import useProductTracking from '@/shared/modules/monitoring/useProductTracking';
import {
  EventType,
  FeatureEventKey,
} from '@/shared/modules/monitoring/types/event';
import { Platform } from '@/shared/modules/platform/types/Platform';
import LfButton from '@/ui-kit/button/Button.vue';
import AppArrayInput from '@/shared/form/array-input.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';

const emit = defineEmits(['update:modelValue']);
const props = defineProps({
  integration: {
    type: Object,
    default: null,
  },
  modelValue: {
    type: Boolean,
    default: false,
  },
  segmentId: {
    type: String,
    required: true,
  },
  grandparentId: {
    type: String,
    required: true,
  },
});

const { trackEvent } = useProductTracking();

const loading = ref(false);
const form = reactive({
  url: '',
  spaces: [''],
});

const { hasFormChanged, formSnapshot } = formChangeDetector(form);
const $v = useVuelidate({
  url: { required: true },
  spaces: {
    required: (value: string[]) => value.length > 0 && value.every((v) => v.trim() !== ''),
  },
}, form, { $stopPropagation: true });

const { doConfluenceConnect } = mapActions('integration');
const isVisible = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit('update:modelValue', value);
  },
});
const logoUrl = confluence.image;

const addSpaceKey = () => {
  form.spaces.push('');
};

const removeSpaceKey = (index: number) => {
  form.spaces.splice(index, 1);
};

onMounted(() => {
  if (props.integration?.settings) {
    form.url = props.integration?.settings.url;
    // to handle both single and multiple spaces
    if (props.integration?.settings.space) {
      form.spaces = [props.integration?.settings.space.key];
    } else {
      form.spaces = props.integration?.settings.spaces;
    }
  }
  formSnapshot();
});

const cancel = () => {
  isVisible.value = false;
};

const connect = async () => {
  loading.value = true;

  const isUpdate = props.integration?.settings;

  doConfluenceConnect({
    settings: {
      url: form.url,
      spaces: form.spaces,
    },
    isUpdate,
    segmentId: props.segmentId,
    grandparentId: props.grandparentId,
  })
    .then(() => {
      trackEvent({
        key: isUpdate
          ? FeatureEventKey.EDIT_INTEGRATION_SETTINGS
          : FeatureEventKey.CONNECT_INTEGRATION,
        type: EventType.FEATURE,
        properties: {
          platform: Platform.CONFLUENCE,
        },
      });

      isVisible.value = false;
    })
    .finally(() => {
      loading.value = false;
    });
};
</script>

<script lang="ts">
export default {
  name: 'LfConfluenceSettingsDrawer',
};
</script>
