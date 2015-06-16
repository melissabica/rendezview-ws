var recipes = {

    searchByIngredient: function(ingredient, sort) {

        // search legistalors by zipcode (default to Boulder, 80301)
        // ref: https://sunlightlabs.github.io/congress/legislators.html

        var ingredient = ingredient || ""
        var sort = sort || ""

        $.get("http://food2fork.com/api/search?key=" + apikey.apikey + "&q=" + ingredient + "&sort=" + sort, function(data) {

            console.log(JSON.parse(data))
            console.log(data.recipes)
            data = JSON.parse(data)
            
            if (data){

                $.get("/food2fork/recipes/list.jade", function(template) {
                    var html = jade.render(template, {
                        data: data
                    })
                    console.log(html)
                    $("#list").html(html)
                })

            }

        })

    },


    load: function() {

        $.get("/food2fork/recipes/ui.jade", function(template) {
            var html = jade.render(template)
            $("#ui").html(html)
        })

        // default search results - most popular recipes
        recipes.searchByIngredient()

    }

}