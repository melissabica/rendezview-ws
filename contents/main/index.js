var main = {

    load: function() {

        $.get("/sophy/main/ui.jade", function(template) {
            var htmlSidebar = jade.render(template)
            $("#ui").html(htmlSidebar)
        })

        $.get("/sophy/main/list.jade", function(template) {
            var htmlMain = jade.render(template)
        })

        $.get("/sophy/main/test.html", function(html) {
            console.log(html)
            $("#list").html(html)            
        })

    }

}