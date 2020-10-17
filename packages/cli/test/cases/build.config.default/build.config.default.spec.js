/*
 * Use Case
 * Run Greenwood with empty config object and default workspace.
 *
 * Uaer Result
 * Should generate a bare bones Greenwood build.  (same as build.default.spec.js)
 *
 * User Command
 * greenwood build
 *
 * User Config
 * {}
 *
 * User Workspace
 * Greenwood default (src/)
 */
const runSmokeTest = require('../../../../../test/smoke-test');
const TestBed = require('../../../../../test/test-bed');

describe.only('Build Greenwood With: ', function() {
  const LABEL = 'Empty Configuration and Default Workspace';
  let setup;

  before(async function() {
    setup = new TestBed();
    this.context = await setup.setupTestBed(__dirname);
  });

  describe(LABEL, function() {
    before(async function() {
      await setup.runGreenwoodCommand('build');
    });
    // TODO runSmokeTest(['public', 'index', 'not-found', 'hello'], LABEL);
    runSmokeTest(['public', 'index'], LABEL);
  });

  after(function() {
    setup.teardownTestBed();
  });
});