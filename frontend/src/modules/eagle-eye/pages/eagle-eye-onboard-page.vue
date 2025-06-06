<template>
  <div class="max-w-xl mx-auto pt-16 pb-24">
    <div class="panel !p-0">
      <!-- Banner -->
      <eagle-eye-banner
        :title="headerContent.title"
        :pre-title="headerContent.preTitle"
        :show-image="headerContent.showImage"
      />

      <!-- Content -->
      <div class="px-8 pb-8 pt-9">
        <eagle-eye-intro v-if="step === 1" @on-step-change="onStepChange" />
        <eagle-eye-keywords
          v-if="step === 2"
          v-model="form.keywords"
          @on-step-change="onStepChange"
        />
        <eagle-eye-platforms
          v-if="step === 3"
          v-model:platforms="form.platforms"
          v-model:published-date="form.datePublished"
          @on-step-change="onStepChange"
        />
        <eagle-eye-summary
          v-if="step === 4"
          @on-step-change="onStepChange"
          @on-submit="onSubmit"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  computed, reactive, ref, onMounted, onBeforeUnmount,
} from 'vue';
import { onBeforeRouteLeave, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import EagleEyeBanner from '@/modules/eagle-eye/components/onboard/eagle-eye-banner.vue';
import EagleEyeIntro from '@/modules/eagle-eye/components/onboard/eagle-eye-intro-step.vue';
import EagleEyeKeywords from '@/modules/eagle-eye/components/onboard/eagle-eye-keywords-step.vue';
import EagleEyePlatforms from '@/modules/eagle-eye/components/onboard/eagle-eye-platforms-step.vue';
import EagleEyeSummary from '@/modules/eagle-eye/components/onboard/eagle-eye-summary-step.vue';
import publishedDateOptions from '@/modules/eagle-eye/constants/eagle-eye-date-published.json';
import platformOptions from '@/modules/eagle-eye/constants/eagle-eye-platforms';
import ConfirmDialog from '@/shared/dialog/confirm-dialog';
import { mapActions } from '@/shared/vuex/vuex.helpers';
import config from '@/config';

const store = useStore();
const router = useRouter();

const { doUpdateSettings } = mapActions('eagleEye');

const step = ref(1);

const form = reactive({
  keywords: [
    {
      value: null,
    },
  ],
  datePublished: publishedDateOptions[1].label,
  platforms: Object.keys(platformOptions).reduce(
    (a, b) => ({
      ...a,
      [b]: true,
    }),
    {},
  ),
});

const isPremiumFeatureCopy = () => {
  if (config.isCommunityVersion) {
    return 'Enterprise';
  }
  return 'Scale';
};

const headerContent = computed(() => {
  if (step.value === 1) {
    return {
      title: 'Community Lens',
      preTitle: `${isPremiumFeatureCopy()} App`,
      showImage: true,
    };
  }

  return {
    title: 'Set up your feed',
    preTitle: 'Community Lens',
  };
});

const wasFormSubmittedSuccessfully = ref(false);
const storeUnsubscribe = ref(() => {});

// Prevent lost data on route change
onBeforeRouteLeave((to) => {
  if (
    step.value > 1
    && !wasFormSubmittedSuccessfully.value
    && to.fullPath !== '/500'
    && to.fullPath !== '/403'
  ) {
    return ConfirmDialog({})
      .then(() => true)
      .catch(() => false);
  }

  return true;
});

onMounted(() => {
  storeUnsubscribe.value = store.subscribe((mutation) => {
    if (mutation.type === 'eagleEye/UPDATE_EAGLE_EYE_SETTINGS_SUCCESS') {
      wasFormSubmittedSuccessfully.value = true;
      router.go(0);
    }
  });
});

onBeforeUnmount(() => {
  storeUnsubscribe.value();
});

const onStepChange = (increment) => {
  step.value += increment;
};

const onSubmit = async () => {
  const formattedKeywords = form.keywords.map((s) => s.value);
  const formattedPlatforms = Object.entries(form.platforms)
    .filter(([, value]) => value)
    .map(([key]) => key);

  await doUpdateSettings({
    data: {
      feed: {
        keywords: formattedKeywords,
        exactKeywords: [],
        excludedKeywords: [],
        publishedDate: form.datePublished,
        platforms: formattedPlatforms,
      },
      aiReplies: true,
    },
  });
};
</script>
