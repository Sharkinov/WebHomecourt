describe('My Friends page', () => {
  // Inicia sesion y entra a la pantalla de amigos antes de cada prueba
  beforeEach(() => {
    cy.intercept('POST', '**/auth/v1/token?grant_type=password').as('loginRequest');

    cy.visit('https://sharkinovhomecourt.vercel.app/login');
    cy.get('input[placeholder="Email"]').type('lakerFan@lakerscourt.com');
    cy.get('input[placeholder="Password"]').type('abc123');
    cy.get('button.text-white').click();

    cy.wait('@loginRequest');
    cy.url().should('eq', 'https://sharkinovhomecourt.vercel.app/');

    cy.visit('https://sharkinovhomecourt.vercel.app/my-friends');
  });

  it('loads the header and the three tabs', () => {
    // Titulo y subtitulo de la pantalla
    cy.contains('h1', 'My Friends').should('be.visible');
    cy.contains('Connect, share, and stay in touch with your community').should('be.visible');

    // Las tres pestañas estan presentes
    cy.contains('button', 'My Friends').should('be.visible');
    cy.contains('button', 'Pending Requests').should('be.visible');
    cy.contains('button', 'Add Friend').should('be.visible');
  });

  it('shows the My Friends tab as active by default', () => {
    // La pestaña "My Friends" arranca activa (fondo morado oscuro)
    cy.contains('button', 'My Friends').should('have.class', 'bg-morado-oscuro');

    // El buscador de amigos esta visible en esta pestaña
    cy.get('input[placeholder="Search friends"]').should('be.visible');
  });

  it('switches to the Add Friend tab', () => {
    cy.contains('button', 'Add Friend').click();

    // La pestaña "Add Friend" queda activa
    cy.contains('button', 'Add Friend').should('have.class', 'bg-morado-oscuro');

    // Se muestra el contenido para buscar y enviar solicitudes
    cy.contains('Search for a Friend').should('be.visible');
    cy.get('input[placeholder="Username or nickname"]').should('be.visible');
    cy.contains('button', 'Find Friend').should('be.visible');
  });

  it('switches to the Pending Requests tab', () => {
    cy.contains('button', 'Pending Requests').click();

    // La pestaña "Pending Requests" queda activa
    cy.contains('button', 'Pending Requests').should('have.class', 'bg-morado-oscuro');

    // Se muestra la lista de solicitudes (o el mensaje de vacio)
    cy.get('div.w-full.pb-8').should('be.visible');
  });

  it('lets the user search for a friend', () => {
    cy.contains('button', 'Add Friend').click();

    // Escribir en el buscador habilita el boton de busqueda
    cy.get('input[placeholder="Username or nickname"]').type('lakers');
    cy.contains('button', 'Find Friend').should('not.be.disabled').click();
  });
});
