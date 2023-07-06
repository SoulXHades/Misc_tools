// ==UserScript==
// @name        BBDC booking
// @author      lamecarrot
// @version    	1.0.2
// @namespace   https://lamecarrot.wordpress.com/
// @description Notify user via browser alert if there are slots available for booking.
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
    var reload_duration = 5*1000;
    var reloadTimeoutId;
    var checkSlotsAndNotifyTimeoutId;

    // Reload the page to see changes
    function reloadPage() {
        location.reload();
    }

    // Show notification
    function showNotification() {
        var notification = new Notification('BBDC booking', {
            body: 'Have BBDC practical slot!!!'
        });
    }

    // Check for the div element and send notification if it has child elements which means have slots for booking
    function checkSlotsAndNotify() {
        clearTimeout(checkSlotsAndNotifyTimeoutId); // Clear the previous timeout so won't call checkSlotsAndNotify() again
        var divElement = document.querySelector('.dateList.dateList-web.d-none.d-md-flex');
        // If True means have button(s) that usually show "Jan", "Feb", etc. Months that have slot(s).
        if (divElement && divElement.children.length > 0) {
            showNotification();
            // If have slot, reset & increase reload interval to 1 min so that user have time to off the script if there are actually slots and user wants to book
            reload_duration = 60*1000;
            reloadTimeoutId = setTimeout(reloadPage, reload_duration); // Set the new timeout to reload the page
        }
        else {
            // Reload since there are no slots available
            reloadTimeoutId = setTimeout(reloadPage, reload_duration);
        }
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

    // Delay the check by 12 seconds after page load (Backup as sometimes the overlay is too fast for the UserScript to note the initial value of the overlay's opacity to compare the changes
    checkSlotsAndNotifyTimeoutId = setTimeout(checkSlotsAndNotify, 12000);
})();