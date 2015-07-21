function toggleSelectInfo(onOff) { 
	var tagCloud = document.getElementById("tag-cloud");
	var map = document.getElementById("inset-map");
	var stLabel1 = document.getElementById("start-time");
	var etLabel1 = document.getElementById("end-time");
	var stLabel2 = document.getElementById("start-time-label");
	var etLabel2 = document.getElementById("end-time-label");

	  // 1 = turn on, 0 = turn off
	if(onOff == 1) {
		tagCloud.style.display = 'block';
		map.style.display = 'block';
		stLabel1.style.display = 'block';
		etLabel1.style.display = 'block';
		stLabel2.style.display = 'block';
		etLabel2.style.display = 'block';
		scene3.visible = true;
	}
	else {
		tagCloud.innerHTML = "";
		tagCloud.style.display = 'none';
		map.style.display = 'none';
		stLabel1.style.display = 'none';
		etLabel1.style.display = 'none';
		stLabel2.style.display = 'none';
		etLabel2.style.display = 'none';
		scene3.visible = false;
	}
}; 

function createWordCloud(strArr) {

	// var strArr = ["HEART:1 CALL:5", "OBEY:10 PUNISH:1 CALL:1","(HT)HOSPITALITY:1 MS:20 MANAGER:1 SONIC:1 ASSISTANT:1","UNITE:1 LONDON:1 BREAK:1 CENTRAL:1 GLAD:1 GUY:5 START:1 (HT)SUMMER:1","HEART:1 CALL:5 DELETE:4 ANXIETY:3 RACE:1 ENJOY:2"];
	var jsonArr = [];
	var allTags = strArr.join(" ").split(" "); //make list of individual strings for each tag/count pair
	// console.log(allTags);

	for(var i=0; i<allTags.length; i++){
		var tagPair = allTags[i].split(":"); //split each tag/count pair to get string for tag, string for count
		// console.log(tagPair[0], tagPair[1]);

		var match = jsonArr.filter(function(obj) { //check if tag has already been seen
		  	return obj["text"] === tagPair[0];
		});

		if(match[0]) { //if tag has already been seen, update its count by adding on new count
			var sum = parseInt(match[0]["size"])+parseInt(tagPair[1])
			// console.log(sum);
			for( var k = 0; k < jsonArr.length; ++k ) {
				if( jsonArr[k]["text"] === tagPair[0] ) {
				  	jsonArr[k]["size"] = parseInt(sum);
				}
			}            
		}

		else { //if tag is new, create a new object with text (tag) and size (tag count)
		  	jsonArr.push({
				text: tagPair[0],
				size: parseInt(tagPair[1])
		  	});
		}

		// console.log(jsonArr);
	}

	var fill = d3.scale.category20(); //colors

	var layout = d3.layout.cloud()
	  .size([200, 150])
	  .words(jsonArr.map(function(d) {return {text:d.text.toLowerCase(), size: d.size+1*6};}))
	  // .rotate(function() { return ~~(Math.random() * 2) * 90; })
	  .rotate(0)
	  .font("impact")
	  .fontSize(function(d) { return d.size; })
	  .on("end", draw);

	layout.start();

	function draw(words) {
		d3.select("#tag-cloud").append("svg")
			.attr("width", layout.size()[0])
			.attr("height", layout.size()[1])
		  .append("g")
			.attr("transform", "translate(" + layout.size()[0] / 2 + "," + layout.size()[1] / 2 + ")")
		  .selectAll("text")
			.data(words)
		  .enter().append("text")
			.style("font-size", function(d) { return d.size + "px"; })
			.style("font-family", "Helvetica")
			.style("fill", function(d, i) { return fill(i); })
			.attr("text-anchor", "middle")
			.attr("transform", function(d) {
			  return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
			})
			.text(function(d) { return d.text; });
	}
}

function createInsetMap() {
	console.log("create inset map");
	var test_json3 = $.getJSON("images/us.geojson", function (data) { 
        drawThreeGeo(scene3, data, 5000, 'plane', {
            color: 'black'
        })    
    });
    scene3.visible = true;
}
