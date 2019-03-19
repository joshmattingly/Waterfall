
var margin = {top: 60, right: 10, bottom: 80, left: 73};

var width = 960 - margin.left - margin.right,
    height = 300 - margin.top - margin.bottom;

var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


d3.csv("sample_data.csv").then(function(dataset){

    // make sure volume and percent change columns are numbers
    dataset.forEach(function(d){
        d.Volume = +d.Volume;
        d.PctChg = +d.PctChg;
    });

    // create the waterfall framework (store the start and end location of each bar, with flag stating pos or neg)
    let cumulative = 0;
    for (let i = 0; i < dataset.length; i++){
        dataset[i].start = cumulative;
        cumulative += dataset[i].Volume;
        dataset[i].end = cumulative;

        dataset[i].class = (dataset[i].value >= 0) ? 'positive' : 'negative';
    }

    // create the final ('ending') column
    dataset.push({
        Category: 'Current Year',
        end: cumulative,
        start: 0,
        PctChg: 0,
        class: 'total'
    });

    let yScale = d3.scaleLinear()
        .domain([0, d3.max(dataset, d => d.end)])
        .range([height, 0]);

    let xScale = d3.scaleBand()
        .domain(dataset.map(d => d.Category))
        .range([0, width]);

    let xAxis = d3.axisBottom(xScale);

    // create the bars. Fill is based on whether increase/decrease or start/end
    svg.selectAll('rect')
        .data(dataset)
        .enter()
        .append('rect')
        .attr("x", (d,i) => i * (width / dataset.length))
        .attr("y", d => yScale(Math.max(d.start, d.end)))
        .attr("height", d => Math.abs(yScale(d.end) - yScale(d.start)))
        .attr("width", (width / dataset.length)-8)
        .attr('fill', function(d){
            if(d.Category == 'Last Year' || d.Category == 'Current Year'){
                return '#BFB8BF';
            };
            if(d.PctChg >=0){
                return '#62BB46';
            } else {
                return '#EA5329';
            };
        });

    // call the xAxis and wrap the text
    svg.append("g")
        .call(xAxis)
        .attr("transform", "translate(0, " + height + ")")
        .selectAll(".tick text")
        .call(wrap, xScale.bandwidth());

    // add the percent change labels and center on the top of the bars.
    svg.append("g").selectAll("text")
        .data(dataset)
        .enter()
        .append("text")
        .attr("x", function(d, i){ return i * (width / dataset.length) + 16; })
        .attr("y", d => yScale(Math.max(d.start, d.end)))
        .text(function(d){
            if (d.PctChg != 0){
                let num = d.PctChg * 100;
                if(d.PctChg > 0) {
                    return "+" + num.toFixed(1).toString() + "%";
                } else {
                    return num.toFixed(1).toString() + "%";
                }
            } else {
                return;
            };
        })
        .attr("font-size", "12px");

    // add the start and ending volume numbers. label centered based on height.
    svg.append("g").selectAll("text")
        .data(dataset)
        .enter()
        .append("text")
        .attr("x", (d,i) => i * (width / dataset.length))
        .attr("y", height / 2)
        .text(function(d){
            if (d.Category == 'Last Year' || d.Category == 'Current Year'){
                let volume = d.Volume;
                return volume.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            };
        })
        .attr("fill", "#231F20")
        .attr("text-anchor", "middle");


});

function wrap(text, width) {
    text.each(function() {
        var text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeight = 1.1, // ems
            y = text.attr("y"),
            dy = parseFloat(text.attr("dy")),
            tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em")
        while (word = words.pop()) {
            line.push(word)
            tspan.text(line.join(" "))
            if (tspan.node().getComputedTextLength() > width) {
                line.pop()
                tspan.text(line.join(" "))
                line = [word]
                tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", `${++lineNumber * lineHeight + dy}em`).text(word)
            }
        }
    })
}