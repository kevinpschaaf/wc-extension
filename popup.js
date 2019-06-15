import {html, render, nothing} from './node_modules/lit-html/lit-html.js';
import {classMap} from './node_modules/lit-html/directives/class-map.js';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch(request.type) {
    case 'stats':
      console.warn(sender.tab.id, tabId);
      if (sender.tab.id == tabId) {
        renderInfo(request.info);
      }
      break;
  }
});

let tabId;
const refresh = () => {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    tabId = tabs[0].id;
    chrome.tabs.sendMessage(tabId, {type: 'refresh'});
  });
};

const reload = () => {
  chrome.tabs.reload(tabId);
};

render(html`
  <style>
    body { width: 400px; box-sizing: border-box; }
    thead { background: lightgray; font-weight: bold; }
    table { border-collapse: collapse; width: 100%; }
    table, th, td { border: 1px solid gray; padding: 2px; }
    td[h] { font-weight: bold; }
    tr[v] { color: deeppink; }
    tr.zero { color: #bbb; }
    h2 { display: flex; flex-direction: row; margin-bottom: 5px; }
    h2 > span { flex: 1; }
    .warn { color: red; }
    .info { font-style: italic; font-weight: normal; }
  </style>
  <h2><span>Web Components info:</span><button @click=${refresh}>Refresh</button></h2>
  <div id="infoDiv"></div>
`, document.body)

const renderInfo = info => {
  const {url, polyfills, customElements, htmlImports, polymerVersion, litElementVersion, ampVersion, alreadyLoaded} = info;
  const V1Count = customElements.filter(r=>r.version=='V1').length;
  const V1Used = customElements.filter(r=>(r.version=='V1' && r.count)).length;
  const V0Count = customElements.filter(r=>r.version=='V0').length;
  const V0Used = customElements.filter(r=>(r.version=='V0' && r.count)).length;
  const sdV0Used = customElements.some(r=>r.shadowRoot=='V0');
  const sdV1Used = customElements.some(r=>r.shadowRoot=='V1');
  render(html`
    ${url}<br><br>
    <table>
      <thead><td colspan="2">Summary</td></thead>
        ${polymerVersion ? html`<tr v><td h>Polymer version</td><td>${polymerVersion}</td></tr>` : nothing}
        ${litElementVersion ? html`<tr v><td h>LitElement version</td><td>${polymerVersion}</td></tr>` : nothing}
        ${ampVersion ? html`<tr v><td h>AMP version</td><td>${ampVersion}</td></tr>` : nothing}
        <tr><td h>Polyfills loaded</td><td>${polyfills ? `✅ ${polyfills}` : '❌'}</td></tr>
        ${sdV0Used ? html`<tr><td h>Shadow DOM V0 Used</td><td>${sdV0Used ? '✅' : '❌'}</td></tr>` : nothing}
        ${sdV1Used ? html`<tr><td h>Shadow DOM V1 Used</td><td>${sdV1Used ? '✅' : '❌'}</td></tr>` : nothing}
        ${!sdV0Used && !sdV1Used ? html`<tr><td h>Shadow DOM Used</td><td>${customElements.some(r=>r.shadowRoot) ? '✅' : '❌'}</td></tr>` : nothing}
        <tr><td h>HTML Imports Used</td><td .title=${htmlImports.join('\n')}>${htmlImports.length ? `✅ ${htmlImports.length}` : '❌'}</td></tr>
        ${V1Count ? html`<tr><td h>Custom Elements V1 (used / total)</td><td>✅ ${V1Used} / ${V1Count}</td></tr>` : nothing}
        ${V0Count ? html`<tr><td h>Custom Elements V0 (used / total)</td><td>✅ ${V0Used} / ${V0Count}</td></tr>` : nothing}
        ${(!V0Count && !V1Count) ? html`<tr><td h>Custom Elements Used</td><td>❌</td></tr>` : nothing}
        <tr><td h>Custom Elements instance count</td><td>${customElements.filter(r=>r.version).reduce((c,r)=>c+r.count, 0)}</td></tr>
    </table>
    ${customElements.length ? html`
    <br>
    <table>
      <thead>
        <td>Tag</td>
        <td>Count</td>
        <td>Version</td>
        <td>ShadowDOM</td>
      </thead>
      ${customElements.sort((a,b) => b.count-a.count).map(r => html`
      <tr class=${classMap({zero: !r.count})}>
        <td .title=${r.ctor}>${r.tag}</td>
        <td>${r.count}</td>
        <td>${r.version || '?'}</td>
        <td>${r.shadowRoot ? `✅ ${r.shadowRoot !== true ? r.shadowRoot : ''}` : ''}</td>
      </tr>`)}
      <tr></tr>
    </table>` : nothing}
    ${alreadyLoaded ? html`
      <h3 class="warn">Reload page for full information. <button @click=${reload}>Reload</button></h3>`
      : nothing}
  `, infoDiv);
}

refresh();