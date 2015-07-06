var main = {

    load: function() {

        $.ajaxPrefilter(function( options, originalOptions, jqXHR ) {
            options.async = true;
        });        

        // Sidebar
        $.get("/sophy/main/ui.jade", function(template) {
            var htmlSidebar = jade.render(template);
            $("#ui").html(htmlSidebar);
        })
        // $.get("/sophy/main/ui.html", function(html) {
        //     $("#ui").html(html);
        // })

        // Upper toolbar
        $.get("/sophy/main/toolbar.jade", function(template) {
            var htmlToolbar = jade.render(template);
            $("#upper").html(htmlToolbar);
        })
        // $.get("/sophy/main/toolbar.html", function(html) {
        //     // console.log(html);
        //     $("#upper").html(html);
        // })

        // three.js visualization
        $.get("/sophy/main/visualization.html", function(html) {
            // console.log(html);
            $("#visualization").html(html);
        })

    }

}