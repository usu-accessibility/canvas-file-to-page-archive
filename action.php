<?php

    /*
    * Developed by Ludovic Attiogbe. Teaching and Learning Technologies - Utah State University 2019
    * @version    1.0
    * @license    See license.txt
    */

    //Turn PHP error reporting on or off and can safely be left as is =)
    error_reporting(E_ALL);
    ini_set('display_errors', '1');


    // Start a new PHP session
    session_start();

    // Check if the files have already been included and if not, include them.
    require_once __DIR__.'/simple_html_dom.php';
    require_once __DIR__.'/OAuthSimple.php';

    // Sets up a framework for tasks to be received from the Javascript. Currently there is only one task, but additional tasks may be added in the future.
    $task = '';
    if (isset($_POST['task'])) {
        $task = $_POST['task'];
    } else if (isset($_GET['task'])) {
        $task = $_GET['task'];
    }

    // Runs the fileToPage task which reference the fileToPage function
    switch($task) {
        case 'fileToPage':
            fileToPage();
        break;
    }

    // Funtion thats sets up the Oauth athentication to Ally and converts the file to HTML

    function fileToPage(){

    /*******************
    *  CONFIGURATION  *
    *******************/

        /* You will need your unique Ally institutional ID. This can be found by looking in your Ally LTI settings in the launch URL setting. If your launch URL is https://prod.ally.ac/api/v1/672/lti/institution then the institutional ID would be 672 */
        $allyID=;

        /* When Ally was installed at your institution, a Consumer Key and Shared Secret was generated for you from Blackboard that you used to install Ally in Canvas. These values are needed to access the Ally API */
        $consumerKey='';
        $sharedSecret='';
        
    /***********************
    *  END CONFIGURATION  *
    ***********************/

        // Receives the fileID and courseID variables defined in the Javascript
        $filsID = $_POST['fileId'];
        $courseID = $_POST['coursesId'];

        // Calls the OAuth clas from the OAuthSimple library
        $oauthObject = new OAuthSimple();

        // Fill in your API key/consumer key you received when you registered your
        $signatures = array( 'consumer_key'     => $consumerKey,
                         'consumer_secret'    => $sharedSecret);

        $url = 'https://prod.ally.ac/api/v1/'.$allyID.'/formats/'.$courseID.'/'.$filsID.'/Html';

        if (!isset($_GET['oauth_verifier'])) {

            $result = $oauthObject->sign(array(
                'action'     => 'GET',
                'method'     => 'HMAC-SHA1',
                'path'       => $url,
                'parameters' => array(
                    'acceptTOU' => 'true',
                    'role' => 'administrator',
                    'userId' => '1'
                ),
                'signatures' => $signatures)
            );

            $fixed_signature = str_replace('%253D', '%3D', $result['header']);
            $fixed_signature = str_replace('%252F', '%2F', $fixed_signature);
            $fixed_signature = str_replace('%252B', '%2B', $fixed_signature);

            $ch = curl_init();
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
            curl_setopt($ch, CURLOPT_URL, $url . '?acceptTOU=true&role=administrator&userId=1');
            curl_setopt($ch, CURLOPT_HTTPHEADER, array(
                'Authorization: ' . $fixed_signature
            ));

            $r = curl_exec($ch);

            curl_close($ch);

            $obj = json_decode($r);
            if (isset($obj->{'status'}) && $obj->{'status'}==="Failed") {
                echo " File cannot  be convert to page. Alternative format generation failed due to copyright restrictions.";
            } else{

                // if conversion is successful the grab the html file and parse the elements needed to create a Canvas page

                $url = $obj->{'url'};
                // Uses the simple_html_dom to parse the title, page and body of the HTML document
                $title_dom = new DOMDocument();
                $page_dom = new DOMDocument();
                $body_dom = new DOMDocument();

                // Collects the HTML elements received from Ally and compiles them into one variable
                libxml_use_internal_errors(true);
                $page_dom->loadHTML(file_get_contents($url));
                $body = $page_dom->getElementsByTagName('body')->item(0);

                foreach ($body->childNodes as $child){
                    $body_dom->appendChild($body_dom->importNode($child, true));
                }

                $file_body = $body_dom->saveHTML();

                libxml_clear_errors();

                $title = '';

                if($title_dom->loadHTMLFile($url)) {
                    $list = $title_dom->getElementsByTagName("title");
                    if ($list->length > 0) {
                        $title = $list->item(0)->textContent;
                    }
                }

                echo  $title .'|~|'.$file_body;

            }

        }
    }


?>

