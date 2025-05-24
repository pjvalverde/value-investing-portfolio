import React from "react";

// Convierte tabla markdown a HTML estilizada
function markdownTableToHtml(md) {
  const lines = md.split("\n");
  const tableLines = [];
  let inTable = false;
  let tableHtml = "";
  for (let i = 0; i < lines.length; i++) {
    // Detecta inicio de tabla markdown
    if (lines[i].includes("|") && lines[i + 1] && lines[i + 1].match(/^\s*\|?\s*-+/)) {
      inTable = true;
      // Header
      const headers = lines[i].split("|").map(h => h.trim()).filter(Boolean);
      tableHtml += '<table class="claude-table"><thead><tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr></thead><tbody>';
      i++;
      continue;
    }
    // Filas de la tabla
    if (inTable && lines[i].includes("|")) {
      const cols = lines[i].split("|").map(c => c.trim()).filter(Boolean);
      if (cols.length > 1) {
        tableHtml += '<tr>' + cols.map(c => `<td>${c}</td>`).join('') + '</tr>';
      }
      continue;
    }
    // Fin de la tabla
    if (inTable && (!lines[i] || !lines[i].includes("|"))) {
      tableHtml += '</tbody></table>';
      inTable = false;
    }
    if (!inTable) tableLines.push(lines[i]);
  }
  if (inTable) tableHtml += '</tbody></table>';
  return { tableHtml, rest: tableLines.join("\n") };
}

export default function ClaudeAnalysis({ analysis }) {
  if (!analysis) return null;
  // Convierte tabla markdown a tabla HTML estilizada
  const { tableHtml, rest } = markdownTableToHtml(analysis);
  return (
    <div>
      {tableHtml && (
        <div style={{overflowX:'auto', marginBottom:12}} dangerouslySetInnerHTML={{ __html: tableHtml }} />
      )}
      {rest && <div style={{whiteSpace:'pre-line'}}>{rest}</div>}
      <style>{`
        .claude-table { border-collapse: collapse; width: 100%; background: #fff; }
        .claude-table th, .claude-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .claude-table th { background: #f0f4fa; font-weight: bold; }
        .claude-table tr:nth-child(even) { background: #f9f9f9; }
      `}</style>
    </div>
  );
}
