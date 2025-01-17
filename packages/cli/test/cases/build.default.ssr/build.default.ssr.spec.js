/*
 * Use Case
 * Run Greenwood with an SSR route.
 *
 * User Result
 * Should generate a bare bones Greenwood build for hosting a server rendered application.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * None
 *
 * User Workspace
 *  src/
 *   components/
 *     footer.js
 *   pages/
 *     artists.js
 *   templates/
 *     app.html
 */
import chai from 'chai';
import fs from 'fs';
import { JSDOM } from 'jsdom';
import path from 'path';
import { getSetupFiles, getDependencyFiles, getOutputTeardownFiles } from '../../../../../test/utils.js';
import request from 'request';
import { runSmokeTest } from '../../../../../test/smoke-test.js';
import { Runner } from 'gallinago';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;

describe('Build Greenwood With: ', function() {
  const LABEL = 'A Server Rendered Application (SSR)';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = fileURLToPath(new URL('.', import.meta.url));
  const hostname = 'http://127.0.0.1:8080';
  let runner;

  before(async function() {
    this.context = { 
      publicDir: path.join(outputPath, 'public') 
    };
    runner = new Runner();
  });

  describe(LABEL, function() {

    before(async function() {
      const lit = await getDependencyFiles(
        `${process.cwd()}/node_modules/lit/*.js`, 
        `${outputPath}/node_modules/lit/`
      );
      const litDecorators = await getDependencyFiles(
        `${process.cwd()}/node_modules/lit/decorators/*.js`, 
        `${outputPath}/node_modules/lit/decorators/`
      );
      const litDirectives = await getDependencyFiles(
        `${process.cwd()}/node_modules/lit/directives/*.js`, 
        `${outputPath}/node_modules/lit/directives/`
      );
      const litPackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/lit/package.json`, 
        `${outputPath}/node_modules/lit/`
      );
      const litElement = await getDependencyFiles(
        `${process.cwd()}/node_modules/lit-element/*.js`, 
        `${outputPath}/node_modules/lit-element/`
      );
      const litElementPackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/lit-element/package.json`, 
        `${outputPath}/node_modules/lit-element/`
      );
      const litElementDecorators = await getDependencyFiles(
        `${process.cwd()}/node_modules/lit-element/decorators/*.js`, 
        `${outputPath}/node_modules/lit-element/decorators/`
      );
      const litHtml = await getDependencyFiles(
        `${process.cwd()}/node_modules/lit-html/*.js`, 
        `${outputPath}/node_modules/lit-html/`
      );
      const litHtmlPackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/lit-html/package.json`, 
        `${outputPath}/node_modules/lit-html/`
      );
      const litHtmlDirectives = await getDependencyFiles(
        `${process.cwd()}/node_modules/lit-html/directives/*.js`, 
        `${outputPath}/node_modules/lit-html/directives/`
      );
      // lit-html has a dependency on this
      // https://github.com/lit/lit/blob/main/packages/lit-html/package.json#L82
      const trustedTypes = await getDependencyFiles(
        `${process.cwd()}/node_modules/@types/trusted-types/package.json`,
        `${outputPath}/node_modules/@types/trusted-types/`
      );
      const litReactiveElement = await getDependencyFiles(
        `${process.cwd()}/node_modules/@lit/reactive-element/*.js`, 
        `${outputPath}/node_modules/@lit/reactive-element/`
      );
      const litReactiveElementDecorators = await getDependencyFiles(
        `${process.cwd()}/node_modules/@lit/reactive-element/decorators/*.js`, 
        `${outputPath}/node_modules/@lit/reactive-element/decorators/`
      );
      const litReactiveElementPackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/@lit/reactive-element/package.json`, 
        `${outputPath}/node_modules/@lit/reactive-element/`
      );

      await runner.setup(outputPath, [
        ...getSetupFiles(outputPath),
        ...lit,
        ...litPackageJson,
        ...litDirectives,
        ...litDecorators,
        ...litElementPackageJson,
        ...litElement,
        ...litElementDecorators,
        ...litHtmlPackageJson,
        ...litHtml,
        ...litHtmlDirectives,
        ...trustedTypes,
        ...litReactiveElement,
        ...litReactiveElementDecorators,
        ...litReactiveElementPackageJson
      ]);

      return new Promise(async (resolve) => {
        setTimeout(() => {
          resolve();
        }, 10000);

        await runner.runCommand(cliPath, 'serve');
      });
    });

    runSmokeTest(['public', 'index'], LABEL);

    let response = {};
    let dom;
    let aboutPageGraphData;

    before(async function() {
      const graph = JSON.parse(await fs.promises.readFile(path.join(outputPath, 'public/graph.json'), 'utf-8'));

      aboutPageGraphData = graph.filter(page => page.route === '/artists/')[0];

      return new Promise((resolve, reject) => {
        request.get(`${hostname}/artists/`, (err, res, body) => {
          if (err) {
            reject();
          }

          response = res;
          response.body = body;
          dom = new JSDOM(body);

          resolve();
        });
      });
    });

    describe('Serve command with HTML route response', function() {

      it('should return a 200 status', function(done) {
        expect(response.statusCode).to.equal(200);
        done();
      });

      it('should return the correct content type', function(done) {
        expect(response.headers['content-type']).to.contain('text/html');
        done();
      });

      it('should return a response body', function(done) {
        expect(response.body).to.not.be.undefined;
        done();
      });

      it('the response body should be valid HTML from JSDOM', function(done) {
        expect(dom).to.not.be.undefined;
        done();
      });

      it('should have one style tags', function() {
        const styles = dom.window.document.querySelectorAll('head > style');

        expect(styles.length).to.equal(1);
      });

      it('should have three script tags', function() {
        const scripts = dom.window.document.querySelectorAll('head > script');

        expect(scripts.length).to.equal(3);
      });

      it('should have expected SSR content from the non module script tag', function() {
        const scripts = Array.from(dom.window.document.querySelectorAll('head > script'))
          .filter(tag => !tag.getAttribute('type'));

        expect(scripts.length).to.equal(1);
        expect(scripts[0].textContent).to.contain('console.log');
      });

      it('should have a bundled script for the footer component', function() {
        const footerScript = Array.from(dom.window.document.querySelectorAll('head > script[type]'))
          .filter(script => (/footer.*[a-z0-9].js/).test(script.src));

        expect(footerScript.length).to.be.equal(1);
        expect(footerScript[0].type).to.be.equal('module');
      });

      it('should have the expected number of table rows of content', function() {
        const rows = dom.window.document.querySelectorAll('body > table tr');

        expect(rows.length).to.equal(11);
      });

      it('should have the expected <title> content in the <head>', function() {
        const title = dom.window.document.querySelectorAll('head > title');

        expect(title.length).to.equal(1);
        expect(title[0].textContent).to.equal('/artists/');
      });

      it('should have custom metadata in the <head>', function() {
        const metaDescription = Array.from(dom.window.document.querySelectorAll('head > meta'))
          .filter((tag) => tag.getAttribute('name') === 'description');

        expect(metaDescription.length).to.equal(1);
        expect(metaDescription[0].getAttribute('content')).to.equal('/artists/ (this was generated server side!!!)');
      });

      it('should be a part of graph.json', function() {
        expect(aboutPageGraphData).to.not.be.undefined;
      });

      it('should have the expected menu and index values in the graph', function() {
        expect(aboutPageGraphData.data.menu).to.equal('navigation');
        expect(aboutPageGraphData.data.index).to.equal(7);
      });

      it('should have expected custom data values in its graph data', function() {
        expect(aboutPageGraphData.data.author).to.equal('Project Evergreen');
        expect(aboutPageGraphData.data.date).to.equal('01-01-2021');
      });

      it('should append the expected <script> tag for a frontmatter import <x-counter> component', function() {
        const componentName = 'counter';
        const counterScript = Array.from(dom.window.document.querySelectorAll('head > script[src]'))
          .filter((tag) => tag.getAttribute('src').indexOf(`/${componentName}.`) === 0);

        expect(aboutPageGraphData.imports[0]).to.equal(`/components/${componentName}.js`);
        expect(counterScript.length).to.equal(1);
      });
    });
  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
    runner.stopCommand();
  });

});