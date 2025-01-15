import { ref } from 'vue';
import { defineStore } from 'pinia';
import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { db, COLLECTIONS } from '@/lib/firebase';
import { PerplexityAPI } from '@/service/perplexity';
import type { Influencer } from '@/types/influencer';

export const useInfluencerStore = defineStore('influencers', () => {
  const apiKey = ref('');
  const perplexityApi = ref<PerplexityAPI | null>(null);
  const isAnalyzing = ref(false);
  const influencers = ref<Influencer[]>([]);
  const settings = ref({
    maxClaims: 10,
    sources: [],
  });

  async function loadInfluencers() {
    const snapshot = await getDocs(collection(db, COLLECTIONS.INFLUENCERS));
    influencers.value = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Influencer[];
  }

  function setApiKey(key: string) {
    apiKey.value = key;
    perplexityApi.value = new PerplexityAPI({
      apiKey: key,
      maxClaims: settings.value.maxClaims,
      sources: settings.value.sources,
    });
  }

  function updateSettings(newSettings: Partial<typeof settings.value>) {
    Object.assign(settings.value, newSettings);
    if (apiKey.value) {
      perplexityApi.value = new PerplexityAPI({
        apiKey: apiKey.value,
        ...settings.value,
      });
    }
  }

  async function analyzeInfluencer(query: string) {
    if (!perplexityApi.value) throw new Error('Set API key first');

    isAnalyzing.value = true;
    try {
      const { influencer, claims } = await perplexityApi.value.findInfluencer(query);

      const influencerRef = await addDoc(collection(db, COLLECTIONS.INFLUENCERS), {
        ...influencer,
        createdAt: serverTimestamp(),
      });

      if (claims) {
        await Promise.all(
          claims.map((claim) =>
            addDoc(collection(db, COLLECTIONS.CLAIMS), {
              ...claim,
              influencerId: influencerRef.id,
              createdAt: serverTimestamp(),
            }),
          ),
        );
      }

      await loadInfluencers();
      return { influencerId: influencerRef.id };
    } finally {
      isAnalyzing.value = false;
    }
  }

  async function discoverInfluencers() {
    if (!perplexityApi.value) throw new Error('Set API key first');

    isAnalyzing.value = true;
    try {
      const results = await perplexityApi.value.discoverInfluencers();
      await Promise.all(
        results.map(async ({ influencer, claims }) => {
          const influencerRef = await addDoc(collection(db, COLLECTIONS.INFLUENCERS), {
            ...influencer,
            createdAt: serverTimestamp(),
          });

          if (claims) {
            await Promise.all(
              claims.map((claim) =>
                addDoc(collection(db, COLLECTIONS.CLAIMS), {
                  ...claim,
                  influencerId: influencerRef.id,
                  createdAt: serverTimestamp(),
                }),
              ),
            );
          }
        }),
      );

      await loadInfluencers();
    } finally {
      isAnalyzing.value = false;
    }
  }
  return {
    apiKey,
    influencers,
    isAnalyzing,
    settings,
    loadInfluencers,
    setApiKey,
    updateSettings,
    analyzeInfluencer,
    discoverInfluencers,
  };
});
