module.exports = {
  name: 'ilios-prerender',
  contentFor: function(type, config) {
    if (type === 'body-footer') {
      return '<script src="ilios-prerender/scripts.js"></script>';
    }
    if (type === 'test-body-footer') {
      return '<script src="ilios-prerender/test-scripts.js"></script>';
    }

    if( type === 'body') {
      return "<div id='initialpageloader'>" +
        "<header class='main'>" +
          "<span class='logo'>" +
            "<img src='images/ilios-logo.png' alt='Ilios Logo' title='Ilios Logo' />" +
          "</span>" +
        "</header>" +
        "<div id='site-container'>" +
          "<p id='browsererrormessage' class='hidden'>" +
            "It is possible that your browser is not supported by Ilios.  " +
            "Please refresh this page or try a different browser." +
          "</p>" +
          "</div>" +
        "</div>" +
      "</div>";
    }
  }
};
