describe('Warn Host from Monitor', () => {
  it('loads and lets the user interact with filters', () => {
    cy.visit('https://sharkinovhomecourt.vercel.app/login');
    cy.get('input[placeholder="Email"]').type('admin@lakerscourt.com');
    cy.get('input[placeholder="Password"]').type('AdminLakers!23');
    cy.get('button.text-white').click();
    
    cy.get('#root div.lg\\:gap-8 button:nth-child(8)').click();
    cy.get('#root div:nth-child(3) div.items-center.justify-between button.text-white').click();
    cy.get('#root button.text-black').click();
    cy.get('#root div.grid-cols-2 button:nth-child(5)').click();
    cy.get('#root button.bg-amarillo-warn').click();
  });
});