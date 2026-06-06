describe('Dismiss Event Report', () => {
  it('loads and lets the user interact with filters', () => {
    cy.visit('https://sharkinovhomecourt.vercel.app/login');
    cy.get('input[placeholder="Email"]').type('admin@lakerscourt.com');
    cy.get('input[placeholder="Password"]').type('AdminLakers!23');
    cy.get('button.text-white').click();
    
    cy.get('#root div.lg\\:gap-8 button:nth-child(8)').click();
    cy.get('#root tr:nth-child(6) button.border').click();
    cy.get('#root button.bg-\\[\\#E7E6E8\\]').click();
  });
});