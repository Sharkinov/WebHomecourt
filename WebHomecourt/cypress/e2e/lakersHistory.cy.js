describe('Lakers History', () => {
    // Goes to correct project url 
    beforeEach(() => {
        cy.intercept('POST', '**/auth/v1/token?grant_type=password').as('login')
        cy.visit('https://sharkinovhomecourt.vercel.app/login')
        cy.get('#root input[placeholder="Email"]').click();
        cy.get('#root input[placeholder="Email"]').type('lakerFan@lakerscourt.com');
        cy.get('#root input[placeholder="Password"]').click();
        cy.get('#root input[placeholder="Password"]').type('abc123');
        cy.contains('button', 'Sign-in').click();
        cy.wait('@login').its('response.statusCode').should('eq', 200)
        cy.location('pathname', { timeout: 10000 }).should('eq', '/')
        cy.visit('/historial-lakers')
    })

    // Checks that the page loads the visible in English 
    it('loads the lakers history page', () => {
        cy.contains('h1', 'MATCH HISTORY').should('be.visible') // Título
        cy.contains("Review your previous games and performance").should('be.visible') // Sub-title elem
        cy.contains('YOUR REPUTATION').should('be.visible') // Button 
        cy.contains('h2', 'Past Games').should('be.visible')
    })

    it('ensure all stat fields are numeric', function () {
        const statLabels = ['Points', 'Rebounds', 'Assists', 'Blocks', 'Steals'];
        
        cy.contains('button', /Add stats|Edit/).filter(':visible').first().click();
        
        cy.contains('h2', /Add my stats|Edit my stats/)
            .should('be.visible')
            .closest('div.fixed')
            .within(() => {
            // Look for the label and its linked numeric input inside the modal
            statLabels.forEach(label => {
                cy.contains('label', label)
                    .parent()
                    .find('input')
                    .should('have.attr', 'type', 'number');
            });
        });
        cy.get('#root span.transition-transform').click();
        // A new input field for 'FG Made' is displayed and is of type 'number'.
        cy.get('#root div.pt-4 div.grid div:nth-child(1) input.border')
          .should(($el) => {
            expect($el).to.be.visible
            expect($el).to.have.value('')
          })
        // A new input field for 'FG Attempts' is displayed and is of type 'number'.
        cy.get('#root div.pt-4 div:nth-child(2) input.border')
          .should(($el) => {
            expect($el).to.be.visible
            expect($el).to.have.value('')
          })
        // A new input field for '3P Made' is displayed and is of type 'number'.
        cy.get('#root div.pt-4 div:nth-child(3) input.border')
          .should(($el) => {
            expect($el).to.be.visible
            expect($el).to.have.value('')
          })
        // A new input field for '3P Attempts' is displayed and is of type 'number'.
        cy.get('#root div.pt-4 div:nth-child(4) input.border')
          .should(($el) => {
            expect($el).to.be.visible
            expect($el).to.have.value('')
          })
        // A new section containing stat input fields is displayed.
        cy.get('#root div.pt-4')
          .should('be.visible')
        // The arrow icon has rotated 180 degrees, indicating the expansion of a section.
        cy.get('#root span.transition-transform')
          .should('have.attr', 'style', 'transform: rotate(180deg);')
        
        cy.get('#root div.max-h-\\[70vh\\]').click();
    });

});

