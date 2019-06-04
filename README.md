# wc-extension
Chrome extension to show info about Web Components used on page.

### Reported information
The extension icon shows green and number of Custom Elements defined on page, or gray if there are none.

Clicking on the icon will open a popup reporting the following informaton on the current page:
* Web Components framework used (currently only detects markers for Polymer, LitElement, AMP)
* Polyfills loaded (which version, when available)
* Shadow DOM Used	(yes or no)
* HTML Imports Used	(yes or no, and count of imports)
* Custom Elements Used (yes or no, version, used definition count, total definition count, instance count)
* Custom Elements tag list (tag, instance count, version, whether it uses Shadow DOM)

### Installation
* `git clone https://github.com/kevinpschaaf/wc-extension.git`
* Open `chrome://extensions` 
* Click `Load unpacked`, navigate to `wc-extension` folder, click OK

The extension patches some browser API's (`customElements.define`, `document.registerElement`) on every page to provide statistics (which may impact overall performance), so it's best to disable the extension when not being used.
