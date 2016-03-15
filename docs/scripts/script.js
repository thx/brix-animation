require(['jquery'], function($) {
  $(function() {
    var headerHeight = $('header').outerHeight()

    $(document).on('scroll.sidescoll', function(e) {
      if ($('body').scrollTop() > headerHeight) {
        $('.side').addClass('side-fixed')
      } else {
        $('.side').removeClass('side-fixed')
      }

    })
  })
})