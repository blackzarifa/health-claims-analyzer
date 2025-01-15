import type { Influencer, InfluencerResponse, RawInfluencerData } from '@/types/influencer';
import type { ClaimResponse } from '@/types/claim';

interface PerplexityResponse {
  choices: Array<{
    message: {
      content: string;
    };
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
      sources?: Array<{ name: string; id: string }>;
      existingInfluencers?: Array<{ name: string; handle: string }>;
    },
  ) {
    if (!config.apiKey) throw new Error('API key is required');
  }

  private buildDuplicateAvoidancePrompt(): string {
    if (!this.config.existingInfluencers?.length) return '';

    const names = this.config.existingInfluencers.map((i) => `${i.name} (${i.handle})`).join(', ');
    return `IMPORTANT: Skip these already analyzed influencers: ${names}. Find new ones instead.`;
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
    let content = response.choices[0].message.content;

    try {
      // Check if the content starts with a JSON object
      if (content.trim().startsWith('{')) {
        // If it does, assume the entire content is JSON
        content = content.trim();
      } else {
        // If not, remove any non-JSON content before and after the JSON block
        const jsonStart = content.indexOf('{');
        const jsonEnd = content.lastIndexOf('}') + 1;

        if (jsonStart === -1 || jsonEnd === -1)
          throw new Error('Could not find JSON block in the response');

        content = content.slice(jsonStart, jsonEnd).trim();
      }

      // Convert human-readable numbers to numeric values
      content = content
        .replace(
          /"followers":\s*([0-9.]+)\s*(?:million|Million|M)/g,
          (_, num) => `"followers":${parseFloat(num) * 1000000}`,
        )
        .replace(
          /"followers":\s*([0-9.]+)\s*(?:k|K|thousand|Thousand)/g,
          (_, num) => `"followers":${parseFloat(num) * 1000}`,
        )
        .replace(
          /"followers":\s*"?([0-9,]+)"?/g,
          (_, num) => `"followers":${parseInt(num.replace(/,/g, ''))}`,
        )
        .replace(/"followers":(\d+)/g, (_, num) => `"followers":${num},`);

      const parsed = JSON.parse(content);
      return parsed as T;
    } catch (error) {
      console.error('Parse error:', error, '\nContent:', content);
      throw new Error('Failed to parse API response as JSON');
    }
  }

  async findInfluencer(query: string): Promise<InfluencerResponse> {
    if (!query.trim()) throw new Error('Search query is required');

    const duplicateCheck = this.buildDuplicateAvoidancePrompt();
    const claimsLimit = this.config.maxClaims
      ? `Limit the response to ${this.config.maxClaims} most recent claims.`
      : '';
    const sourcesGuidance = this.config.sources?.length
      ? `Prioritize verification using these sources: ${this.config.sources.map((s) => s.name).join(', ')}.`
      : '';

    const prompt = `Act as a health content researcher. Search for "${query}" and analyze their recent health-related content.
    ${duplicateCheck}
    ${claimsLimit}
    ${sourcesGuidance}
    Respond only in this JSON format:
    {
      "name": "full name",
      "handle": "social media handle",
      "description": "small description about their expertise",
      "followers": number,
      "mainCategory": "1 word to describe the influencer main field, such as: Medicine/Nutrition/Mental Health/etc...",
      "claims": [
        {
          "claim": "exact health claim",
          "trustScore": number between 0-100,
          "analysis": "verification explanation with scientific backing",
          "sources": ["an array of strings with the source links for the analysis"],
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
    const duplicateCheck = this.buildDuplicateAvoidancePrompt();
    const claimsLimit = this.config.maxClaims
      ? `Limit to ${this.config.maxClaims} claims per influencer.`
      : '';
    const sourcesGuidance = this.config.sources?.length
      ? `Prioritize verification using these sources: ${this.config.sources.map((s) => s.name).join(', ')}.`
      : '';

    const prompt = `Find 3 trending health influencers who are actively sharing scientific health advice and analyze their recent health-related content.
    ${duplicateCheck}
    ${claimsLimit}
    ${sourcesGuidance}
    Respond only in this JSON format:
    {
      "influencers": [
        {
          "name": "full name",
          "handle": "social media handle",
          "description": "small description about their expertise",
          "followers": number,
          "mainCategory": "1 word to describe the influencer main field, such as: Medicine/Nutrition/Mental Health/etc...",
          "claims": [
            {
              "claim": "exact health claim",
              "trustScore": number between 0-100,
              "analysis": "verification explanation with scientific backing",
              "sources": ["1st source link string", "2nd source link string", "..."],
            }
          ]
        }
      ]
    }`;

    const result = await this.search(prompt);
    const data = await this.parseResponse<RawDiscoverResponse>(result);
    console.log('Parsed data:', data);

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
