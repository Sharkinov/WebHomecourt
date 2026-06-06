describe('Cambio de tarjetas', () => {
  beforeEach(() => {
    cy.session('lakerFan', () => {
      cy.intercept('POST', '**/auth/v1/token?grant_type=password').as('login')
      cy.visit('https://sharkinovhomecourt.vercel.app/login')
      cy.get('input[placeholder="Email"]').type('lakerFan@lakerscourt.com')
      cy.get('input[placeholder="Password"]').type('abc123')
      cy.contains('button', 'Sign-in').click()
      cy.wait('@login').its('response.statusCode').should('eq', 200)
      cy.location('pathname', { timeout: 10000 }).should('eq', '/')
    })

    cy.intercept('POST', '**/rest/v1/rpc/get_deck_cards').as('getDeck')
    cy.visit('https://sharkinovhomecourt.vercel.app/juego')
    cy.wait('@getDeck', { timeout: 15000 })
    cy.contains('h2', 'Starting Lineup', { timeout: 10000 }).should('be.visible')
    cy.contains('h2', 'My Bench', { timeout: 10000 }).should('be.visible')
  })

  const deckSection = () =>
    cy.contains('h2', 'Starting Lineup').closest('section')

  const firstDeckCard = () =>
    deckSection()
      .find('div.grid')
      .first()
      .find('div.relative')
      .first()

  const firstBenchCard = () =>
    deckSection()
      .find('div.grid')
      .eq(1)
      .find('div.relative')
      .first()

  it('no muestra botón Use si el bench está vacío', () => {
    cy.get('body').then(($body) => {
      if ($body.find('p:contains("No players in your bench.")').length > 0) {
        cy.contains('button', 'Use').should('not.exist')
      } else {
        cy.log('Bench tiene cartas, test de bench vacío no aplica')
      }
    })
  })

  it('seleccionar carta del bench muestra botón Use', () => {
    cy.get('body').then(($body) => {
      if ($body.find('p:contains("No players in your bench.")').length > 0) {
        cy.log('Bench vacío, test no aplica')
        return
      }

      firstBenchCard().click()
      cy.contains('button', 'Use').should('exist')
    })
  })

  it('click en Use muestra mensaje "Choose a player to replace"', () => {
    cy.get('body').then(($body) => {
      if ($body.find('p:contains("No players in your bench.")').length > 0) {
        cy.log('Bench vacío, test no aplica')
        return
      }

      firstBenchCard().click()
      cy.contains('button', 'Use').click()

      // El h5 existe pero puede estar fuera del scroll visible
      cy.contains('h5', 'Choose a player to replace').should('exist')
      firstDeckCard().should('have.class', 'ring-4')
    })
  })

  it('cancelar con botón Cancel regresa al estado normal', () => {
    cy.get('body').then(($body) => {
      if ($body.find('p:contains("No players in your bench.")').length > 0) {
        cy.log('Bench vacío, test no aplica')
        return
      }

      firstBenchCard().click()
      cy.contains('button', 'Use').click()
      cy.contains('h5', 'Choose a player to replace').should('exist')

      cy.contains('button', 'Cancel').click()

      cy.contains('h5', 'Choose a player to replace').should('not.exist')
      cy.contains('button', 'Cancel').should('not.exist')
    })
  })

  it('cancelar picándole a la misma carta del bench regresa al estado normal', () => {
    cy.get('body').then(($body) => {
      if ($body.find('p:contains("No players in your bench.")').length > 0) {
        cy.log('Bench vacío, test no aplica')
        return
      }

      firstBenchCard().click()
      cy.contains('button', 'Use').should('exist')

      firstBenchCard().click()
      cy.contains('button', 'Use').should('not.exist')
    })
  })

  it('swap completo: carta de bench pasa al deck', () => {
    cy.get('body').then(($body) => {
      if ($body.find('p:contains("No players in your bench.")').length > 0) {
        cy.log('Bench vacío, test no aplica')
        return
      }

      deckSection()
        .find('div.grid')
        .first()
        .find('div.relative')
        .its('length')
        .as('deckCountBefore')

      firstBenchCard().click()
      cy.contains('button', 'Use').click()
      cy.contains('h5', 'Choose a player to replace').should('exist')

      cy.intercept('POST', '**/rest/v1/rpc/swap_deck_card').as('swapCard')

      firstDeckCard().click()

      cy.wait('@swapCard', { timeout: 10000 })
      cy.contains('h5', 'Choose a player to replace').should('not.exist')

      cy.get('@deckCountBefore').then((before) => {
        deckSection()
          .find('div.grid')
          .first()
          .find('div.relative')
          .should('have.length', before as unknown as number)
      })
    })
  })
})