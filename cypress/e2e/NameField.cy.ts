context('NameField', () => {
  beforeEach(() => {
    cy.visit('http://localhost:6006/iframe.html?args=&id=namefield--valid-name&viewMode=story');
  });

  it('Input field should contain text "valid-name"', () => {
    cy.findByRole('textbox', { name: /name/ }).should('exist');
  });

  it('Type invalid name', () => {
    cy.findByRole('textbox', { name: /name/ }).type('Hello world');
    cy.findByRole('dialog', { name: /validation popover/i }).should('exist');
    cy.findByRole('alert', {
      name: /must start and end with an lowercase alphanumeric character/i,
    }).should('exist');
    cy.findByRole('alert', {
      name: 'Use lowercase alphanumeric characters, dot (.) or hyphen (-)',
    }).should('exist');
  });
});
