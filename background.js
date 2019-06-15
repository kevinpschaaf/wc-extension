function setIcon(value) {
  function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    if (typeof stroke == "undefined" ) {
      stroke = true;
    }
    if (typeof radius === "undefined") {
      radius = 5;
    }
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    if (stroke) {
      ctx.stroke();
    }
    if (fill) {
      ctx.fill();
    }        
  }
  var color = value && value !== '?' ? 'green' : 'gray';
  var canvas = document.createElement('canvas');
  var context = canvas.getContext('2d');
  context.fillStyle = color;
  roundRect(context, 0,0,19,19,6,true);
  context.fillStyle = "white";
  context.font = "10px arial";
  context.fillText(value, 3, 12);
  var imageData = context.getImageData(0, 0, 19, 19);
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.pageAction.show(tabs[0].id);
    chrome.pageAction.setIcon({
      tabId: tabs[0].id,
      imageData: imageData
    });
  });
}

let stats;
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch(request.type) {
    case 'stats':
      stats = request.info;
      const {customElements, alreadyLoaded, htmlImports} = request.info;
      const total = alreadyLoaded ? 
        customElements.filter(def => def.count).length :
        customElements.filter(def => def.version).length;
      if (total) {
        setIcon(total);
      } else if (customElements.some(r=>r.shadowRoot)) {
        setIcon('SD');
      } else if (htmlImports.length) {
        setIcon('HI');
      } else {
        setIcon(0);
      }
      break;
  }
});

const refreshStats = () => {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    setIcon('?');
    chrome.tabs.executeScript(tabs[0].id, {
      file: 'content.js'
    }, () => {
      chrome.tabs.sendMessage(tabs[0].id, {type: 'refresh'});
    });
  });
};

chrome.windows.onFocusChanged.addListener(refreshStats);
chrome.tabs.onActivated.addListener(refreshStats);