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
  /*
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
          .should('have.value', '1')
      })
    })
  })

  // 3. No permite ingresar valores negativos al input de estadísticas, solo igual o mayor a 0 (este va a fallar)
  it('Estadísticas claves númericas', () => {
    const mainStatLabels = ['Points', 'Rebounds', 'Assists', 'Blocks', 'Steals']
    const shootingLabels = ['FG Made', 'FG Attempts', '3P Made', '3P Attempts']

    openStatsModal().within(() => {
      //Add negative team overall score values 
      cy.contains('p', 'Your Team')
        .parent()
        .find('input')
        .clear()
        .type('-10')

      cy.contains('p', 'Opposing team')
        .parent()
        .find('input')
        .clear()
        .type('-10')

      // Main stat fields w -10 
      mainStatLabels.forEach((label) => {
        cy.contains('label', label)
          .parent()
          .find('input')
          .should('have.attr', 'type', 'number')
          .clear()
          .type('-10')
          .should('have.value', '-10')
      })

      // Open shooting splits division
      cy.contains('button', 'Shooting splits (optional)').click()

      cy.get('div.pt-4').should('be.visible')

      // Shooting split fields
      shootingLabels.forEach((label) => {
        cy.contains('label', label)
          .parent()
          .find('input')
          .should('be.visible')
          .and('have.attr', 'type', 'number')
          .clear()
          .type('-10')
          .should('have.value', '-10')
      })

      cy.contains('button', 'Save stats').click()

      // Adolfo no consider q se muestre el error q stats cannot be negative 
      cy.contains('p', 'Error').should('be.visible')
      cy.contains('p', 'Your stats cannot be negative.').should('be.visible')
    })
  })
  */

  // 4. Publicar ya que todas las estadísticas claves tengan un valor válido que afecte los valores que se ven en las gráficas en general para validar number updating 

  // 5. Ir a editar stats de la actividad que se acaba de completar, llenar solo los extra stats y picar en varita; verifica que FG made y click en Auto-fill points from shooting calcule el points bien (1 FG = 2 points). Llenar las otras required fields con 0 y click en guardar

  // 6.  Ir a editar stats de la actividad que se acaba de completar, llenar solo los extra stats y picar en varita; verifica que 3P Made y click en Auto-fill points from shooting calcule el points bien (1 3P Made = 3 points ). Llenar las otars required fields con valores = 0 y click en guardar

  // 7. Filter view Wins solo muestra juegos en tabla donde result = W 

  // 8. Filter view Losses solo muestra juegos en tabla donde result = L 

  // 9. Filter view Pending solo muestra el nombre de evento, ubicación, fecha, result  con P y las ptras columnas de SCORE PTS REB AST = -- con actions de + Add Stats 

  // Intermediate step tengo que log out, iniciar sesión ahora con email: noLakers@gmail.com password: noGames0! and then navigate to historial-lakers

  // 10. Todas las gráficas se muestrn pero con 0s, y la tabla de Past Games muestra solo una fila "No past games yet"

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