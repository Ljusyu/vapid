$(document).ready(function () {
  // Semantic UI
  $('.ui.checkbox').checkbox()
  $('.ui.dropdown').dropdown()

  // Sidebar
  $('[data-toggle=sidebar]').click(function (e) {
    e.preventDefault()
    $('.ui.sidebar').sidebar('toggle')
  })

  // Ace Editor
  $('.ace_editor').each(function () {
    var $editor = $(this)
    var $textarea = $editor.next("textarea")

    editor = ace.edit(this);
    editor.getSession().setValue($textarea.val())

    editor.getSession().on("change", function () {
      $textarea.val( editor.getSession().getValue() )
    })

    $editor.height(300)
    $textarea.hide()
  })
})
