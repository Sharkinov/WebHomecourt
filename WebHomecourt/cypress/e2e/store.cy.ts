describe('template spec', () => {
  it('passes', () => {
    cy.intercept('POST', '**/auth/v1/token?grant_type=password').as('loginRequest');
    cy.intercept('GET', '**/rest/v1/user_laker?select=banned_until&user_id=*').as('bannedCheck');

    cy.visit('https://sharkinovhomecourt.vercel.app/login');
    cy.get('input[placeholder="Email"]').type('lakerFan@lakerscourt.com');
    cy.get('input[placeholder="Password"]').type('abc123');
    cy.get('button.text-white').click();

    cy.wait('@loginRequest');
    cy.wait('@bannedCheck');
    cy.url().should('eq', 'https://sharkinovhomecourt.vercel.app/');

    cy.visit('https://sharkinovhomecourt.vercel.app/store');

    cy.get('#root h1.text-zinc-100')
      .should('contain.text', 'Lakers Cards Store')
       
    // The page title is now 'Lakers Cards Store'.
    // A new subtitle describes the store's offerings.
    cy.get('#root h5.mt-2')
      .should('contain.text', 'Unlock more cards featuring your favorite players and improve your Dunk Royale game deck')
    // A 'Player Pack' section is now visible.
    cy.get('#root div:nth-child(3) h2.font-bold')
      .should('contain.text', 'Player Pack')
    // A LeBron James player pack is available.
    cy.get('#root div:nth-child(3) div:nth-child(1) div.flex-row div.w-full div.justify-start h4.font-bold')
      .should('contain.text', 'LeBron James')
    // The player pack costs 200.
    cy.get('#root div:nth-child(3) div:nth-child(1) div.flex-row div.w-full div.mb-4 button.flex span:nth-child(3)')
      .should('contain.text', '200')
    // An Austin Reaves player pack is available.
    cy.get('#root div:nth-child(3) div.grid div:nth-child(2) div.flex-row div.w-full div.justify-start h4.font-bold')
      .should('contain.text', 'Austin Reaves')
    // The player pack costs 200.
    cy.get('#root div:nth-child(3) div.grid div:nth-child(2) div.flex-row div.w-full div.mb-4 button.flex span:nth-child(3)')
      .should('contain.text', '200')
    // A Luka Doncic player pack is available.
    cy.get('#root div:nth-child(3) div.grid div:nth-child(3) div.flex-row div.w-full div.justify-start h4.font-bold')
      .should('contain.text', 'Luka Doncic')
    
    cy.get('#root div:nth-child(3) div:nth-child(1) div.flex-row div.w-full div.mb-4 button.flex span.text-black').click();
    // A modal dialog titled 'Open the pack!' has appeared.
    cy.get('#root div.fixed.flex')
      .should('be.visible')
    // The modal dialog title is 'Open the pack!'.
    cy.get('#root h2.text-white')
      .should(($el) => {
        expect($el).to.be.visible
        expect($el).to.contain.text('Open the pack!')
      })
    // The pack contains 'LeBron James'.
    cy.get('#root p.text-white')
      .should(($el) => {
        expect($el).to.be.visible
        expect($el).to.contain.text('LeBron James')
      })
    // Instructions to 'Press the pack or the open button to see what you get!' are displayed.
    cy.get('#root div.text-center h5.mb-2')
      .should(($el) => {
        expect($el).to.be.visible
        expect($el).to.contain.text('Press the pack or the open button to see what you get!')
      })
    // The pack costs 200.
    cy.get('#root span.pl-3.text-xl')
      .should(($el) => {
        expect($el).to.be.visible
        expect($el).to.contain.text('200')
      })
    // An 'OPEN' button is displayed.
    cy.get('#root div.md\\:px-4 button.w-full')
      .should(($el) => {
        expect($el).to.be.visible
        expect($el).to.contain.text('OPEN')
      })
    
    cy.get('#root div.md\\:px-10 button.w-full').click();
    cy.get('#root div:nth-child(3) div.grid div:nth-child(2) div.flex-row div.w-full div.mb-4 button.flex').click();
    // A modal dialog titled 'Open the pack!' has appeared.
    cy.get('#root div.fixed.flex')
      .should('be.visible')
    // The player name 'Austin Reaves' is displayed in the modal.
    cy.get('#root p.text-white')
      .should(($el) => {
        expect($el).to.be.visible
        expect($el).to.contain.text('Austin Reaves')
      })
    // An image of a player pack is displayed.
    cy.get('#root img.animate-\\[pulse_0\\.75s_ease-in-out_2\\]')
      .should('be.visible')
    // An 'OPEN' button is visible within the modal.
    cy.get('#root div.md\\:px-4 button.w-full')
      .should(($el) => {
        expect($el).to.be.visible
        expect($el).to.contain.text('OPEN')
      })
    
    cy.get('#root svg.h-6').click();
    cy.get('#root div:nth-child(3) div.items-center button:nth-child(3)').click();
    // The number of available packs has increased to 2.
    cy.get('#root div:nth-child(3) div.items-center span.text-black')
      .should('contain.text', '2 / 2')
    // The button to increase the pack quantity is disabled.
    cy.get('#root div:nth-child(3) div.items-center button:nth-child(3)')
      .should('have.attr', 'disabled')
    // The player name displayed has changed to 'Black Mamba'.
    cy.get('#root div:nth-child(3) div.outline div.flex-row div.w-full div.justify-start h4.font-bold')
      .should('contain.text', 'Black Mamba')
    // The pack number displayed has changed to 'Player Pack #8'.
    cy.get('#root div:nth-child(3) div.outline div.flex-row div.w-full div.justify-start h5.font-semibold')
      .should('contain.text', 'Player Pack #8')
    
    cy.get('#root div:nth-child(4) > div.grid > div:nth-child(2) > div.flex-row > div.w-full > div.mb-4 > button.flex').click();
    // A modal dialog has appeared.
    cy.get('#root div.fixed.flex')
      .should('be.visible')
    // The modal dialog title is 'Open the pack!'.
    cy.get('#root h2.text-white')
      .should(($el) => {
        expect($el).to.be.visible
        expect($el).to.contain.text('Open the pack!')
      })
    // Instructions to 'Press the pack or the open button to see what you get!' are displayed.
    cy.get('#root div.text-center h5.mb-2')
      .should(($el) => {
        expect($el).to.be.visible
        expect($el).to.contain.text('Press the pack or the open button to see what you get!')
      })
    // The pack costs 400.
    cy.get('#root span.pl-3.text-xl')
      .should(($el) => {
        expect($el).to.be.visible
        expect($el).to.contain.text('400')
      })
    // An 'OPEN' button is displayed.
    cy.get('#root div.md\\:px-4 button.w-full')
      .should(($el) => {
        expect($el).to.be.visible
        expect($el).to.contain.text('OPEN')
      })
    
    cy.get('#root div.md\\:px-10 button.w-full').click();
    cy.get('#root div:nth-child(4) > div.md\\:flex-row > div.items-center > button:nth-child(3)').click();
    // The number of available packs has increased to 2.
    cy.get('#root div:nth-child(4) > div.md\\:flex-row > div.items-center > span.text-black')
      .should('contain.text', '2 / 2')
    // The button to increase the pack quantity is disabled.
    cy.get('#root div:nth-child(4) > div.md\\:flex-row > div.items-center > button:nth-child(3)')
      .should('have.attr', 'disabled')
    // The player name displayed has changed to 'Showtime Lakers'.
    cy.get('#root div:nth-child(4) > div.grid > div.outline > div.flex-row > div.w-full > div.justify-start > h4.font-bold')
      .should('contain.text', 'Showtime Lakers')
    // The pack number displayed has changed to 'Team Pack #10'.
    cy.get('#root div:nth-child(4) > div.grid > div.outline > div.flex-row > div.w-full > div.justify-start > h5.font-semibold')
      .should('contain.text', 'Team Pack #10')
    
    cy.get('#root div:nth-child(3) > div.flex-row > div.w-full > div.mb-4 > button.flex').click();
    // A modal dialog has appeared.
    cy.get('#root div.fixed.flex')
      .should('be.visible')
    // The modal dialog title is 'Open the pack!'.
    cy.get('#root h2.text-white')
      .should(($el) => {
        expect($el).to.be.visible
        expect($el).to.contain.text('Open the pack!')
      })
    // The pack contains 'Pre-2000s Legends'.
    cy.get('#root p.text-white')
      .should(($el) => {
        expect($el).to.be.visible
        expect($el).to.contain.text('Pre-2000s Legends')
      })
    // Instructions to 'Press the pack or the open button to see what you get!' are displayed.
    cy.get('#root div.text-center h5.mb-2')
      .should(($el) => {
        expect($el).to.be.visible
        expect($el).to.contain.text('Press the pack or the open button to see what you get!')
      })
    // The pack costs 700.
    cy.get('#root span.pl-3.text-xl')
      .should(($el) => {
        expect($el).to.be.visible
        expect($el).to.contain.text('700')
      })
    // An image of a player pack is displayed.
    cy.get('#root img.animate-\\[pulse_0\\.75s_ease-in-out_2\\]')
      .should('be.visible')
    // An 'OPEN' button is displayed.
    cy.get('#root div.md\\:px-4 button.w-full')
      .should(($el) => {
        expect($el).to.be.visible
        expect($el).to.contain.text('OPEN')
      })
    
    cy.get('#root div.md\\:px-10 button.w-full').click();
    cy.get('#root div:nth-child(5) button:nth-child(3)').click();
    // The button to decrease the pack quantity is enabled.
    cy.get('#root div:nth-child(5) div.items-center button:nth-child(1)')
      .should('not.have.attr', 'disabled')
    // The pack quantity has increased to 2.
    cy.get('#root div:nth-child(5) div.items-center span.text-black')
      .should('contain.text', '2 / 2')
    // The button to increase the pack quantity is disabled.
    cy.get('#root div:nth-child(5) button:nth-child(3)')
      .should('have.attr', 'disabled')
    // The pack name has changed to 'Dynasty Pack'.
    cy.get('#root div:nth-child(5) h4.font-bold')
      .should('contain.text', 'Dynasty Pack')
    // The pack number has changed to 'Legendary Pack #13'.
    cy.get('#root div:nth-child(5) h5.font-semibold')
      .should('contain.text', 'Legendary Pack #13')
    
  })
})