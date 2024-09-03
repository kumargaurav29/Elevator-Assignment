$(document).ready(function () {
    const floor_height = 60;
    let callInQueue = [];
    let intervals = {}; // Store intervals to cancel if needed
    let activeElevators = {}; // Track which elevator is handling which floor

    // Calling an elevator
    $('.floor-call-btn').click(function () {
        const floor = $(this).closest('.floor').attr('data-floor');


        const isWaiting = $(this).hasClass('waiting');

        if (isWaiting) {
            cancelElevatorCall(floor, $(this));
        } else {
            initiateElevatorCall(floor, $(this));
        }
    });

    const initiateElevatorCall = (floor, button) => {
        button.text('Waiting').addClass('waiting').prop('disabled', false);

        const nearestElevator = findNearestElevator(floor);

        if (nearestElevator.hasOwnProperty('elevator')) {
            moveElevator(nearestElevator.elevator, floor, button);
        } else {
            callInQueue.push(floor);
        }
    };

    const cancelElevatorCall = (floor, button) => {
        button.text('Call').removeClass('waiting').prop('disabled', false);

        // Remove from queue
        callInQueue = callInQueue.filter(queuedFloor => queuedFloor !== floor);


        // If the elevator is already moving towards this floor, stop it
        if (intervals[floor]) {
            clearInterval(intervals[floor]);
            delete intervals[floor];

            const floorElement = $("[data-floor=" + floor + "]");
            floorElement.find('.floor-call-btn').text('Arrived').addClass('arrived');
        }

        // If an elevator is actively moving to this floor, reset its state
        if (activeElevators[floor]) {
            const elevatorElement = $("[data-elevator=" + activeElevators[floor] + "]");
            elevatorElement.removeClass('engage moving').addClass('free');
            delete activeElevators[floor];
        }
    };

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
    const moveElevator = (elevator, floor, button) => {
        const currentElevatorElement = $("[data-elevator=" + elevator + "]");
        const floorElement = $("[data-floor=" + floor + "]");

        currentElevatorElement.removeClass('free');
        currentElevatorElement.addClass('engage');

        // Track the elevator actively moving to this floor
        activeElevators[floor] = elevator;

        const position = currentElevatorElement.attr('data-position');

        const timeArrive = Math.abs(+position - +floor) * 1000; // will take 1 sec to arrive an floor

        // currentElevatorElement.attr('data-position', floor);

        // get position from bottom
        let bottom = parseInt(currentElevatorElement.css('bottom'));
        // bottom = bottom.replace(/[^0-9]/g, '')


        const floorToCover = +position - +floor;

        let i = 60;
        let timer = 1000;
        let currentPosition = +position;

        if (timeArrive > 0) {
            intervals[floor] = setInterval(() => {
                const newPosition = +bottom - (floorToCover > 0 ? i : (-i));
                currentElevatorElement.css('bottom', `${newPosition}px`);
                i += 60;

                if (+position > +floor) {
                    currentPosition = currentPosition - 1;
                    currentElevatorElement.attr('data-position', Math.abs(currentPosition));
                } else {
                    currentPosition = currentPosition + 1;
                    console.log(currentPosition, 'currentPosition')
                    currentElevatorElement.attr('data-position', Math.abs(currentPosition));
                }

                if (timer >= timeArrive) {
                    // clearInterval(timeInterval);
                    clearInterval(intervals[floor]);
                    delete intervals[floor];
                }
                timer += 1000;

            }, 1000)
        }

        setTimeout(() => {
            if (!button.hasClass('waiting')) {
                // If the call was canceled before the elevator arrived
                currentElevatorElement.removeClass('engage moving').addClass('free');
                floorElement.find('.floor-call-btn').text('Call').removeClass('arrived waiting').prop('disabled', false);
                delete activeElevators[floor];
                return;
            }

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
                delete activeElevators[floor];
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