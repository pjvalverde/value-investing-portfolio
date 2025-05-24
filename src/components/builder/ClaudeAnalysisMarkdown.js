import React from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import './ClaudeAnalysisMarkdown.css';

// Extrae la tabla markdown (en texto plano)
const extractMarkdownTable = (markdown) => {
  const tableRegex = /(\|.+\|\n\|[-| ]+\|([\s\S]*?)(\n\|.+\|)+)/;
  const match = markdown.match(tableRegex);
  return match ? match[0] : null;
};

// Parsea la tabla markdown a filas y columnas (array de arrays)
function parseMarkdownTable(mdTable) {
  if (!mdTable) return { headers: [], rows: [] };
  const lines = mdTable.trim().split('\n');
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = lines[0].split('|').map(h => h.trim()).filter(Boolean);
  const rows = lines.slice(2).map(line =>
    line.split('|').map(cell => cell.trim()).filter(Boolean)
  );
  return { headers, rows };
}

const ClaudeAnalysisMarkdown = ({ markdown }) => {
  if (!markdown) return null;
  // Extraer tabla y el resto del markdown
  const tableMd = extractMarkdownTable(markdown);
  const restMd = tableMd ? markdown.replace(tableMd, '') : markdown;
  const { headers, rows } = parseMarkdownTable(tableMd);

  // Render seguro para el resto del markdown
  const restHtml = DOMPurify.sanitize(marked.parse(restMd));

  return (
    <div className="claude-analysis-markdown">
      <div className="claude-analysis-text" dangerouslySetInnerHTML={{ __html: restHtml }} />
      {headers.length > 0 && rows.length > 0 && (
        <div className="claude-analysis-table-wrapper">
          <table>
            <thead>
              <tr>
                {headers.map((h, i) => <th key={i}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j} style={headers[j].toLowerCase().includes('métrica') ? {whiteSpace:'pre-line',color:'#1a237e',fontFamily:'Fira Mono,Consolas,Menlo,monospace'} : {}}>{cell || '-'}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ClaudeAnalysisMarkdown;
