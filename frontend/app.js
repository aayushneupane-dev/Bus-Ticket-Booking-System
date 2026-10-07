
// ============================================================
// DJANGO API
// ============================================================

// The address of our Django backend
const API_BASE_URL = 'http://127.0.0.1:8000/api';


// ============================================================
// GET HTML ELEMENTS
// ============================================================

const routeSelect = document.getElementById('routeSelect');
const seatGrid = document.getElementById('seatGrid');
const summary = document.getElementById('summary');
const bookingForm = document.getElementById('bookingForm');
const submitBtn = document.getElementById('submitBtn');
const messageBox = document.getElementById('message');


// ============================================================
// VARIABLES
// ============================================================

let allRoutes = [];
let selectedRoute = null;
let selectedSeat = null;


// ============================================================
// 1. LOAD ROUTES FROM DJANGO
// ============================================================

async function loadRoutes() {

  try {

    console.log('Loading routes...');

    const response = await fetch(`${API_BASE_URL}/routes/`);

    if (!response.ok) {
      throw new Error(
        `Server returned status ${response.status}`
      );
    }

    allRoutes = await response.json();

    console.log('Routes loaded:', allRoutes);

    fillRouteDropdown();

  } catch (error) {

    console.error('Error loading routes:', error);

    routeSelect.innerHTML =
      '<option value="">Could not load routes</option>';

    showMessage(
      'Cannot connect to the server. Is Django running?',
      'error'
    );
  }
}


// ============================================================
// 2. FILL ROUTE DROPDOWN
// ============================================================

function fillRouteDropdown() {

  if (allRoutes.length === 0) {

    routeSelect.innerHTML =
      '<option value="">No routes available</option>';

    selectedRoute = null;
    selectedSeat = null;

    renderSeats();
    updateSummary();

    return;
  }


  // Remember the previously selected route
  const previouslySelectedId =
    selectedRoute
      ? String(selectedRoute.id)
      : '';


  // Clear dropdown
  routeSelect.innerHTML =
    '<option value="">-- Select a route --</option>';


  // Add every route
  allRoutes.forEach(function (route) {

    const option =
      document.createElement('option');

    option.value = route.id;


    // Format departure time
    let departure = 'Unknown time';

    if (route.departure_time) {

      const date =
        new Date(route.departure_time);

      if (!isNaN(date.getTime())) {

        departure =
          date.toLocaleString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
          });
      }
    }


    option.textContent =
      `${route.origin} → ${route.destination} | ` +
      `${departure} | NPR ${route.fare} | ` +
      `${route.bus_name}`;


    routeSelect.appendChild(option);

  });


  // Restore previous route
  routeSelect.value =
    previouslySelectedId;

  handleRouteChange();
}


// ============================================================
// 3. WHEN USER PICKS A ROUTE
// ============================================================

function handleRouteChange() {

  const chosenId =
    routeSelect.value;


  // Find selected route
  selectedRoute =
    allRoutes.find(function (route) {

      return String(route.id) ===
        String(chosenId);

    }) || null;


  console.log(
    'Selected route:',
    selectedRoute
  );


  // Clear selected seat
  selectedSeat = null;


  renderSeats();
  updateSummary();
}


// Listen for route changes
routeSelect.addEventListener(
  'change',
  function () {

    hideMessage();

    handleRouteChange();

  }
);


// ============================================================
// 4. DRAW THE SEAT GRID
// ============================================================

function renderSeats() {

  seatGrid.innerHTML = '';


  // No route selected
  if (!selectedRoute) {
    return;
  }


  // Make sure booked_seats exists
  const bookedSeats =
    Array.isArray(selectedRoute.booked_seats)
      ? selectedRoute.booked_seats
      : [];


  const totalSeats =
    Number(selectedRoute.total_seats);


  console.log(
    'Total seats:',
    totalSeats
  );

  console.log(
    'Booked seats:',
    bookedSeats
  );


  if (!totalSeats || totalSeats < 1) {

    seatGrid.innerHTML =
      '<p>No seats available.</p>';

    return;
  }


  // Create seats
  for (
    let seatNumber = 1;
    seatNumber <= totalSeats;
    seatNumber++
  ) {

    const seatButton =
      document.createElement('button');


    seatButton.type = 'button';

    seatButton.className = 'seat';

    seatButton.textContent =
      seatNumber;


    // Check whether seat is already booked
    // Number() handles both "5" and 5
    const isTaken =
      bookedSeats.some(function (seat) {

        return Number(seat) ===
          Number(seatNumber);

      });


    if (isTaken) {

      // Booked seat
      seatButton.classList.add('taken');

      seatButton.disabled = true;

      seatButton.title =
        'This seat is already booked';

    } else {

      // Available seat
      seatButton.addEventListener(
        'click',
        function () {

          selectSeat(seatNumber);

        }
      );
    }


    // Highlight selected seat
    if (
      Number(seatNumber) ===
      Number(selectedSeat)
    ) {

      seatButton.classList.add('selected');
    }


    seatGrid.appendChild(
      seatButton
    );


    // Add aisle after seats 2, 6, 10, 14...
    if (
      seatNumber % 4 === 2 &&
      seatNumber < totalSeats
    ) {

      const aisle =
        document.createElement('div');

      aisle.className =
        'aisle';

      seatGrid.appendChild(
        aisle
      );
    }
  }
}


