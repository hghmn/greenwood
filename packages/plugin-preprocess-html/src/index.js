const fs = require('fs');
const path = require('path');
const TransformInterface = require('@greenwood/cli/src/transforms/transform.interface');

class TestTransform extends TransformInterface {

  constructor(req, compilation) {
    super(req, compilation, {
      extensions: ['.html'], 
      constentType: 'text/html'
    });
  }

  shouldTransform() {
    const { url } = this.request;
    console.debug(this.request.url);
    const barePath = url.endsWith('/')
      ? `${this.workspace}/pages${url}index`
      : `${this.workspace}/pages${url.replace('.html', '')}`;
      
    return (this.extensions.indexOf(path.extname(url)) >= 0 || path.extname(url) === '') && 
      fs.existsSync(`${barePath}.html`);
  }

  async applyTransform() {
    
    return new Promise(async (resolve, reject) => {
      try {
        let body = `
        <html>
          <head>
            <title>test</title>
            <meta-outlet></meta-outlet>
          </head>
          <body>
            <h1>test pre process plugin</h1>
          </body>
        </html>`;

        resolve({
          body,
          contentType: this.contentType,
          extension: this.extensions
        });
      } catch (e) {
        reject(e);
      }
    });
  }
}

module.exports = () => {
  return [
    {
      type: 'transform-pre',
      provider: (req, compilation) => new TestTransform(req, compilation)
    }
  ];
};