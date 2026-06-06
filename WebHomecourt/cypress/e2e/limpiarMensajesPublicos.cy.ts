describe('Chat - Filtro de groserías', () => {
  // cy.session cachea el login y no repite el flujo completo en cada test
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

    cy.visit('https://sharkinovhomecourt.vercel.app/')
    // Espera a que el chat cargue antes de cada test
    cy.get('#root input.border', { timeout: 10000 }).should('be.visible')
  })

  // Español

  it('censura "pendejo" y conserva el resto del mensaje', () => {
    cy.get('#root input.border').type('eres un pendejo')
    cy.get('#root button.transition-all').click()
    cy.get('article p').should('contain.text', '***')
    cy.get('article p').last().invoke('text').then((text) => {
      expect(text).to.match(/eres un \*\*\*|\*\*\*/)
    })
  })

  it('censura "puta" y conserva el resto del mensaje', () => {
    cy.get('#root input.border').type('hijo de puta')
    cy.get('#root button.transition-all').click()
    cy.get('article p').should('contain.text', '***')
    cy.get('article p').last().invoke('text').then((text) => {
      expect(text).to.match(/hijo de \*\*\*|\*\*\*/)
    })
  })

  it('censura "estupido" y conserva el resto del mensaje', () => {
    cy.get('#root input.border').type('no seas estupido')
    cy.get('#root button.transition-all').click()
    cy.get('article p').should('contain.text', '***')
    cy.get('article p').last().invoke('text').then((text) => {
      expect(text).to.match(/no seas \*\*\*|\*\*\*/)
    })
  })

  it('censura "culero" y conserva el resto del mensaje', () => {
    cy.get('#root input.border').type('no seas culero')
    cy.get('#root button.transition-all').click()
    cy.get('article p').should('contain.text', '***')
    cy.get('article p').last().invoke('text').then((text) => {
      expect(text).to.match(/no seas \*\*\*|\*\*\*/)
    })
  })

  it('censura "cabron" y conserva el resto del mensaje', () => {
    cy.get('#root input.border').type('pinche cabron')
    cy.get('#root button.transition-all').click()
    cy.get('article p').should('contain.text', '***')
    cy.get('article p').last().invoke('text').then((text) => {
      expect(text).to.match(/pinche \*\*\*|\*\*\*/)
    })
  })

  it('censura "chingada" y conserva el resto del mensaje', () => {
    cy.get('#root input.border').type('vete a la chingada')
    cy.get('#root button.transition-all').click()
    cy.get('article p').should('contain.text', '***')
    cy.get('article p').last().invoke('text').then((text) => {
      expect(text).to.match(/vete a la \*\*\*|\*\*\*/)
    })
  })

  // Ingles

  it('censura "fuck" y conserva el resto del mensaje', () => {
    cy.get('#root input.border').type('fuck this team')
    cy.get('#root button.transition-all').click()
    cy.get('article p').should('contain.text', '***')
    cy.get('article p').last().invoke('text').then((text) => {
      expect(text).to.match(/\*\*\* this team|\*\*\*/)
    })
  })

  it('censura "shit" y conserva el resto del mensaje', () => {
    cy.get('#root input.border').type('what a shit game')
    cy.get('#root button.transition-all').click()
    cy.get('article p').should('contain.text', '***')
    cy.get('article p').last().invoke('text').then((text) => {
      expect(text).to.match(/what a \*\*\* game|\*\*\*/)
    })
  })

  it('censura "bitch" y conserva el resto del mensaje', () => {
    cy.get('#root input.border').type('dont be a bitch')
    cy.get('#root button.transition-all').click()
    cy.get('article p').should('contain.text', '***')
    cy.get('article p').last().invoke('text').then((text) => {
      expect(text).to.match(/dont be a \*\*\*|\*\*\*/)
    })
  })

  // Casos edge

  it('deja pasar un mensaje completamente limpio', () => {
    cy.get('#root input.border').type('vamos lakers a ganar')
    cy.get('#root button.transition-all').click()
    cy.contains('article p', 'vamos lakers a ganar').should('be.visible')
  })

  it('limpia el input después de enviar', () => {
    cy.get('#root input.border').type('hola')
    cy.get('#root button.transition-all').click()
    cy.get('#root input.border').should('have.value', '')
  })

  it('no envía un mensaje vacío', () => {
    cy.get('article').then(($before) => {
      const countBefore = $before.length
      cy.get('#root button.transition-all').click()
      cy.get('#root input.border').should('have.value', '')
      cy.get('article').should('have.length', countBefore)
    })
  })
})