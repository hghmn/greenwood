/*
 * 
 * Manages web standard resource related operations for JavaScript.
 * This is a Greenwood default plugin.
 *
 */
const Buffer = require('buffer').Buffer;
const fs = require('fs');
const path = require('path');
const { ResourceInterface } = require('../../lib/resource-interface');
// const rollupPluginAlias = require('@rollup/plugin-alias');

let routesCache;

const getRouteTagsCache = function(compilation) {
  if (routesCache) {
    return routesCache;
  }

  console.debug('getRouteTagsCache!!!!!! (should only happen once)');

  routesCache = compilation.graph.map((page) => {
    const { template, route } = page;
    // let currentTemplate;
    const { projectDirectory, scratchDir, outputDir } = compilation.context;
    const pageContents = fs.readFileSync(path.join(scratchDir, `${page.route}/index.html`), 'utf-8');
    const bodyContents = pageContents.match(/<body>(.*)<\/body>/s)[0].replace('<body>', '').replace('</body>', '');
    const basePath = url.replace(projectDirectory, '');
    const id = Buffer.from(bodyContents).toString('base64');
    const hashOffset = id.length / 2;
    const routeKey = `/_routes${basePath}`
      .replace('.greenwood/', '')
      .replace('//', '/')
      .replace('.html', `.${id.slice(hashOffset, hashOffset + 8).toLowerCase()}.html`);
    // const outputBundlePath = `${outputDir}${routeKey}`;

    // console.debug('outputBundlePath', outputBundlePath);
    // console.debug('basePath', basePath);
    // console.debug('routeKey', routeKey);
    // console.debug('*****************************************');
    // .slice(bodyContents.length / 2, 8).toLowerCase();
    // console.debug('whole buffer', Buffer.from(bodyContents).toString('base64'));
    // console.debug('bodyContents', bodyContents);
    // console.debug('hash offset', hashOffset);
    // console.debug('id', id);

    // contents
    // routeKey
    // if (url.replace(scratchDir, '') === `${page.route}index.html`) {
    //   currentTemplate = template;
    // }

    return {
      contents: bodyContents,
      template,
      route,
      routeKey,
      routeTag: `
        <greenwood-route data-route="${route}" data-template="${template}" data-key="${routeKey}"></greenwood-route>
      `
    };
  });

  return routesCache;
};

class OptimizationMPAResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
    this.extensions = ['.html'];
    this.contentType = 'text/html';
    this.libPath = '@greenwood/router/router.js';
  }

  // TODO make this work using this.libPath
  async shouldResolve(url) {
    return Promise.resolve(url.indexOf(this.libPath) >= 0);
  }

  async resolve() {
    return new Promise(async (resolve, reject) => {
      try {
        const routerUrl = path.join(__dirname, '../../', 'lib/router.js');

        resolve(routerUrl);
      } catch (e) {
        reject(e);
      }
    });
  }

  // TODO add support for running in development?
  // async shouldIntercept(url, body, headers) {
  //   return Promise.resolve(this.compilation.config.optimization === 'mpa' && headers.request.accept.indexOf('text/html') >= 0);
  // }

  // async intercept(url, body) {
  //   return new Promise(async (resolve, reject) => {
  //     try {
  //       // es-modules-shims breaks on dangling commas in an importMap :/
  //       const danglingComma = body.indexOf('"imports": {}') > 0 
  //         ? ''
  //         : ',';
  //       const shimmedBody = body.replace('"imports": {', `
  //         "imports": {
  //           "@greenwood/cli/lib/router": "/node_modules/@greenwood/cli/lib/router.js"${danglingComma}
  //       `);

  //       resolve({ body: shimmedBody });
  //     } catch (e) {
  //       reject(e);
  //     }
  //   });
  // }

  async shouldOptimize(url) {
    return Promise.resolve(path.extname(url) === '.html' && this.compilation.config.mode === 'mpa');
  }

  async optimize(url, body) {
    return new Promise(async (resolve, reject) => {
      try {
        const { projectDirectory, scratchDir, outputDir } = this.compilation.context;
        const routesCache = getRouteTagsCache(this.compilation);
        const routeTags = routesCache.map(route => route.routeTag);
        const currentRoute = routesCache.filter((route) => {
          console.debug('url', url);
          console.debug('route.url', route.url);
          console.debug('*********************');
          return route.url === url;
        })[0];
        const outputBundlePath = `${outputDir}${currentRoute.routeKey}`;

        console.debug('currentRoute', currentRoute);

        if (!fs.existsSync(path.dirname(outputBundlePath))) {
          fs.mkdirSync(path.dirname(outputBundlePath), {
            recursive: true
          });
        }

        await fs.promises.writeFile(outputBundlePath, contents);

        // TODO this gets swalloed by Rollup?
        // <script type="module" src="/node_modules/@greenw">
        //   import "@greenwood/cli/lib/router";
        // </script>\n
        body = body.replace('</head>', `
          <script type="module" src="/node_modules/@greenwood/cli/src/lib/router.js"></script>\n
          <script>
            window.__greenwood = window.__greenwood || {};
            
            window.__greenwood.currentTemplate = "${currentRoute.template}";
          </script> 
          </head>
        `).replace(/<body>(.*)<\/body>/s, `
          <body>\n
            
            <router-outlet>
              ${currentRoute.contents}\n
            </router-outlet>
            
            ${routeTags.join('\n')}
          </body>
        `);

        resolve(body);
      } catch (e) {
        reject(e);
      }
    });
  }
}

module.exports = (options = {}) => {
  return [{
    type: 'resource',
    name: 'plugin-optimization-mpa',
    provider: (compilation) => new OptimizationMPAResource(compilation, options)
  // }, {
  //   type: 'rollup',
  //   name: 'plugin-optimization-mpa:rollup',
  //   provider: () => [
  //     rollupPluginAlias({
  //       entries: [
  //         { find: '@greenwood/cli/lib/router', replacement: '/node_modules/@greenwood/cli/lib/router.js' }
  //       ]
  //     })
  //   ]
  }];
}; 