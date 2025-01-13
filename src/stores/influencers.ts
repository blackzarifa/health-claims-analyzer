import { ref } from 'vue';
import { defineStore } from 'pinia';
import { collection, addDoc, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, COLLECTIONS } from '@/lib/firebase';
import { PerplexityAPI } from '@/service/perplexity';
import type { FirestoreInfluencer, FirestoreClaim } from '@/lib/firebase';

export const useInfluencerStore = defineStore('influencers', () => {
  const apiKey = ref('');
  const perplexityApi = ref<PerplexityAPI | null>(null);
  const isAnalyzing = ref(false);
  const influencers = ref<FirestoreInfluencer[]>([]);
  const settings = ref({
    maxClaims: 10,
    sources: [],
  });

  async function loadInfluencers() {
    const snapshot = await getDocs(collection(db, COLLECTIONS.INFLUENCERS));
    influencers.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as FirestoreInfluencer[];
  }

  function setApiKey(key: string) {
    apiKey.value = key;
    perplexityApi.value = new PerplexityAPI({
      apiKey: key,
      maxClaims: settings.value.maxClaims,
      sources: settings.value.sources,
    });

    addDoc(collection(db, COLLECTIONS.API_KEYS), {
      key,
      createdAt: serverTimestamp(),
    });
  }

  function updateSettings(newSettings: Partial<typeof settings.value>) {
    Object.assign(settings.value, newSettings);
    if (perplexityApi.value) {
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
      const data = await perplexityApi.value.findInfluencer(query);

      const influencerRef = await addDoc(collection(db, COLLECTIONS.INFLUENCERS), {
        name: data.name,
        handle: data.handle,
        avatar: `/api/placeholder/40/40`,
        followers: data.followers,
        category: data.category as FirestoreInfluencer['category'],
        stats: { verified: 0, debunked: 0 },
        lastUpdated: new Date().toISOString(),
        createdAt: serverTimestamp(),
      });

      const claimResults = await Promise.all(
        data.recentClaims.map((claim: string) => perplexityApi.value!.analyzeClaim(claim))
      );

      const claims: Omit<FirestoreClaim, 'id' | 'createdAt'>[] = claimResults.map(result => ({
        influencerId: influencerRef.id,
        statement: result.claim,
        category: result.category as FirestoreClaim['category'],
        analysis: {
          result: result.trustScore >= 70 ? 'verified' : 'debunked',
          explanation: result.analysis,
          confidence: result.trustScore,
          sources: result.evidence,
        },
      }));

      await Promise.all(
        claims.map(claim =>
          addDoc(collection(db, COLLECTIONS.CLAIMS), {
            ...claim,
            createdAt: serverTimestamp(),
          })
        )
      );

      const stats = {
        verified: claims.filter(c => c.analysis.result === 'verified').length,
        debunked: claims.filter(c => c.analysis.result === 'debunked').length,
      };

      await updateDoc(doc(db, COLLECTIONS.INFLUENCERS, influencerRef.id), {
        stats,
        lastUpdated: new Date().toISOString(),
      });

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
      const result = await perplexityApi.value.search(
        'Find 5 rising health influencers gaining popularity. Return array of objects with name and handle.'
      );
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
    loadInfluencers,
    setApiKey,
    updateSettings,
    analyzeInfluencer,
    discoverInfluencers,
  };
});
