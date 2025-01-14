<script setup lang="ts">
import { ref, computed } from 'vue';
import { useToast } from 'primevue/usetoast';
import Card from 'primevue/card';
import Password from 'primevue/password'
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Button from 'primevue/button';
import MultiSelect from 'primevue/multiselect';
import { useInfluencerStore } from '@/stores/influencers';

const store = useInfluencerStore();
const toast = useToast();
const searchQuery = ref('');
const maxClaims = computed({
  get: () => store.settings.maxClaims,
  set: val => store.updateSettings({ maxClaims: val }),
});

const selectedSources = computed({
  get: () => store.settings.sources,
  set: val => store.updateSettings({ sources: val }),
});

const sources = [
  { name: 'PubMed', id: 'pubmed' },
  { name: 'Google Scholar', id: 'scholar' },
  { name: 'ResearchGate', id: 'researchgate' },
  { name: 'ScienceDirect', id: 'sciencedirect' },
];

async function searchInfluencer() {
  if (!store.apiKey || !searchQuery.value) return;

  try {
    await store.analyzeInfluencer(searchQuery.value);
    toast.add({ severity: 'success', summary: 'Done!' });
    searchQuery.value = '';
  } catch (err) {
    const error = err as Error;
    toast.add({ severity: 'error', summary: error.message });
  }
}

async function discoverInfluencers() {
  if (!store.apiKey) return;

  try {
    await store.discoverInfluencers();
    toast.add({ severity: 'success', summary: 'Found new influencers!' });
  } catch (err) {
    const error = err as Error;
    toast.add({ severity: 'error', summary: error.message });
  }
}
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-3xl font-bold">Admin Panel</h1>

    <Card>
      <template #title>Settings</template>
      <template #content>
        <div class="space-y-4">
          <div>
            <label class="block mb-2">Perplexity API Key</label>
            <Password
              :model-value="store.apiKey"
              @update:model-value="store.setApiKey"
              placeholder="pplx-xxxxxxxxxxxxxxxx"
              fluid
              toggleMask
              :feedback="false"
            />
          </div>

          <div>
            <label class="block mb-2">Max Claims per Analysis</label>
            <InputNumber
              v-model="maxClaims"
              fluid
              :min="1"
              :max="50"
              :step="1"
              suffix=" claims"
              :disabled="store.isAnalyzing"
            />
            <small class="text-gray-400">Maximum number of claims to analyze per influencer</small>
          </div>

          <div>
            <label class="block mb-2">Scientific Sources</label>
            <MultiSelect
              v-model="selectedSources"
              fluid
              :options="sources"
              display="chip"
              showClear
              optionLabel="name"
              placeholder="Select sources to check"
              :disabled="store.isAnalyzing"
            />
            <small class="text-gray-400">Sources to verify claims against</small>
          </div>
        </div>
      </template>
    </Card>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <template #title>Search Influencer</template>
        <template #content>
          <div class="flex gap-2">
            <InputText
              v-model="searchQuery"
              placeholder="Enter name or handle"
              class="w-full"
              :disabled="store.isAnalyzing || !store.apiKey"
            />
            <Button
              @click="searchInfluencer"
              :label="store.isAnalyzing ? 'Analyzing...' : 'Search'"
              :disabled="!searchQuery || store.isAnalyzing || !store.apiKey"
              :icon="store.isAnalyzing ? 'pi pi-spinner pi-spin' : ''"
            />
          </div>
        </template>
      </Card>

      <Card>
        <template #title>Discover Influencers</template>
        <template #content>
          <Button
            @click="discoverInfluencers"
            :label="store.isAnalyzing ? 'Discovering...' : 'Find New Influencers'"
            class="w-full"
            :disabled="store.isAnalyzing || !store.apiKey"
            :icon="store.isAnalyzing ? 'pi pi-spinner pi-spin' : ''"
          />
          <small class="block mt-2 text-gray-400">
            Automatically find trending health influencers
          </small>
        </template>
      </Card>
    </div>
  </div>
</template>
