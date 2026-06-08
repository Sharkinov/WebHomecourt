describe('Profile page', () => {
  // Inicia sesion antes de cada prueba para poder acceder al perfil propio
  beforeEach(() => {
    cy.intercept('POST', '**/auth/v1/token?grant_type=password').as('loginRequest');

    cy.visit('https://sharkinovhomecourt.vercel.app/login');
    cy.get('input[placeholder="Email"]').type('lakerFan@lakerscourt.com');
    cy.get('input[placeholder="Password"]').type('abc123');
    cy.get('button.text-white').click();

    cy.wait('@loginRequest');
    cy.url().should('eq', 'https://sharkinovhomecourt.vercel.app/');

    // Una vez logueado, navegamos al perfil
    cy.visit('https://sharkinovhomecourt.vercel.app/perfil');
  });

  it('loads the profile header with stats and actions', () => {
    // El encabezado del perfil muestra desde cuando es miembro
    cy.contains('Member since').should('be.visible');

    // Las estadisticas del usuario estan visibles
    cy.contains('Reputation').should('be.visible');
    cy.contains('Credits').should('be.visible');
    cy.contains('Events Created').should('be.visible');
    cy.contains('Events Attended').should('be.visible');
    cy.contains('Cards collected').should('be.visible');

    // El boton de editar perfil esta disponible
    cy.contains('Edit Profile').should('be.visible');
  });

  it('shows the main profile sections', () => {
    // Seccion de amigos con su accion para administrarlos
    cy.contains('Friends').should('be.visible');
    cy.contains('Manage Friends').should('be.visible');

    // Secciones de actividad y eventos del propio perfil
    cy.contains('Voting Activity').should('be.visible');
    cy.contains('My Upcoming Events').should('be.visible');

    // Seccion de logros
    cy.contains('Achievements').should('be.visible');
  });

  it('navigates to My Friends from the profile', () => {
    // Al pulsar "Manage Friends" se va a la pantalla de amigos
    cy.contains('Manage Friends').click();

    cy.url().should('include', '/my-friends');
    cy.contains('h1', 'My Friends').should('be.visible');
  });
});
