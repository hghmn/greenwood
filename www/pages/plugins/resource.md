---
label: 'Resource'
menu: side
title: 'Resource'
index: 3
---

## Resource

Resource plugins allow developers to interact with the request and response lifecycles of files at a variety of different points along the development and build workflow, when running the `develop` and `build` commands.  These lifecycles provide the ability to do things like:
- Integrating Site Analytics (Google, Snowplow) in each generated _index.html_ page
- Introduce additional file types, like TypeScript

### API (Resource Interface)
Although JavaScript is loosely typed, a [resource "interface"](https://github.com/ProjectEvergreen/greenwood/tree/master/packages/cli/src/lib/resource-interface.js) has been provided by Greenwood that you can use to start building your own resource plugins.  Effectively you have to define two things:
- `extensions`: The file types your plugin will operate on
- `contentType`: A browser compatible contentType to ensure browsers correctly interpret you transformations

```javascript
import fs from 'fs';
import { ResourceInterface } from '@greenwood/cli/src/lib/resource-interface.js';

class ResourceInterface {
  constructor(compilation, options = {}) {
    this.compilation = compilation;
    this.options = options;
    this.extensions = [];
    this.contentType = '';
  }

  // test if this plugin should change a relative URL from the browser to an absolute path on disk
  // like for node_modules/ resolution. not commonly needed by most resource plugins
  // return true | false
  async shouldResolve(url) {
    return Promise.resolve(false);
  }

  // return an absolute path
  async resolve(url) {
    return Promise.resolve(url);
  }

  // test if this plugin should be used to process a given url / header for the browser
  // ex: `<script type="module" src="index.ts">`
  // return true | false
  async shouldServe(url, headers) {
    return Promise.resolve(this.extensions.indexOf(path.extname(url)) >= 0);
  }

  // return the new body and / or contentType, e.g. convert file.foo -> file.js
  async serve(url, headers) {
    return Promise.resolve({});
  }

  // test if this plugin should return a new body for an already resolved resource
  // useful for modifying code on the fly without needing to read the file from disk
  // return true | false
  async shouldIntercept(url, body, headers) {
    return Promise.resolve(false);
  }

  // return the new body
  async intercept(url, body, headers) {
    return Promise.resolve({ body });
  }

  // test if this plugin should manipulate any files prior to any final optimizations happening
  // ex: add a "banner" to all .js files with a timestamp of the build, or minifying files
  // return true | false
  async shouldOptimize(url, body) {
    return Promise.resolve(false);
  }

  // return the new body
  async optimize (url, body) {
    return Promise.resolve(body);
  }
}

export function myResourcePlugin(options = {}) {
  return {
    type: 'resource',
    name: 'plugin-example',
    provider: (compilation) => new ExampleResource(compilation, options)
  }
};
```

## Example
Below is an example of turning files that have a _.foo_ extension into JavaScript.

```js
// file.foo
interface User {
  id: number
  firstName: string
  lastName: string
  role: string
}

console.log('hello from file.foo with non standard JavaScript in it.');
```

```js
// plugin-foo.js
import fs from 'fs';
import { ResourceInterface } from '@greenwood/cli/src/lib/resource-interface.js';

class FooResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);

    this.extensions = ['.foo'];
    this.contentType = 'text/javascript';
  }

  async serve(url) {
    return new Promise(async (resolve, reject) => {
      try {
        let body = await fs.promises.readFile(url, 'utf-8');

        // remove non standard JavaScript usage so browser is happy
        body = body.replace(/interface (.*){(.*)}/s, '');

        // and we can return .foo as .js!
        resolve({
          body,
          contentType: this.contentType
        });
      } catch (e) {
        reject(e);
      }
    });
  }
}

export function myFooPlugin(options = {}) {
  return {
    type: 'resource',
    name: 'plugin-foo',
    provider: (compilation) => new StandardJsonResource(compilation, options)
  }
};

// greenwood.config.js
import { myFooPlugin } from './plugin-foo.js';

export default {

  ...

  plugins: [
    myFooPlugin()
  ]

}
```

> _You can see [more in-depth examples of resource plugin](https://github.com/ProjectEvergreen/greenwood/tree/master/packages/cli/src/plugins/resource/) by reviewing the default plugins maintained in Greenwood's CLI package._