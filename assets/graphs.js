const apiBaseUrl = "https://pubsm4kw3kv5thp2m6zsgfzlwi0tzxyh.lambda-url.eu-west-2.on.aws/";

const svgMinWidth = 300;
const svgMaxHeight = 300;
const numDays = 7;

const margin = {top: 30, right: 20, bottom: 30, left: 40};
const spaceAboveRatio = 0.1;

const dateFormat = d3.time.format("%d %b %y %H:%M");

const day = 24*60*60*1000, rangePeriod = day * numDays, now = new Date(Date.now()), then = new Date(now.getTime() - rangePeriod);

function plotGraph(htmlid) {
    if (document.readyState === "loading") {
        addEventListener('DOMContentLoaded', () => _plotGraph(htmlid));
    } else {
        _plotGraph(htmlid);
    }
}

function _plotGraph(htmlid) {
    const graphEl = document.getElementById(htmlid), parentEl = graphEl.parentNode.parentNode;
    const svgWidth = Math.max(parentEl.clientWidth, svgMinWidth), svgHeight = Math.min(window.innerWidth, svgMaxHeight);
    const width = svgWidth - margin.left - margin.right,
        height = svgHeight - margin.top - margin.bottom;
    then.setHours(0, 0, 0, 0);
    //now.setHours(0, 0, 0, 0);
    const x = d3.time.scale().nice()
        .domain([then, now])
        .rangeRound([0, width]);

    const y = d3.scale.linear()
        .rangeRound([height, 0]);
    const ydata = d3.scale.linear()
        .range([Math.round(height * (1 - spaceAboveRatio)), 0]);

    const xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

    const yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .ticks(10, "");

    const line = d3.svg.line()
        .x(d => x(d.measured_at))
        .y(d => y(d.value));

    const area = d3.svg.area()
        .x(d => x(d.measured_at))
        .y0(height)
        .y1(d => y(d.value));

    const tip = d3.tip()
       .attr('class', 'd3-tip')
       .offset([-10, 0])
       .html(d => `<strong>${dateFormat(d.measured_at)}</strong><br />${d.value.toPrecision(3)} m<sup>3</sup>/s`);

    d3.select(`#${htmlid}-graph`).html("");
    const svg = d3.select(`#${htmlid}-graph`).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    d3.select(`#${htmlid}-table`).html("");
    const table = d3.select(`#${htmlid}-table`).append("table").html("<tr><th>Time</th><th>Flow Rate (m<sup>3</sup>/s)</th></tr>");

    svg.call(tip);

    const parseDateTime = d3.time.format.utc("%Y-%m-%d %H:%M:%S").parse,
        toDate = d => d3.time.format.utc("%Y-%m-%d").parse(d3.time.format.utc("%Y-%m-%d")(d));

    const startDate = $(`#${htmlid}-date-from`).datepicker("getDate"), endDate = $(`#${htmlid}-date-to`).datepicker("getDate");
    const stationName = document.getElementById(htmlid).dataset.stationName;
    let apiUrl = `${apiBaseUrl}?station_name=${encodeURIComponent(stationName)}`;
    if (startDate !== null && endDate !== null) {
        // Add a day to the end date so that we get that day's data too
        endDate.setTime(endDate.getTime() + 24*60*60*1000);
        apiUrl += `&start=${d3.time.format("%Y-%m-%d")(startDate)}&end=${d3.time.format("%Y-%m-%d")(endDate)}`;
    }

    d3.json(apiUrl, (error, json) => {
        if (error) return console.warn(error);

        let data;
        if (json) {
            data = json.data;
            console.log(json);
            data.forEach(d => {
                d.value = +d.value;
                d.measured_at = parseDateTime(d.measured_at);
            });
            data.sort((d1, d2) => d1.measured_at.getTime() < d2.measured_at.getTime() ? -1 : 1);
            //data = data.filter(uniqueTimes);
        }

        // WA var xtent = d3.extent(data, function(d) { return toDate(d.measured_at); }),
        const xtent = d3.extent(data, d => d.measured_at),
            numCols = Math.round((xtent[1] - xtent[0]) / (24*60*60*1000)) + 1,
            barWidth = Math.floor(width / numCols),
            graphWidth = numCols * barWidth,
            barPadding = Math.floor(barWidth * 0.2);
        x.domain(xtent);
        const days = d3.time.days(xtent[0], xtent[1]);
        const saturdays = d3.time.saturdays(xtent[0], xtent[1]), mondays = d3.time.mondays(xtent[0], xtent[1]);
        const weekends = [];
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
        y.domain([0, d3.max(data, d => d.value * (1 + spaceAboveRatio))]);
        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", `translate(0,${height})`)
            .call(xAxis)

        svg.append("g")
          .attr("class", "y axis")
          .call(yAxis)
          .append("text")
          .attr("y", 5)
          .attr("dy", "-14px")
          .attr("dx", "-28px")
          .text("Flow Rate (m3/s)");

        svg.selectAll(".weekends")
            .data(weekends)
            .enter().append("rect")
            .attr("class", "weekend")
            .attr("x", d => x(d[0]))
            .attr("width", d => x(d[1]) - x(d[0]))
            .attr("y", 0)
            .attr("height", height)
            .attr("transform", "translate(0,0)");

        svg.selectAll(".days")
            .data(days)
            .enter().append("svg:line")
            .attr("class", "weekday")
            .attr("x1", d => x(d))
            .attr("x2", d => x(d))
            .attr("y1", 0)
            .attr("y2", height)
            .attr("transform", "translate(0,0)");

        svg.selectAll(".rule")
            .data(y.ticks(10))
            .enter().append("svg:line")
            .attr("class", "rule")
            .attr("x1", 1)
            .attr("y1", d => y(d))
            .attr("y2", d => y(d))
            .attr("x2", x(xtent[1]));

        svg.selectAll(".bar")
            .data([])
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", d => x(toDate(d.measured_at)))
            .attr("width", barWidth - barPadding*2)
            .attr("y", d => y(d.value))
            .attr("height", d => height - y(d.value))
            .attr("transform", `translate(${barPadding},0)`)
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
            .attr("cx", d => x(d.measured_at))
            .attr("cy", d => y(d.value))
            .on('mouseover', tip.show)
            .on('mouseout', tip.hide)
            .on('click', (d, i) => console.log(d, i));

        table.selectAll(".row")
            .data(data)
            .enter().append("tr")
            .html(d => `<td>${dateFormat(d.measured_at)}</td><td>${d.value}</td>`);

        const statusEl = document.getElementById('lastFlowDiv') || document.createElement("p");
        statusEl.id = 'lastFlowDiv';
        const lastValue = data.length ? data[data.length - 1] : null;
        if (lastValue) {
            const formattedValue = Math.round(lastValue.value * 10) / 10;
            const formattedDate = new Intl.DateTimeFormat(undefined, {dateStyle: 'medium', timeStyle: 'short'}).format(lastValue.measured_at);
            statusEl.innerHTML = `<span style="font-size: 1.2em; font-weight: bold;"><span>Latest flow rate is ${formattedValue} m3/sec</span><span style="padding-left: 5px; color: #999;">measured at ${formattedDate}</span></span>`;
            graphEl.prepend(statusEl);
        }
    });
}