// ============================================================
// 5. SELECT A SEAT
// ============================================================

function selectSeat(seatNumber) {

  hideMessage();


  if (!selectedRoute) {

    showMessage(
      'Please select a route first.',
      'error'
    );

    return;
  }


  // Check if the seat is already booked
  const bookedSeats =
    Array.isArray(selectedRoute.booked_seats)
      ? selectedRoute.booked_seats
      : [];


  const isTaken =
    bookedSeats.some(function (seat) {

      return Number(seat) ===
        Number(seatNumber);

    });


  if (isTaken) {

    showMessage(
      'Sorry, this seat is already booked.',
      'error'
    );

    return;
  }


  // Remember selected seat
  selectedSeat =
    Number(seatNumber);


  console.log(
    'Selected seat:',
    selectedSeat
  );


  renderSeats();
  updateSummary();
}


// ============================================================
// 6. UPDATE SUMMARY
// ============================================================

function updateSummary() {

  if (!selectedRoute) {

    summary.textContent =
      'Select a route and a seat to see your booking summary.';

    submitBtn.disabled = true;

    return;
  }


  if (!selectedSeat) {

    summary.textContent =
      'Now click an available seat on the seat map.';

    submitBtn.disabled = true;

    return;
  }


  summary.innerHTML =
    `<strong>${selectedRoute.origin} → ` +
    `${selectedRoute.destination}</strong><br>` +
    `Bus: ${selectedRoute.bus_name}<br>` +
    `Seat: <strong>${selectedSeat}</strong><br>` +
    `Fare: <strong>NPR ${selectedRoute.fare}</strong>`;


  // User can now submit
  submitBtn.disabled = false;
}


// ============================================================
// 7. SEND BOOKING TO DJANGO
// ============================================================

