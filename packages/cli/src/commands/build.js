const fs = require('fs');
const generateCompilation = require('../lifecycles/compile');
const serializeBuild = require('../lifecycles/serialize');
const { server } = require('../lifecycles/serve');

module.exports = runProductionBuild = async () => {

  return new Promise(async (resolve, reject) => {

    try {
      const compilation = await generateCompilation();
      const port = compilation.config.devServer.port;
      const outputDir = compilation.context.outputDir;

      await server.listen(port);
  
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
      }
  
      await serializeBuild(compilation);
      
      //   // TODO rollup only understands ESM in Node :/
      //   // rollup.write(rollupConfig);
  
      //   // 5) run rollup on .greenwood and put into public/
      //   // TODO this is a hack just for the sake of the POC, will do for real :)
      //   execSync('rollup -c ./rollup.config.js');
  
      resolve();
    } catch (err) {
      reject(err);
    }
  });
  
};