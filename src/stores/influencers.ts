import { ref } from 'vue';
import { defineStore } from 'pinia';
import { PerplexityAPI } from '@/service/perplexity';
import type { Influencer } from '@/types/influencer';

export const useInfluencerStore = defineStore('influencers', () => {
  const apiKey = ref('');
  const api = ref<PerplexityAPI | null>(null);
  const isAnalyzing = ref(false);
  const influencers = ref<Influencer[]>([]);

  function setApiKey(key: string) {
    apiKey.value = key;
    api.value = new PerplexityAPI({
      apiKey: key,
      maxClaims: settings.value.maxClaims,
      sources: settings.value.sources,
    });
  }

  const settings = ref({
    maxClaims: 10,
    sources: [],
  });

  function updateSettings(newSettings: { maxClaims?: number; sources?: string[] }) {
    Object.assign(settings.value, newSettings);
  }

  async function analyzeInfluencer(query: string) {
    if (!api.value) throw new Error('Set API key first');

    isAnalyzing.value = true;
    try {
      const influencer = await api.value.findInfluencer(query);
      const claims = await Promise.all(
        influencer.recentClaims.map((claim: string) => api.value!.analyzeClaim(claim))
      );

      const result = {
        ...influencer,
        claims,
        trustScore: Math.round(claims.reduce((sum, c) => sum + c.trustScore, 0) / claims.length),
        lastUpdated: new Date().toISOString(),
      };

      influencers.value.push(result);

      return result;
    } finally {
      isAnalyzing.value = false;
    }
  }

  async function discoverInfluencers() {
    if (!api.value) throw new Error('Set API key first');

    isAnalyzing.value = true;
    try {
      const prompt = `Find 5 rising health influencers who are gaining popularity. Return array of influencer names & handles.`;
      const result = await api.value.search(prompt);
      const discovered = JSON.parse(result.choices[0].message.content);

      for (const inf of discovered) {
        await analyzeInfluencer(`${inf.name} ${inf.handle}`);
      }
    } finally {
      isAnalyzing.value = false;
    }
  }

  return {
    apiKey,
    influencers,
    isAnalyzing,
    settings,
    setApiKey,
    updateSettings,
    analyzeInfluencer,
    discoverInfluencers,
  };
});
