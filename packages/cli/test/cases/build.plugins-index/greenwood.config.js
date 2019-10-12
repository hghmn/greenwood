module.exports = {
  
  plugins: [{
    type: 'index',
    provider: () => {
      return {
        hookGreenwoodAnalytics: `
          <div class="hook-analytics">
            <!-- TODO analytics code here -->
          </div>
        `
      };
    }
  }, {
    type: 'index',
    provider: () => {
      return {
        hookGreenwoodPolyfills: `
          <!-- 
            this covers custom overriding since polyfills are on by default already
            so for this test, we actully need to load something that works with puppeterr + JSDOM 
          -->
          <div class="hook-polyfills">
            <script src="//cdnjs.cloudflare.com/ajax/libs/webcomponentsjs/2.2.7/webcomponents-bundle.js"></script>
          </div>
        `
      };
    }
  }]
  
};