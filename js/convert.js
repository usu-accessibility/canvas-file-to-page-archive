/*
* Developed by Ludovic Attiogbe. Teaching and Learning Technologies - Utah State University 2019
* @version    1.0
* @license    See https://github.com/usu-access/file_to_page/blob/master/LICENSE
*/

/*jslint browser: true, sloppy: true, eqeq: false, vars: false, maxerr: 50, indent: 4, plusplus: true */
/*global $, jQuery, console */


/*******************
*  CONFIGURATION  *
*******************/

// Define the full URL where the action.php script is installed
var scriptURL = ''


/***********************
*  END CONFIGURATION  *
***********************/


//
$(document).ready(function() {
    "use strict";

    // Append  jQuery dialog to the body of your page
    $('body').append('<div id="file_convert_dialog" title="Processing"></div>');

    // Check if the page is completetly loaded using Dom Mutation
    $(function() {
        const m = new MutationObserver(function(records) {
            for (let i = 0; i < records.length; i++) {
                for (let j = 0; j < records[i].addedNodes.length; j++) {
                    if (records[i].addedNodes[j].matches && records[i].addedNodes[j].matches('.ef-item-row ')) {
                        initialize(records[i].addedNodes[j]);
                    }
                }
            }
        });

        m.observe(document, {
            subtree: true,
            childList: true,
        });

        // Use Canvas file row class .ef-item-row
        const components = document.querySelectorAll('.ef-item-row ');

        for (let i = 0; i < components.length; i++) {
            initialize(components[i]);
        }

        components[0].parentNode.appendChild(components[0].cloneNode());

        function initialize(component) {
            // Get the file url
            var files_url = $(component).find('.ef-name-col').children("a").attr("href");
            if (typeof(files_url) != "undefined" && files_url.indexOf('https') > -1) {
                // Get the file ID
    			 var fileId = files_url.split('/')[4];

    		// Get the file name
                var fileName = $(component).find('.ef-name-col').children("a").find('.ef-name-col__text').html();

                // Check the file icon type
                var doc_mime_icon = $(component).find('.ef-name-col').find("a").find('.ef-big-icon-container').find('i');

                // Checks to determine if the file is a PDF, doc or presentation file
                if (doc_mime_icon.hasClass('mimeClass-pdf') || doc_mime_icon.hasClass('mimeClass-doc') || doc_mime_icon.hasClass('mimeClass-ppt')) {

                	// Append the convert action link into the file actions dropdown menu
                    if ($(component).find('.ef-links-col').find('.al-options').find('.page_conversion').length == 0) {
                        $(component).find('.ef-links-col')
                            .find('.al-options')
                            .append('<li role="presentation" class="page_conversion">'+
                            '   <a data-id="' + fileId + '" data-name="' + fileName + '" class="pdf_to_page" href="" tabindex="-1" role="menuitem">Convert to Canvas Page</a>'+
                            '</li>');
                    }
                }

                // Begin file conversion when "Convert to Canvas Page" link is clicked
                $(".pdf_to_page").unbind('click').click(function() {
                    var $this = $(this);
    				// Create modal dialog to provide status of document conversion
                    $("#file_convert_dialog").dialog();
                    $("#file_convert_dialog").html('<h3 style="text-align: center;">Converting file to Canvas page</h3> <img style="display: block; margin-left: auto; margin-right: auto; max-width: 100%;" src="'+scriptURL+'images/loading.gif" alt="loading" />');

                    var fileId = $this.data('id');
                    var fileName = $this.data('name');
                    var coursesId = ENV.COURSE_ID; //the Canvas course ID
                    var params;
                    console.log(fileId);

                    function callAlly($this){
                        $.post(scriptURL+'action.php', {
                            task: "allyAuth",
                            fileId: fileId,
                            coursesId: coursesId
                        }).done(function(data_str) {

                            var data = JSON.parse(data_str);
                            console.log(data);
                            if (data.indexOf("https://ally-production.s3.amazonaws.com") > -1) {

                		// 
                                $.post(scriptURL+'action.php', {
                                    task: "fileToPage",
                                    url: data
                                }).done(function(pagedata) {

                                    // Retrieve Ally file data from action.php
                                    var data_info = pagedata.split('|~|');
                                    // console.log(data);

                                    // Determine if the the converted file has a title, if it doesn't then use the file name
                                    if (data_info[0] === "") {
                                        var page_tite = fileName;
                                    } else {
                                        var page_tite = data_info[0];
                                    }

                	            // Run the Canvas API to convert the data from Allyinto a Canvas page using the document title and page content
                                    params = {
                                        'wiki_page[title]': page_tite,
                                        'wiki_page[body]': '<a href="https://' + document.domain + '/courses/' + coursesId + '/files/' + fileId + '" target="_blank">Download ' + page_tite + ' file</a>' + data_info[1]
                                    }

                                    $.ajax({
                                        'url': 'https://' + document.domain + '/api/v1/courses/' + coursesId + '/pages',
                                        'type': 'POST',
                                        'data': params
                                    }).done(function(results) {
                                        $("#file_convert_dialog").html('<h3 style="text-align: center;">The document is ready!<br /> <a href="' + results.html_url + '">View the page here</a><br /> (corrections may be needed).</h3>');

                                    });
                                });

                            } else if (data === "Failed"){

                                $("#file_convert_dialog").html('<h3 style="text-align: center;">Sorry, we are Unable to Convert your documment!</h3>');

                            } else {
				// Check the status of the file conversion until it is ready. 
                                function checkStatus(nb_run) {
                                    var max_run = 12,
                                        repeatTime = 3000;
                                    if (data === "Pending" || data === "InProgress" || data === "Succeeded") {
                                        setTimeout(function(){ callAlly(); }, 3000);
                                    } else {
                                        // Continue to check in case a status is not returned.  
					nb_run++;
                                        if (nb_run !== max_run) {
                                            if (nb_run > 3) {
                                                repeatTime = 5000;
                                            } else if (nb_run > 6) {
                                                repeatTime = 10000;
                                            }
                                            setTimeout(function() {
                                                checkStatus(nb_run);
                                            }, repeatTime);
                                        } else {
                                            alert("The server is experiencing high traffic. Please reload the page");
                                        }
                                    }
                                }

                                checkStatus(1);
                            }


                        });
                    }
                     callAlly();
                });
            }
        }
    });

});

