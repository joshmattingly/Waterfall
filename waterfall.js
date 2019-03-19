
var margin = {top: 20, right: 10, bottom: 20, left: 10};

var width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


d3.csv("sample_data.csv").then(function(dataset){

    dataset.forEach(function(d){
        d.Volume = +d.Volume;
        d.PctChg = +d.PctChg;
    });

    let cumulative = 0;
    for (let i = 0; i < dataset.length; i++){
        dataset[i].start = cumulative;
        cumulative += dataset[i].Volume;
        dataset[i].end = cumulative;

        dataset[i].class = (dataset[i].value >= 0) ? 'positive' : 'negative';
    }
    dataset.push({
        name: 'Total',
        end: cumulative,
        start: 0,
        class: 'total'
    });

    console.log(dataset);

    let yScale = d3.scaleLinear()
        .domain([0, d3.max(dataset, function(d){ return d.end; })])
        .range([height, 0]);

    let xScale = d3.scaleBand()
        .range([0, width]);

    let xAxis = d3.axisBottom(xScale);

    svg.selectAll('rect')
        .data(dataset)
        .enter()
        .append('rect')
        .attr("x", function(d,i){ return i * (width / dataset.length); })
        .attr("y", function(d){return yScale(Math.max(d.start, d.end)); })
        .attr("height", function(d){ return Math.abs(yScale(d.end) - yScale(d.start)); })
        .attr("width", 50)
        .attr('fill', function(d){
            if(d.Category == 'Last Year' || d.Category == 'Current Year'){
                return 'grey';
            };
            if(d.PctChg >=0){
                return '#78BE20';
            } else {
                return '#FC952E';
            };
        });

    svg.append("g")
        .call(xAxis)
        .attr("transform", "translate(0, " + height + ")");

});