$(function(){
    $('body').on('click', 'img', function(){
        const _this = $(this);
        const id = _this.data('id');
        console.log(id);
        const result = $.ajax({
         url: `/track/${id}`
        })
    })
})