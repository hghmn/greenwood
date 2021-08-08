/*
 * Use Case
 * Run Greenwood develop command with no config.
 *
 * User Result
 * Should start the development server and render a bare bones Greenwood build and process TypeScript (.ts) files.
 *
 * User Command
 * greenwood develop
 *
 * User Config
 * TypeScript Plugin
 *
 * User Workspace
 * src/
 *   main.ts
 *
 */
const expect = require('chai').expect;
const { JSDOM } = require('jsdom');
const path = require('path');
const request = require('request');
const Runner = require('gallinago').Runner;
const runSmokeTest = require('../../../../../test/smoke-test');

describe('Develop Greenwood With: ', function() {
  const LABEL = 'TypeScript plugin for resolving .ts files';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = __dirname;
  const hostname = 'http://localhost';
  const port = 1984;
  let runner;

  before(function() {
    this.context = {
      hostname: `${hostname}:${port}`
    };
    runner = new Runner();
  });

  describe(LABEL, function() {

    before(async function() {
      await runner.setup(outputPath);

      return new Promise(async (resolve) => {
        setTimeout(() => {
          resolve();
        }, 3000);

        await runner.runCommand(cliPath, 'develop');
      });
    });

    runSmokeTest(['serve'], LABEL);

    describe('Develop command specific .ts behaviors', function() {
      let response = {};

      before(async function() {
        return new Promise((resolve, reject) => {
          request.get({
            url: `http://127.0.0.1:${port}/main.ts`
          }, (err, res, body) => {
            if (err) {
              reject();
            }

            response = res;
            
            dom = new JSDOM(body);
            resolve();
          });
        });
      });

      it('should return a 200', function(done) {
        expect(response.statusCode).to.equal(200);

        done();
      });

      it('should return the correct content type', function(done) {
        expect(response.headers['content-type']).to.equal('text/javascript');
        done();
      });

      it('should return an ECMAScript module', function(done) {
        expect(response.body.trim().indexOf('const user')).to.equal(0);
        done();
      });
    });
  });

  after(function() {
    runner.stopCommand();
    runner.teardown([
      path.join(outputPath, '.greenwood')
    ]);
  });
});