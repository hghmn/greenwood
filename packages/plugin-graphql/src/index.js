const fs = require('fs');
const graphqlServer = require('./core/server');
const { gql } = require('apollo-server');
const path = require('path');
const { ResourceInterface } = require('@greenwood/cli/src/lib/resource-interface');
const { ServerInterface } = require('@greenwood/cli/src/lib/server-interface');
const rollupPluginAlias = require('@rollup/plugin-alias');

class GraphQLResource extends ResourceInterface {
  constructor(compilation, options = {}) {
    super(compilation, options);
    this.extensions = ['.gql'];
    this.contentType = ['text/javascript'];
  }

  async serve(url) {
    return new Promise(async (resolve, reject) => {
      try {
        const js = await fs.promises.readFile(url, 'utf-8');
        const gqlJs = gql`${js}`;
        const body = `
          export default ${JSON.stringify(gqlJs)};
        `;

        resolve({
          body,
          contentType: this.contentType
        });
      } catch (e) {
        reject(e);
      }
    });
  }
  
  async shouldIntercept(url, body, headers) {
    return Promise.resolve((headers.request.accept && headers.request.accept.indexOf('text/html') >= 0) ||
    url.indexOf('node_modules/graphql/language/parser.mjs') >= 0);
  }

  async intercept(url, body, headers) {
    return new Promise(async (resolve, reject) => {
      try {
        if (headers.request.accept.indexOf('text/html') >= 0) {
          const shimmedBody = body.replace('"imports": {', `
            "imports": {
              "@ungap/global-this": "/node_modules/@ungap/global-this/esm/index.js",
              "symbol-observable": "/node_modules/symbol-observable/es/index.js",
              "zen-observable": "/node_modules/zen-observable/esm.js",
              "fast-json-stable-stringify": "/node_modules/fast-json-stable-stringify/index.js",
              "graphql": "/node_modules/graphql/index.mjs",
              "optimism": "/node_modules/optimism/lib/bundle.esm.js",
              "@wry/trie": "/node_modules/@wry/trie/lib/trie.esm.js",
              "@wry/context": "/node_modules/@wry/context/lib/context.esm.js",
              "@wry/equality": "/node_modules/@wry/equality/lib/equality.esm.js",
              "graphql/language/visitor": "/node_modules/graphql/language/visitor.mjs",
              "graphql/language/parser": "/node_modules/graphql/language/parser.mjs",
              "graphql/language/printer": "/node_modules/graphql/language/printer.mjs",
              "graphql-tag": "/node_modules/graphql-tag/src/index.js",
              "tslib": "/node_modules/tslib/tslib.es6.js",
              "ts-invariant": "/node_modules/@apollo/client/node_modules/ts-invariant/lib/invariant.esm.js",
              "@apollo/client/core": "/node_modules/@apollo/client/core/index.js",
              "@greenwood/plugin-graphql/core/client": "/node_modules/@greenwood/plugin-graphql/src/core/client.js",
              "@greenwood/plugin-graphql/core/common": "/node_modules/@greenwood/plugin-graphql/src/core/common.client.js",
              "@greenwood/plugin-graphql/queries/menu": "/node_modules/@greenwood/plugin-graphql/src/queries/menu.gql",
              "@greenwood/plugin-graphql/queries/config": "/node_modules/@greenwood/plugin-graphql/src/queries/config.gql",
          `);

          resolve({ body: shimmedBody });
        } else if (url.indexOf('node_modules/graphql/language/parser.mjs') >= 0) {
          const shimmedContents = `
            ${body}\n
            export default {}
          `;

          resolve({ body: shimmedContents });
        }
      } catch (e) {
        reject(e);
      }
    });
  }

  async shouldOptimize(url) {
    return Promise.resolve(path.extname(url) === '.html');
  }

  async optimize(url, body) {
    return new Promise((resolve, reject) => {
      try {
        // TODO const apolloScript = isStrictOptimization (no apollo-state)
        body = body.replace('<script>', `
          <script data-state="apollo">
            window.__APOLLO_STATE__ = true;
          </script>
          <script>
        `);
    
        resolve(body);
      } catch (e) {
        reject(e);
      }
    });
  }
}

class GraphQLServer extends ServerInterface {
  constructor(compilation, options = {}) {
    super(compilation, options);
  }

  async start() {
    return graphqlServer(this.compilation).listen().then((server) => {
      console.log(`GraphQLServer started at ${server.url}`);
    });
  }
}

module.exports = (options = {}) => {
  return [{
    type: 'server',
    name: 'plugin-graphql:server',
    provider: (compilation) => new GraphQLServer(compilation, options)
  }, {
    type: 'resource',
    name: 'plugin-graphql:resource',
    provider: (compilation) => new GraphQLResource(compilation, options)
  }, {
    type: 'rollup',
    name: 'plugin-graphql:rollup',
    provider: () => [
      rollupPluginAlias({
        entries: [
          { find: '@greenwood/plugin-graphql/core/client', replacement: '@greenwood/plugin-graphql/src/core/client.js' },
          { find: '@greenwood/plugin-graphql/core/common', replacement: '@greenwood/plugin-graphql/src/core/common.client.js' },
          { find: '@greenwood/plugin-graphql/queries/menu', replacement: '@greenwood/plugin-graphql/src/queries/menu.gql' },
          { find: '@greenwood/plugin-graphql/queries/config', replacement: '@greenwood/plugin-graphql/src/queries/config.gql' }
        ]
      })
    ]
  }];
};