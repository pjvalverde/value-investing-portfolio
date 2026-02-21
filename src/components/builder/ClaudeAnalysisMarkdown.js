import React from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import './ClaudeAnalysisMarkdown.css';

const ClaudeAnalysisMarkdown = ({ markdown }) => {
  if (!markdown) {
    return <div>No hay análisis disponible</div>;
  }

  // Configure marked for safe rendering with GFM tables
  marked.setOptions({
    breaks: true,
    gfm: true,
  });

  // Convert markdown to HTML
  const rawHtml = marked(markdown);

  // Sanitize HTML – allow tables and standard formatting tags
  const cleanHtml = DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'blockquote', 'code', 'pre',
      'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
      'div', 'span',
    ],
    ALLOWED_ATTR: ['class', 'style'],
  });

  return (
    <div className="claude-analysis-markdown">
      <div className="claude-analysis-table-wrapper claude-analysis-text"
        dangerouslySetInnerHTML={{ __html: cleanHtml }}
      />
    </div>
  );
};

export default ClaudeAnalysisMarkdown;
