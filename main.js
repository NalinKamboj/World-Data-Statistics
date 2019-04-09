var mortalityData = null;
var currentYear = 1960;
var mapData = [];
var lineData = [];
var mapChart;
var mapPolygonSeries;
var polygonTemplate;
var heatLegend;
var lineChart;
var yearAxis; //X AXIS
var lifeAxis; //Y AXIS
var currentLines = [];
var materialColors = [
  "#f44336",
  "#9c27b0",
  "#2196f3",
  "#8bc34a",
  "#ffc107",
  "#26a69a",
  "#f06292",
  "#ffb74d"
];
var selectedPoly;
var counter = 0;
// initData();
loadJSON("GET", "data/mortalityData2.json")
  .then(function(response) {
    console.log("REQUEST COMPLETE!");
    window[mortalityData] = JSON.parse(response);
    // console.log(window[mortalityData]);
    drawMap();
    createLineChart();
  })
  .catch(function(err) {
    console.error("Some error occurred.", err.statusText);
  });

//All utility functions...
//Function for visualizing stuff on map
function drawMap() {
  am4core.useTheme(am4themes_animated);
  //Making properties amCharts readable...
  mapData = [];
  for (var i = 0; i < window[mortalityData].length; i++) {
    mapData.push({
      name: window[mortalityData][i]["Country Name"],
      id: window[mortalityData][i].id,
      value: window[mortalityData][i][currentYear]
    });
  }
  // console.log(mapData);
  //Start map creation
  mapChart = am4core.create("mapdiv", am4maps.MapChart);
  mapChart.geodata = am4geodata_worldLow;
  mapChart.projection = new am4maps.projections.Miller();

  //Configure map's data...
  mapPolygonSeries = mapChart.series.push(new am4maps.MapPolygonSeries());
  mapPolygonSeries.useGeodata = true;
  mapPolygonSeries.data = mapData;
  mapPolygonSeries.exclude = ["AQ"];

  polygonTemplate = mapPolygonSeries.mapPolygons.template;
  polygonTemplate.applyOnClones = true;
  polygonTemplate.togglable = true;
  polygonTemplate.tooltipText = "[bold]{name} ({id})[/]";
  polygonTemplate.nonScalingStroke = true;
  polygonTemplate.strokeOpacity = 0.6;
  // polygonTemplate.fill = mapChart.colors.getIndex(0);

  //Create heat rules for country colors
  mapPolygonSeries.heatRules.push({
    property: "fill",
    target: polygonTemplate,
    min: am4core.color("#ff4e50"),
    max: am4core.color("#f9d423")
  });

  var heatLegend = mapChart.createChild(am4maps.HeatLegend);
  heatLegend.series = mapPolygonSeries;
  heatLegend.width = am4core.percent(100);
  heatLegend.valueAxis.renderer.labels.template.fontSize = 20;
  // heatLegend.valueAxis.renderer.minGridDistance = 3000;
  // heatLegend.orientation = "vertical";
  heatLegend.markerCount = 10;
  heatLegend.valueAxis.stroke = "#000000";

  var selectState = polygonTemplate.states.create("active");
  selectState.properties.fill = mapChart.colors.getIndex(2);
  var hoverState = polygonTemplate.states.create("hover");
  hoverState.properties.fill = mapChart.colors.getIndex(4);

  polygonTemplate.events.on("hit", function(event) {
    target = event.target;
    target.isActive = target.isActive;
    var id = target.dataItem.dataContext.id;
    toggleLineSeries(id);
  });

  //Configure legend tooltip
  var legendTooltip = heatLegend.valueAxis.tooltip;
  legendTooltip.background.stroke = am4core.color("#ffffff");
  legendTooltip.text = "[bold]{value}[/]";
  legendTooltip.fontSize = 20;

  //Add tooltip animation for value axis
  polygonTemplate.events.on("over", function(ev) {
    if (!isNaN(ev.target.dataItem.value)) {
      heatLegend.valueAxis.showTooltipAt(ev.target.dataItem.value);
    } else {
      heatLegend.valueAxis.hideTooltip();
    }
  });

  polygonTemplate.events.on("out", function(ev) {
    heatLegend.valueAxis.hideTooltip();
  });

  // mapChart.smallMap = new am4maps.SmallMap();
  // mapChart.smallMap.align = "right";
  // mapChart.smallMap.valign = "top";
  // mapChart.smallMap.series.push(mapPolygonSeries);
  // mapChart.smallMap.background = am4core.color("#000000");

  //Zoom controls
  mapChart.zoomControl = new am4maps.ZoomControl();

  //Add Home Button for Map
  var homeButton = new am4core.Button();
  homeButton.events.on("hit", function() {
    mapChart.goHome();
  });
  homeButton.icon = new am4core.Sprite();
  homeButton.padding(7, 5, 7, 5);
  homeButton.width = 30;
  homeButton.icon.path =
    "M16,8 L14,8 L14,16 L10,16 L10,10 L6,10 L6,16 L2,16 L2,8 L0,8 L8,0 L16,8 Z M16,8";
  homeButton.marginBottom = 5;
  homeButton.parent = mapChart.zoomControl;
  homeButton.insertBefore(mapChart.zoomControl.plusButton);

  //Add timeline slider to the chart
  //Create slider in new DIV
  var slider = am4core.create("map_slider", am4core.Slider);
  slider.valign = "bottom";
  slider.paddingLeft = 15;
  slider.paddingRight = 15;
  slider.startGrip.background.fill = mapChart.colors.getIndex(2);
  slider.startGrip.background.states.getKey(
    "hover"
  ).properties.fill = mapChart.colors.getIndex(4);
  var yearText = document.getElementById("year_text");
  slider.events.on("up", function() {
    updateChart();
  });
  slider.events.on("rangechanged", function() {
    currentYear = getYearFromSlider(slider.start);
    yearText.innerHTML = currentYear;
  });
}

