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

	search: function(keywords, threshold, dateRange, patternType, database) {

		// Clear map
		removeBoxes();
		removeInsetBoxes();
		document.getElementById("start-time").innerHTML = '';
		document.getElementById("end-time").innerHTML = '';
		toggleSelectInfo(0);
		var kwColors = {};

		// Format inputs for the query
		var threshold =parseFloat(threshold);
		console.log("Parameter: ",threshold);

		var dateRange, start, end;
		if(dateRange){
			dateRange = dateRange.split(" - "); //dateRange[0] = st, dateRange[1] = et
			// Dates on calendar start at midnight
			start = moment(dateRange[0]+" 00:00", "MMM DD, YYYY HH:mm").format("[']YYYY-MM-DD HH:mm[']");
			end = moment(dateRange[1]+" 00:00", "MMM DD, YYYY HH:mm").format("[']YYYY-MM-DD HH:mm[']");
			console.log("Start: ",start);
			console.log("End:   ",end);
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
			console.log("Keyword(s): ",keywords);
			console.log("Keywords length ",keywords.length);
			console.log("Keyword colors: ",kwColors);
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
		// if(threshold) {
		// 	query += " and threshold = '"+threshold+"'";
		// 	flag = 1;
		// }
		// if(keywords) {    
		// 	query += " and word in ["+keywords+"]";
		// 	flag = 1;
		// }
		// //select word, st, et, value, type, geom, tags from LOCALFORM where word IN ['OPEN','WORK'] and st > '2015-06-19' limit -1
		// query += " limit -1";
		// console.log("Query: ",query);

		if (database === "localform")
			db = "main/localform2.json.data"
		else if (database === "coincident")
			db = "main/coincident.json.data"

		// Get data from local json -- also CoIncident
		$.get(db, function(data) {

			console.log("get local data");

			var results = JSON.parse(data);
			var result = results.result;
			console.log(result);
			var startTime = result[0].st; // Start time of earliest selected box
			var endTime = result[0].et; // End time of latest selected box

			var count = 0;

			var tAxisTimeRange = moment(dateRange[1], "MMM DD, YYYY").diff(moment(dateRange[0], "MMM DD, YYYY"),'minutes'); // Minutes in selected date range from calendar (will always be multiple of 1440 = 24 hours)
			console.log("t-axis time range: ",tAxisTimeRange," minutes");

			for (var i=0; i<result.length; i++) {
				var word;
				if(database === "localform")
					word = result[i].word;
				if(database === "coincident")
					word = result[i].outword;

				if (keywords.indexOf("\'"+word.toUpperCase()+"\'") > -1 && // keyword matches
					moment(result[i].st).diff(moment(dateRange[0], "MMM DD, YYYY")) >= 0 && // start date matches
					moment(dateRange[1], "MMM DD, YYYY").diff(moment(result[i].et)) >= 0 && // end date matches
					((types.indexOf(result[i].type) > -1) || database==="coincident") && // type matches (if localform)
					result[i].value >= threshold) // value matches
				{

					count++;

					// if (moment(result[i].st).diff(startTime) >= 0){
					// 	console.log("earlier")
					// }

					var dataTimeRange = moment(result[i].et).diff(moment(result[i].st),'minutes'); // Minutes from st to et of data
					var timeFromStart = (moment(result[i].st).diff(moment(dateRange[0], "MMM DD, YYYY"),'minutes')); // Minutes from beginning of date range to data st
					var latsLons = findCoords(result[i].geom); // Object with lats and longs of data

					// Boxes for main map
					var width = translateLonToX(latsLons.lon2) - translateLonToX(latsLons.lon1); //x-axis (red)
					var depth = translateLatToY(latsLons.lat1) - translateLatToY(latsLons.lat2); // y-axis (blue)
					var height = (dataTimeRange / tAxisTimeRange) * 1000; // t-axis (green)

					var xpos = translateLonToX( midpoint(latsLons.lon1, latsLons.lon2) ); // x-axis (red)
					var ypos = translateLatToY( midpoint(latsLons.lat1, latsLons.lat2) ); // y-axis (blue)
					var tpos = ((timeFromStart / tAxisTimeRange) * 1000); // t-axis (green)

					// var newColor = ColorLuminance('5E35C6', result[i].value*100);
					if(database === "localform")
						mult = 10000;
					else
						mult = 1;
					var newColor = ColorLuminance(String(kwColors[("\'"+word.toUpperCase()+"\'")]), result[i].value*mult);

					var boxInfo = { width: width, 
									depth: depth, 
									height: height, 
									xpos: xpos, 
									ypos: ypos, 
									tpos: tpos, 
									color: newColor, 
									tags: result[i].tags, 
									geom: result[i].geom,
									st: result[i].st,
									et: result[i].et };

					addBox(boxInfo);
					// console.log("result[i].st: ",result[i].st, typeof result[i].st)

					// break;
				}

				else {
					// not a match
					// console.log(keywords.indexOf("\'"+word.toUpperCase()+"\'") > -1);
					// console.log(keywords, word);
					// console.log(moment(result[i].st).diff(moment(dateRange[0], "MMM DD, YYYY")) >= 0); // start date matches
					// console.log(moment(dateRange[1], "MMM DD, YYYY").diff(moment(result[i].et)) >= 0); // end date matches
					// console.log( (types.indexOf(result[i].type) > -1) || database==="coincident" ); // type matches

					// break;
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

// Main map translations
function translateLonToX(lon) {
	return (4700+(lon/210) * 10000);
}

function translateLatToY(lat) {
	return (2200+(lat/180) * -10000); 
}

// Inset map translations
function translateLonToX2(lon) {
    return (2300+(lon/210) * 5000);
}

function translateLatToY2(lat) {
	return (-950+(lat/180) * 5000);
}
////

// Parse WKT string to get 4 coordinates used to calculate width/depth of boxes
function findCoords(wktString) {
	//Example: POLYGON(( -75.556703 40.380221, -73.756444 40.380221, -73.756444 40.907506, -75.556703 40.907506, -75.556703 40.380221))
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

function midpoint(point1, point2) {
	return ((point1 + point2) / 2);
}

function addInsetMapBox(geom) {
	var latsLons = findCoords(geom);

	var width = translateLonToX2(latsLons.lon2) - translateLonToX2(latsLons.lon1);
	var depth = translateLatToY2(latsLons.lat1) - translateLatToY2(latsLons.lat2);
	var height = 10;

	var xpos = translateLonToX2( midpoint(latsLons.lon1, latsLons.lon2) );
	var ypos = translateLatToY2( midpoint(latsLons.lat1, latsLons.lat2) );
	var tpos = 5;

	addBox2(width, depth, height, xpos, ypos, tpos, "#FF0000");
}

// Multiply a hex color by a value to get a different shade
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


function updateTimeLabels(start, end, shift) {
	var stLabel = document.getElementById("start-time");
	if(stLabel.innerHTML != "") {
		var currentSt = moment(stLabel.innerHTML).format("YYYY-MM-DD HH:mm:ss");
		var newSt = moment(start).format("YYYY-MM-DD HH:mm:ss");

		// update if selected box start time earlier than current start time AND shift is clicked	
		if(moment(currentSt).diff(newSt) > 0 && shift === true) { 
			stLabel.innerHTML = start;
		}
	}
	else
		stLabel.innerHTML = start;	


	var etLabel = document.getElementById("end-time");
	if(etLabel.innerHTML != "") {
		var currentEt = moment(etLabel.innerHTML).format("YYYY-MM-DD HH:mm:ss");
		var newEt = moment(start).format("YYYY-MM-DD HH:mm:ss");

		// update if selected box end time later than current end time AND shift is clicked	
		if(moment(newEt).diff(currentEt) > 0 && shift === true) { 
			etLabel.innerHTML = end;
		}
	}
	else
		etLabel.innerHTML = end;
}


function createSankey() {
	var newJson = {"links":[], "nodes":[]};
	$.get("main/coincident.json.data", function(data) {
		var results = JSON.parse(data);
		var result = results.result;
		console.log("coincident: ",result[0]);
		var length = result.length;

		for(var i=0; i<length; i++) {
			if(result[i].inword === "TODAY" && result[i].outword != "TODAY"){
				// console.log("if true");

				// add link from outword to inword to links if it does not yet exist
				// console.log("find where:", (_.findWhere(newJson.links, { 'source': result[i].outword, 'target': result[i].inword })) );
				var index = _.findIndex(newJson.links, { 'source': result[i].outword, 'target': result[i].inword });
				if(index === -1) {
					newJson.links.push({"source": result[i].outword, 
										"target": result[i].inword, 
										"value": String(result[i].value)});
					// console.log("new: ",result[i].outword, result[i].inword, result[i].value)
				}
				else {
					// find link in newJson.links from outword to inword and update value
					// console.log("update: ",result[i].outword, result[i].inword, newJson.links[index].value, result[i].value)
					var newValue = parseFloat(newJson.links[index].value) + result[i].value;
					newJson.links[index].value = String(newValue);
				}

				// add inword/outword to nodes if it does not yet exist
				if(! (_.includes(_.pluck(newJson.nodes, 'name'), result[i].outword)) ) {
					newJson.nodes.push({"name": result[i].outword});
				}
				
				if(! (_.includes(_.pluck(newJson.nodes, 'name'), result[i].inword)) ) {
					newJson.nodes.push({"name": result[i].inword});
				}
			}
			if(i==199)
				break;
		}
		console.log("newJson: ",JSON.stringify(newJson));
	});


	// load the data
	d3.json("main/test.json.data", function(error, graph) {
	 
		var nodeMap = {};
		graph.nodes.forEach(function(x) { nodeMap[x.name] = x; });
		graph.links = graph.links.map(function(x) {
		  return {
			source: nodeMap[x.source],
			target: nodeMap[x.target],
			value: x.value
		  };
		});
	 
	  sankey
		  .nodes(graph.nodes)
		  .links(graph.links)
		  .layout(32);
	 
	// add in the links
	  var link = svg.append("g").selectAll(".link")
		  .data(graph.links)
		.enter().append("path")
		  .attr("class", "link")
		  .attr("d", path)
		  .style("stroke-width", function(d) { return Math.max(1, d.dy); })
		  .sort(function(a, b) { return b.dy - a.dy; })
		  .on("click", function(d) { onLinkClick(d.source.name,d.target.name);removeBoxes();removeInsetBoxes(); });

	 
	// add the link titles
	  link.append("title")
			.text(function(d) {
			return d.source.name + " → " + d.target.name + "\n" + format(d.value); });
	 
	// add in the nodes
	  var node = svg.append("g").selectAll(".node")
		  .data(graph.nodes)
		.enter().append("g")
		  .attr("class", "node")
		  .attr("transform", function(d) { 
			  return "translate(" + d.x + "," + d.y + ")"; })
		.call(d3.behavior.drag()
		  .origin(function(d) { return d; })
		  .on("dragstart", function() { 
			  this.parentNode.appendChild(this); })
		  .on("drag", dragmove));
	 
	// add the rectangles for the nodes
	  node.append("rect")
		  .attr("height", function(d) { return d.dy; })
		  .attr("width", sankey.nodeWidth())
		  .style("fill", function(d) { 
			  return d.color = color(d.name.replace(/ .*/, "")); })
		  .style("stroke", function(d) { 
			  return d3.rgb(d.color).darker(2); })
		.append("title")
		  .text(function(d) { 
			  return d.name + "\n" + format(d.value); });
	 
	// add in the title for the nodes
	  node.append("text")
		  .attr("x", -6)
		  .attr("y", function(d) { return d.dy / 2; })
		  .attr("dy", ".35em")
		  .attr("text-anchor", "end")
		  .attr("transform", null)
		  .text(function(d) { return d.name; })
		.filter(function(d) { return d.x < width / 2; })
		  .attr("x", 6 + sankey.nodeWidth())
		  .attr("text-anchor", "start");
	 
	// the function for moving the nodes
	  function dragmove(d) {
		d3.select(this).attr("transform", 
		   "translate(" + d.x + "," + (
					d.y = Math.max(0, Math.min(height - d.dy, d3.event.y))
				) + ")");
		sankey.relayout();
		link.attr("d", path);
	  }
	});
}

function onLinkClick(a,b) {
	word1 = a.split(' ');
	word2 = b.split(' ');
	console.log("clicked on link",word1[0],word2[0]);
	main.search( word1[0], 0, $("#date-range-label").text(), $("input[name=pattern]:checked", "#searchOptions").val(), "coincident" );
}

main.load(); // originally in js/app.js