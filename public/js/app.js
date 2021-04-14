

//new.ej ----------------------
$('#updateForm').hide();

$('#updateBtn').on('click',function(){
  $('.bookContain').hide();
  $('#updateForm').toggle();

});



//header -------------------

$('nav').hide();

$('header i').on('click',function(){
  $('nav').toggle();
});
