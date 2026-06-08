describe('Profile page', () => {
  // Inicia sesion antes de cada prueba para poder acceder al perfil propio
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

    // Una vez logueado, navegamos al perfil
    cy.visit('https://sharkinovhomecourt.vercel.app/perfil');
  });

  it('loads the profile header with stats and actions', () => {
    // El encabezado del perfil muestra desde cuando es miembro.
    // El header carga varias consultas de Supabase, así que esperamos un poco más.
    cy.contains('Member since', { timeout: 15000 }).should('be.visible');

    // Las estadisticas del usuario estan visibles
    cy.contains('Reputation').should('be.visible');
    cy.contains('Credits').should('be.visible');
    cy.contains('Events Created').should('be.visible');
    cy.contains('Events Attended').should('be.visible');
    cy.contains('Cards collected').should('be.visible');

    // El boton de editar perfil esta disponible. Hay dos botones (movil y
    // escritorio); en el viewport por defecto solo el de escritorio es visible.
    cy.contains('button:visible', 'Edit Profile').should('be.visible');
  });

  it('shows the main profile sections', () => {
    // Seccion de amigos con su accion para administrarlos
    cy.contains('Friends', { timeout: 15000 }).should('be.visible');
    cy.contains('Manage Friends').should('be.visible');

    // Secciones de actividad y eventos del propio perfil
    cy.contains('Voting Activity').should('be.visible');
    cy.contains('My Upcoming Events').should('be.visible');

    // Seccion de logros
    cy.contains('Achievements').should('be.visible');
  });

  it('navigates to My Friends from the profile', () => {
    // Al pulsar "Manage Friends" se va a la pantalla de amigos
    cy.contains('Manage Friends', { timeout: 15000 }).click();

    cy.url().should('include', '/my-friends');
    cy.contains('h1', 'My Friends').should('be.visible');
  });
});
