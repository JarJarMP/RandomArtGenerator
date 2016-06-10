var RAG = (function ($) {
    var context = null;
    var config = {
        selector: '', // the canvas element selector

        width: 1000, // the canvas element width
        height: 600, // the canvas element height

        sideRatio: 10, // divide on side of the triangle into 1:(10 - 1) sections
        fillDensity: 90, // one triangle will be filled with this amount of lines
        cornerRange: 0, // range for triangle corner point location

        useColor: false, // whether colorize the piece by triangles or not

        dividerPointWeight: 100, // init
        dividerPointCountX: 0, // how many divider points will be on the x axis
        dividerPointCountY: 0, // how many divider points will be on the y axis
        stepDistanceAxisX: 0, // distance between two divider point
        stepDistanceAxisY: 0 // distance between two divider point
    };

    function initCanvas (options) {
        $.extend(config, options);

        var canvasElement = $(config.selector)[0] || null;

        if (canvasElement === null) {
            var msg = 'Missing canvas element or wrong selector ('
                + config.selector
                + ')';
            throw(new Error(msg));

        } else {
            initContext(canvasElement);
            initRatios();

            var points = calculateTrianglesCorners();
            generateCoordinates(points).forEach(drawTriangle);
        }
    }

    function initContext (canvasElement) {
        context = canvasElement.getContext('2d');
        context.canvas.height = config.height;
        context.canvas.width = config.width;
    }

    function initRatios () {
        config.dividerPointCountX = Math.floor(Math.floor(config.width / config.dividerPointWeight) / 2);
        config.dividerPointCountY = Math.floor(Math.floor(config.height / config.dividerPointWeight) / 2);

        config.stepDistanceAxisX = Math.floor(config.width / config.dividerPointCountX);
        config.stepDistanceAxisY = Math.floor(config.height / config.dividerPointCountY);

        if (config.cornerRange === 0) {
            config.cornerRange =
                (config.stepDistanceAxisX > config.stepDistanceAxisY)
                ? Math.floor(config.stepDistanceAxisY * 0.6)
                : Math.floor(config.stepDistanceAxisX * 0.6)
        }
    }

    function calculateTrianglesCorners () {
        var points = [];
        var limitX = {
            max: config.width,
            min: 0
        };
        var limitY = {
            max: config.height,
            min: 0
        };

        for (var i = 0; i <= config.dividerPointCountX; i++) {
            points[i] = (typeof points[i] === 'undefined') ? [] : points[i];

            for (var j = 0; j <= config.dividerPointCountY; j++) {
                points[j] = (typeof points[j] === 'undefined') ? [] : points[j];

                points[i][j] = {
                    x: calculateCoordinate(i * config.stepDistanceAxisX, limitX),
                    y: calculateCoordinate(j * config.stepDistanceAxisY, limitY)
                };

                // overwrite canvas border line points with exact min, max values
                if (i == 0) {
                    points[i][j]['x'] = limitX.min;
                }
                if (j == 0) {
                    points[i][j]['y'] = limitY.min;
                }
                if (i == config.dividerPointCountX) {
                    points[i][j]['x'] = limitX.max;
                }
                if (j == config.dividerPointCountY) {
                    points[i][j]['y'] = limitY.max;
                }
            }
        }

        return points;
    }

    function calculateCoordinate(value, limits) {
        var max = value + (config.cornerRange / 2);
        var min = value - (config.cornerRange / 2);

        max = max > limits.max ? limits.max : max;
        min = min < limits.min ? limits.min : min;

        return getRandom(min, max);
    }

    function generateCoordinates (points) {
        var coordinates = [];
        var setpAmountX = points.length;
        var stepAmountY = points[0].length;

        for (var i = 0; i < setpAmountX - 1; i++) {
            for (var j = 0; j < stepAmountY - 1; j++) {
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

        return coordinates.map(shuffleArray);
    }

    function drawTriangle (oneTriangle) {
        for (var i = 3; i <= config.fillDensity; i++) {
            oneTriangle[i] = calculateNextPoint(
                oneTriangle[i - 3],
                oneTriangle[i - 2]
            );
        };

        fillOneTriangle(oneTriangle);
    }

    function calculateNextPoint (A, B) {
        // ratio for divider point
        // http://cms.sulinet.hu/get/d/d16e4558-1ad2-4f7f-8a8f-c9f32fdfc60e/1/7/b/Normal/b17ca002.jpg
        var n = config.sideRatio - 1;
        var m = 1;

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

        // fill up the triangle with lines
        for (var j = 2; j < config.fillDensity; j++) {
            pointPairs.push([points[j], points[j + 1]]);
        };

        // random color for one triangle
        var color = getRandomRGBColor();

        // delayed linedrawing almost an animation
        var nIntervId = setInterval(function (){
            if (pointPairs.length) {
                var pointPair = pointPairs.shift();
                drawLine(pointPair.shift(), pointPair.shift(), color);
            } else {
                clearInterval(nIntervId);
            }
        }, 20);
    }

    function drawLine (from, to, color) {
        context.beginPath();
        context.moveTo(from.x, from.y);
        context.lineTo(to.x, to.y);

        if (config.useColor) {
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

    function shuffleArray (a) {
        var i, j, x;

        for (i = a.length; i; i -= 1) {
            j = Math.floor(Math.random() * i);
            x = a[i - 1];
            a[i - 1] = a[j];
            a[j] = x;
        }

        return a;
    }

    return {
        initCanvas: initCanvas
    }

})(jQuery);
