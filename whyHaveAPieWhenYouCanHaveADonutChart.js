/*

    I.      Name: whyHaveAPieWhenYouCanHaveADonutChart

    II.     Description: This directive takes a series of options, and displays a donut chart reflecting the passed in values.

    III.    Params:
                options {Object} Required, contains all of the donut specific data/labels
                options.value {Number} Optional, This is the value to be displayed by default in the middle (usually the total)
                options.data {Array} Required, This is the data to be displayed in the donuts
                options.data[index].value {Number} Required, number that populates the size of the associated arc
                options.data[index].color {String} Required, color to display for the associated arc
                options.data[index].label {String} Optional, this is displayed when you hover over the arc associated with the label
                options.containerWidth {Number} Optional, width of box that holds donut, defaults to 246
                options.containerHeight {Number} Optional, height of box that holds donut, defaults to 246
                options.outerRadius {Number} Optional, radius of the donut, defaults to half of the container width minus the 20px expand space for hovering on arc
                options.innerRadius {Number} Optional, radius of the inner donut hole, defaults to 60
                options.tween {Number} Optional, time that animations take place once animations are working
                options.preLabelUnit {String} Optional, the label, such as '$', that prefixes the center donut value
                options.postLabelUnit {String} Optional, the label, such as 'lbs', that follows the center donut value
                chartLabel {String} Optional, the label of the chart, displays at the bottom

    IV.     HTML Example Usage:
                <span data-donut-chart="options" data-chart-label="'Example Chart Name'"></span>

    V.      Javascript Example Usage:
                $scope.options = {};
                $scope.options.containerWidth = 200;
                $scope.options.containerHeight = 200;
                $scope.options.innerRadius = 50;
                $scope.options.data = [{
                    value: 132,
                    color: '#0071a9',
                    label: 'Low'
                }, {
                    value: 145,
                    color: '#83CD41',
                    label: 'Normal'
                }, {
                    value: 50,
                    color: '#E55349',
                    label: 'Critical'
                }];

    VI.     LESS Example Usage:
		.donut-chart {
			font-family: Calibri, sans-serif;
			.chart-label {
				fill: grey;
			 }
			 .label-group {
				 fill: darkgray;
				 .label {
					 font-weight: bold;
					 fill: grey;
				 }
			 }
		}

    VII.    Improvements
                1. flag to change location of the chartLabel between top or bottom
                2. flag to animate drawing of arcs or not (ability to animate)
                3. flag to display different arcs with different widths, depending on their number
                    (ex. higher number, thicker width)
                4. display an icon in the center of the graph instead of a number - maybe pass through the html?
                5. click listeners on the individual arcs - pass in a callback
                6. passing through a LESS variable
                7. add checks for Modernizr.svg for < IE9
                8. optional drop shadow

    VIII.   Resources:
                1. http://bl.ocks.org/mbostock/4c5fad723c87d2fd8273
                2. https://bl.ocks.org/mbostock/5100636
                3. https://bost.ocks.org/mike/transition/
                4. https://github.com/d3/d3-transition
                5. https://github.com/d3/d3/blob/master/API.md
		
    IX.	    Attributions
    		1. PHT Corp - at the very first company I worked at out of college, we had these awesome donut charts
		   that I spent a lot of time looking at. It helped me learn SVG, and that was a lot of the motivation for the
		   design of these. Although PHT is no longer a company, thanks for teaching me the basics of Angular and
		   Javascript.

    X.     Other Developer Suggestions
                1.
                2.
                3.

*/

var app = angular.module('app', []);

app.controller('ChartCtrl', ['$scope', function ($scope) {
  
  $scope.label = 'Ticket Priority';
  
  $scope.options = {};
  
  $scope.options.containerWidth = 200;
  $scope.options.containerHeight = 200;
  $scope.options.innerRadius = 50;
  $scope.options.value = 327;
  
  $scope.options.data = [{
    value: 132,
    color: '#0071a9',
    label: 'Low'
  }, {
    value: 145,
    color: '#83CD41',
    label: 'Normal'
  }, {
    value: 50,
    color: '#E55349',
    label: 'Critical'
  }];
  
}]);

