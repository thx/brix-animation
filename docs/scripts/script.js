require(['jquery'], function($) {
  $(function() {
    var headerHeight = $('header').outerHeight()

    var setSideFixed = function() {
      if ($('body').scrollTop() > headerHeight) {
        $('.side').addClass('side-fixed')
      } else {
        $('.side').removeClass('side-fixed')
      }
    }

    $(document).on('scroll.sidescoll', setSideFixed)
    setSideFixed()


    $('.side').on('click', 'a', function(e) {
      $('.side a').removeClass('active')
      $(e.currentTarget).addClass('active')
    })

  })
})