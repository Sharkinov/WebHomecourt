describe('Wrapped page', () => {
  // Inicia sesion y entra a la pantalla de Wrapped antes de cada prueba
  beforeEach(() => {
    cy.intercept('POST', '**/auth/v1/token?grant_type=password').as('loginRequest');

    cy.visit('https://sharkinovhomecourt.vercel.app/login');
    cy.get('input[placeholder="Email"]').type('lakerFan@lakerscourt.com');
    cy.get('input[placeholder="Password"]').type('abc123');
    cy.get('button.text-white').click();

    cy.wait('@loginRequest');
    // Tras el login, la app aún hace getUser() + consulta banned_until antes de
    // navegar a "/", así que ampliamos el timeout para esas peticiones extra.
    cy.url({ timeout: 15000 }).should('eq', 'https://sharkinovhomecourt.vercel.app/');

    cy.visit('https://sharkinovhomecourt.vercel.app/wrapped');
  });

  it('loads the banner, onboarding and the main sections', () => {
    // El banner principal de la pantalla
    cy.contains('Wrapped').should('be.visible');
    cy.contains('The game happened. Make it legendary.').should('be.visible');

    // Los pasos de onboarding ("in 3 simple steps")
    cy.contains('in 3 simple steps', { timeout: 15000 }).should('be.visible');

    // Seccion para elegir el tipo de wrap y sus opciones
    cy.contains('Pick a Wrap').should('be.visible');
    cy.contains('Last Game').should('be.visible');
    cy.contains('MVP Moment').should('be.visible');
    cy.contains('Top Stats').should('be.visible');

    // Panel de personalizacion con sus secciones
    cy.contains('Customize Style').should('be.visible');
    cy.contains('Background').should('be.visible');
    cy.contains('Stickers').should('be.visible');
    cy.contains('Your Caption').should('be.visible');
  });

  it('lets the user pick a wrap type and use the customize buttons', () => {
    // Espera a que cargue y cambia el tipo de wrap seleccionado
    cy.contains('Pick a Wrap', { timeout: 15000 }).should('be.visible');
    cy.contains('MVP Moment').click();
    cy.contains('Top Stats').click();
    cy.contains('Last Game').should('be.visible');

    // Los botones de accion del preview funcionan
    cy.contains('button', 'Download').should('be.visible');
    cy.contains('button', 'Randomize').should('be.visible').click();
    cy.contains('button', 'Reset').should('be.visible').click();
  });
});
