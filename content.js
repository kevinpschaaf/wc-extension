if (!window.hasRun) {
  window.hasRun = true;

  const runInPageRealm = fn => {
    var script = document.createElement('script');
    script.textContent = `(${fn})();`;
    (document.head||document.documentElement).appendChild(script);
    script.remove();
  }

  const installStats = () => {
    let polyfills;
    const alreadyLoaded = document.readyState === 'complete';
    const defineMap = window.customElementsMap = new Map();
    const querySelectorDeep = (query, root=document) => {
      return Array.from(root.querySelectorAll(query))
        .concat(
          ...Array.from(root.querySelectorAll('*'))
            .filter(n=>n.shadowRoot)
            .map(n=>querySelectorDeep(query, n.shadowRoot)),
          ...Array.from(root.querySelectorAll('link[rel=import]'))
            .map(l => querySelectorDeep(query, l.import))
        )
    }
    let polymerVersion;
    const updateCounts = () => {
      defineMap.forEach(def => def.count = 0);
      querySelectorDeep('*')
        .filter(el => el.localName.includes('-'))
        .forEach(el => {
          let def = defineMap.get(el.localName);
          if (!def) {
            const ctor = customElements.get(el.localName) || '';
            defineMap.set(el.localName, def = {tag: el.localName, ctor, version: ctor ? 'V1' : undefined, count: 0});
          }
          def.count++;
          def.shadowRoot = def.shadowRoot || Boolean(el.shadowRoot);
          polymerVersion = polymerVersion || el.constructor.polymerElementVersion;
        });
    }
    let statsDebouncer;
    const sendStats = window.__sendWCStats = (delay = 100) => {
      if (!statsDebouncer) {
        statsDebouncer = setTimeout(() => {
          statsDebouncer = null;
          updateCounts();
          if (window.WebComponents) {
            polyfills = window.WebComponents.flags ? 'WCJS V0' : 'WCJS V1';
          } else if (window.customElements && customElements.get('document-register-element-a')) {
            polyfills = 'DRE V1';
          }
          else if ((window.CustomElementRegistry && !window.CustomElementRegistry.toString().includes('[native code]')) ||
              (window.customElements && window.customElements.define !== statsDefine && !window.customElements.define.toString().includes('[native code]'))) {
            polyfills = 'Other (CE V1)';
            console.info(customElements.get.toString(), window.CustomElementRegistry.toString());
          } else if (document.registerElement !== statsRegister && !document.registerElement.toString().includes('[native code]')) {
            polyfills = 'Other (CE V0)';
          }
          const detail = {
            alreadyLoaded,
            url: window.location.href,
            customElements: Array.from(defineMap.values()).map(r => ({...r, ctor: r.ctor.toString()})),
            htmlImports: Array.from(querySelectorDeep('link[rel=import]').map(l => l.href)),
            polymerVersion: polymerVersion || (window.Polymer && window.Polymer.version),
            litElementVersion: window.litElementVersions,
            ampVersion: (window.AMP_MODE && window.AMP_MODE.version) || (window.AMP_CONFIG && window.AMP_CONFIG.v),
            polyfills
          }
          document.dispatchEvent(new CustomEvent('wc-stats', {
            detail
          }));
        }, 100);
      }
    }
    const origDefine = customElements.define;
    let statsDefine;
    if (origDefine) {
      statsDefine = customElements.define = function(tag, ctor, options) {
        defineMap.set(tag, {tag, ctor, options, version: 'V1'});
        sendStats();
        return origDefine.apply(this, arguments);
      };
    }
    const origRegister = document.registerElement;
    let statsRegister;
    if (origRegister) {
      statsRegister = document.registerElement = function(tag, ctor, options) {
        defineMap.set(tag, {tag, ctor, options, version: 'V0'});
        sendStats();
        return origRegister.apply(this, arguments);
      };
    }
    const origAttachShadow = Element.prototype.attachShadow;
    if (origAttachShadow) {
      Element.prototype.attachShadow = function() {
        const def = defineMap.get(this.localName);
        if (def) {
          def.shadowRoot = 'V1';
        }
        sendStats();
        return origAttachShadow.apply(this, arguments);
      }
    }
    const origCreateShadowRoot = Element.prototype.createShadowRoot;
    if (origCreateShadowRoot) {
      Element.prototype.createShadowRoot = function() {
        const def = defineMap.get(this.localName);
        if (def) {
          def.shadowRoot = 'V0';
        }
        sendStats();
        return origCreateShadowRoot.apply(this, arguments);
      }
    }
    window.addEventListener('load', e => {
      sendStats();
    });
  }

  const handleStats = e => {
    chrome.runtime.sendMessage({
      type: 'stats',
      info: e.detail
    });  
  };

  document.addEventListener('wc-stats', handleStats);

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch(request.type) {
      case 'refresh':
        runInPageRealm(() => window.__sendWCStats(0));
        break;
    }
  });

  runInPageRealm(installStats);
}