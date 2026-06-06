describe('Warn User from Report', () => {
  it('loads and lets the user interact with filters', () => {
    cy.visit('https://sharkinovhomecourt.vercel.app/login');
    cy.get('input[placeholder="Email"]').type('admin@lakerscourt.com');
    cy.get('input[placeholder="Password"]').type('AdminLakers!23');
    cy.get('button.text-white').click();
    
    
    cy.get('#root div.lg\\:gap-8 button:nth-child(8)').click();
    cy.get('#root tr:nth-child(3) td:nth-child(6) button.border').click();
    cy.get('#root button.bg-\\[\\#FFD796\\]').click();
    cy.get('#root div.grid-cols-2 button:nth-child(1)').click();
    cy.get('#root button.bg-amarillo-warn').click();
  });
});