bookingForm.addEventListener(
  'submit',
  async function (event) {

    // Prevent normal browser form submission
    event.preventDefault();

    hideMessage();


    // --------------------------------------------------------
    // CHECK ROUTE
    // --------------------------------------------------------

    if (!selectedRoute) {

      showMessage(
        'Please select a route first.',
        'error'
      );

      return;
    }


    // --------------------------------------------------------
    // CHECK SEAT
    // --------------------------------------------------------

    if (!selectedSeat) {

      showMessage(
        'Please select a seat first.',
        'error'
      );

      return;
    }


    // --------------------------------------------------------
    // GET PASSENGER NAME FIELD
    // --------------------------------------------------------

    const passengerNameElement =
      document.getElementById(
        'passengerName'
      );


    if (!passengerNameElement) {

      console.error(
        'ERROR: passengerName element was not found.'
      );

      showMessage(
        'Passenger name field is missing.',
        'error'
      );

      return;
    }


    // --------------------------------------------------------
    // GET PHONE FIELD
    // --------------------------------------------------------

    const phoneElement =
      document.getElementById('phone');


    if (!phoneElement) {

      console.error(
        'ERROR: phone element was not found.'
      );

      showMessage(
        'Phone number field is missing.',
        'error'
      );

      return;
    }


    // --------------------------------------------------------
    // READ FORM VALUES
    // --------------------------------------------------------

    const passengerName =
      passengerNameElement.value.trim();


    const phoneNumber =
      phoneElement.value.trim();


    // --------------------------------------------------------
    // VALIDATE PASSENGER NAME
    // --------------------------------------------------------

    if (!passengerName) {

      showMessage(
        'Please enter the passenger name.',
        'error'
      );

      passengerNameElement.focus();

      return;
    }


    // --------------------------------------------------------
    // VALIDATE PHONE NUMBER
    // --------------------------------------------------------

    if (!phoneNumber) {

      showMessage(
        'Please enter the phone number.',
        'error'
      );

      phoneElement.focus();

      return;
    }


    // ========================================================
    // IMPORTANT:
    // Django expects "phone_number", NOT "phone"
    // ========================================================

    const bookingData = {

      route: selectedRoute.id,

      seat_number: selectedSeat,

      passenger_name: passengerName,

      phone_number: phoneNumber

    };


    // --------------------------------------------------------
    // DEBUG
    // --------------------------------------------------------

    console.log(
      '========================================'
    );

    console.log(
      'SENDING BOOKING TO DJANGO'
    );

    console.log(
      'Booking data:',
      bookingData
    );

    console.log(
      'Route:',
      selectedRoute.id
    );

    console.log(
      'Seat:',
      selectedSeat
    );

    console.log(
      'Passenger:',
      passengerName
    );

    console.log(
      'Phone Number:',
      phoneNumber
    );

    console.log(
      '========================================'
    );


    // --------------------------------------------------------
    // DISABLE BUTTON
    // --------------------------------------------------------

    submitBtn.disabled = true;

    submitBtn.textContent =
      'Booking...';


    try {

      // ------------------------------------------------------
      // SEND POST REQUEST
      // ------------------------------------------------------

      const response =
        await fetch(
          `${API_BASE_URL}/bookings/`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',

              'Accept':
                'application/json'
            },

            body:
              JSON.stringify(
                bookingData
              )
          }
        );


      // ------------------------------------------------------
      // READ RESPONSE
      // ------------------------------------------------------

      const responseText =
        await response.text();


      let result;


      try {

        result =
          responseText
            ? JSON.parse(responseText)
            : {};

      } catch (jsonError) {

        console.error(
          'Django returned invalid JSON:',
          responseText
        );

        result = {
          detail:
            responseText ||
            'Server returned an invalid response.'
        };
      }


      console.log(
        'Django status:',
        response.status
      );

      console.log(
        'Django response:',
        result
      );


      // ======================================================
      // SUCCESS
      // ======================================================

      if (response.ok) {

        const bookedSeat =
          selectedSeat;

        const bookedPassenger =
          passengerName;


        showMessage(
          `✅ Booking confirmed! Seat ${bookedSeat} ` +
          `is yours, ${bookedPassenger}.`,
          'success'
        );


        // Clear form
        bookingForm.reset();


        // Clear selected seat
        selectedSeat = null;


        // Reload routes
        // Newly booked seat should now be unavailable
        await loadRoutes();

      }


      // ======================================================
      // ERROR
      // ======================================================

      else {

        console.error(
          'Booking failed:',
          result
        );


        showMessage(
          '❌ ' + formatErrors(result),
          'error'
        );


        // Reload routes in case another user
        // booked the same seat
        await loadRoutes();
      }


    } catch (error) {

      console.error(
        'Booking error:',
        error
      );


      showMessage(
        '❌ Could not reach the server. ' +
        'Please make sure Django is running on ' +
        '127.0.0.1:8000.',
        'error'
      );

    }


    // --------------------------------------------------------
    // RESTORE BUTTON
    // --------------------------------------------------------

    submitBtn.textContent =
      'Book My Seat';


    updateSummary();

  }
);


// ============================================================
// 8. FORMAT DJANGO ERRORS
// ============================================================

function formatErrors(errorObject) {

  const messages = [];


  if (!errorObject) {

    return (
      'Something went wrong while booking the seat.'
    );
  }


  for (
    const field in errorObject
  ) {

    const value =
      errorObject[field];


    // Example:
    //
    // {
    //   "phone_number": [
    //     "This field is required."
    //   ]
    // }

    if (Array.isArray(value)) {

      messages.push(
        `${formatFieldName(field)}: ` +
        value.join(' ')
      );

    } else {

      messages.push(
        `${formatFieldName(field)}: ` +
        String(value)
      );
    }
  }


  if (messages.length === 0) {

    return (
      'Something went wrong while booking the seat.'
    );
  }


  return messages.join(' ');
}


// ============================================================
// 9. MAKE DJANGO FIELD NAMES USER-FRIENDLY
// ============================================================

function formatFieldName(fieldName) {

  const names = {

    route:
      'Route',

    seat_number:
      'Seat Number',

    passenger_name:
      'Passenger Name',

    phone_number:
      'Phone Number',

    detail:
      'Error'

  };


  if (names[fieldName]) {

    return names[fieldName];
  }


  // Convert snake_case to normal text
  return fieldName
    .replace(/_/g, ' ')
    .replace(
      /\b\w/g,
      function (letter) {
        return letter.toUpperCase();
      }
    );
}


// ============================================================
// 10. SHOW MESSAGE
// ============================================================

function showMessage(
  text,
  type
) {

  messageBox.textContent =
    text;

  messageBox.className =
    type;
}


// ============================================================
// 11. HIDE MESSAGE
// ============================================================

function hideMessage() {

  messageBox.className =
    '';

  messageBox.textContent =
    '';
}


// ============================================================
// 12. START THE APPLICATION
// ============================================================

console.log(
  'Bus booking application started.'
);

console.log(
  'Django API:',
  API_BASE_URL
);


// Load routes when page opens
loadRoutes();

