# file: components/ClaimsList.vue
<script setup lang="ts">
import { ref } from 'vue';
import Tag from 'primevue/tag';
import Button from 'primevue/button';
import Card from 'primevue/card';
import type { Claim } from '@/types/claim';
import { getTrustScoreColor } from '@/utils/format';

defineProps<{
  claims: Claim[];
  searchQuery: string;
}>();

const expandedClaimIds = ref<Set<string>>(new Set());

const toggleClaim = (claimId: string) => {
  if (expandedClaimIds.value.has(claimId)) {
    expandedClaimIds.value.delete(claimId);
  } else {
    expandedClaimIds.value.add(claimId);
  }
};
</script>

<template>
  <Card>
    <template #content>
      <div class="space-y-4">
        <div v-if="claims.length" class="text-sm text-gray-400">
          Showing {{ claims.length }} claims
        </div>
        <div v-else class="text-center text-gray-400">No claims matching the search</div>

        <div
          v-for="claim in claims"
          :key="claim.id"
          class="space-y-3 cursor-pointer"
          @click="toggleClaim(claim.id)"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="flex items-center gap-2">
              <Tag
                :value="claim.verified ? 'Verified' : 'Debunked'"
                :severity="claim.verified ? 'success' : 'danger'"
                class="uppercase text-xs"
              />
              <span class="text-xs text-gray-400">{{ claim.date }}</span>
            </div>
            <span :class="['font-bold text-lg', getTrustScoreColor(claim.trustScore)]">
              {{ claim.trustScore }}%
            </span>
          </div>

          <div class="font-medium">{{ claim.claim }}</div>

          <div v-if="expandedClaimIds.has(claim.id)">
            <div class="flex items-center gap-2 mb-4">
              <i class="pi pi-code text-2xl text-primary-500"></i>
              <span class="font-bold text-lg text-primary-500">AI Analysis</span>
            </div>
            <p class="text-gray-300 pl-6">{{ claim.analysis }}</p>

            <div class="flex gap-2 mt-6 pl-6">
              <Button
                label="View Source"
                severity="secondary"
                size="small"
                icon="pi pi-external-link"
                class="p-button-outlined"
              />
              <Button
                label="View Research"
                severity="secondary"
                size="small"
                icon="pi pi-file-pdf"
                class="p-button-outlined"
              />
            </div>
          </div>

          <div
            v-if="claim !== claims[claims.length - 1]"
            class="border-b border-slate-700 mt-6 mb-4"
          ></div>
        </div>
      </div>
    </template>
  </Card>
</template>
