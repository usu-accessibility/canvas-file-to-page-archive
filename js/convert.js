2

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
var scriptURL = 'https://elearn.usu.edu/accessibility/file_to_page/'


/***********************
*  END CONFIGURATION  *
***********************/


//
// $(window).load(function() {
$(document).ready(function() {
    "use strict";
    // Append  jQuery dialog to the body of your page
    $('body').append('<div id="file_convert_dialog" title="Processing"></div>');

    var body = $('body');
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
                            '   <a data-id="' + fileId + '" data-name="' + fileName + '" class="pdf_to_page" href="#" tabindex="-1" role="menuitem">Convert to Canvas Page</a>'+
                            '</li>');
                    }
                }

                // Begin file conversion when "Convert to Canvas Page" link is clicked
                $(".pdf_to_page").unbind('click').click(function() {
                    var $this = $(this);
                    // Create modal dialog to provide status of document conversion

                    $( "#file_convert_dialog" ).dialog({ position : { of:"bottom", at: "bottom", of: window, collision: "fit"}})
                    
                    var position = $( ".ui-dialog" ).css({
                        "position": "absolute",
                        "top":"15rem"
                      });;

                    $("#file_convert_dialog").html('<h3 style="text-align: center;">Converting file to Canvas page</h3> <img style="display: block; margin-left: auto; margin-right: auto; max-width: 100%;" src="'+scriptURL+'images/loading.gif" alt="loading" />');


                    var fileId = $this.data('id');
                    var fileName = $this.data('name');
                    var coursesId = ENV.COURSE_ID; //the Canvas course ID
                    var params;
                    var actualCount = 1;

                    var uploadedImgURLs = [];

                    function uploadImageToFilesofCanvas(imageUrl, name, paramsForFileToCanvas, idx, totalCount, contentType, imageIds, path, folder_id){
                        
                        const fileUrl = new File([imageUrl],  name + imageExtension, { type: imageUrl.type });                    
                        var imageExtension = (contentType == "image/jpeg")?'.jpg':'.png';

                        var formData = new FormData()
                        formData.append('Authorization', 'Enter the access token here')
                        formData.append('parent_folder_path', path)
                        formData.append('display_name', name + imageExtension)
                        formData.append('filename', name + imageExtension)
                        formData.append('content_type', contentType)
                        
                        // uploads all the images to root folder of files
                        $.ajax({
                            'url': 'https://' + document.domain + '/api/v1/courses/' + coursesId + '/files',
                            'type': 'POST',
                            'data': formData,
                            processData: false,
                            contentType: false,
                            success: function (data) {
                                console.log("target url got set successfully");
                            },
                            error: function(xhr, status, error) {
                                // handle error response
                                if(actualCount === totalCount){
                                    convertFileToCanvasPage(paramsForFileToCanvas, uploadedImgURLs);
                                }
                                actualCount += 1;
                                console.log("failed to set target url");
                            }
                        }).done(function(response) {
                            var response = JSON.parse(response)  ;

                            if (response.upload_url) {

                                // POST to the upload_url with the upload_params to start the upload

                                var formData1 = new FormData()
                                formData1.append('Authorization', 'Enter the access token here')
                                formData1.append('fileName', fileUrl, name + imageExtension);

                                var upload_url = response.upload_url;
                                for (const key in response.upload_params) {
                                    formData1.append(key, response.upload_params[key]);
                                }

                                $.ajax({
                                    'url': upload_url,
                                    'type': 'POST',
                                    'data': formData1,
                                    processData: false,
                                    contentType: false,
                                    success: function (data) {
                                        console.log("File uploaded got uploded successfully");
                                    },
                                    error: function(xhr, status, error) {
                                        // handle error response
                                        if(actualCount === totalCount){
                                            convertFileToCanvasPage(paramsForFileToCanvas, uploadedImgURLs);
                                        }
                                        actualCount += 1;
                                        console.log("File uploaded got uploded unsuccessfully");
                                    }
                                }).done(function(res) {
                                    imageIds.push(res);
                                    uploadedImgURLs[idx - 1] = res.url;
                                    if(actualCount === totalCount){
                                        convertFileToCanvasPage(paramsForFileToCanvas, uploadedImgURLs);
                                    }
                                    actualCount += 1;
                                })
                            }
                        });


                    }

                    function convertFileToCanvasPage(paramsForFileToCanvas, uploadedImgURLs){
                        var htmlString = paramsForFileToCanvas.pagedata;
                        htmlString = htmlString.replace(/src="(.*?)"/g, function(match, p1) {
                            return `src="${uploadedImgURLs.shift()}"`;
                        });

                        var data_info = htmlString.split('|~|');
                        
                        if (data_info[0] === "") {
                            var page_tite = fileName;
                        } else {
                            var page_tite = data_info[0];
                        }

                        // Run the Canvas API to convert the data from Allyinto a Canvas page using the document title and page content    
                        params = {
                            'wiki_page[title]': page_tite,
                            'wiki_page[body]': '<a href="https://' + document.domain + '/courses/' + paramsForFileToCanvas.coursesId + '/files/' + paramsForFileToCanvas.fileId + '" target="_blank">Download ' + page_tite + ' file</a>' + data_info[1]
                        }
                        $.ajax({
                            'url': 'https://' + document.domain + '/api/v1/courses/' + coursesId + '/pages',
                            'type': 'POST',
                            'data': params
                        }).done(function(results) {
                            $("#file_convert_dialog").html('<h3 style="text-align: center;">The document is ready!<br /> <a href="' + results.html_url + '">View the page here</a><br /> (corrections may be needed).</h3>');
                        });
                    }

                    function callAlly($this){
                        $.post(scriptURL+'action.php', {
                            task: "allyAuth",
                            fileId: fileId,
                            coursesId: coursesId
                        }).done(function(data_str) {
                            var data = JSON.parse(data_str);
                            if (data.indexOf("https://ally-production.s3.amazonaws.com") > -1) {

                                $.post(scriptURL+'action.php', {
                                    task: "fileToPage",
                                    url: data
                                }).done(function(pagedata) {
                                    // Retrieve Ally file data from action.php
                                    // Get the img element
                             
                                    const srcRegex = /<img[^>]+src="([^"]+)"/g;
                                    const srcValues = [];
                                    var imageIds = []; 
                                    var contentType;

                                    let match;
                                    while ((match = srcRegex.exec(pagedata)) !== null) {
                                        srcValues.push(match[1]);
                                    }

                                    for (var i = 1; i <= srcValues.length; i++) {
                                        uploadedImgURLs.push("");
                                    }

                                    var convertedImg = [];
                                    for(var idx = 0; idx < srcValues.length;idx++){
                                        var src = srcValues[idx];
                                        // Get the base64-encoded data from the src attribute
                                        var base64Data = src.split(',')[1];
                                        base64Data = base64Data.replaceAll("&#13;%0A",'');

                                        // // Decode the base64-encoded data
                                        const decodedData = atob(base64Data);
                                        contentType = ((src.split(',')[0]).split(";")[0]).split(':')[1]

                                            
                                        // Convert the decoded data to a Uint8Array
                                        const uint8Array = new Uint8Array(decodedData.length);
                                        for (let i = 0; i < decodedData.length; i++) {
                                            uint8Array[i] = decodedData.charCodeAt(i);
                                        }
    
                                        // Create a Blob from the Uint8Array and set it as the src of the img element
                                        const blob = new Blob([uint8Array], { type: contentType });
                                        // const objectUrl = URL.createObjectURL(blob);
                                        convertedImg.push(blob);
                                    }                                   



                                    var paramsForFileToCanvas = {
                                        'pagedata' : pagedata,
                                        'fileId' : fileId,
                                        'courseId' : coursesId,
                                    }

                                    var filename = fileName.split('.').slice(0, -1).join('.').replaceAll(" ", "-");

                                    function uploadImageAndConverToCanvasPage(path, folder_id){
                                        if(convertedImg.length !== 0){
                                            for(var idx = 0; idx < convertedImg.length;idx++){
                                                var imageUrl = convertedImg[idx];
                                                var name = filename;
                                                name = name.replaceAll("pdf",'');
                                                name = name + "-" + idx;
                                                uploadImageToFilesofCanvas(imageUrl, name, paramsForFileToCanvas, idx + 1, convertedImg.length, contentType, imageIds, path, folder_id);
                                            }
                                        }
                                        else{
                                            convertFileToCanvasPage(paramsForFileToCanvas, uploadedImgURLs);
                                        }
                                    }

                                    var page = 1;
                                    var flag = false;
                                    var initialFolderId = "";
                                    var initialFileId = "";

                                    for(var idx = 1;idx <= 10;idx++){

                                        var formData5 = new FormData()
                                        formData5.append('Authorization', 'Enter the access token here')
                                        formData5.append('name', filename);
                                        formData5.append('parent_folder_path', '/images/converted-files');
                                        formData5.append('on_duplicate', 'overwrite');

                                        $.ajax({
                                            'url': 'https://' + document.domain + '/api/v1/courses/' + coursesId + '/folders',
                                            'type': 'GET',
                                            'data': {'per_page':200, 'page':idx},
                                            success: function(response) {
                                                page += 1;

                                                //check if any folders already exist or not
                                                if(response.length !== 0){
                                                    response.forEach(element => {
                                                        if(element.name === 'converted-files'){
                                                            initialFolderId = element.id;
                                                        }
                                                        if(element.name === "images"){
                                                            flag = true;
                                                        }
                                                        if(element.name === filename){
                                                            initialFileId = element.id;
                                                        }
                                                    });
                                                }

                                                // if any of the folders already exist it fetches id of the folder to upload file or it creates folders if doesn't exist.
                                                if(page === 11){
                                                    if(flag){
                                                        if(initialFolderId === ""){
                                                            var formData4 = new FormData()
                                                            formData4.append('Authorization', 'Enter the access token here')
                                                            formData4.append('name', 'converted-files');
                                                            formData4.append('parent_folder_path', '/images');
                                                            formData4.append('on_duplicate', 'overwrite');
                                                            
                                                            $.ajax({
                                                                'url': 'https://' + document.domain + '/api/v1/courses/' + coursesId + '/folders',
                                                                'type': 'POST',
                                                                'data': formData4,
                                                                processData: false,
                                                                contentType: false,
                                                                success: function(res1) {
                                                                    res1 = JSON.parse(res1);

                                                                    $.ajax({
                                                                        'url': 'https://' + document.domain + '/api/v1/courses/' + coursesId + '/folders',
                                                                        'type': 'POST',
                                                                        'data': formData5,
                                                                        processData: false,
                                                                        contentType: false,
                                                                        success: function(res2) {
                                                                            res2 = JSON.parse(res2);
                                                                            uploadImageAndConverToCanvasPage("images/" + 'converted-files/' + filename, res2.id);
                                                                            console.log('Created converted-files folder successfully');
                                                                        },
                                                                        error: function(xhr, status, error){
                                                                            console.log('Failed to move image to the new folder.');
                                                                            $("#file_convert_dialog").html('<h3 style="text-align: center;">Internal Server Error<br /> Please try again.</h3>');        
                                                                        }
                                                                    });
                                                                },
                                                                error: function(xhr, status, error) {
                                                                    console.log('Failed to move image to the new folder.');
                                                                    $("#file_convert_dialog").html('<h3 style="text-align: center;">Internal Server Error<br /> Please try again.</h3>');
                                                                }
                                                            });
                                                        }
                                                        else {
                                                            if(initialFileId === ""){
                                                                $.ajax({
                                                                    'url': 'https://' + document.domain + '/api/v1/courses/' + coursesId + '/folders',
                                                                    'type': 'POST',
                                                                    'data': formData5,
                                                                    processData: false,
                                                                    contentType: false,
                                                                    success: function(res2) {
                                                                        res2 = JSON.parse(res2);
                                                                        uploadImageAndConverToCanvasPage("images/" + 'converted-files/' + filename, res2.id);
                                                                        console.log('Created converted-files folder successfully');
                                                                    },
                                                                    error: function(xhr, status, error){
                                                                        console.log('Failed to move image to the new folder.');
                                                                        $("#file_convert_dialog").html('<h3 style="text-align: center;">Internal Server Error<br /> Please try again.</h3>');        
                                                                    }
                                                                });
                                                            }
                                                            else {
                                                                uploadImageAndConverToCanvasPage("images/" + 'converted-files/' + filename, initialFileId);
                                                            }
                                                        }
                                                    }
                                                    else {
                                                        var formData2 = new FormData()
                                                        formData2.append('Authorization', 'Enter the access token here')
                                                        formData2.append('name', 'images')
                                                        formData2.append('parent_folder_path', '/')

                                                        $.ajax({
                                                            'url': 'https://' + document.domain + '/api/v1/courses/' + coursesId + '/folders',
                                                            'type': 'POST',
                                                            'data': formData2,
                                                            processData: false,
                                                            contentType: false,
                                                            success: function(res) {
                                                                console.log('Created images folder successfully');

                                                                var formData4 = new FormData()
                                                                formData4.append('Authorization', 'Enter the access token here')
                                                                formData4.append('name', 'converted-files');
                                                                formData4.append('parent_folder_path', '/images');
                                                                formData4.append('on_duplicate', 'overwrite');

                                                                $.ajax({
                                                                    'url': 'https://' + document.domain + '/api/v1/courses/' + coursesId + '/folders',
                                                                    'type': 'POST',
                                                                    'data': formData4,
                                                                    processData: false,
                                                                    contentType: false,
                                                                    success: function(res1) {
                                                                        $.ajax({
                                                                            'url': 'https://' + document.domain + '/api/v1/courses/' + coursesId + '/folders',
                                                                            'type': 'POST',
                                                                            'data': formData5,
                                                                            processData: false,
                                                                            contentType: false,
                                                                            success: function(res2) {
                                                                                res2 = JSON.parse(res2);
                                                                                uploadImageAndConverToCanvasPage("images/" + 'converted-files/' + filename, res2.id);
                                                                                console.log('Created converted-files folder successfully');
                                                                            },
                                                                            error: function(xhr, status, error){
                                                                                console.log('Failed to move image to the new folder.');
                                                                                $("#file_convert_dialog").html('<h3 style="text-align: center;">Internal Server Error<br /> Please try again.</h3>');        
                                                                            }
                                                                        });
                                                                    },
                                                                    error: function(xhr, status, error) {
                                                                        console.log('Failed to create a new folder.');
                                                                        $("#file_convert_dialog").html('<h3 style="text-align: center;">Internal Server Error<br /> Please try again.</h3>');
                                                                    }
                                                                });
                                                            },
                                                            error: function(xhr, status, error) {
                                                                console.log('Failed to create a new folder.');
                                                                $("#file_convert_dialog").html('<h3 style="text-align: center;">Internal Server Error<br /> Please try again.</h3>');
                                                            }
                                                        });
                                                    }
                                                }
                                            },
                                            error: function(xhr, status, error) {
                                                console.log('Failed to move image to the new folder.');
                                                $("#file_convert_dialog").html('<h3 style="text-align: center;">Internal Server Error<br /> Please try again.</h3>');
                                            },
                                            timeout: 40000
                                        });
                                    }
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


