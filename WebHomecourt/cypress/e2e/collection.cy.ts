describe('collection page', () => {
  it('loads and lets the user interact with filters', () => {
    cy.intercept('POST', '**/rest/v1/rpc/collection_summary').as('getCollectionSummary');
    cy.intercept('POST', '**/rest/v1/rpc/card_collection').as('cardCollection');
    
    cy.visit('https://sharkinovhomecourt.vercel.app/login');
    cy.get('input[placeholder="Email"]').type('lakerFan@lakerscourt.com');
    cy.get('input[placeholder="Password"]').type('abc123');
    cy.get('button.text-white').click();
    
    cy.visit('https://sharkinovhomecourt.vercel.app/collection');
    cy.get('#root div:nth-child(1) > div.grid > button:nth-child(2)').click();
    // The 'All' filter button is no longer active.
    cy.get('#root div:nth-child(1) > div.grid > button:nth-child(1)')
      .should(($el) => {
        expect($el).to.have.class('bg-Gris-Oscuro')
        expect($el).to.not.have.class('bg-morado-lakers')
      })
    // The 'Common' filter button is now active.
    cy.get('#root div:nth-child(1) > div.grid > button:nth-child(2)')
      .should(($el) => {
        expect($el).to.have.class('bg-morado-lakers')
        expect($el).to.not.have.class('bg-Gris-Oscuro')
      })
    // The displayed item count updated from 1/9 to 1/4.
    cy.get('#root span.text-xl')
      .should('contain.text', '1 / 4')
    
    cy.get('#root div:nth-child(1) > div.grid > button:nth-child(1)').click();
    // The 'All' filter button is now active.
    cy.get('#root div:nth-child(1) > div.grid > button:nth-child(1)')
      .should(($el) => {
        expect($el).to.have.class('bg-morado-lakers')
        expect($el).to.not.have.class('bg-Gris-Oscuro')
      })
    // The 'Common' filter button is no longer active.
    cy.get('#root div:nth-child(1) > div.grid > button:nth-child(2)')
      .should(($el) => {
        expect($el).to.have.class('bg-Gris-Oscuro')
        expect($el).to.not.have.class('bg-morado-lakers')
      })
    // The displayed item count updated from 1/4 to 1/9.
    cy.get('#root span.text-xl')
      .should('contain.text', '1 / 9')
    
    cy.get('#root div:nth-child(1) > div.grid > button:nth-child(2)').click();
    // The 'All' filter button changed from active to inactive.
    cy.get('#root div:nth-child(1) > div.grid > button:nth-child(1)')
      .should(($el) => {
        expect($el).to.have.class('bg-Gris-Oscuro')
        expect($el).to.not.have.class('bg-morado-lakers')
      })
    // The 'Common' filter button changed from inactive to active.
    cy.get('#root div:nth-child(1) > div.grid > button:nth-child(2)')
      .should(($el) => {
        expect($el).to.have.class('bg-morado-lakers')
        expect($el).to.not.have.class('bg-Gris-Oscuro')
      })
    // The displayed item count changed from '1 / 9' to '1 / 4'.
    cy.get('#root span.text-xl')
      .should('contain.text', '1 / 4')
    
    cy.get('#root div:nth-child(1) > div.grid > button:nth-child(3)').click();
    // The 'All' filter button is no longer active.
    cy.get('#root div:nth-child(1) > div.grid > button:nth-child(2)')
      .should(($el) => {
        expect($el).to.have.class('bg-Gris-Oscuro')
        expect($el).to.not.have.class('bg-morado-lakers')
      })
    // The 'Common' filter button is now active.
    cy.get('#root div:nth-child(1) > div.grid > button:nth-child(3)')
      .should(($el) => {
        expect($el).to.have.class('bg-morado-lakers')
        expect($el).to.not.have.class('bg-Gris-Oscuro')
      })
    // The displayed item count updated from 1/4 to 1/3.
    cy.get('#root span.text-xl')
      .should('contain.text', '1 / 3')
    
    cy.get('#root div:nth-child(1) > div.grid > button:nth-child(4)').click();
    // The 'All' filter button changed from active to inactive.
    cy.get('#root div:nth-child(1) > div.grid > button:nth-child(3)')
      .should(($el) => {
        expect($el).to.have.class('bg-Gris-Oscuro')
        expect($el).to.not.have.class('bg-morado-lakers')
      })
    // The 'Rare' filter button changed from inactive to active.
    cy.get('#root div:nth-child(1) > div.grid > button:nth-child(4)')
      .should(($el) => {
        expect($el).to.have.class('bg-morado-lakers')
        expect($el).to.not.have.class('bg-Gris-Oscuro')
      })
    // The displayed item count changed from '1 / 3' to '1 / 4'.
    cy.get('#root span.text-xl')
      .should('contain.text', '1 / 4')
    
    cy.get('#root div:nth-child(1) > div.grid > button:nth-child(5)').click();
    // The 'All' filter button is no longer active.
    cy.get('#root div:nth-child(1) > div.grid > button:nth-child(4)')
      .should(($el) => {
        expect($el).to.have.class('bg-Gris-Oscuro')
        expect($el).to.not.have.class('bg-morado-lakers')
      })
    // The 'Common' filter button is now active.
    cy.get('#root div:nth-child(1) > div.grid > button:nth-child(5)')
      .should(($el) => {
        expect($el).to.have.class('bg-morado-lakers')
        expect($el).to.not.have.class('bg-Gris-Oscuro')
      })
    // The displayed item count updated from '1 / 4' to '1 / 1'.
    cy.get('#root span.text-xl')
      .should('contain.text', '1 / 1')
    // The 'Next' button is now disabled.
    cy.get('#root div.ml-4 button:nth-child(3)')
      .should('have.attr', 'disabled')
    
    cy.get('#root div:nth-child(3) div.grid button:nth-child(2)').click();
    // The 'All' filter button is no longer active.
    cy.get('#root div:nth-child(3) div.grid button:nth-child(1)')
      .should(($el) => {
        expect($el).to.have.class('bg-Gris-Oscuro')
        expect($el).to.not.have.class('bg-morado-lakers')
      })
    // The 'Common' filter button is now active.
    cy.get('#root div:nth-child(3) div.grid button:nth-child(2)')
      .should(($el) => {
        expect($el).to.have.class('bg-morado-lakers')
        expect($el).to.not.have.class('bg-Gris-Oscuro')
      })
    // A message indicating that no cards match the specified filters is now displayed.
    cy.get('#root p.text-center')
      .should('contain.text', 'No cards matching specified filters.')
    
    cy.get('#root div:nth-child(3) div.grid button:nth-child(3)').click();
    // The 'Common' filter button is no longer active.
    cy.get('#root div:nth-child(3) div.grid button:nth-child(2)')
      .should(($el) => {
        expect($el).to.have.class('bg-Gris-Oscuro')
        expect($el).to.not.have.class('bg-morado-lakers')
      })
    // The 'Limited' filter button is now active.
    cy.get('#root div:nth-child(3) div.grid button:nth-child(3)')
      .should(($el) => {
        expect($el).to.have.class('bg-morado-lakers')
        expect($el).to.not.have.class('bg-Gris-Oscuro')
      })
    
    cy.get('#root div:nth-child(3) div.grid button:nth-child(1)').click();
    // The 'All' filter button is now active.
    cy.get('#root div:nth-child(3) div.grid button:nth-child(1)')
      .should(($el) => {
        expect($el).to.have.class('bg-morado-lakers')
        expect($el).to.not.have.class('bg-Gris-Oscuro')
      })
    // The 'Limited' filter button is no longer active.
    cy.get('#root div:nth-child(3) div.grid button:nth-child(3)')
      .should(($el) => {
        expect($el).to.have.class('bg-Gris-Oscuro')
        expect($el).to.not.have.class('bg-morado-lakers')
      })
    
    cy.get('#root div:nth-child(1) > div.grid > button:nth-child(1)').click();
    // The 'All' filter button is now active.
    cy.get('#root div:nth-child(1) > div.grid > button:nth-child(1)')
      .should(($el) => {
        expect($el).to.have.class('bg-morado-lakers')
        expect($el).to.not.have.class('bg-Gris-Oscuro')
      })
    // The 'Limited' filter button is no longer active.
    cy.get('#root div:nth-child(1) > div.grid > button:nth-child(5)')
      .should(($el) => {
        expect($el).to.have.class('bg-Gris-Oscuro')
        expect($el).to.not.have.class('bg-morado-lakers')
      })
    // The displayed item count updated from '1 / 1' to '1 / 9'.
    cy.get('#root span.text-xl')
      .should('contain.text', '1 / 9')
    // The 'Next' button is now enabled.
    cy.get('#root div.ml-4 button:nth-child(3)')
      .should('not.have.attr', 'disabled')
    // The card title changed to 'Austin Reaves'.
    cy.get('#root div:nth-child(1) > div.outline > div.font-semibold')
      .should('contain.text', 'Austin Reaves')
    // The card's rarity changed to 'Common'.
    cy.get('#root div:nth-child(1) > div.outline > div:nth-child(3) > div.text-base')
      .should('contain.text', 'Common')
    // The card title changed to 'Derek Fisher Bouncing'.
    cy.get('#root div:nth-child(2) div.outline div.font-semibold')
      .should('contain.text', 'Derek Fisher Bouncing')
    // The card's rarity changed to 'Common'.
    cy.get('#root div:nth-child(2) div.outline div:nth-child(3) div.text-base')
      .should('contain.text', 'Common')
    
  });
});