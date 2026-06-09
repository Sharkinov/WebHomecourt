describe('Lakers History', () => {
  const login = () => {
    cy.session('lakerFan', () => {
      cy.intercept('POST', '**/auth/v1/token?grant_type=password').as('login')

      cy.visit('https://sharkinovhomecourt.vercel.app/login')

      cy.get('input[placeholder="Email"]').type('lakerFan@lakerscourt.com')
      cy.get('input[placeholder="Password"]').type('abc123')
      cy.contains('button', 'Sign-in').click()

      // Check login worked 
      cy.wait('@login', { timeout: 15000 })
      cy.location('pathname', { timeout: 10000 }).should('eq', '/')
    })
  }

  const visitHistoryPage = () => {
    cy.visit('https://sharkinovhomecourt.vercel.app/historial-lakers')

    cy.contains('h1', 'MATCH HISTORY', { timeout: 10000 }).should('be.visible')
    cy.contains('Review your previous games and performance').should('be.visible')
    cy.contains('YOUR REPUTATION').should('be.visible')
    cy.contains('h2', 'Past Games').should('be.visible')
  }

  const openStatsModal = () => {
    cy.contains('button', /Add stats|Edit/, { timeout: 10000 })
      .filter(':visible')
      .first()
      .click()

    return cy
      .contains('h2', /Add my stats|Edit my stats/, { timeout: 10000 })
      .should('be.visible')
      .closest('div.fixed')
  }

  beforeEach(() => {
    login()
    visitHistoryPage()
  })

  // 1. First test checks that the page does load everything in English
  it('Lakers History en inglés', () => {
    cy.contains('h1', 'MATCH HISTORY').should('be.visible')
    cy.contains('Review your previous games and performance').should('be.visible')
    cy.contains('YOUR REPUTATION').should('be.visible')
    cy.contains('h2', 'Past Games').should('be.visible')
  })

  // 2. No permite characters q no sean númericos
  it('Estadísticas claves númericas', () => {
    const statLabels = ['Points', 'Rebounds', 'Assists', 'Blocks', 'Steals']
  
    // Tries to add alphabetic chars and checks that it remains blank
    openStatsModal().within(() => {
      statLabels.forEach((label) => {
        cy.contains('label', label)
          .parent()
          .find('input')
          .as('statInput')

        cy.get('@statInput')
          .should('have.attr', 'type', 'number')
          .clear()
          .type('abcdefghijklmnopqrstuvwxyz')
          .should('have.value', '')

        cy.get('@statInput')
          .type('1')
          .should('have.value', '')
      })
    })
  })

  // 3. No permite ingresar valores negativos al input de estadísticas, solo igual o mayor a 0

  // 4. Publicar ya que todas las estadísticas claves tengan un valor 

  // 5. Ir a editar stats de la actividad que se acaba de completar, llenar solo los extra stats y picar en varita; verifica que el autofill from shooting calcule los valores correctamente 

  // 6. 

  // 3. Ingresar más estadísticas y asegurar que estén vacíos los inputs
  it('Ingresar más estadísticas', () => {
    const shootingLabels = ['FG Made', 'FG Attempts', '3P Made', '3P Attempts']

    openStatsModal().within(() => {
      cy.get('span.transition-transform').click()

      cy.get('div.pt-4').should('be.visible')

      shootingLabels.forEach((label) => {
        cy.contains('label', label)
          .parent()
          .find('input')
          .should('be.visible')
          .and('have.attr', 'type', 'number')
      })

      cy.get('span.transition-transform')
        .should('have.attr', 'style')
        .and('include', 'rotate(180deg)')
    })
  })

  // 4. Cerrar pop-up impacta gráficas
  it('can close the stats modal', () => {
    openStatsModal()

    // This works if the X/close icon is rendered as a button.
    cy.get('body').then(($body) => {
      if ($body.find('button:contains("Cancel")').length > 0) {
        cy.contains('button', 'Cancel').click()
      } else if ($body.find('button:contains("Close")').length > 0) {
        cy.contains('button', 'Close').click()
      } else {
        cy.get('body').type('{esc}')
      }
    })

    cy.contains('h2', /Add my stats|Edit my stats/).should('not.exist')
  })
})