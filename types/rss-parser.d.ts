declare module 'rss-parser' {
  export interface Item {
    title?: string;
    link?: string;
    pubDate?: string;
    creator?: string;
    content?: string;
    contentSnippet?: string;
    guid?: string;
    categories?: string[];
    isoDate?: string;
    summary?: string;
    description?: string;
    [key: string]: any;
  }

  export interface Output {
    items: Item[];
    feedUrl?: string;
    title?: string;
    description?: string;
    link?: string;
    language?: string;
    lastBuildDate?: string;
    [key: string]: any;
  }

  export interface ParserOptions {
    customFields?: {
      feed?: string[];
      item?: string[];
    };
    headers?: Record<string, string>;
    timeout?: number;
    maxRedirects?: number;
    [key: string]: any;
  }

  export default class Parser {
    constructor(options?: ParserOptions);
    parseURL(url: string): Promise<Output>;
    parseString(xml: string): Promise<Output>;
  }
} 