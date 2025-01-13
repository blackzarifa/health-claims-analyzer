const API_URL = 'https://api.perplexity.ai/chat/completions';

export class PerplexityAPI {
  constructor(
    private config: {
      apiKey: string;
      maxClaims?: number;
      sources?: string[];
    }
  ) {}

  async search(prompt: string) {
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

    if (!res.ok) throw new Error(`API error: ${res.statusText}`);
    return res.json();
  }

  async findInfluencer(query: string) {
    const prompt = `Search for health influencer "${query}" and return as JSON:
    {
      name: string,
      handle: string,
      followers: number,
      category: string,
      recentClaims: string[] (array of up to ${this.config.maxClaims || 10} recent health claims)
    }`;

    const result = await this.search(prompt);
    return JSON.parse(result.choices[0].message.content);
  }

  async analyzeClaim(claim: string) {
    const prompt = `Analyze this health claim: "${claim}"
    Search ${this.config.sources?.join(', ') || 'scientific literature'} and return as JSON:
    {
      category: string,
      trustScore: number (0-100),
      analysis: string (explain why verified/debunked),
      evidence: [{
        title: string,
        url: string,
        snippet: string
      }]
    }`;

    const result = await this.search(prompt);
    return JSON.parse(result.choices[0].message.content);
  }
}
