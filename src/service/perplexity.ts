import type { FirestoreInfluencer, FirestoreClaim } from '@/lib/firebase';

const API_URL = 'https://api.perplexity.ai/chat/completions';

export class PerplexityAPI {
  constructor(
    private config: {
      apiKey: string;
      maxClaims?: number;
      sources?: string[];
    }
  ) {}

  private async search(prompt: string) {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) throw new Error(`Perplexity API error: ${await res.text()}`);
    return res.json();
  }

  private validateInfluencer(data: unknown): Omit<FirestoreInfluencer, 'id' | 'createdAt'> {
    if (!data || typeof data !== 'object') throw new Error('Invalid influencer data');
    const d = data as Record<string, unknown>;

    if (
      typeof d.name !== 'string' ||
      typeof d.handle !== 'string' ||
      typeof d.followers !== 'number' ||
      typeof d.category !== 'string' ||
      !Array.isArray(d.recentClaims)
    ) {
      throw new Error('Missing or invalid influencer fields');
    }

    return {
      name: d.name,
      handle: d.handle,
      avatar: `/api/placeholder/40/40`,
      followers: d.followers,
      category: d.category,
      stats: { verified: 0, debunked: 0 },
      lastUpdated: new Date().toISOString(),
    };
  }

  private validateClaimAnalysis(
    data: unknown,
    influencerId: string
  ): Omit<FirestoreClaim, 'id' | 'createdAt'> {
    if (!data || typeof data !== 'object') throw new Error('Invalid claim analysis');
    const d = data as Record<string, unknown>;

    if (
      typeof d.statement !== 'string' ||
      typeof d.category !== 'string' ||
      typeof d.confidence !== 'number' ||
      typeof d.analysis !== 'string' ||
      !Array.isArray(d.sources)
    ) {
      throw new Error('Missing or invalid claim analysis fields');
    }

    return {
      influencerId,
      statement: d.statement,
      category: d.category,
      analysis: {
        result: d.confidence >= 70 ? 'verified' : 'debunked',
        explanation: d.analysis,
        confidence: d.confidence,
        sources: d.sources as FirestoreClaim['analysis']['sources'],
      },
    };
  }

  async findInfluencer(query: string) {
    const prompt = `Search for health influencer "${query}" and return JSON:
    {
      name: string,
      handle: string,
      followers: number,
      category: string (their main field/topic),
      recentClaims: string[] (${this.config.maxClaims || 10} recent health claims)
    }`;

    const result = await this.search(prompt);
    return this.validateInfluencer(JSON.parse(result.choices[0].message.content));
  }

  async analyzeClaim(claim: string, influencerId: string) {
    const prompt = `Analyze health claim: "${claim}"
    Search ${this.config.sources?.join(', ') || 'scientific literature'} and return JSON:
    {
      statement: string (the claim),
      category: string (field of health),
      confidence: number (0-100),
      analysis: string (verification explanation),
      sources: [{
        title: string,
        url: string,
        snippet: string
      }]
    }`;

    const result = await this.search(prompt);
    return this.validateClaimAnalysis(JSON.parse(result.choices[0].message.content), influencerId);
  }
}
