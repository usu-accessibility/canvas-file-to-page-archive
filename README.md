Ally File to Canvas Page
==============================

* Ally File to Canvas Page* is a utility that utilizes the API from [Blackboard Ally](https://www.blackboard.com/accessibility/blackboard-ally.html) to convert files to Canvas pages. 
* [View a video of the tool in action here](https://mymedia.usu.edu/media/File+to+Page+Demo/0_8i787b0d).
  
Limitations
-----------

* The tool currently works with content that has a mime content of PDF, Doc or PPT. 
* The utility currently does not convert images contained within files to Canvas pages.  

Contributions are welcome! 


Requirements
------------

* PHP 5.3 or higher 

Installation Instructions
------------

1. Download this repository as a zip.
2. Complete the Configuration sections at the top of [convert.js] and found partway down [action.php] the file. If needed, some of the information required can be found in the LTI settings for Ally (Admin > Settings > App > View App Configurations). 
3. Upload these files to a server. 
4. Then you will need to add a reference the [convert.js] file in your Canvas global JavaScript using [these instructions for updating your JavaScript](https://community.canvaslms.com/docs/DOC-10862-4214724282) using the following JavaScript: 

```sh
$.getScript(“[path to file]/convert.js”, function () {
               console.log(‘convert.js loaded’);
           });

// Convert Ally PDF HTML to Canvas page
// $(window).on('load', function () {
    if (($.inArray('admin', ENV.current_user_roles) !== -1 || $.inArray('teacher', ENV.current_user_roles) !== -1) && document.location.href.indexOf('/files') > -1) {
        $.getScript("[path to file]/convert.js", function () {
            console.log('PDF to Canvas Page Ran');
        });
    }
// }); 
```


Dependencies
------------

The project uses the following dependencies: 

1. https://github.com/jrconlin/oauthsimple (BSD licence)
2. http://sourceforge.net/projects/simplehtmldom/ (MIT License)
