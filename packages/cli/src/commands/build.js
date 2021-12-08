import { bundleCompilation } from '../lifecycles/bundle.js';
import { copyAssets } from '../lifecycles/copy.js';
import { devServer } from '../lifecycles/serve.js';
import fs from 'fs';
import { generateCompilation } from '../lifecycles/compile.js';
import { preRenderCompilation, staticRenderCompilation } from '../lifecycles/prerender.js';
import { ServerInterface } from '../lib/server-interface.js';

const runProductionBuild = async () => {

  return new Promise(async (resolve, reject) => {

    try {
      const compilation = await generateCompilation();
      const { prerender } = compilation.config;
      const port = compilation.config.devServer.port;
      const outputDir = compilation.context.outputDir;

      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
      }
      
      if (prerender) {
        await new Promise(async (resolve, reject) => {
          try {
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
          
              await preRenderCompilation(compilation);
  
              resolve();
            });
          } catch (e) {
            reject(e);
          }
        });
      } else {
        await staticRenderCompilation(compilation);
      }

      await bundleCompilation(compilation);
      await copyAssets(compilation);

      resolve();
    } catch (err) {
      reject(err);
    }
  });
  
};

export { runProductionBuild };