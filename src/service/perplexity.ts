import type { Influencer } from '@/types/influencer';
import type { Claim } from '@/types/claim';

interface PerplexityResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

type ClaimResponse = Omit<Claim, 'id'>;

interface InfluencerResponse {
  influencer: Omit<Influencer, 'id'>;
  claims?: Array<ClaimResponse>;
}

interface RawInfluencerData {
  name: string;
  handle: string;
  description: string;
  followers: number;
  mainCategory: string;
  claims?: Array<{
    claim: string;
    trustScore: number;
    analysis: string;
    sources: string[];
  }>;
}

interface RawDiscoverResponse {
  influencers: RawInfluencerData[];
}

export class PerplexityAPI {
  private readonly API_URL = 'https://api.perplexity.ai/chat/completions';
  private readonly MODEL = 'llama-3.1-sonar-small-128k-online';

  constructor(
    private config: {
      apiKey: string;
      maxClaims?: number;
      sources?: string[];
    },
  ) {
    if (!config.apiKey) {
      throw new Error('API key is required');
    }
  }

  private async search(prompt: string): Promise<PerplexityResponse> {
    try {
      const res = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.MODEL,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(`Perplexity API error (${res.status}): ${error}`);
      }

      return res.json();
    } catch (error) {
      if (error instanceof Error)
        throw new Error(`Failed to fetch from Perplexity API: ${error.message}`);

      throw error;
    }
  }

  private validateInfluencer(data: unknown): Omit<Influencer, 'id'> {
    if (!data || typeof data !== 'object')
      throw new Error('Invalid influencer data: Expected an object');

    const d = data as Record<string, unknown>;
    const requiredFields = ['name', 'handle', 'description', 'followers', 'mainCategory'] as const;

    for (const field of requiredFields) {
      if (!(field in d)) throw new Error(`Missing required field: ${field}`);
    }

    if (typeof d.name !== 'string') throw new Error('Invalid name: Expected string');
    if (typeof d.handle !== 'string') throw new Error('Invalid handle: Expected string');
    if (typeof d.description !== 'string') throw new Error('Invalid description: Expected string');
    if (typeof d.followers !== 'number' || d.followers < 0)
      throw new Error('Invalid followers: Expected positive number');
    if (typeof d.mainCategory !== 'string')
      throw new Error('Invalid mainCategory: Expected string');

    return {
      name: d.name,
      handle: d.handle,
      description: d.description,
      followers: d.followers,
      mainCategory: d.mainCategory,
      stats: { verified: 0, debunked: 0 },
      lastUpdated: new Date().toISOString(),
    };
  }

  private validateClaim(data: unknown): ClaimResponse {
    if (!data || typeof data !== 'object')
      throw new Error('Invalid claim data: Expected an object');

    const d = data as Record<string, unknown>;
    const requiredFields = ['claim', 'trustScore', 'analysis', 'sources'] as const;

    for (const field of requiredFields) {
      if (!(field in d)) throw new Error(`Missing required field: ${field}`);
    }

    if (typeof d.claim !== 'string') throw new Error('Invalid claim: Expected string');
    if (typeof d.trustScore !== 'number' || d.trustScore < 0 || d.trustScore > 100)
      throw new Error('Invalid trustScore: Expected number between 0-100');
    if (typeof d.analysis !== 'string') throw new Error('Invalid analysis: Expected string');
    if (!Array.isArray(d.sources)) throw new Error('Invalid sources: Expected array');

    return {
      date: new Date().toISOString(),
      claim: d.claim,
      verified: d.trustScore >= 70,
      trustScore: d.trustScore,
      analysis: d.analysis,
      sources: d.sources as string[],
    };
  }

  private async parseResponse<T>(response: PerplexityResponse): Promise<T> {
    try {
      const parsed = JSON.parse(response.choices[0].message.content);
      return parsed as T;
    } catch (error) {
      console.error('Parse error:', error);
      throw new Error('Failed to parse API response as JSON');
    }
  }

  async findInfluencer(query: string): Promise<InfluencerResponse> {
    if (!query.trim()) throw new Error('Search query is required');

    const claimsLimit = this.config.maxClaims
      ? `Limit the response to ${this.config.maxClaims} most recent claims.`
      : '';
    const sourcesGuidance = this.config.sources?.length
      ? `Prioritize verification using these sources: ${this.config.sources.join(', ')}.`
      : '';

    const prompt = `Act as a health content researcher. Search for "${query}" and analyze their recent health-related content.
    ${claimsLimit}
    ${sourcesGuidance}
    Respond only in this JSON format:
    {
      "name": "full name",
      "handle": "social media handle",
      "description": "small description about their expertise",
      "followers": number,
      "mainCategory": "Medicine/Nutrition/Mental Health/etc...",
      "claims": [
        {
          "claim": "exact health claim",
          "trustScore": number between 0-100,
          "analysis": "verification explanation with scientific backing",
          "sources": ["an array of strings with the sources for the analysis"],
        }
      ],
    }`;

    const result = await this.search(prompt);
    const data = await this.parseResponse<RawInfluencerData>(result);

    const claims = (data.claims ?? []).map((c) => this.validateClaim(c));
    const { ...influencerData } = data;

    const influencer = this.validateInfluencer(influencerData);
    influencer.stats = {
      verified: claims.filter((c) => c.verified).length,
      debunked: claims.filter((c) => !c.verified).length,
    };

    return { influencer, claims };
  }

  async discoverInfluencers(): Promise<InfluencerResponse[]> {
    const claimsLimit = this.config.maxClaims
      ? `Limit to ${this.config.maxClaims} claims per influencer.`
      : '';
    const sourcesGuidance = this.config.sources?.length
      ? `Prioritize these sources: ${this.config.sources.join(', ')}.`
      : '';

    const prompt = `Find 3 trending health influencers who are actively sharing scientific health advice and analyze their recent health-related content.
    ${claimsLimit}
    ${sourcesGuidance}
    Respond only in this JSON format:
    {
      "influencers": [
        {
          "name": "full name",
          "handle": "social media handle",
          "description": "1-2 sentences about their expertise",
          "followers": number,
          "mainCategory": "Medicine/Nutrition/Mental Health/etc...",
          "claims": [
            {
              "claim": "exact health claim",
              "trustScore": number between 0-100,
              "analysis": "verification explanation with scientific backing",
              "sources": ["an array of strings with the sources for the analysis"],
            }
          ]
        }
      ]
    }`;

    const result = await this.search(prompt);
    const data = await this.parseResponse<RawDiscoverResponse>(result);

    return data.influencers.map((inf) => {
      const claims = (inf.claims ?? []).map((c) => this.validateClaim(c));
      const { ...influencerData } = inf;

      const influencer = this.validateInfluencer(influencerData);
      influencer.stats = {
        verified: claims.filter((c) => c.verified).length,
        debunked: claims.filter((c) => !c.verified).length,
      };

      return { influencer, claims };
    });
  }
}