function updateChart() {
  mapData = [];
  for (var i = 0; i < window[mortalityData].length; i++) {
    mapData.push({
      name: window[mortalityData][i]["Country Name"],
      id: window[mortalityData][i].id,
      value: window[mortalityData][i][currentYear]
    });
  }
  mapPolygonSeries.data = mapData;
  console.log(lineChart.series.length);
  while (lineChart.series.length > 0) {
    lineChart.series.removeIndex(0).dispose();
  }
  currentLines = [];
}

function getYearFromSlider(value) {
  return Math.floor(1960 + value * 56);
}

function createLineChart() {
  lineChart = am4core.create("line_chart", am4charts.XYChart);
  yearAxis = lineChart.xAxes.push(new am4charts.ValueAxis());
  yearAxis.title.text = "[bold]Year[/]";
  yearAxis.min = 1960;
  yearAxis.max = 2016;
  yearAxis.renderer.minGridDistance = 40;
  yearAxis.strictMinMax = true;
  yearAxis.numberFormatter.numberFormat = "####";

  lifeAxis = lineChart.yAxes.push(new am4charts.ValueAxis());
  lifeAxis.title.text = "[bold]Life Expectancy at Birth[/]";
  lifeAxis.min = 25;
  lifeAxis.max = 90;
  lifeAxis.renderer.minGridDistance = 20;
  lifeAxis.strictMinMax = true;

  lineChart.cursor = new am4charts.XYCursor();
  lineChart.legend = new am4charts.Legend();
}

function getCountryData(code) {
  var outer = {};
  outer.id = code;
  for (var i = 0; i < window[mortalityData].length; i++) {
    var data = [];
    if (window[mortalityData][i].id === code) {
      for (var j = 1960; j < 2017; j++) {
        var temp = {};
        temp.year = j;
        temp.value = window[mortalityData][i][j];
        data.push(temp);
      }
      outer.properties = data;
      // console.log(outer);
      return outer;
    }
  }
  return null;
}

function toggleLineSeries(code) {
  //First check if line series already exists. If it does, remove it
  for (var i = 0; i < currentLines.length; i++) {
    console.log(currentLines[i].series.name);
    if (currentLines[i].series.name === code) {
      if (currentLines[i].series.visible) {
        // console.log("SET FALSE");
        currentLines[i].series.visible = false;
        currentLines[i].bullets.visible = false;
      } else {
        // console.log("SET TRUE");
        currentLines[i].series.visible = true;
        currentLines[i].bullets.visible = true;
      }
      return;
    }
  }
  var data = getCountryData(code);

  var newSeries = lineChart.series.push(new am4charts.LineSeries());
  newSeries.data = data.properties;
  newSeries.name = code;
  newSeries.strokeWidth = 3;
  newSeries.dataFields.valueX = "year";
  newSeries.dataFields.valueY = "value";
  var seriesBullets = newSeries.bullets.push(new am4charts.CircleBullet());
  var seriesBulletHover = seriesBullets.states.create("hover");
  seriesBulletHover.properties.scale = 1.7;
  seriesBullets.tooltipText = "{name}: [bold]{valueY}[/]";
  seriesBullets.properties.scale = 1.1;
  seriesBullets.stroke = am4core.color("#333333");

  //Set random color to lineseries
  // var color = materialColors[Math.floor(Math.random() * materialColors.length)];
  var color = materialColors[counter];
  counter = (counter + 1) % materialColors.length;
  newSeries.stroke = am4core.color(color);
  seriesBullets.fill = am4core.color(color);
  // newSeries.tooltipText = "{year}: {value}";
  var lineState = {};
  lineState.series = newSeries;
  lineState.bullets = seriesBullets;
  currentLines.push(lineState);
  // console.log(newSeries.name);
}

function loadJSON(method, url) {
  return new Promise(function(resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.open(method, url);
    xhr.onload = function() {
      if (this.status >= 200 && this.status < 300) {
        resolve(xhr.response);
      } else {
        reject({
          status: this.status,
          statusText: this.statusText
        });
      }
    };
    xhr.onerror = function() {
      reject({
        status: this.status,
        statusText: this.statusText
      });
    };
    xhr.send();
  });
}
