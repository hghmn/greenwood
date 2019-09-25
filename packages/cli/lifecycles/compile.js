require('colors');
const initConfig = require('./config');
const initContext = require('./context');
const generateGraph = require('./graph');
const generateScaffolding = require('./scaffold');
const generateFromSources = require('./sources');

module.exports = generateCompilation = () => {
  return new Promise(async (resolve, reject) => {
    try {

      let compilation = {
        graph: [],
        context: {},
        config: {}
      };

      // read from defaults/config file
      console.log('Reading project config');
      compilation.config = await initConfig();

      // determine whether to use default template or user detected workspace
      console.log('Initializing project workspace contexts');
      compilation.context = await initContext(compilation);

      // generate a graph of all pages / components to build
      console.log('Generating graph of workspace files...');
      compilation = await generateGraph(compilation);

      console.log('Scaffolding from sources....');
      compilation = await generateFromSources(compilation);

      // generate scaffolding
      console.log('Scaffolding out project files...');
      await generateScaffolding(compilation);

      resolve(compilation);
    } catch (err) {
      reject(err);
    }
  });
};