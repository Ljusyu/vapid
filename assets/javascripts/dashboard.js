var editor = ace.edit('editor');
var $editor = document.querySelector('#editor')
var $textarea = document.querySelector('textarea[name^=content]')

if ($editor) {
  editor.getSession().setValue($textarea.value)

  editor.getSession().on("change", function () {
    $textarea.value = editor.getSession().getValue()
  });

  $editor.style.height = "300px";
  $textarea.style.display = "none";
}