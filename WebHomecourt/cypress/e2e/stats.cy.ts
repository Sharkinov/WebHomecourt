describe('Pagina de Estadisticas', () => {
    beforeEach(() => {
        cy.intercept('GET','**/rest/v1/view_player_stats*',{ fixture: 'stats.json' }).as('getStats')
        cy.intercept('GET','**/rest/v1/view_marcadores*',{ fixture: 'marcador.json' }).as('getMarcador')
        cy.intercept('GET','**/rest/v1/view_team_stats_comparision*',{ fixture: 'team_stats.json' }).as('getTeamStats')

        cy.visit('/estadisticas')

        cy.wait('@getStats')
        cy.wait('@getMarcador')
        cy.wait('@getTeamStats')
    })

    it('carga la pagina correctamente', () => {
        cy.get('body').should('be.visible')
        cy.url().should('include', '/estadisticas')
    })

    it('muestra el encabezado de la tabla', () => {
        cy.contains('PLAYER').should('be.visible')
        cy.contains('PTS').should('be.visible')
        cy.contains('REB').should('be.visible')
    })

    it('muestra un jugador de las estadisticas', () => {
        cy.contains('Juan Garcia').should('be.visible')
    })

    it('renderiza al menos una grafica', () => {
        cy.get('svg').should('have.length.greaterThan', 0)
    })

    it('muestra las graficas esperadas', () => {
        cy.get('svg').should('have.length.greaterThan', 3)
    })

    it('se adapta correctamente en mobile', () => {
        cy.viewport('iphone-8')
        cy.contains('PLAYER')
        .scrollIntoView()
        .should('be.visible')
    })

    it('muestra el panel de estadisticas', () => {
        cy.contains('Statistics').should('be.visible')
    })

    it('muestra la fila Team Total', () => {
        cy.contains('Team Total').should('be.visible')
    })

    it('oculta la columna PTS', () => {
        cy.contains('label', 'Points (PTS)')
            .find('input')
            .click()
        cy.get('span').contains(/^PTS$/).should('not.exist')
    })

    it('calcula correctamente los totales', () => {
        cy.contains('Team Total').should('be.visible')
        cy.contains('30').should('be.visible')
    })
})