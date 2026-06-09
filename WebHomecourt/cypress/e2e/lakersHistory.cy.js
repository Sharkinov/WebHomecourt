describe('Lakers History', () => {
  // Login 
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
    // Loads table 
    cy.contains('YOUR REPUTATION').should('be.visible')
    cy.contains('h2', 'Past Games').should('be.visible')
  }

  // Helper functions 
  // Open the pop-up for stats 
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

  // Open a game that is marked as pending aka will have no values
  const getStatCard = (title) => {
    return cy
      .contains('p', title)
      .closest('div.flex.w-full.flex-col')
  }

  // Gets the graph cards themselves 
  const getStatCardValue = (title) => {
    return getStatCard(title).find('span').first()
  }

  // Stat card titles and values to compare before and after for test 4
  const getAllDashboardValues = () => {
    const titles = [
      'PPG',
      'RPG',
      'APG',
      'Record',
      'FG%',
      '3P%',
      'Winning Streak',
      'Pending',
    ]

    const values = {}

    cy.wrap(titles).each((title) => {
      getStatCardValue(title).invoke('text').then((text) => {
        values[title] = text.trim()
      })
    })

    return cy.wrap(values)
  }

  // Will always login and visit page 
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
  it('Estadísticas positivas', () => {
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

  // 4. Publicar ya que todas las estadísticas claves tengan un valor válido que afecte los valores que se ven en las gráficas en general para validar number updating 
  it('Estadísticas válidas afectan gráficas', () => {
    const mainStats = {
      Points: '20',
      Rebounds: '10',
      Assists: '8',
      Steals: '3',
      Blocks: '2',
    }

    const shootingStats = {
      'FG Made': '5',
      'FG Attempts': '10',
      '3P Made': '2',
      '3P Attempts': '5',
    }

    cy.get('body').then(($body) => {
      const addStatsButtons = $body
        .find('button')
        .filter((_, button) => button.innerText.includes('Add stats'))

      if (addStatsButtons.length === 0) {
        cy.log('No hay partidos pendientes con Add stats, test no aplica')
        return
      }

      getAllDashboardValues().then((beforeValues) => {
        cy.get('button')
          .filter((_, button) => button.innerText.includes('Add stats'))
          .first()
          .scrollIntoView()
          .click({ force: true })

        cy.contains('h2', 'Add my stats', { timeout: 10000 })
          .should('be.visible')
          .closest('div.fixed')
          .within(() => {
            cy.contains('p', 'Your Team')
              .parent()
              .find('input')
              .clear()
              .type('100')

            cy.contains('p', 'Opposing team')
              .parent()
              .find('input')
              .clear()
              .type('10')

            Object.entries(mainStats).forEach(([label, value]) => {
              cy.contains('label', label)
                .parent()
                .find('input')
                .clear()
                .type(value)
                .should('have.value', value)
            })

            cy.contains('button', 'Shooting splits (optional)').click()

            cy.get('div.pt-4').should('be.visible')

            Object.entries(shootingStats).forEach(([label, value]) => {
              cy.contains('label', label)
                .parent()
                .find('input')
                .clear()
                .type(value)
                .should('have.value', value)
            })

            cy.contains('button', 'Save stats').click()
          })

        cy.contains('h2', 'Add my stats', { timeout: 15000 }).should('not.exist')

        const cardsThatShouldUpdate = ['PPG', 'RPG', 'APG', 'FG%', 'Pending']

        cardsThatShouldUpdate.forEach((title) => {
          getStatCardValue(title).should(($value) => {
            expect($value.text().trim(), `${title} changed`).not.to.eq(beforeValues[title])
          })
        })
      })
    })
  })

  // 5. Ir a editar stats de la actividad que se acaba de completar, llenar solo los extra stats y picar en varita; verifica que FG made y click en Auto-fill points from shooting calcule el points bien (1 FG = 2 points). Llenar las otras required fields con 0 y click en guardar
  it('Calcular puntos con FG', () => {
    // Checks it can actually edit a game 
    cy.get('body').then(($body) => {
      if ($body.find('button:contains("Edit")').length === 0) {
        cy.log('No hay actividades completadas con Edit, test no aplica')
        return
      }

      cy.contains('button', 'Edit')
        .first()
        .scrollIntoView()
        .click({ force: true })

      cy.contains('h2', /Edit my stats/, { timeout: 10000 })
        .should('be.visible')
        .closest('div.fixed')
        .within(() => {
          // Set final score to 0
          cy.contains('p', 'Your Team')
            .parent()
            .find('input')
            .clear()
            .type('0')

          cy.contains('p', 'Opposing team')
            .parent()
            .find('input')
            .clear()
            .type('0')

          // Set all other stat fields to 0
          const mainStatLabels = ['Points', 'Rebounds', 'Assists', 'Steals', 'Blocks']

          mainStatLabels.forEach((label) => {
            cy.contains('label', label)
              .parent()
              .find('input')
              .clear()
              .type('0')
              .should('have.value', '0')
          })

          // Open shooting splits
          cy.contains('button', 'Shooting splits (optional)').click()

          cy.get('div.pt-4').should('be.visible')

          // Set shooting fields to 0 first
          const shootingLabels = ['FG Made', 'FG Attempts', '3P Made', '3P Attempts']

          shootingLabels.forEach((label) => {
            cy.contains('label', label)
              .parent()
              .find('input')
              .clear()
              .type('0')
              .should('have.value', '0')
          })

          // 1 FG es 2 pts 
          cy.contains('label', 'FG Made')
            .parent()
            .find('input')
            .clear()
            .type('1')
            .should('have.value', '1')

          // FG Attempts also a 1
          cy.contains('label', 'FG Attempts')
            .parent()
            .find('input')
            .clear()
            .type('1')
            .should('have.value', '1')

          // Magic wand para pts 
          cy.contains('button', 'Auto-fill points from shooting')
            .click()

          // Points should update from 0 to 2
          cy.contains('label', 'Points')
            .parent()
            .find('input')
            .should('have.value', '2')

          cy.contains('button', 'Save stats').click()
        })
    })
  })

  // 6. Ir a editar stats de la actividad que se acaba de completar, llenar solo los extra stats y picar en varita; verifica que 3P Made y click en Auto-fill points from shooting calcule el points bien (1 3P Made = 3 points ). Llenar las otars required fields con valores = 0 y click en guardar
  it('Calcula puntos con 3P Made', () => {
    cy.get('body').then(($body) => {
      if ($body.find('button:contains("Edit")').length === 0) {
        cy.log('No hay actividades completadas con Edit, test no aplica')
        return
      }

      cy.contains('button', 'Edit')
        .first()
        .scrollIntoView()
        .click({ force: true })

      cy.contains('h2', 'Edit my stats', { timeout: 10000 })
        .should('be.visible')
        .closest('div.fixed')
        .within(() => {
          // No final scores 
          cy.contains('p', 'Your Team')
            .parent()
            .find('input')
            .clear()
            .type('0')

          cy.contains('p', 'Opposing team')
            .parent()
            .find('input')
            .clear()
            .type('0')

          // Required fields in 0 first
          const mainStatLabels = ['Points', 'Rebounds', 'Assists', 'Steals', 'Blocks']

          mainStatLabels.forEach((label) => {
            cy.contains('label', label)
              .parent()
              .find('input')
              .clear()
              .type('0')
              .should('have.value', '0')
          })

          // Open shooting splits
          cy.contains('button', 'Shooting splits (optional)').click()

          cy.get('div.pt-4').should('be.visible')

          // Reset shooting fields to 0
          const shootingLabels = ['FG Made', 'FG Attempts', '3P Made', '3P Attempts']

          shootingLabels.forEach((label) => {
            cy.contains('label', label)
              .parent()
              .find('input')
              .clear()
              .type('0')
              .should('have.value', '0')
          })

          // 1 3P = 3 pts 
          cy.contains('label', '3P Made')
            .parent()
            .find('input')
            .clear()
            .type('1')
            .should('have.value', '1')

          // 3P Attempts should be at least equal to 3P Made
          cy.contains('label', '3P Attempts')
            .parent()
            .find('input')
            .clear()
            .type('1')
            .should('have.value', '1')


          // Click Auto-fill points from shooting
          cy.contains('button', 'Auto-fill points from shooting')
            .click({ force: true })

          // Points update to 3
          cy.contains('label', 'Points')
            .parent()
            .find('input')
            .should('have.value', '3')

          cy.contains('button', 'Save stats').click()
        })

      cy.contains('h2', 'Edit my stats', { timeout: 15000 })
        .should('not.exist')
    })
  })
    */

  // 7. Filter view Wins solo muestra juegos en tabla donde result = W 
  it('Filtrar por victorias', () => {
    cy.contains('button', 'Wins').click()

    cy.contains('h2', 'Past Games')
      .closest('section')
      .find('.max-h-76')
      .within(() => {
        cy.get('> div').then(($rows) => {
          // Checa que solo se muestren W
          cy.wrap($rows).each(($row) => {
            cy.wrap($row)
              .children()
              .eq(3)
              .find('span')
              .invoke('text')
              .then((resultText) => {
                const result = resultText.trim()

                expect(result).to.eq('W')

                // Failed
                expect(result).not.to.eq('L')
                expect(result).not.to.eq('P')
              })
          })
        })
      })
  })

  // 8. Filter view Losses solo muestra juegos en tabla donde result = L 
  it('Filtra por perdidas', () => {
    cy.contains('button', 'Losses').click()

    cy.contains('h2', 'Past Games')
      .closest('section')
      .find('.max-h-76')
      .within(() => {
        cy.get('> div').then(($rows) => {
          // Checa todas las rows third elem the sticker 
          cy.wrap($rows).each(($row) => {
            cy.wrap($row)
              .children()
              .eq(3)
              .find('span')
              .invoke('text')
              .then((resultText) => {
                const result = resultText.trim()

                expect(result).to.eq('L')
                // Other vals no no
                expect(result).not.to.eq('W')
                expect(result).not.to.eq('P')
              })
          })
        })
      })
  })

  // 9. Filter view Pending ya no tiene pending entonces muestra No pending games (va a fallar, muestra "No past games yet")
  it('Filtrar sin juegos pendientes', () => {
    // Click filter
    cy.contains('button', 'Pending').click()

    // Checa q no se muestre mssg generic solo No pending games
    cy.contains('h2', 'Past Games')
      .closest('section')
      .find('.max-h-76')
      .within(() => {
        cy.contains('No pending games').should('be.visible')
        cy.contains('No past games yet').should('not.exist')
      })
  })

  // Intermediate step tengo que log out, iniciar sesión ahora con email: noLakers@gmail.com password: noGames0! and then navigate to historial-lakers

  // 10. Todas las gráficas se muestrn pero con 0s, y la tabla de Past Games muestra solo una fila "No past games yet"

  /*
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
    */
})