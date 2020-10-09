var margin = {top: 30, right: 20, bottom: 30, left: 40},
    width = 940 - margin.left - margin.right,
    height = 300 - margin.top - margin.bottom,
    spaceAboveRatio = 0.1;

var barWidth = 0;

var dateFormat = d3.time.format("%d %b %y %H:%M");

var day = 24*60*60*1000, month = day * 30, now = new Date(Date.now()), then = new Date(now.getTime() - month);

var stationNames = {
    'kingston': 'Kingston',
    'walton': 'Walton',
    'maidenhead': 'Maidenhead',
    'reading': 'Reading'
}

function plotGraph(htmlid) {
    then.setHours(0, 0, 0, 0);
    //now.setHours(0, 0, 0, 0);
    var x = d3.time.scale().nice()
        .domain([then, now])
        .rangeRound([0, width]);
    //    .filter([new Date(2001, 1, 1), new Date(2001, 2, 1)])
    //    .rangeRoundBands([0, width], .1);

    var y = d3.scale.linear()
        .rangeRound([height, 0]);
    var ydata = d3.scale.linear()
        .range([Math.round(height * (1 - spaceAboveRatio)), 0]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");
//        .ticks(d3.time.days, 1)
//        .tickFormat(d3.time.format('%d'))
//        .tickSize(0)
//        .tickPadding(8);

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .ticks(10, "");

    var line = d3.svg.line()
        .x(function(d) { return x(d.measured_at); })
        .y(function(d) { return y(d.value); });

    var area = d3.svg.area()
        .x(function(d) { return x(d.measured_at); })
        .y0(height)
        .y1(function(d) { return y(d.value); });

    var tip = d3.tip()
       .attr('class', 'd3-tip')
       .offset([-10, 0])
       .html(function(d) {
          var dt = d.measured_at;
          return "<strong>" + dateFormat(dt) + "</strong><br />" + (d.value).toPrecision(3) + " m<sup>3</sup>/s";
       });

    d3.select("#" + htmlid + "-graph").html("");
    var svg = d3.select("#" + htmlid + "-graph").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    d3.select("#" + htmlid + "-table").html("");
    var table = d3.select("#" + htmlid + "-table").append("table").html("<tr><th>Time</th><th>Flow Rate (m<sup>3</sup>/s)</th></tr>");

    svg.call(tip);

    var parseDateTime = d3.time.format("%Y-%m-%d %H:%M:%S").parse,
        toDate = function(d) { return d3.time.format("%Y-%m-%d").parse(d3.time.format("%Y-%m-%d")(d)); };

    var data,
        query = "select measured_at, value from flowrate where station_name=\"" + stationNames[htmlid] + "\"";

    var startDate = $("#" + htmlid + "-date-from").datepicker("getDate"), endDate = $("#" + htmlid + "-date-to").datepicker("getDate");
    if (startDate !== null && endDate !== null) {
        // Add a day to the end date so that we get that day's data too
        endDate.setTime(endDate.getTime() + 24*60*60*1000);
        query += " AND measured_at > \"" + d3.time.format("%Y-%m-%d")(startDate) + "\" AND measured_at < \"" + d3.time.format("%Y-%m-%d")(endDate) + "\"";
    }

    d3.json("https://wabson.org/flowdata/sqlite.php?db=thames_flow&table=flowrate&query=" + encodeURIComponent(query), function(error, json) {
        if (error) return console.warn(error);

        if (json) {
            data = json.data;
            data.forEach(function(d) {
                d.value = +d.value;
                d["measured_at"] = parseDateTime(d["measured_at"]);
            });
            data.sort(function(d1, d2) {
                return d1["measured_at"].getTime() < d2["measured_at"].getTime() ? -1 : 1;
            });
            var lastTime = 0;
            function uniqueTimes(d) {
                var midnight = toDate(d.measured_at), result = midnight.getTime() != lastTime;
                lastTime = midnight.getTime();
                return result;
            }
            //data = data.filter(uniqueTimes);
        }

        // WA var xtent = d3.extent(data, function(d) { return toDate(d.measured_at); }),
        var xtent = d3.extent(data, function(d) { return d.measured_at; }),
            numCols = Math.round((xtent[1] - xtent[0]) / (24*60*60*1000)) + 1,
            barWidth = Math.floor(width / numCols),
            graphWidth = numCols * barWidth,
            barPadding = Math.floor(barWidth * 0.2);
        x.domain(xtent);
        var days = d3.time.days(xtent[0], xtent[1]);
        var saturdays = d3.time.saturdays(xtent[0], xtent[1]), mondays = d3.time.mondays(xtent[0], xtent[1]);
        var weekends = [];
        if (saturdays.length > 0 && mondays.length > 0) {
            if (saturdays[0] > mondays[0]) { // Is the start of the graph already in a weekend?
                weekends.push([xtent[0], mondays.shift()]);
            }
            while(saturdays.length > 0 && mondays.length > 0) {
                weekends.push([saturdays.shift(), mondays.shift()]);
            }
            if (saturdays.length > 0) { // Is the start of the graph already in a weekend?
                weekends.push([saturdays.shift(), xtent[0]]);
            }
        }
        //WA
        //x.range([0, (numCols-1) * barWidth]);
        y.domain([0, d3.max(data, function(d) { return d.value * (1+spaceAboveRatio); })]);
        svg.append("g")
            .attr("class", "x axis")
        //WA    .attr("transform", "translate(" + barWidth/2 + "," + height + ")")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis)

        svg.append("g")
          .attr("class", "y axis")
          .call(yAxis)
          .append("text")
          //.attr("transform", "rotate(-90)")
          .attr("y", 5)
          .attr("dy", "-14px")
          .attr("dx", "-28px")
          //.attr("dy", "-3.6em")
          //.style("text-anchor", "end")
          .text("Flow Rate (m3/s)");

        svg.selectAll(".weekends")
            .data(weekends)
            .enter().append("rect")
            //.attr("class", function(d) { var day = d.measured_at.getDay(); return day == 0 || day == 6 ? "weekend" : "noshow" })
            .attr("class", "weekend")
            .attr("x", function(d) { return x(d[0]); })
            .attr("width", function(d) { return x(d[1]) - x(d[0]); })
            .attr("y", 0)
            .attr("height", height)
            .attr("transform", "translate(0,0)");

        svg.selectAll(".days")
            .data(days)
            .enter().append("svg:line")
            .attr("class", "weekday")
            //.attr("x1", function(d) { return x(toDate(d.measured_at)); })
            //.attr("x2", function(d) { return x(toDate(d.measured_at)); })
            .attr("x1", function(d) { return x(d); })
            .attr("x2", function(d) { return x(d); })
            .attr("y1", 0)
            .attr("y2", height)
            .attr("transform", "translate(0,0)");

        svg.selectAll(".rule")
            .data(y.ticks(10))
            .enter().append("svg:line")
            .attr("class", "rule")
            .attr("x1", 1)
            .attr("y1", function(d) { return y(d) + 0; })
            .attr("y2", function(d) { return y(d) + 0; })
            .attr("x2", x(xtent[1]));

        svg.selectAll(".bar")
            .data([])
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", function(d) { return x(toDate(d.measured_at)); })
            .attr("width", barWidth - barPadding*2)
            .attr("y", function(d) { return y(d.value); })
            .attr("height", function(d) { return height - y(d.value); })
            .attr("transform", "translate(" + barPadding + ",0)")
            .on('mouseover', tip.show)
            .on('mouseout', tip.hide)

        svg.append("path")
            .datum(data)
            .attr("class", "area")
            .attr("d", area);

        svg.append("path")
            .datum(data)
            .attr("class", "line")
            .attr("d", line);

        svg.selectAll("dot")
            .data(data)
            .enter().append("circle")
            .attr("class", "point")
            .attr("r", 3.5)
            .attr("cx", function(d) { return x(d.measured_at); })
            .attr("cy", function(d) { return y(d.value); })
            .on('mouseover', tip.show)
            .on('mouseout', tip.hide)
            .on('click', function (d, i){ console.log(d, i);} );

        table.selectAll(".row")
            .data(data)
            .enter().append("tr")
            .html(function(d) { return "<td>" + dateFormat(d.measured_at) + "</td><td>" + d.value + "</td>"; });
    });
};

