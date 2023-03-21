// Put your application javascript here
$('document').ready(function(){
    $('.qtyminus').on('click', function() {       
        var qty = parseInt($(this).parent('.qtybox').find('.quantity-input').val());
        if (qty > 1) {
          var inc = qty - 1;
        } else { 
          var inc = qty;
        }
        $(this).parent('.qtybox').find('.quantity-input').attr('value', inc); 
        $('#stick_qty').attr('value', inc);
      });
      $('.qtyplus').on('click', function() {        
        var qty = parseInt($(this).parent('.qtybox').find('.quantity-input').val());
        var inc = qty + 1;
        $(this).parent('.qtybox').find('.quantity-input').attr('value', inc);
        $('#stick_qty').attr('value', inc);
      });   
    
}); 

