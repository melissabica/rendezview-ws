var main = {

    load: function() {

        //sidebar
        $.get("/sophy/main/ui.jade", function(template) {
            var htmlSidebar = jade.render(template)
            $("#ui").html(htmlSidebar)
        })

        //three.js visualization
        $.get("/sophy/main/visualization.html", function(html) {
            // console.log(html)
            $("#visualization").html(html)
        })

        // //three.js visualization
        // $.get("/sophy/main/visualization.jade", function(template) {
        //     var html = jade.render(template)
        //     $("#list").html(html)
        // })


    }

}