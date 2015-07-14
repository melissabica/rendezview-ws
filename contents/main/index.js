var main = {

	load: function() {

		$.ajaxPrefilter(function( options, originalOptions, jqXHR ) {
			options.async = true;
		});        

		// Sidebar
		$.get("/rendezview/main/ui.jade", function(template) {
			var htmlSidebar = jade.render(template);
			$("#ui").html(htmlSidebar);
		})
		// $.get("/rendezview/main/ui.html", function(html) {
		//     $("#ui").html(html);
		// })

		// Upper toolbar
		$.get("/rendezview/main/toolbar.jade", function(template) {
			var htmlToolbar = jade.render(template);
			$("#upper").html(htmlToolbar);
		})
		// $.get("/rendezview/main/toolbar.html", function(html) {
		//     // console.log(html);
		//     $("#upper").html(html);
		// })

		// three.js visualization
		$.get("/rendezview/main/visualization.html", function(html) {
			// console.log(html);
			$("#visualization").html(html);
		})

	},

	search: function(keywords, param, dateRange, patternType) {

		// Clear map
		removeBoxes();

		// Format inputs for the query
		var param = param;
		console.log("Parameter: "+param);

		var dateRange, start, end;
		if(dateRange){
			dateRange = dateRange.split(" - "); //dateRange[0] = st, dateRange[1] = et
			start = moment(dateRange[0], "MMM DD, YYYY").format("[']YYYY-MM-DD[']");
			end = moment(dateRange[1], "MMM DD, YYYY").format("[']YYYY-MM-DD[']");
			console.log("Start: "+start);
			console.log("End:   "+end);
		}

		if (keywords) {
			var keywords = keywords.split(',');
			//normalize keywords to uppercase
			for(var i=0; i<keywords.length; i++){
				keywords[i] = "\'"+keywords[i].toUpperCase()+"\'";
				// console.log(typeof keywords[i], keywords[i]);
			}
			console.log("Keyword(s): "+keywords);
			console.log("Keywords length "+keywords.length);
		}

		var patternType = patternType;
		console.log("Pattern type: "+patternType);

		// Form database query
		var query = "select word, st, et, value, type, geom, tags from LOCALFORM where"

		if(patternType.toUpperCase() === "FLOCK") {
			query += " type in ['HH', 'LL']";
		}
		else {
			query += " type in ['HL', 'LH']";
		}
		if(dateRange) {
			query += " and st > "+start+" and et < "+end;
		}
		if(param) {
			query += " and param = '"+param+"'";
			flag = 1;
		}
		if(keywords) {    
			query += " and word in ["+keywords+"]";
			flag = 1;
		}
		//select word, st, et, value, type, geom, tags from LOCALFORM where word IN ['OPEN','WORK'] and st > '2015-06-19' limit -1
		query += " limit -1";
		console.log("Query: ",query);

		// Get data from local json -- also CoIncident
		$.get("main/localform.json.data", function(data) {

			var results = JSON.parse(data);
			var result = results.result;
			// console.log(result);

			var count = 0;

			for (var i=0; i<result.length; i++) {
				idx = keywords.indexOf("\'"+result[i].word.toUpperCase()+"\'");
				if (idx > -1) {
					count++;
					//( width, height, depth, xpos, ypos, color, tags )
					// addBox(Math.floor(Math.random()*101), //width
					//     Math.floor(Math.random()*101), //height
					//     Math.floor(Math.random()*101), //depth
					//     Math.floor(Math.random()*1001)-500, //xpos
					//     Math.floor(Math.random()*801)-400, //ypos
					//     "#4B3BFF",
					//     result[i].tags);

					// console.log(result[i].geom);					
					// console.log(findCoords(result[i].geom));
					latsLons = findCoords(result[i].geom);
					// console.log(latsLons.lat1);

					var width = translateLonToX(latsLons.lon2) - translateLonToX(latsLons.lon1); //x-axis (red)
					var height = 40; // t-axis (green)
					var depth = translateLatToY(latsLons.lat1) - translateLatToY(latsLons.lat2); // y-axis (blue)
					var xpos = translateLonToX( midpoint(latsLons.lon1, latsLons.lon2) ); // x-axis (red)
					var ypos = translateLatToY( midpoint(latsLons.lat1, latsLons.lat2) ); // y-axis (blue)

					addBox(width, height, depth, xpos, ypos, "#4B3BFF", result[i].tags);
					// POLYGON(( -75.556703 40.380221, -73.756444 40.380221, -73.756444 40.907506, -75.556703 40.907506, -75.556703 40.380221))

					break;
				}
				else {
					// console.log(keywords, result[i].word.toUpperCase());
				}

			}
			console.log(count+" results");
		})


		// // NOT WORKING - Connect to Orient database

		 // var database = new ODatabase('http://ralfie.hpcc.jp:2480/sophydb');
		 // console.log("database object created");

		 // databaseInfo = database.open('root','admin');
		 // // console.log("DatabaseInfo: ",databaseInfo,database.databaseInfo);
		 // console.log("Database: ",database);

		 // queryResult = database.query("select word, st, et, value, type, geom, tags from LOCALFORM limit -1");
		 // console.log("QueryResult: ",queryResult);
		// if (queryResult["result"].length == 0){
		// //   commandResult = database.executeCommand('insert into Address (street,type) values (\'Via test 1\',\'Tipo test\')');
		//     console.log(queryResult)["result"];
		// } 
		// else {
		//   commandResult = database.executeCommand('update Address set street = \'Via test 1\' where city.country.name = \'Italy\'');
		// }
		// database.close();



	},

	date: function(dateRange) {

		var dateRange = dateRange.split(" - "); //dateRange[0] = st, dateRange[1] = et
		var start = moment(dateRange[0], "MMM DD, YYYY").format("YYYY-MM-DD");
		var end = moment(dateRange[1], "MMM DD, YYYY").format("YYYY-MM-DD");
		console.log("Start: "+start);
		console.log("End:   "+end);
	},

	pattern: function(patternType) {

		var patternType = patternType;
		console.log("Pattern type: "+patternType);
	}

}

function translateLonToX(lon) {
	return (5400+(lon/180) * 10000);
}

function translateLatToY(lat) {
	return (2200+(lat/180) * -10000); 
}

function midpoint(point1, point2) {
	return ((point1 + point2) / 2);
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

function findCoords(wktString) {
	//"POLYGON(( -75.556703 40.380221, -73.756444 40.380221, -73.756444 40.907506, -75.556703 40.907506, -75.556703 40.380221))"
	newStr = wktString.split(', ');
	for(var i=0; i<newStr.length; i++) {
		newStr[i] = newStr[i].split(' ');
	}
	// console.log("new string ",newStr);
	var latLon = {lat1: parseFloat(newStr[0][2]), 
				  lat2: parseFloat(newStr[2][1]), 
				  lon1: parseFloat(newStr[0][1]), 
				  lon2: parseFloat(newStr[1][0])}
	return (latLon);
}

main.load(); // originally in js/app.js