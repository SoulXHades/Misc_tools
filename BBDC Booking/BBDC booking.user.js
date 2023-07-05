// ==UserScript==
// @name        BBDC booking
// @author      lamecarrot
// @version    	1.0
// @namespace   https://lamecarrot.wordpress.com/
// @description asd
// @include		*://*.booking.bbdc.sg/*
// @match		*://*.booking.bbdc.sg/*
// ==/UserScript==


(function() {
    'use strict';

    // Request permission for notifications
    Notification.requestPermission();
    // Default reload every 25 seconds
    var reload_duration = 25*1000;
    var reloadTimeoutId;

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

    // Check for the div element and send notification if it has child elements
    function checkAndNotify() {
        var divElement = document.querySelector('.dateList.dateList-web.d-none.d-md-flex');
        // If True means have button(s) that usually show "Jan", "Feb", etc. Months that have slot(s).
        if (divElement && divElement.children.length > 0) {
            showNotification();
            // If have slot, reset & increase reload interval to 1 min so that user have time to off the script if there are actually slots and user wants to book
            reload_duration = 60*1000;
            clearTimeout(reloadTimeoutId); // Clear the previous timeout
            reloadTimeoutId = setTimeout(reloadPage, reload_duration); // Set the new timeout to reload the page
        }
    }

    // Reload every 25 seconds
    reloadTimeoutId = setTimeout(reloadPage, reload_duration);
    // Delay the check by 12 seconds after page load
    setTimeout(checkAndNotify, 12000);
})();