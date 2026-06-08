describe('Pagina de Estadisticas', () => {

  beforeEach(() => {
    cy.visit('/estadisticas', {
      state: { game_id: 1 }
    })
  })

  it('carga la pagina correctamente', () => {
    cy.get('body').should('be.visible')
    cy.url().should('include', '/estadisticas')
  })

  it('renderiza al menos una grafica', () => {
    cy.get('svg').should('exist').and('be.visible')
  })

  it('muestra las 4 graficas esperadas', () => {
    cy.get('svg').should('have.length.greaterThan', 3)
  })
})