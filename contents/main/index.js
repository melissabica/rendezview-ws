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

    },

    search: function(keyword, param) {

        removeBoxes();

        var keyword = keyword.split(',') || ['keyword'];
        console.log("Keyword(s): "+keyword);
        // for(var x=0; x<keyword.length; x++){
        //     console.log("Keyword: "+keyword[x]);
        // }
        var param = param || 'param';
        console.log("Parameter: "+param);

        $.get("main/localform.json.data", function(data) {

            var results = JSON.parse(data);
            var result = results.result;
            console.log(result);

            var count = 0;

            for (var i=0; i<result.length; i++) {
                idx = keyword.indexOf(result[i].word.toLowerCase());
                if (idx > -1) {
                    //( width, height, depth, xpos, ypos, color, tags )
                    addBox(Math.floor(Math.random()*101), Math.floor(Math.random()*101), Math.floor(Math.random()*101), Math.floor(Math.random()*1001)-500, Math.floor(Math.random()*801)-400, "#4B3BFF",result[i].tags);
                    // addBox(100,200,100,-100,10,ColorLuminance("0000ff",(result[i].value*1000)),result[i].tags);    
                }
            }
        })

        //NOT WORKING

        // var database = new ODatabase('http://ralfie.hpcc.jp:2480/db-sophydb');
        // databaseInfo = database.open('root','admin');
        // console.log(databaseInfo);
        // console.log("Database: ",database);
        // queryResult = database.query('select * from LOCALFORM');
        // if (queryResult["result"].length == 0){
        //   // commandResult = database.executeCommand('insert into Address (street,type) values (\'Via test 1\',\'Tipo test\')');
        //   console.log("no results");
        // } else {
        //   // commandResult = database.executeCommand('update Address set street = \'Via test 1\' where city.country.name = \'Italy\'');
        //   console.log("results!");
        // }
        // database.close();
        
    },

    date: function(dateRange) {

        var dateRange = dateRange;
        console.log("Date range: "+dateRange);
    },

    pattern: function(patternType) {

        var patternType = patternType;
        console.log("Pattern type: "+patternType);
    }

}


function ColorLuminance(hex, lum) {

    // validate hex string
    hex = String(hex).replace(/[^0-9a-f]/gi, '');
    if (hex.length < 6) {
        hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
    }
    lum = lum || 0;

    // convert to decimal and change luminosity
    var rgb = "#", c, i;
    for (i = 0; i < 3; i++) {
        c = parseInt(hex.substr(i*2,2), 16);
        c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16);
        rgb += ("00"+c).substr(c.length);
    }

    return rgb;
}