app.directive('donutChart', function () {

  return {
    restrict: 'A',
    scope: {
      options: '=donutChart',
      chartLabel: '=?',
      clickArc: '=?'
    },
    link: function (scope, ele) {

      var ease, title,containerWidth, containerHeight, innerRadius,outerRadius, view, tween,
          arc, arcs, arcHover,bgGroup, outerBackground, innerBackground, pie,path;

      scope.options = scope.options|| {};

      //Defines options
      containerWidth = scope.options.containerWidth || 246;
      containerHeight = scope.options.containerHeight || 246;
      innerRadius = scope.options.innerRadius || 60;
      outerRadius = scope.options.outerRadius || scope.options.containerWidth / 2 - 20;
      tween = scope.options.tween || 450;

      //find the view, append the child elements that we need
      view = d3.select(ele[0])
        .attr('class', 'donut-chart')
        .append('svg') //add svg container
        .attr('width',containerWidth)
        .attr('height',scope.chartLabel ? containerHeight + 30 :containerHeight) //only make it 30px taller if we need space for a label
        .append('g')
        .attr('transform','translate(' + containerWidth / 2 + ',' + containerHeight / 2 + ')');

      //"title" is the overall chart label
      title = view.append('svg:g')
        .attr('transform','translate(0' + ',' + containerHeight / 2 +')');

      title.append('svg:text')
        .attr('class', 'chart-label')
        .attr('dy', 5)
        .text(scope.chartLabel || '')
        .attr('text-anchor','middle');

      //make the paths!
      arc = d3.arc()
        .outerRadius(outerRadius)
        .innerRadius(innerRadius);

      bgGroup = view.append('svg:g')
        .attr('class', 'center-group')
        .attr('transform','translate(' + 0 + ',' + 0 + ')');

      outerBackground = bgGroup.append('svg:circle')
        .attr('fill','rgba(0,0,0,.1)')
        .attr('r', outerRadius);

      innerBackground = bgGroup.append('svg:circle')
        .attr('fill', '#fff')
        .attr('r', innerRadius);

      //when hovering on arc
      arcHover = d3.arc()
        .outerRadius(outerRadius + 5)
        .innerRadius(innerRadius + 5);

      pie = d3.pie()
        .value(function (d) {return d.value || 0; })
        .sort(null);

      //Builds the donut and displays it on the page
      scope.render = function () {

        //select all g elements that have slice class
        arcs = view.datum(scope.options.data).selectAll('g.slice')

        //associate pie data
          .data(pie)

        //create g elements for each piece of data
          .enter()

        //create a group to associate slice so we can add labels to each slice
          .append('svg:g')

        //slice stylin'
          .attr('class','slice');

        //draws the paths for slices
        path = arcs.append('path')

          .attr('fill', function(d, idx) {
          return scope.options.data[idx].color;
        })

          .attr('d', arc)

          .each(function (d) {this._current = d; });

        scope.drawLabels({ value:scope.options.value || '', label: 'Total' });

        scope.addListeners();

        scope.rendered = true;

      };

      scope.drawLabels = function(dataOptions) {

        var labelGroup;

        //remove label and redraw so labels don't stack on top of each other
        view.select('.label-group')
          .remove();

        labelGroup = view.append('svg:g')
          .attr('class', 'label-group')
          .attr('transform','translate(' + 0 + ',' + 0 + ')');

        //Render label
        labelGroup.append('svg:text')
          .attr('class', 'label')
          .attr('dy', -2)
          .attr('text-anchor','middle')
          .text(dataOptions.label|| '');

        //Render Label Value
        labelGroup.append('svg:text')
          .attr('class', 'label-value')
          .attr('dy', 15)
          .attr('text-anchor','middle')
          .text((scope.options.preUnitLabel || '') + (dataOptions.value || 0) + (scope.options.postUnitLabel || ''));

      };

      //adds hover/click events
      scope.addListeners = function() {

        //when you hover on a slice, make it look like it zooms
        arcs.on('mouseover',function (d, idx) {

          var target = d3.select(this);

          arcHover = d3.arc().outerRadius(outerRadius + 5).innerRadius(innerRadius + 5);

          scope.drawLabels(scope.options.data[idx]);

          target.select('path').transition()
          //.ease('elastic')
          //.duration(tween)
            .attr('d',arcHover)
            .attr('fill',function (d) {
            returnd3.rgb(scope.options.data[idx].color).brighter();
          });

        });

        //return to normal
        arcs.on('mouseout',function (d, idx) {

          var target = d3.select(this);

          scope.drawLabels({ value: scope.options.value || '', label:'Total' });

          target.select('path').transition()
          //.ease('back')
          //.duration(tween)
            .attr('d', arc)
            .attr('fill',function (d) { returnd3.rgb(scope.options.data[idx].color); });

        });

      };

      scope.$watch('options.data',function (curr, prev) {
        if (curr && !scope.rendered&& !angular.equals(curr !== prev)) {
          scope.render();
        }
      });

    }
  };

});
