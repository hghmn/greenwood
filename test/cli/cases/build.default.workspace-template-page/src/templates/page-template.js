import { html, LitElement } from 'lit-element';
MDIMPORT;
METAIMPORT;
METADATA;

class PageTemplate extends LitElement {
  render() {
    return html`
      METAELEMENT
      <div class='wrapper'>
        <div class='page-template blog-content content owen-test'>
          <entry></entry>
        </div>
      </div>
    `;
  }
}

customElements.define('page-template', PageTemplate);