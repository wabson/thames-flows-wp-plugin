const apiBaseUrl = "https://pubsm4kw3kv5thp2m6zsgfzlwi0tzxyh.lambda-url.eu-west-2.on.aws/";

const svgMinWidth = 300;
const svgMaxHeight = 300;
const numDays = 7;

const margin = {top: 30, right: 20, bottom: 30, left: 40};
const spaceAboveRatio = 0.1;

const dateFormat = d3.timeFormat("%d %b %y %H:%M");

const day = 24*60*60*1000, rangePeriod = day * numDays, now = new Date(Date.now()), then = new Date(now.getTime() - rangePeriod);

function initGraph(htmlid) {
    document.getElementById(`${htmlid}-date-from`).value = then.toISOString().split("T")[0];
    document.getElementById(`${htmlid}-date-to`).value = now.toISOString().split("T")[0];
    document.getElementById(`${htmlid}-change-btn`).addEventListener("click", function() {
        plotGraph(this.id.replace("-change-btn", ""));
    });
    plotGraph(htmlid);
    document.querySelector(`#${htmlid}-data-toggle a`).addEventListener("click", function(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        const tableEl = document.getElementById(this.parentNode.id.replace("-data-toggle", "-table"));
        tableEl.style.display = tableEl.style.display === "none" ? "" : "none";
    });
    window.addEventListener("orientationchange", () => plotGraph(htmlid));
    if (screen && screen.orientation && screen.orientation.addEventListener) {
        screen.orientation.addEventListener("change", () => plotGraph(htmlid));
    }
}

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

    const x = d3.scaleTime()
        .domain([then, now])
        .rangeRound([0, width]);

    const y = d3.scaleLinear()
        .rangeRound([height, 0]);

    const ydata = d3.scaleLinear()
        .range([Math.round(height * (1 - spaceAboveRatio)), 0]);

    const xAxis = d3.axisBottom(x);
    const yAxis = d3.axisLeft(y).ticks(10);

    const line = d3.line()
        .x(d => x(d.measured_at))
        .y(d => y(d.value));

    const area = d3.area()
        .x(d => x(d.measured_at))
        .y0(height)
        .y1(d => y(d.value));

    // Singleton tooltip shared across all graphs on the page
    let tooltipEl = document.getElementById('flow-graph-tooltip');
    if (!tooltipEl) {
        tooltipEl = document.createElement('div');
        tooltipEl.id = 'flow-graph-tooltip';
        tooltipEl.className = 'd3-tip';
        document.body.appendChild(tooltipEl);
    }
    const showTip = (event, d) => {
        tooltipEl.innerHTML = `<strong>${dateFormat(d.measured_at)}</strong><br />${d.value.toPrecision(3)} m<sup>3</sup>/s`;
        tooltipEl.style.opacity = '1';
        tooltipEl.style.left = (event.pageX + 10) + 'px';
        tooltipEl.style.top = (event.pageY - 40) + 'px';
    };
    const moveTip = (event) => {
        tooltipEl.style.left = (event.pageX + 10) + 'px';
        tooltipEl.style.top = (event.pageY - 40) + 'px';
    };
    const hideTip = () => { tooltipEl.style.opacity = '0'; };

    d3.select(`#${htmlid}-graph`).html("");
    const svg = d3.select(`#${htmlid}-graph`).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    d3.select(`#${htmlid}-table`).html("");
    const table = d3.select(`#${htmlid}-table`).append("table").html("<tr><th>Time</th><th>Flow Rate (m<sup>3</sup>/s)</th></tr>");

    const parseDateTime = d3.utcParse("%Y-%m-%d %H:%M:%S"),
        toDate = d => d3.utcParse("%Y-%m-%d")(d3.utcFormat("%Y-%m-%d")(d));

    const startDateVal = document.getElementById(`${htmlid}-date-from`).value;
    const endDateVal = document.getElementById(`${htmlid}-date-to`).value;
    const startDate = startDateVal ? new Date(startDateVal) : null;
    const endDate = endDateVal ? new Date(endDateVal) : null;
    const stationName = document.getElementById(htmlid).dataset.stationName;
    let apiUrl = `${apiBaseUrl}?station_name=${encodeURIComponent(stationName)}`;
    if (startDate !== null && endDate !== null) {
        // Add a day to the end date so that we get that day's data too
        endDate.setTime(endDate.getTime() + 24*60*60*1000);
        apiUrl += `&start=${d3.timeFormat("%Y-%m-%d")(startDate)}&end=${d3.timeFormat("%Y-%m-%d")(endDate)}`;
    }

    d3.json(apiUrl).then(json => {
        let data;
        if (json) {
            data = json.data;
            console.log(json);
            data.forEach(d => {
                d.value = +d.value;
                d.measured_at = parseDateTime(d.measured_at);
            });
            data.sort((d1, d2) => d1.measured_at.getTime() < d2.measured_at.getTime() ? -1 : 1);
        }

        // WA var xtent = d3.extent(data, function(d) { return toDate(d.measured_at); }),
        const xtent = d3.extent(data, d => d.measured_at),
            numCols = Math.round((xtent[1] - xtent[0]) / (24*60*60*1000)) + 1,
            barWidth = Math.floor(width / numCols),
            graphWidth = numCols * barWidth,
            barPadding = Math.floor(barWidth * 0.2);
        x.domain(xtent);
        const days = d3.timeDays(xtent[0], xtent[1]);
        const saturdays = d3.timeSaturdays(xtent[0], xtent[1]), mondays = d3.timeMondays(xtent[0], xtent[1]);
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
            .enter().append("line")
            .attr("class", "weekday")
            .attr("x1", d => x(d))
            .attr("x2", d => x(d))
            .attr("y1", 0)
            .attr("y2", height);

        svg.selectAll(".rule")
            .data(y.ticks(10))
            .enter().append("line")
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
            .on('mouseover', showTip)
            .on('mousemove', moveTip)
            .on('mouseout', hideTip);

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
            .on('mouseover', showTip)
            .on('mousemove', moveTip)
            .on('mouseout', hideTip)
            .on('click', (event, d) => console.log(d));

        table.selectAll(".row")
            .data(data)
            .enter().append("tr")
            .html(d => `<td>${dateFormat(d.measured_at)}</td><td>${d.value}</td>`);

        const statusEl = document.getElementById('lastFlowDiv') || document.createElement("p");
        statusEl.id = 'lastFlowDiv';
        const lastValue = data.length ? data[data.length - 1] : null;
        if (lastValue) {
            const formattedValue = Math.round(lastValue.value * 10) / 10;
            const formattedDate = new Intl.DateTimeFormat(undefined, {day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short'}).format(lastValue.measured_at);
            statusEl.innerHTML = `<span style="font-size: 1.2em; font-weight: bold;"><span>Latest flow rate is ${formattedValue} m3/sec</span><span style="padding-left: 5px; color: #999;">measured at ${formattedDate}</span></span>`;
            graphEl.prepend(statusEl);
        }
    }).catch(error => console.warn(error));
}
