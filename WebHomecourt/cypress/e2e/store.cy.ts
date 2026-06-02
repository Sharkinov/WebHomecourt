describe('template spec', () => {
  it('passes', () => {
    cy.visit('https://sharkinovhomecourt.vercel.app/login')
    cy.get('#root input[placeholder="Email"]').click();
    cy.get('#root input[placeholder="Email"]').type('lakerFan@lakerscourt.com');
    cy.get('#root input[placeholder="Password"]').click();
    cy.get('#root input[placeholder="Password"]').type('abc123');
    cy.get('#root button.text-white').click();
    // The 'Sign-in' button text changed to 'Signing-in'.
    cy.get('#root button.text-white')
      .should('contain.text', 'Signing-in')
    
    cy.get('#root div.lg\\:gap-8 button:nth-child(6)').click();
    // Page URL changed.
    cy.url()
      .should('eq', 'https://sharkinovhomecourt.vercel.app/store')
    // The title of the page changed to 'Lakers Cards Store'.
    cy.get('#root h1.text-zinc-100')
      .should('contain.text', 'Lakers Cards Store')
    // A description of the Lakers Cards Store is now visible.
    cy.get('#root h5.mt-2')
      .should('contain.text', 'Unlock more cards featuring your favorite players and improve your Dunk Royale game deck')
    // The 'STORE' button is now visible and active.
    cy.get('#root button.bg-morado-lakers')
      .should('contain.text', 'STORE')
    // The 'COLLECTION' button is now visible but inactive.
    cy.get('#root button.bg-transparent')
      .should('contain.text', 'COLLECTION')
    
    cy.get('#root div:nth-child(6) span:nth-child(3)').click();
    // A modal dialog titled 'Open the pack!' has appeared.
    cy.get('#root div.fixed.flex')
      .should('be.visible')
    // The modal dialog title is 'Open the pack!'.
    cy.get('#root h2.text-white')
      .should(($el) => {
        expect($el).to.be.visible
        expect($el).to.contain.text('Open the pack!')
      })
    // The modal dialog displays 'April 2026 Recap'.
    cy.get('#root p.text-white')
      .should(($el) => {
        expect($el).to.be.visible
        expect($el).to.contain.text('April 2026 Recap')
      })
    // The modal dialog instructs the user to 'Press the pack or the open button to see what you get!'.
    cy.get('#root div.text-center h5.mb-2')
      .should(($el) => {
        expect($el).to.be.visible
        expect($el).to.contain.text('Press the pack or the open button to see what you get!')
      })
    // The pack cost of 950 is displayed.
    cy.get('#root span.pl-3.text-xl')
      .should(($el) => {
        expect($el).to.be.visible
        expect($el).to.contain.text('950')
      })
    // An image of a pack is displayed within the modal.
    cy.get('#root img.animate-\\[pulse_0\\.75s_ease-in-out_2\\]')
      .should('be.visible')
    // An 'OPEN' button is visible within the modal.
    cy.get('#root div.md\\:px-4 button.w-full')
      .should(($el) => {
        expect($el).to.be.visible
        expect($el).to.contain.text('OPEN')
      })
    
    cy.get('#root div.md\\:px-4 button.w-full').click();
    // The instruction text changed from 'Press the pack or the open button to see what you get!' to 'First tear! Click again to keep opening it...'
    cy.get('#root div.text-center h5.mb-2')
      .should('contain.text', 'First tear! Click again to keep opening it...')
    
    cy.get('#root div.md\\:px-4 button.w-full').click();
    // The instruction text changed to 'You can almost see the cards now...'
    cy.get('#root div.text-center h5.mb-2')
      .should('contain.text', 'You can almost see the cards now...')
    
    cy.get('#root div.md\\:px-4 button.w-full').click();
    // The user's credit balance changed from 1490 to 540.
    cy.get('#root span.font-normal')
      .should('contain.text', '540')
    // The instruction text changed from 'You can almost see the cards now...' to 'Congrats!'.
    cy.get('#root div.mt-3 h5.mb-2')
      .should('contain.text', 'Congrats!')
    // The pack image is replaced by a container for the opened cards.
    cy.get('#root div.justify-start')
      .should('be.visible')
    // The 'OPEN' button is disabled and its text changed to 'Not enough credits, you have 540 remaining'.
    cy.get('#root div.md\\:px-4 button.w-full')
      .should(($el) => {
        expect($el).to.contain.text('Not enough credits, you have 540 remaining')
        expect($el).to.have.class('bg-disabled')
        expect($el).to.have.class('text-gray-100')
        expect($el).to.have.class('outline-disabled')
        expect($el).to.not.have.class('bg-morado-lakers')
        expect($el).to.not.have.class('text-white')
        expect($el).to.not.have.class('outline-morado-lakers')
        expect($el).to.not.have.class('hover:bg-morado-bajo')
        expect($el).to.not.have.class('hover:outline-morado-bajo')
        expect($el).to.not.have.class('selected:bg-morado-oscuro')
      })
    
    cy.get('#root svg.h-6').click();
  })
})