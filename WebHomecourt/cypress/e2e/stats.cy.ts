describe('Pagina de Estadisticas', () => {

  beforeEach(() => {
    cy.intercept('GET', '**/rest/v1/view_player_stats*', { fixture: 'stats.json' }).as('getStats')
    cy.intercept('GET', '**/rest/v1/view_marcadores*', { fixture: 'marcador.json' }).as('getMarcador')
    cy.intercept('GET', '**/rest/v1/view_team_stats_comparision*', { fixture: 'team_stats.json' }).as('getTeamStats')

    cy.visit('/estadisticas')
    cy.wait('@getStats')
  })

  // --- Carga general ---
  it('carga la página correctamente', () => {
    cy.get('body').should('be.visible')
    cy.url().should('include', '/estadisticas')
  })

  // --- Tabla de stats ---
  it('muestra la tabla de estadísticas con filas', () => {
    cy.get('[data-cy="stats-table"]').should('exist')
    cy.get('[data-cy="stats-row"]').should('have.length', 2)
  })

  it('la tabla contiene el nombre de un jugador', () => {
    cy.get('[data-cy="stats-row"]').first().should('contain.text', 'Juan García')
  })

  // --- Gráficas (Recharts usa SVG, no canvas) ---
  it('renderiza al menos una gráfica', () => {
    cy.get('svg').should('have.length.greaterThan', 0)
  })

  it('muestra las 4 gráficas esperadas', () => {
    cy.get('svg').should('have.length.greaterThan', 3)
  })

  // --- Responsive ---
  it('se adapta correctamente en mobile', () => {
    cy.viewport('iphone-8')
    cy.get('[data-cy="stats-table"]').should('exist')
    cy.get('[data-cy="stats-table"]').scrollIntoView().should('be.visible')
  })
})