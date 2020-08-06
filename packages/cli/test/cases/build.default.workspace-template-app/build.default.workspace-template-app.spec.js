/*
 * Use Case
 * Run Greenwood build command with no config and custom app template.
 *
 * User Result
 * Should generate a bare bones Greenwood build with custom app template.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * None (Greenwood Default)
 *
 * User Workspace
 * src/
 *   templates/
 *     app-template.js
 */
const expect = require('chai').expect;
const fs = require('fs');
const { JSDOM } = require('jsdom');
const path = require('path');
const TestBed = require('../../../../../test/test-bed');

const mainBundleScriptRegex = /index.*.bundle\.js/;

describe('Build Greenwood With: ', function() {
  const LABEL = 'Default Greenwood Configuration and Workspace w/Custom App Template';
  let setup;

  before(async function() {
    setup = new TestBed();
    this.context = await setup.setupTestBed(__dirname);
  });

  describe(LABEL, function() {
    let dom;

    before(async function() {
      await setup.runGreenwoodCommand('build');
    });

    runSmokeTest(['public', 'not-found', 'hello'], LABEL);

    describe('Custom Index (Home) page', function() {
      const indexPageHeading = 'Greenwood';
      const indexPageBody = 'This is the home page built by Greenwood. Make your own pages in src/pages/index.js!';
      let dom;

      beforeEach(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'index.html'));
      });

      it('should have the default config title in the <title> tag in the <head>', function() {
        const title = dom.window.document.querySelector('head title').textContent;

        expect(title).to.be.equal('My App');
      });

      it('should have one <script> tag in the <body> for the main bundle', function() {
        const scriptTags = dom.window.document.querySelectorAll('body > script');
        const bundledScript = Array.prototype.slice.call(scriptTags).filter(script => {
          const src = script.src.replace('file:///', '');

          return mainBundleScriptRegex.test(src);
        });

        expect(bundledScript.length).to.be.equal(1);
      });

      it('should have one <script> tag for Apollo state', function() {
        const scriptTags = dom.window.document.querySelectorAll('script');
        const bundleScripts = Array.prototype.slice.call(scriptTags).filter(script => {
          return script.getAttribute('data-state') === 'apollo';
        });

        expect(bundleScripts.length).to.be.equal(1);
      });

      it('should have only one <script> tag in the <head>', function() {
        const scriptTags = dom.window.document.querySelectorAll('head > script');

        expect(scriptTags.length).to.be.equal(1);
      });

      it('should have a router outlet tag in the <body>', function() {
        const outlet = dom.window.document.querySelectorAll('body app-root');

        expect(outlet.length).to.be.equal(1);
      });

      // no 404 route in our custom app-template.js, like greenwood does
      it('should have the correct route tags in the <body>', function() {
        const routes = dom.window.document.querySelectorAll('body lit-route');

        expect(routes.length).to.be.equal(2);
      });

      it('should have the expected heading text within the index page in the public directory', function() {
        const heading = dom.window.document.querySelector('h3').textContent;

        expect(heading).to.equal(indexPageHeading);
      });

      it('should have the expected paragraph text within the index page in the public directory', function() {
        let paragraph = dom.window.document.querySelector('p').textContent;

        expect(paragraph).to.equal(indexPageBody);
      });
    });

    describe('Custom App Template', function() {
      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'index.html'));
      });

      it('should output a single index.html file using our custom app template', function() {
        expect(fs.existsSync(path.join(this.context.publicDir, './index.html'))).to.be.true;
      });

      it('should have the specific element we added as part of our custom app template', function() {
        const customParagraph = dom.window.document.querySelector('p#custom-app-template').textContent;

        expect(customParagraph).to.equal('My Custom App Template');
      });
    });
  });

  after(function() {
    setup.teardownTestBed();
  });
});