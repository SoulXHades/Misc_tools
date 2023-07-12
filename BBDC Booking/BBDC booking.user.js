// ==UserScript==
// @name        BBDC booking
// @author      lamecarrot
// @version    	1.1.2
// @namespace   https://lamecarrot.wordpress.com/
// @description Notify user via browser alert if there are slots available for booking. User maybe choose the date range they are interested in (months only for now). User may also choose to stop refreshing.
// @match		*://*.booking.bbdc.sg/*
// ==/UserScript==


(function() {
    'use strict';

    // Check if we are at the booking page. If not, don't execute the remaining script.
    if (window.location.href.indexOf("/booking/chooseSlot") < 0) {
        return
    }

    // Request permission for notifications
    Notification.requestPermission();
    // Default reload in 5 sec else too fast and might actually spam the server
    const MIN_RELOAD_SEC = 5;
    var reload_duration = MIN_RELOAD_SEC*1000;
    var reloadTimeoutId;
    var checkSlotsAndNotifyTimeoutId;

    // Reload the page to see changes
    function reloadPage() {
        location.reload();
    }

    // Create or restore user preference
    function createOrRestoreUserPreference() {
        var userPreferenceDiv = document.createElement('div');
        userPreferenceDiv.id = 'userPreference';
        userPreferenceDiv.style.background = '#e0e0e0';
        userPreferenceDiv.style.padding = '15px';
        userPreferenceDiv.innerHTML = `
            <label for="start">Start Date:</label>
            <input type="date" id="start" name="start">
            <label for="end">End Date:</label>
            <input type="date" id="end" name="end">
            <label for="end">Refresh duration in seconds:</label>
            <input type="number" id="refreshduration" name="refreshduration" min="5" value=5 style="width: 5em">
            <button id="save">Save</button>
            <button id="stopRefresh">Stop refreshing</button>
        `;

        // To place this at the top of the page, we will need to find the right element without page's own CSS messes things up
        var containerDiv = document.querySelector('.container.container--fluid');
        if (containerDiv) {
            containerDiv.insertBefore(userPreferenceDiv, containerDiv.firstChild);
        }

        var saveButton = document.getElementById('save');
        saveButton.addEventListener('click', saveDateRange);
        // Save button's design
        saveButton.style.margin = "10px";
        saveButton.style.padding = "3px .3em";
        saveButton.style.border = "1px solid transparent";
        saveButton.style.borderRadius = "5px";
        saveButton.style.color = "#fff";
        saveButton.style.backgroundColor = "#0095ff";
        saveButton.style.display = "inline-block";
        saveButton.style.outline = "none";
        saveButton.style.boxShadow = "rgba(255, 255, 255, .4) 0 1px 0 0 inset";

        var stopRefreshButton = document.getElementById('stopRefresh');
        stopRefreshButton.addEventListener('click', stopRefreshing);
        // Stop refresing's button's design
        stopRefreshButton.style.margin = "10px";
        stopRefreshButton.style.padding = "3px .3em";
        stopRefreshButton.style.border = "1px solid transparent";
        stopRefreshButton.style.borderRadius = "5px";
        stopRefreshButton.style.color = "#fff";
        stopRefreshButton.style.backgroundColor = "#FF4742";
        stopRefreshButton.style.display = "inline-block";
        stopRefreshButton.style.outline = "none";
        stopRefreshButton.style.boxShadow = "rgba(255, 255, 255, .4) 0 1px 0 0 inset";

        // Retrieve and populate the saved date range
        var savedData = localStorage.getItem('user_preference');
        if (savedData) {
            var userPreference = JSON.parse(savedData);
            var startDateInput = document.getElementById('start');
            var endDateInput = document.getElementById('end');
            var refreshDurationInput = document.getElementById('refreshduration');
            startDateInput.value = userPreference.startDate;
            endDateInput.value = userPreference.endDate;
            refreshDurationInput.value = parseInt(userPreference.refreshDuration);
            // Set the previously saved refresh duration
            reload_duration = parseInt(userPreference.refreshDuration) * 1000;
        }
    }

    // Save the selected date range
    function saveDateRange() {
        var startDateInput = document.getElementById('start');
        var endDateInput = document.getElementById('end');
        var refreshDurationInput = document.getElementById('refreshduration');

        if (parseInt(refreshDurationInput.value) < 5) refreshDurationInput.value = MIN_RELOAD_SEC;

        var userPreference = {
            startDate: startDateInput.value,
            endDate: endDateInput.value,
            refreshDuration: parseInt(refreshDurationInput.value)
        };
        // Save to localstorage
        localStorage.setItem('user_preference', JSON.stringify(userPreference));
        // Reset the refresh timeout and set based on what user just set
        reload_duration = parseInt(refreshDurationInput.value) * 1000;
        clearTimeout(reloadTimeoutId);
        reloadTimeoutId = setTimeout(reloadPage, reload_duration);

        // Enable stop refresh button
        var stopRefreshButton = document.getElementById('stopRefresh');
        stopRefreshButton.disabled = false;
        stopRefreshButton.style.backgroundColor = "#FF4742";
    }

    // Stop all timeout that leads to refreshing the page
    function stopRefreshing() {
        clearTimeout(checkSlotsAndNotifyTimeoutId);
        clearTimeout(reloadTimeoutId);
        // Disable button
        var stopRefreshButton = document.getElementById('stopRefresh');
        stopRefreshButton.disabled = true;
        stopRefreshButton.style.backgroundColor = "#B30000";
    }

    // Show notification
    function showNotification(available_months) {
        var notificationBody = 'Months with slots: ' + available_months.join(', ');
        var notification = new Notification('BBDC booking', {
            body: notificationBody
        });
    }

    // Helper function to get the month index based on month name
    function getMonthIndex(month) {
        var monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        return monthNames.indexOf(month);
    }

    // Parse the date from button text (assuming it follows the format "Month Year")
    function parseButtonDate(buttonText) {
        var parts = buttonText.split("'");
        var month = parts[0];
        var year = "20" + parts[1];
        return new Date(year, getMonthIndex(month.toUpperCase())).setHours(0, 0, 0, 0);
    }

    // Check for the div element and send notification if it has child elements which means have slots for booking
    function checkSlotsAndNotify() {
        var available_months = [];
        var userPreference = JSON.parse(localStorage.getItem('user_preference'));
        clearTimeout(checkSlotsAndNotifyTimeoutId); // Clear the previous timeout so won't call checkSlotsAndNotify() again
        var divElement = document.querySelector('.dateList.dateList-web.d-none.d-md-flex');
        // If True means have button(s) that usually show "Jan'23", "Feb'23", etc. Months that have slot(s).
        if (divElement && divElement.children.length > 0) {
            // Get the months that has slots available from the buttons
            divElement.children.forEach(function(month_button) {
                var buttonText = month_button.querySelector('.v-btn__content').innerHTML.trim();
                available_months.push(buttonText);
            });
            var startDate_dateFormat = new Date(userPreference.startDate.slice(0, -3)).setHours(0, 0, 0, 0); // Slice day away for now until implement compare exact date
            var endDate_dateFormat = new Date(userPreference.endDate.slice(0, -3)).setHours(0, 0, 0, 0); // Slice day away for now until implement compare exact date
            var notificationTexts = available_months.filter(function(buttonText) {
                var buttonDate = parseButtonDate(buttonText); // Parse like "Jul'23" to Date() object
                console.log("Button date: " + buttonDate);
                console.log("Start date: " + startDate_dateFormat);
                console.log("End date: " + endDate_dateFormat);
                return buttonDate >= startDate_dateFormat && buttonDate <= endDate_dateFormat; // Compare by exact date
            });
            if (Array.isArray(notificationTexts) && notificationTexts.length) {
                showNotification(notificationTexts);
                // If have slot, reset & increase reload interval to 1 min so that user have time to off the script if there are actually slots and user wants to book
                reload_duration = 60*1000;
            }
        }
        // Reload since there are no slots available
        reloadTimeoutId = setTimeout(reloadPage, reload_duration);
    }

    // Check for the overlay div attribute and trigger notification if it meets the criteria
    function checkOpacityAndNotify() {
        var divElement = document.querySelector('.v-overlay__scrim');
        // True means the overlay is gone and the page has loaded finish. The overlay loading animation is from vue.js while waiting for data on available slots to load from the server
        if (divElement && divElement.style.opacity === '0') {
            // Page loaded finish. We can now check if there are any slots for booking
            checkSlotsAndNotify();
        }
    }

    // Create a mutation observer to detect attribute changes in the overlay div element
    var observer_4_overlay = new MutationObserver(function(mutationsList) {
        for (var mutation of mutationsList) {
            if (mutation.target.classList.contains('v-overlay__scrim')) {
                checkOpacityAndNotify();
            }
        }
    });
    // Start observing attribute modifications in the div overlay element
    observer_4_overlay.observe(document, {
        attributes: true,
        attributeFilter: ['style'],
        subtree: true
    });

    // Create user preference DIV on page load
    createOrRestoreUserPreference();
    // Delay the check by 12 seconds after page load (Backup as sometimes the overlay is too fast for the UserScript to note the initial value of the overlay's opacity to compare the changes
    checkSlotsAndNotifyTimeoutId = setTimeout(checkSlotsAndNotify, 12000);
})();