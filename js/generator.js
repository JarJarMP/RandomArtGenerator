var RAG = (function ($) {
    var context = null;
    var config = {
        selector: '', // selector of the canvas element

        width: 1000, // the canvas element width in pixel
        height: 600, // the canvas element height in pixel

        sideRatio: 10, // divide on side of the triangle in the ratioof 1:(sideRatio - 1)
        fillDensity: 90, // one triangle will be filled with this amount of lines
        fillSpeed: 20, // how fast the art piece will be drawn (all triangles will be started at the same time)
        cornerIntval: 0, // interval for triangle corner point location
        cornerIntvalWeight: 0.6, // constant for calculating cornerIntval from the stepDistance

        useColor: false, // whether colorize the art piece by triangles or not

        divPointWeight: 100, // init
        divPointCountX: 0, // how many divider points will be on the x axis
        divPointCountY: 0, // how many divider points will be on the y axis
        stepDistX: 0, // distance between two divider point on the x axis
        stepDistY: 0 // distance between two divider point on the y axis
    };

    function initCanvas (options) {
        // merge incoming parameters into default config
        $.extend(config, options);

        // grab the canvas DOM element
        var canvasElement = $(config.selector)[0] || null;

        if (canvasElement === null) {
            // if element not exists, log a message and do not do any further actions
            console.log('Missing canvas element: ' + config.selector);
        } else {
            // init the canvas context from the element, set sizes
            initContext(canvasElement);

            // calculate values related to the triangle sizes
            // based on the canvas sizes
            initRatios();

            // calculate the coordinates where will be triangle corner
            var points = generateTrianglesCorners();

            // from the possible corner coordinates
            // calculate triangles' corners' coordinates
            // and draw all triangles one-by-one
            calculateTriangleCoordinates(points).forEach(drawTriangle);
        }
    }

    function initContext (canvasElement) {
        context = canvasElement.getContext('2d');
        context.canvas.height = config.height;
        context.canvas.width = config.width;
    }

    function initRatios () {
        config.divPointCountX = Math.floor(Math.floor(config.width / config.divPointWeight) / 2);
        config.divPointCountY = Math.floor(Math.floor(config.height / config.divPointWeight) / 2);

        config.stepDistX = Math.floor(config.width / config.divPointCountX);
        config.stepDistY = Math.floor(config.height / config.divPointCountY);

        if (config.cornerIntval === 0) {
            config.cornerIntval =
                (config.stepDistX > config.stepDistY)
                ? Math.floor(config.stepDistY * config.cornerIntvalWeight)
                : Math.floor(config.stepDistX * config.cornerIntvalWeight)
        }
    }

    function generateTrianglesCorners () {
        var points = [];
        var limitX = {
            max: config.width,
            min: 0
        };
        var limitY = {
            max: config.height,
            min: 0
        };

        for (var i = 0; i <= config.divPointCountX; i++) {
            points[i] = (typeof points[i] === 'undefined') ? [] : points[i];

            for (var j = 0; j <= config.divPointCountY; j++) {
                points[j] = (typeof points[j] === 'undefined') ? [] : points[j];

                points[i][j] = {
                    x: calculateCoordinate(i * config.stepDistX, limitX),
                    y: calculateCoordinate(j * config.stepDistY, limitY)
                };

                // overwrite canvas' frame line points with exact values
                if (i === 0) {
                    points[i][j]['x'] = limitX.min;
                }
                if (j === 0) {
                    points[i][j]['y'] = limitY.min;
                }
                if (i === config.divPointCountX) {
                    points[i][j]['x'] = limitX.max;
                }
                if (j === config.divPointCountY) {
                    points[i][j]['y'] = limitY.max;
                }
            }
        }

        return points;
    }

    function calculateCoordinate(value, limits) {
        var max = value + (config.cornerIntval / 2);
        var min = value - (config.cornerIntval / 2);

        max = (max > limits.max) ? limits.max : max;
        min = (min < limits.min) ? limits.min : min;

        return getRandom(min, max);
    }

    function calculateTriangleCoordinates (points) {
        var coordinates = [];
        var stepX = points.length;
        var stepY = points[0].length;

        // grab a 'rectangle'
        // generate two triangles inside of it
        // by saving the three pair of coordinates
        for (var i = 0; i < stepX - 1; i++) {
            for (var j = 0; j < stepY - 1; j++) {
                coordinates.push([
                    {x:points[i][j]['x'], y:points[i][j]['y']},
                    {x:points[i + 1][j]['x'], y:points[i + 1][j]['y']},
                    {x:points[i + 1][j + 1]['x'], y:points[i + 1][j + 1]['y']}
                ]);
                coordinates.push([
                    {x:points[i][j]['x'], y:points[i][j]['y']},
                    {x:points[i + 1][j + 1]['x'], y:points[i + 1][j + 1]['y']},
                    {x:points[i][j + 1]['x'], y:points[i][j + 1]['y']}
                ]);
            }
        }

        return coordinates;
    }

    function drawTriangle (oneTriangle) {
        // the three corners are given by there coordinates
        // calculate all the points inside the triangle
        // where lines should be drawn
        for (var i = 3; i <= config.fillDensity; i++) {
            oneTriangle[i] = calculateNextPoint(
                oneTriangle[i - 3],
                oneTriangle[i - 2]
            );
        };

        // draw the triangle and fill up with the inner lines too
        fillOneTriangle(oneTriangle);
    }

    function calculateNextPoint (A, B) {
        // ratio for divider point
        // http://cms.sulinet.hu/get/d/d16e4558-1ad2-4f7f-8a8f-c9f32fdfc60e/1/7/b/Normal/b17ca002.jpg
        var m = 1;
        var n = config.sideRatio - m;

        return {
            x: (n * A.x + m * B.x) / (m + n),
            y: (n * A.y + m * B.y) / (m + n)
        };
    }

    function fillOneTriangle (points) {
        var pointPairs = [];

        // the triangle's sides
        pointPairs.push([points[0], points[1]]);
        pointPairs.push([points[1], points[2]]);
        pointPairs.push([points[2], points[0]]);

        // create the remaining point pairs for tha actual drawing
        for (var j = 2; j < config.fillDensity; j++) {
            pointPairs.push([points[j], points[j + 1]]);
        };

        // random color for one triangle
        var color = getRandomRGBColor();

        // delayed linedrawing almost an animation
        var intervalId = setInterval(function (){
            if (pointPairs.length) {
                var pointPair = pointPairs.shift();
                drawLine(pointPair.shift(), pointPair.shift(), color);
            } else {
                clearInterval(intervalId);
            }
        }, config.fillSpeed);
    }

    function drawLine (from, to, color) {
        context.beginPath();
        context.moveTo(from.x, from.y);
        context.lineTo(to.x, to.y);

        if (config.useColor && typeof color !== 'undefined') {
            context.strokeStyle = color;
        }

        context.stroke();
    }

    function getRandomRGBColor() {
        var values = [
            getRandom(0, 255),
            getRandom(0, 255),
            getRandom(0, 255)
        ];
        return 'rgb(' + values.join(', ') + ')';
    }

    function getRandom (min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    return {
        initCanvas: initCanvas
    }

})(jQuery);
