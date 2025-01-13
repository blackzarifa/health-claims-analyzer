import type { Influencer } from '@/types/influencer';
import type { Claim } from '@/types/claim';

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

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Perplexity API error: ${error}`);
    }
    return res.json();
  }

  private validateInfluencer(data: unknown): Omit<Influencer, 'id'> {
    if (!data || typeof data !== 'object') throw new Error('Invalid influencer data');
    const d = data as Record<string, unknown>;

    if (
      typeof d.name !== 'string' ||
      typeof d.handle !== 'string' ||
      typeof d.description !== 'string' ||
      typeof d.followers !== 'number' ||
      typeof d.mainCategory !== 'string'
    ) {
      throw new Error('Missing or invalid influencer fields');
    }

    return {
      name: d.name,
      handle: d.handle,
      description: d.description,
      followers: d.followers,
      mainCategory: d.mainCategory,
      stats: { verified: 0, debunked: 0 }, // Will update after analyzing claims
      lastUpdated: new Date().toISOString(),
    };
  }

  private validateClaim(data: unknown): Omit<Claim, 'id'> {
    if (!data || typeof data !== 'object') throw new Error('Invalid claim data');
    const d = data as Record<string, unknown>;

    if (
      typeof d.claim !== 'string' ||
      typeof d.trustScore !== 'number' ||
      typeof d.analysis !== 'string'
    ) {
      throw new Error('Missing or invalid claim fields');
    }

    return {
      date: new Date().toISOString(),
      claim: d.claim,
      verified: d.trustScore >= 70,
      trustScore: d.trustScore,
      analysis: d.analysis,
    };
  }

  async findInfluencer(query: string) {
    const prompt = `Act as a health content researcher. Search for "${query}" and analyze their recent health-related content.
    Return the data in this JSON format:
    {
      "name": "full name",
      "handle": "social media handle",
      "description": "1-2 sentences about their expertise",
      "followers": number,
      "mainCategory": "Medicine/Nutrition/Mental Health",
      "claims": [
        {
          "claim": "exact health claim",
          "trustScore": number between 0-100,
          "analysis": "verification explanation with scientific backing"
        }
      ]
    }`;

    const result = await this.search(prompt);
    const data = JSON.parse(result.choices[0].message.content);

    const claims = (data.claims || []).map((c: Claim) => this.validateClaim(c));
    delete data.claims;

    const influencer = this.validateInfluencer(data);
    influencer.stats = {
      verified: claims.filter((c: Claim) => c.verified).length,
      debunked: claims.filter((c: Claim) => !c.verified).length,
    };

    return { influencer, claims };
  }

  async discoverInfluencers() {
    const prompt = `Find 3 trending health influencers who are actively sharing scientific health advice.
    Return them in JSON format:
    {
      "influencers": [
        {
          "name": "full name",
          "handle": "social media handle",
          "description": "1-2 sentences about their expertise",
          "followers": number,
          "mainCategory": "Medicine/Nutrition/Mental Health"
        }
      ]
    }`;

    const result = await this.search(prompt);
    const { influencers } = JSON.parse(result.choices[0].message.content);

    return Promise.all(
      influencers.map(async (inf: unknown) => {
        const influencer = this.validateInfluencer(inf);
        return this.findInfluencer(influencer.name);
      })
    );
  }
}
