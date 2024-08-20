$(document).ready(function () {
    const floor_height = 60;
    let callInQueue = [];

    // Calling an elevator
    $('.floor-call-btn').click(function () {
        const floor = $(this).closest('.floor').attr('data-floor');

        $(this).text('Waiting').addClass('waiting').prop('disabled', true);

        const nearestElevator = findNearestElevator(floor);

        if (nearestElevator.hasOwnProperty('elevator')) {
            moveElevator(nearestElevator.elevator, floor);
        } else {
            callInQueue.push(floor);
        }
    });

    // Identify the closest elevator to the floor
    const findNearestElevator = (floor) => {
        const elevatorElement = $('#elevators .elevator');
        const distanceArray = [];

        $(elevatorElement).each(function () {
            const position = $(this).attr('data-position');
            const elevator = $(this).attr('data-elevator');

            if ($(this).hasClass("free")) {
                const distance = Math.abs(+position - +floor);

                distanceArray.push({ distance, elevator });
            }
        });

        const distanceArraySort = distanceArray.sort((a, b) => a.distance - b.distance);

        return distanceArraySort.length > 0 ? distanceArraySort[0] : {};
    }

    // Send the elevator to that floor
    const moveElevator = (elevator, floor) => {
        const currentElevatorElement = $("[data-elevator=" + elevator + "]");
        const floorElement = $("[data-floor=" + floor + "]");

        currentElevatorElement.removeClass('free');
        currentElevatorElement.addClass('engage');

        const position = currentElevatorElement.attr('data-position');

        const timeArrive = Math.abs(+position - +floor) * 1000; // will take 1 sec to arrive an floor

        currentElevatorElement.attr('data-position', floor);

        // get position from bottom
        let bottom = parseInt(currentElevatorElement.css('bottom'));
        // bottom = bottom.replace(/[^0-9]/g, '')
        

        const floorToCover = +position - +floor;

        let i = 60;
        let timer = 1000;

        if (timeArrive > 0) {
            const timeInterval = setInterval(() => {
                const newPosition = +bottom - (floorToCover > 0 ? i : (-i));
                currentElevatorElement.css('bottom', `${newPosition}px`);
                i += 60;

                if (timer >= timeArrive) {
                    clearInterval(timeInterval);
                }
                timer += 1000;
            }, 1000)
        }

        setTimeout(() => {
            // clearInterval(timeInterval);

            currentElevatorElement.removeClass('engage');
            currentElevatorElement.addClass('moving');
            
            floorElement.find('.floor-call-btn').text('Arrived').addClass('arrived');
            
            play();

            setTimeout(() => {
                // Revert the elevator color to default
                currentElevatorElement.removeClass('moving');
                currentElevatorElement.addClass('free');

                floorElement.find('.floor-call-btn').text('Call').removeClass('arrived waiting').prop('disabled', false);

                checkFloorCallQueue();
            }, 2000); // Wait 2 seconds before moving to the next call
        }, timeArrive)
    }

    // Check queue
    const checkFloorCallQueue = () => {
        if (callInQueue.length > 0) {
            const initiatingFloor = callInQueue.shift();
            const nearestElevator = findNearestElevator(initiatingFloor);

            if (nearestElevator.hasOwnProperty('elevator')) {
                moveElevator(nearestElevator.elevator, initiatingFloor);
            } else {
                callInQueue.unshift(initiatingFloor);
            }
        }
    }    

    // Make a sound when the elevator reaches the floor
    const play = () => {
        var elevatorSound = new Audio('./assets/elevator-ding.mp3');
        elevatorSound.play();
    }
});