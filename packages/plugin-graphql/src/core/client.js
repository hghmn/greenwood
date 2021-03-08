import { getQueryHash } from '@greenwood/plugin-graphql/core/common';
import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client/core';

const client = new ApolloClient({
  cache: new InMemoryCache(),
  link: new HttpLink({
    uri: 'http://localhost:4000'
  })
});
const APOLLO_STATE = window.__APOLLO_STATE__; // eslint-disable-line no-underscore-dangle
const backupQuery = client.query;

client.query = (params) => {
  if (APOLLO_STATE) {
    // __APOLLO_STATE__ defined, in production mode
    // TODO convert query hash back    
    const queryHash = getQueryHash(params.query, params.variables);
    const cachePath = `/${queryHash}-cache.json`;
    
    return fetch(cachePath)
      .then(response => response.json())
      .then((response) => {
        // mock client.query response
        return {
          data: new InMemoryCache().restore(response).readQuery(params)
        };
      });
  } else {
    // __APOLLO_STATE__ NOT defined, in development mode
    return backupQuery(params);
  }
};

export default client;