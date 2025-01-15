import { ref } from 'vue';
import { defineStore } from 'pinia';
import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { db, COLLECTIONS } from '@/lib/firebase';
import { PerplexityAPI } from '@/service/perplexity';
import type { Influencer } from '@/types/influencer';
import type { Claim } from '@/types/claim';

export const useInfluencerStore = defineStore('influencers', () => {
  const apiKey = ref('');
  const perplexityApi = ref<PerplexityAPI | null>(null);
  const isAnalyzing = ref(false);
  const influencers = ref<Influencer[]>([]);
  const claims = ref<Record<string, Claim[]>>({});
  const settings = ref({
    maxClaims: 10,
    sources: [],
  });

  async function loadInfluencers() {
    const [influencersSnapshot, claimsSnapshot] = await Promise.all([
      getDocs(collection(db, COLLECTIONS.INFLUENCERS)),
      getDocs(collection(db, COLLECTIONS.CLAIMS)),
    ]);

    const claims = claimsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Claim[];

    influencers.value = influencersSnapshot.docs.map((doc) => {
      // Explicitly type the Firestore data
      const influencerData = doc.data() as Omit<Influencer, 'id'>;

      const influencer = {
        id: doc.id,
        name: influencerData.name,
        handle: influencerData.handle,
        description: influencerData.description,
        followers: influencerData.followers,
        mainCategory: influencerData.mainCategory,
        stats: influencerData.stats,
        lastUpdated: influencerData.lastUpdated,
      };

      const influencerClaims = claims.filter((claim) => claim.influencerId === doc.id);
      const avgTrustScore =
        influencerClaims.reduce((sum, claim) => sum + claim.trustScore, 0) /
        influencerClaims.length;

      return {
        ...influencer,
        trustScore: influencerClaims.length ? Math.round(avgTrustScore) : 0,
      };
    });
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
      const { influencer, claims: newClaims } = await perplexityApi.value.findInfluencer(query);

      const influencerRef = await addDoc(collection(db, COLLECTIONS.INFLUENCERS), {
        ...influencer,
        createdAt: serverTimestamp(),
      });

      if (newClaims) {
        await Promise.all(
          newClaims.map((claim) =>
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
        results.map(async ({ influencer, claims: newClaims }) => {
          const influencerRef = await addDoc(collection(db, COLLECTIONS.INFLUENCERS), {
            ...influencer,
            createdAt: serverTimestamp(),
          });

          if (newClaims) {
            await Promise.all(
              newClaims.map((claim) =>
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
    claims,
    isAnalyzing,
    settings,
    loadInfluencers,
    setApiKey,
    updateSettings,
    analyzeInfluencer,
    discoverInfluencers,
  };
});
