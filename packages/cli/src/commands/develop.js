import { generateCompilation } from '../lifecycles/compile.js';
import { ServerInterface } from '../lib/server-interface.js';
import { devServer } from '../lifecycles/serve.js';

const runDevServer = async () => {

  return new Promise(async (resolve, reject) => {

    try {
      const compilation = await generateCompilation();
      const { port } = compilation.config.devServer;
      
      (await devServer(compilation)).listen(port, async () => {
        
        console.info(`Started local development server at localhost:${port}`);
        const serverPlugins = [...compilation.config.plugins].filter(plugin => plugin.type === 'server');

        for (const plugin of serverPlugins) {
          const server = await plugin.provider(compilation);

          if (!(server instanceof ServerInterface)) {
            console.warn(`WARNING: ${plugin.name}'s provider is not an instance of ServerInterface.`);
          }

          server.start();
        }

        resolve();
      });
    } catch (err) {
      reject(err);
    }

  });
};

export { runDevServer };