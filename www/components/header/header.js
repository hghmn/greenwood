import { css, html, LitElement, unsafeCSS } from 'lit-element';
// import client from '@greenwood/cli/data/client';
// import MenuQuery from '@greenwood/cli/data/queries/menu';
import '@evergreen-wc/eve-container';
import headerCss from './header.css';
// TODO import evergreenLogo from '../../assets/evergreen.svg';
import '../social-icons/social-icons.js';

class HeaderComponent extends LitElement {

  static get properties() {
    return {
      navigation: {
        type: Array
      }
    };
  }

  static get styles() {
    return css`
      ${unsafeCSS(headerCss)}
    `;
  }

  constructor() {
    super();
    this.navigation = [];
  }

  // TODO async connectedCallback() {
  //   super.connectedCallback();

  //   const response = await client.query({
  //     query: MenuQuery,
  //     variables: {
  //       name: 'navigation',
  //       order: 'index_asc'
  //     }
  //   });

  //   this.navigation = response.data.menu.children;
  // }

  /* eslint-disable indent */
  render() {
    const { navigation } = this;

    return html`
      <header class="header">
        <eve-container fluid>
          <div class="head-wrap">

            <div class="brand">
              <a href="https://projectevergreen.github.io" target="_blank" rel="noopener noreferrer"
                onclick="getOutboundLink('https://projectevergreen.github.io');">
                <img src="../../assets/evergreen.svg" alt="Greenwood logo"/>
              </a>
              <div class="project-name">
                <a href="/">Greenwood</a>
              </div>
            </div>

            <nav>
              <ul>
                ${navigation.map(({ item }) => {
                  return html`
                    <li><a href="${item.link}" title="Click to visit the ${item.label} page">${item.label}</a></li>
                  `;
                })}
              </ul>
            </nav>

            <app-social-icons></app-social-icons>

          </div>
        </eve-container>
      </header>
    `;
    /* eslint-enable */
  }
}

customElements.define('app-header', HeaderComponent);