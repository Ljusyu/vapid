$(document).ready(() => {
  // Semantic UI
  $('.ui.checkbox').checkbox();
  $('.ui.dropdown').dropdown();

  // Sidebar
  $('[data-toggle=sidebar]').click((e) => {
    e.preventDefault();
    $('.ui.sidebar').sidebar('toggle');
  });

  // Ace Editor
  $('.ace_editor').each(function () {
    const $editor = $(this);
    const $textarea = $editor.next('textarea');

    editor = ace.edit(this);
    editor.getSession().setValue($textarea.val());

    editor.getSession().on('change', () => {
      $textarea.val(editor.getSession().getValue());
    });

    $editor.height(300);
    $textarea.hide();
  });

  // Hide messages
  $('.ui.form').submit(() => {
    $('.ui.message').hide();
  });

  // WebSocket listener
  if ('WebSocket' in window) {
    const ws = new WebSocket('ws://localhost:3000/livereload');

    ws.onmessage = (evt) => {
      console.log(JSON.parse(evt.data));
    };
  }
});
