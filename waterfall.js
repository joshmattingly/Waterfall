
var margin = {top: 160, right: 10, bottom: 80, left: 70};

var width = 1000 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var symbol = d3.symbol();


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

    let barWidth = (width / dataset.length);
    let barWidthPadding = 15;
    let volumeLabelOffset = 31;
    let volumeFontSize = 14;
    let labelFontSize = 12;
    let textXpadding = 10;
    let textYpadding = 3;
    let numDec = 1;
    let yoyVertPad = 30;
    let arrowHeadSize = 75;
    let arrowHeadXpad = 30;
    let arrowHeadYpad = 6;
    let horizonLineX1Pad = 5.5;
    let horizonLineX2Pad = 46.5;
    let ellipseRadius = 35;
    let ellipseTextPad = 5;

    // create the bars. Fill is based on whether increase/decrease or start/end
    svg.selectAll('rect')
        .data(dataset)
        .enter()
        .append('rect')
        .attr("x", (d,i) => i * (width / dataset.length))
        .attr("y", d => yScale(Math.max(d.start, d.end)))
        .attr("height", d => Math.abs(yScale(d.end) - yScale(d.start)))
        .attr("width", barWidth-barWidthPadding)
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
        .attr("x", function(d, i){ return i * (width / dataset.length) + textXpadding; })
        .attr("y", d => yScale(Math.max(d.start, d.end)) - textYpadding)
        .text(function(d){
            if (d.PctChg != 0){
                let num = d.PctChg * 100;
                if(d.PctChg > 0) {
                    return "+" + num.toFixed(numDec).toString() + "%";
                } else {
                    return num.toFixed(numDec).toString() + "%";
                }
            } else {
                return;
            };
        })
        .attr("font-size", labelFontSize);

    // add the start and ending volume numbers. label centered based on height.
    svg.append("g").selectAll("text")
        .data(dataset)
        .enter()
        .append("text")
        .attr("x", (d,i) => i * (width / dataset.length) + volumeLabelOffset)
        .attr("y", height / 2)
        .text(function(d){
            if (d.Category == 'Last Year' || d.Category == 'Current Year'){
                let volume = d.end;
                return volume.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            };
        })
        .attr("fill", "#231F20")
        .attr("font-size", volumeFontSize)
        .attr("text-anchor", "middle");

    // create connector lines
    svg.append('g').selectAll('line')
        .data(dataset.filter(d => d.Category != 'Current Year'))
        .enter()
        .append('line')
        .attr("class", "connector")
        .attr("x1", (d,i) => i * (width/dataset.length) + ((width / dataset.length)-barWidthPadding))
        .attr("y1", d => yScale(d.end))
        .attr("x2", (d,i) => (i+1) * (width/dataset.length))
        .attr("y2", d => yScale(d.end));

    // creating the year-over-year change vertical lines
    svg.append("g").selectAll('line')
        .data(dataset)
        .enter()
        .append('line')
        .attr("class", function(d){
            if (d.Category == 'Last Year' || d.Category == 'Current Year') {
                return "YoY";
            } else{
                return "none";
            };
        })
        .attr("y1", d => yScale(d.end))
        .attr("y2", -(margin.top/2))
        .attr("x1", (d,i) => (i * width / dataset.length) + yoyVertPad)
        .attr("x2", (d,i) => (i * width / dataset.length) + yoyVertPad);

    // add arrowhead to current year
    svg.append("g")
        .attr("class", "arrowhead")
        .selectAll('.points')
        .data(dataset)
        .enter()
        .append('path')
        .attr("d", symbol.size(arrowHeadSize).type(d3.symbolTriangle))
        .attr("fill", function(d){
            if(d.Category == 'Current Year') {
                return "#231F20";
            } else{
                return "none";
            }
        })
        .attr("transform",function(d,i){
            return "translate(" + ((i * width / dataset.length) + arrowHeadXpad) + ", "
                + (yScale(d.end) - arrowHeadYpad) + ") rotate(180)"
        });

    // creating the year-over-year change horizontal line
    svg.append("g").selectAll('line')
        .data(dataset)
        .enter()
        .append('line')
        .attr("class", function(d){
            if (d.Category == 'Last Year' || d.Category == 'Current Year') {
                return "YoY";
            } else{
                return "none";
            };
        })
        .attr("y1", -(margin.top/2))
        .attr("y2", -(margin.top/2))
        .attr("x1", margin.left / 2 - horizonLineX1Pad)
        .attr("x2", width - horizonLineX2Pad);


    // add the year-over-year circle
    svg.append("g")
        .append("ellipse")
        .attr("cx", width / 2)
        .attr("cy", 0 - (margin.top / 2))
        .attr("rx", ellipseRadius)
        .attr("ry", ellipseRadius/2)
        .attr("fill", "white")
        .attr("stroke", "black");

    svg.append("g")
        .append("text")
        .attr("x", (width / 2))
        .attr("y", 0 - (margin.top / 2) + ellipseTextPad)
        .attr("text-anchor", "middle")
        .text("-3.5%");

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