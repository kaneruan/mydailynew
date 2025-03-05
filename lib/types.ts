export interface NewsItem {
  id: string
  title: string
  description: string
  content?: string
  link: string
  pubDate: string
  source: string
}

export interface Article extends NewsItem {
  highlights: Highlight[]
  comments: Comment[]
}

export interface Highlight {
  id: string
  articleId: string
  text: string
  comment?: string
  createdAt: string
}

export interface Comment {
  id: string
  articleId: string
  content: string
  createdAt: string
  userId?: string
  userName: string
}

export interface UserProfile {
  id: string
  name: string
  comments: Comment[]
  highlights: Highlight[]
}

