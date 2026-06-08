describe('Collection', () => {
  const rarityFilter = () =>
    cy.contains('div', 'Card Rarity Category').parent();

  const statusFilter = () =>
    cy.contains('div', 'Card Status').parent();

  const pageCounter = () => cy.get('#root span.text-xl');
  const nextButton = () => cy.get('#root div.ml-4 button:nth-child(3)');

  const selectFilter = (
    filter: () => Cypress.Chainable<JQuery<HTMLElement>>,
    option: string,
  ) => {
    filter().within(() => {
      cy.contains('button', option).click();
    });
  };

  const assertSelectedFilter = (
    filter: () => Cypress.Chainable<JQuery<HTMLElement>>,
    selectedOption: string,
    inactiveOption: string,
  ) => {
    filter().within(() => {
      cy.contains('button', selectedOption)
        .should('have.class', 'bg-morado-lakers')
        .and('not.have.class', 'bg-Gris-Oscuro');

      cy.contains('button', inactiveOption)
        .should('have.class', 'bg-Gris-Oscuro')
        .and('not.have.class', 'bg-morado-lakers');
    });
  };

  beforeEach(() => {
    cy.intercept('POST', '**/auth/v1/token?grant_type=password').as('login');
    cy.intercept('POST', '**/rest/v1/rpc/collection_summary').as('getCollectionSummary');
    cy.intercept('POST', '**/rest/v1/rpc/card_collection').as('cardCollection');

    cy.visit('https://sharkinovhomecourt.vercel.app/login');
    cy.get('input[placeholder="Email"]').type('lakerFan@lakerscourt.com');
    cy.get('input[placeholder="Password"]').type('abc123');
    cy.get('button.text-white').click();
    cy.wait('@login').its('response.statusCode').should('eq', 200);

    cy.visit('https://sharkinovhomecourt.vercel.app/collection');
    cy.wait('@getCollectionSummary');
    cy.wait('@cardCollection');
    cy.contains('h1, h2, h3', 'Lakers Cards Collection').should('be.visible');
  });

  describe('Carga inicial y navegación', () => {
    it('muestra toda la colección y habilita la navegación', () => {
      assertSelectedFilter(rarityFilter, 'All', 'Limited');
      pageCounter().should('contain.text', '1 / 9');
      nextButton().should('not.be.disabled');

      cy.get('#root div:nth-child(1) > div.outline > div.font-semibold')
        .should('contain.text', 'Austin Reaves');
      cy.get('#root div:nth-child(1) > div.outline > div:nth-child(3) > div.text-base')
        .should('contain.text', 'Common');
      cy.get('#root div:nth-child(2) div.outline div.font-semibold')
        .should('contain.text', 'Derek Fisher Bouncing');
      cy.get('#root div:nth-child(2) div.outline div:nth-child(3) div.text-base')
        .should('contain.text', 'Common');
    });
  });

  describe('Filtros por rareza', () => {
    it('filtra las cartas Common', () => {
      selectFilter(rarityFilter, 'Common');

      assertSelectedFilter(rarityFilter, 'Common', 'All');
      pageCounter().should('contain.text', '1 / 4');
    });

    it('regresa de Common a todas las rarezas', () => {
      selectFilter(rarityFilter, 'Common');
      selectFilter(rarityFilter, 'All');

      assertSelectedFilter(rarityFilter, 'All', 'Common');
      pageCounter().should('contain.text', '1 / 9');
    });

    it('filtra las cartas Rare', () => {
      selectFilter(rarityFilter, 'Rare');

      assertSelectedFilter(rarityFilter, 'Rare', 'All');
      pageCounter().should('contain.text', '1 / 3');
    });

    it('filtra las cartas Legendary', () => {
      selectFilter(rarityFilter, 'Legendary');

      assertSelectedFilter(rarityFilter, 'Legendary', 'Rare');
      pageCounter().should('contain.text', '1 / 4');
    });

    it('filtra las cartas Limited y deshabilita el botón siguiente', () => {
      selectFilter(rarityFilter, 'Limited');

      assertSelectedFilter(rarityFilter, 'Limited', 'Legendary');
      pageCounter().should('contain.text', '1 / 1');
      nextButton().should('be.disabled');
    });
  });

  describe('Filtros por estado', () => {
    it('muestra el estado vacío cuando no hay cartas Unlocked', () => {
      selectFilter(statusFilter, 'Unlocked');

      assertSelectedFilter(statusFilter, 'Unlocked', 'All');
      cy.get('#root p.text-center')
        .should('contain.text', 'No cards matching specified filters.');
    });

    it('cambia el filtro de Unlocked a Locked', () => {
      selectFilter(statusFilter, 'Unlocked');
      selectFilter(statusFilter, 'Locked');

      assertSelectedFilter(statusFilter, 'Locked', 'Unlocked');
    });

    it('regresa de Locked a todos los estados', () => {
      selectFilter(statusFilter, 'Locked');
      selectFilter(statusFilter, 'All');

      assertSelectedFilter(statusFilter, 'All', 'Locked');
    });

    it('Quit card from deck', function() {
      cy.get('#root div:nth-child(3) div.grid button:nth-child(5)').click();
      // The card count changed from '1 / 9' to '1 / 1'.
      cy.get('#root span.text-xl')
        .should('contain.text', '1 / 1')
      // The navigation button is now disabled.
      cy.get('#root div.ml-4 button:nth-child(3)')
        .should('have.attr', 'disabled')
      
      cy.get('#root div:nth-child(3) span:nth-child(2)').click();
      // A toast message appeared: 'Remove from Dunk Royale deck first'
      cy.get('#root div.absolute.items-center')
        .should('be.visible')
      
    });
  });
});
