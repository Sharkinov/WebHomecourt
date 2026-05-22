describe('Lakers History', () => {
    // Goes to correct project url 
    beforeEach(() => {
        cy.visit('/historial-lakers')
    })

    // Checks that the page loads the visible in English 
    it('loads the lakers history page', () => {
        cy.contains('LAKERS COURT - HISTORY').should('be.visible') // Título
        cy.contains("Check your progress and enjoy your games").should('be.visible') // Sub-title elem
        cy.contains('YOUR REPUTATION').should('be.visible') // Button 
        cy.contains('Past Games').should('be.visible')
    })

    it('ensure all stat fields are numeric', function () {
        const statLabels = ['Points', 'Rebounds', 'Assists', 'Blocks', 'Steals'];

        // Look for label and linkd input in div
        statLabels.forEach(label => {
            cy.contains(label)
                .parent() // adjust if your structure is different
                .find('input')
                .should('have.attr', 'type', 'number');
        });
    });

});

