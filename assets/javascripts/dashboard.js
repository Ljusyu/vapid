// Semantic UI
$('.ui.checkbox').checkbox()
$('.ui.dropdown').dropdown()

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
