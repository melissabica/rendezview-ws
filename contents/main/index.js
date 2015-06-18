var main = {

    load: function() {

        //sidebar
        $.get("/sophy/main/ui.jade", function(template) {
            var htmlSidebar = jade.render(template)
            $("#ui").html(htmlSidebar)
        })

        //three.js visualization
        $.get("/sophy/main/test2.html", function(html) {
            // console.log(html)
            $("#list").html(html)
        })

    }

}