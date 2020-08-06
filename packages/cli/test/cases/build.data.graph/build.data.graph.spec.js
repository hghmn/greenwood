/*
 * Use Case
 * Run Greenwood build command with GraphQL calls to get data about the projects graph.  This will test various 
 * permutations of Children, Menu, and Graph calls, simulating a site of blog posts.
 *
 * User Result
 * Should generate a Greenwood build that dynamically serializes data from the graph from the header and in the page-template.
 *
 * User Command
 * greenwood build
 *
 * Default Config
 *
 * Custom Workspace
 * src/
 *   components/
 *     header.js
 *   pages/
 *     blog/
 *       first-post/
 *         index.md
 *       second-post/
 *         index.md
 *     index.md
 *   templates/
 *     app-template.js
 *     blog-template.js
 *     post-template.js
 */
const expect = require('chai').expect;
const fs = require('fs');
const glob = require('glob-promise');
const { JSDOM } = require('jsdom');
const path = require('path');
const TestBed = require('../../../../../test/test-bed');

const mainBundleScriptRegex = /index.*.bundle\.js/;

describe('Build Greenwood With: ', function() {
  const LABEL = 'Data from GraphQL';
  const apolloStateRegex = /window.__APOLLO_STATE__ = true/;
  let setup;

  before(async function() {
    setup = new TestBed();
    this.context = await setup.setupTestBed(__dirname);
  });

  describe(LABEL, function() {

    before(async function() {
      await setup.runGreenwoodCommand('build');
    });

    runSmokeTest(['public', 'not-found'], LABEL);

    describe('Home (Page Template) w/ Navigation Query', function() {
      beforeEach(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'index.html'));
      });

      it('should create a public directory', function() {
        expect(fs.existsSync(this.context.publicDir)).to.be.true;
      });

      it('should output an index.html file (home page)', function() {
        expect(fs.existsSync(path.join(this.context.publicDir, './index.html'))).to.be.true;
      });

      it('should output a single 404.html file (not found page)', function() {
        expect(fs.existsSync(path.join(this.context.publicDir, './404.html'))).to.be.true;
      });

      it('should output one JS bundle file', async function() {
        expect(await glob.promise(path.join(this.context.publicDir, './index.*.bundle.js'))).to.have.lengthOf(1);
      });

      it('should output a (partial) *-cache.json file, one per each query made', async function() {
        expect(await glob.promise(path.join(this.context.publicDir, './*-cache.json'))).to.have.lengthOf(5);
      });

      it('should output a (partial) *-cache.json files, one per each query made, that are all defined', async function() {
        const cacheFiles = await glob.promise(path.join(this.context.publicDir, './*-cache.json'));

        cacheFiles.forEach(file => {
          const cache = require(file);

          expect(cache).to.not.be.undefined;
        });
      });

      it('should have one <script> tag in the <body> for the main bundle', function() {
        const scriptTags = dom.window.document.querySelectorAll('body > script');
        const bundledScript = Array.prototype.slice.call(scriptTags).filter(script => {
          const src = script.src.replace('file:///', '');

          return mainBundleScriptRegex.test(src);
        });

        expect(bundledScript.length).to.be.equal(1);
      });

      it('should have one window.__APOLLO_STATE__ <script> with (approximated) expected state', () => {
        const scriptTags = dom.window.document.querySelectorAll('script');
        const apolloScriptTags = Array.prototype.slice.call(scriptTags).filter(script => {
          return script.getAttribute('data-state') === 'apollo';
        });
        const innerHTML = apolloScriptTags[0].innerHTML;

        expect(apolloScriptTags.length).to.equal(1);
        expect(innerHTML).to.match(apolloStateRegex);
      });

      it('should have only one <script> tag in the <head>', function() {
        const scriptTags = dom.window.document.querySelectorAll('head > script');

        expect(scriptTags.length).to.be.equal(1);
      });

      it('should have a <header> tag in the <body>', function() {
        const header = dom.window.document.querySelectorAll('body header');

        expect(header.length).to.be.equal(1);
      });

      it('should have a expected NavigationQuery output in the <header> tag', function() {
        const listItems = dom.window.document.querySelectorAll('body header ul li');
        const link1 = listItems[0].querySelector('a');
        const link2 = listItems[1].querySelector('a');

        expect(listItems.length).to.be.equal(2);
        
        expect(link1.href.replace('file://', '')).to.be.equal('/blog/first-post/');
        expect(link1.title).to.be.equal('Click to visit the First blog post');
        expect(link1.innerHTML).to.contain('First');

        expect(link2.href.replace('file://', '')).to.be.equal('/blog/second-post/');
        expect(link2.title).to.be.equal('Click to visit the Second blog post');
        expect(link2.innerHTML).to.contain('Second');
      });
    });

    describe('Blog Page (Template) w/ Navigation and Children Query', function() {
      beforeEach(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'blog', 'index.html'));
      });

      it('should output an index.html file (first post page)', function() {
        expect(fs.existsSync(path.join(this.context.publicDir, 'blog', 'index.html'))).to.be.true;
      });

      it('should have one <script> tag in the <body> for the main bundle', function() {
        const scriptTags = dom.window.document.querySelectorAll('body > script');
        const bundledScript = Array.prototype.slice.call(scriptTags).filter(script => {
          const src = script.src.replace('file:///', '');

          return mainBundleScriptRegex.test(src);
        });

        expect(bundledScript.length).to.be.equal(1);
      });

      it('should have one window.__APOLLO_STATE__ <script> with (approximated) expected state', () => {
        const scriptTags = dom.window.document.querySelectorAll('script');
        const apolloScriptTags = Array.prototype.slice.call(scriptTags).filter(script => {
          return script.getAttribute('data-state') === 'apollo';
        });
        const innerHTML = apolloScriptTags[0].innerHTML;

        expect(apolloScriptTags.length).to.equal(1);
        expect(innerHTML).to.match(apolloStateRegex);
      });

      it('should have only one <script> tag in the <head>', function() {
        const scriptTags = dom.window.document.querySelectorAll('head > script');

        expect(scriptTags.length).to.be.equal(2);
      });

      it('should have a <header> tag in the <body>', function() {
        const header = dom.window.document.querySelectorAll('body header');

        expect(header.length).to.be.equal(1);
      });

      it('should have expected navigation links in the <header> tag tag when using NavigationQuery', function() {
        const listItems = dom.window.document.querySelectorAll('body header ul li');
        const link1 = listItems[0].querySelector('a');
        const link2 = listItems[1].querySelector('a');

        expect(listItems.length).to.be.equal(2);
        
        expect(link1.href.replace('file://', '')).to.be.equal('/blog/first-post/');
        expect(link1.title).to.be.equal('Click to visit the First blog post');
        expect(link1.innerHTML).to.contain('First');

        expect(link2.href.replace('file://', '')).to.be.equal('/blog/second-post/');
        expect(link2.title).to.be.equal('Click to visit the Second blog post');
        expect(link2.innerHTML).to.contain('Second');
      });

      it('should have expected blog posts links in the <body> tag when using ChildrenQuery', function() {
        const listItems = dom.window.document.querySelectorAll('body div.posts ul li');
        const linkItems = dom.window.document.querySelectorAll('body div.posts ul li a');

        expect(listItems.length).to.be.equal(2);
        expect(linkItems.length).to.be.equal(2);

        const link1 = linkItems[0];
        const link2 = linkItems[1];

        expect(link1.href.replace('file://', '')).to.be.equal('/blog/first-post/');
        expect(link1.title).to.be.equal('Click to read my First blog post');
        expect(link1.innerHTML).to.contain('First');

        expect(link2.href.replace('file://', '')).to.be.equal('/blog/second-post/');
        expect(link2.title).to.be.equal('Click to read my Second blog post');
        expect(link2.innerHTML).to.contain('Second');
      });
    });

    describe('Blog Post Pages (Post Template) w/ custom Graph Query', function() {
      let dom2;

      // just use one post page for the generic tests here
      beforeEach(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'blog', 'first-post', 'index.html'));
        dom2 = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'blog', 'second-post', 'index.html'));
      });

      it('should output an index.html file for first blog post page', function() {
        expect(fs.existsSync(path.join(this.context.publicDir, 'blog', 'first-post', 'index.html'))).to.be.true;
      });

      it('should have one window.__APOLLO_STATE__ <script> with (approximated) expected state', () => {
        const scriptTags = dom.window.document.querySelectorAll('script');
        const apolloScriptTags = Array.prototype.slice.call(scriptTags).filter(script => {
          return script.getAttribute('data-state') === 'apollo';
        });
        const innerHTML = apolloScriptTags[0].innerHTML;

        expect(apolloScriptTags.length).to.equal(1);
        expect(innerHTML).to.match(apolloStateRegex);
      });

      it('should have a <header> tag in the <body>', function() {
        const header = dom.window.document.querySelectorAll('body header');

        expect(header.length).to.be.equal(1);
      });

      it('should have expected navigation links in the <header> tag tag when using NavigationQuery', function() {
        const listItems = dom.window.document.querySelectorAll('body header ul li');
        const link = listItems[0].querySelector('a');

        expect(listItems.length).to.be.equal(2);
        expect(link.href.replace('file://', '')).to.be.equal('/blog/first-post/');
        expect(link.title).to.be.equal('Click to visit the First blog post');
        expect(link.innerHTML).to.contain('First');
      });

      it('should have expected date in the <body> tag when using custom GraphQuery', function() {
        const date = dom.window.document.querySelectorAll('body p.date');

        expect(date.length).to.be.equal(1);
        expect(date[0].innerHTML).to.contain('Posted on 07.08.2020');
      });

      it('should have expected date in the <body> tag when using custom GraphQuery', function() {
        const date = dom2.window.document.querySelectorAll('body p.date');

        expect(date.length).to.be.equal(1);
        expect(date[0].innerHTML).to.contain('Posted on 07.09.2020');
      });
    });

  });

  after(function() {
    setup.teardownTestBed();
  });

});