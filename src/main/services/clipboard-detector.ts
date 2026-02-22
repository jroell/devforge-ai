export interface DetectionResult {
  toolId: string
  content: string
  confidence: number
}

export interface DetectorRule {
  toolId: string
  pattern: RegExp
  priority: number
}

const rules: DetectorRule[] = [
  { toolId: 'jwt-decoder', pattern: /^eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/, priority: 100 },
  { toolId: 'json-formatter', pattern: /^\s*[\[{][\s\S]*[\]}]\s*$/, priority: 90 },
  { toolId: 'xml-formatter', pattern: /^\s*<\?xml[\s\S]*/, priority: 85 },
  { toolId: 'html-preview', pattern: /^\s*<!DOCTYPE[\s\S]*|^\s*<html[\s\S]*/i, priority: 84 },
  { toolId: 'unix-timestamp', pattern: /^\d{10,13}$/, priority: 80 },
  { toolId: 'base64-codec', pattern: /^[A-Za-z0-9+/]{20,}={0,2}$/, priority: 70 },
  { toolId: 'url-parser', pattern: /^https?:\/\/.+/, priority: 60 },
  { toolId: 'uuid-generator', pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, priority: 50 },
  { toolId: 'regex-tester', pattern: /^\/.*\/[gimsuy]*$/, priority: 40 }
].sort((a, b) => b.priority - a.priority)

export function detectClipboardType(content: string): DetectionResult {
  const trimmed = content.trim()

  for (const rule of rules) {
    if (rule.pattern.test(trimmed)) {
      return { toolId: rule.toolId, content, confidence: rule.priority }
    }
  }

  return { toolId: 'json-formatter', content, confidence: 0 }
}
