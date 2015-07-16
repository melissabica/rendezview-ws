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
		var kwColors = {};

		// Format inputs for the query
		var param = param;
		console.log("Parameter: "+param);

		var dateRange, start, end;
		if(dateRange){
			dateRange = dateRange.split(" - "); //dateRange[0] = st, dateRange[1] = et
			start = moment(dateRange[0]+" 00:00", "MMM DD, YYYY HH:mm").format("[']YYYY-MM-DD HH:mm[']");
			end = moment(dateRange[1]+" 00:00", "MMM DD, YYYY HH:mm").format("[']YYYY-MM-DD HH:mm[']");
			console.log("Start: "+start);
			console.log("End:   "+end);
			// console.log("Difference: ",moment(dateRange[1], "MMM DD, YYYY").diff(moment(dateRange[0], "MMM DD, YYYY")) )
		}

		if (keywords) {
			var keywords = keywords.split(',');
			var colors = ['5D35C6', 'D56600', '4C7900']
			
			//normalize keywords to uppercase
			for(var i=0; i<keywords.length; i++){
				keywords[i] = "\'"+keywords[i].toUpperCase()+"\'";
				// console.log(typeof keywords[i], keywords[i]);
				kwColors[keywords[i]] = colors[i];
			}
			console.log("Keyword(s): "+keywords);
			console.log("Keywords length "+keywords.length);
			console.log(kwColors);
		}

		var patternType = patternType;
		var types = [];
		console.log("Pattern type: "+patternType);
		if(patternType.toUpperCase() === "FLOCK")
			types = ['HH','LL'];
		else
			types = ['HL','LH'];

		// // Form database query
		// var query = "select word, st, et, value, type, geom, tags from LOCALFORM where"

		// if(patternType.toUpperCase() === "FLOCK") {
		// 	query += " type in ['HH', 'LL']";
		// }
		// else {
		// 	query += " type in ['HL', 'LH']";
		// }
		// if(dateRange) {
		// 	query += " and st > "+start+" and et < "+end;
		// }
		// if(param) {
		// 	query += " and param = '"+param+"'";
		// 	flag = 1;
		// }
		// if(keywords) {    
		// 	query += " and word in ["+keywords+"]";
		// 	flag = 1;
		// }
		// //select word, st, et, value, type, geom, tags from LOCALFORM where word IN ['OPEN','WORK'] and st > '2015-06-19' limit -1
		// query += " limit -1";
		// console.log("Query: ",query);

		// Get data from local json -- also CoIncident
		$.get("main/localform.json.data", function(data) {

			var results = JSON.parse(data);
			var result = results.result;
			// console.log(result);

			var count = 0;

			var tAxisTimeRange = moment(dateRange[1], "MMM DD, YYYY").diff(moment(dateRange[0], "MMM DD, YYYY"),'minutes');
			console.log("t-axis time range: "+tAxisTimeRange+" minutes");

			for (var i=0; i<result.length; i++) {
				if (keywords.indexOf("\'"+result[i].word.toUpperCase()+"\'") > -1 && //keyword matches
					moment(result[i].st).diff(moment(dateRange[0], "MMM DD, YYYY")) >= 0 && // start date matches
					moment(dateRange[1], "MMM DD, YYYY").diff(moment(result[i].et)) >= 0 && // end date matches
					types.indexOf(result[i].type) > -1 && // type matches
					result[i].value >= param
				   ) {

					count++;

					// console.log(result[i].value);

					var dataTimeRange = moment(result[i].et).diff(moment(result[i].st),'minutes');
					// console.log(result[i].st+" - "+result[i].et);
					// console.log("Difference: ",dataTimeRange);

					var timeFromStart = (moment(result[i].st).diff(moment(dateRange[0], "MMM DD, YYYY"),'minutes'));
					// console.log(start +', '+ result[i].st);
					// console.log("Time from start: ", timeFromStart);

					// console.log(end + ', '+ result[i].et);
					// var timeToEnd = ( moment(dateRange[1], "MMM DD, YYYY").diff(moment(result[i].et), 'minutes') );
					// console.log("Time to end: ", timeToEnd);

					// console.log(result[i].geom);
					latsLons = findCoords(result[i].geom);
					// console.log(latsLons.lat1);

					var width = translateLonToX(latsLons.lon2) - translateLonToX(latsLons.lon1); //x-axis (red)
					var depth = translateLatToY(latsLons.lat1) - translateLatToY(latsLons.lat2); // y-axis (blue)
					var height = (dataTimeRange / tAxisTimeRange) * 2000; // t-axis (green)

					var xpos = translateLonToX( midpoint(latsLons.lon1, latsLons.lon2) ); // x-axis (red)
					var ypos = translateLatToY( midpoint(latsLons.lat1, latsLons.lat2) ); // y-axis (blue)
					var tpos = ((timeFromStart / tAxisTimeRange) * 2000); // t-axis (green)

					// var newColor = ColorLuminance('5E35C6', result[i].value*100);
					var newColor = ColorLuminance(String(kwColors[("\'"+result[i].word.toUpperCase()+"\'")]), result[i].value*100);
					// console.log("color: ",String(kwColors[("\'"+result[i].word.toUpperCase()+"\'")]));

					addBox(width, depth, height, xpos, ypos, tpos, newColor, result[i].tags);
					// addBox( width, depth, height, xpos, ypos, mytpos, color, tags )
					// POLYGON(( -75.556703 40.380221, -73.756444 40.380221, -73.756444 40.907506, -75.556703 40.907506, -75.556703 40.380221))

					// break;
				}

				else {
					// not a match
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



	}
}

function translateLonToX(lon) {
	return (4700+(lon/210) * 10000);
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