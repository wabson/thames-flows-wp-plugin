<?php
/**
 * Plugin Name: Thames Flow Data
 * Plugin URI: http://wabson.org/
 * Description: Display flow rate measurements from Thames gauging stations.
 * Version: 0.1
 * Author: Will Abson
 * Author URI: http://wabson.org/
 * License: Apache
 */
function markup($id, $stationName) {
   return '<div class="graph flow-graph" id="'.$id.'" data-station-name="'.htmlspecialchars($stationName).'">'.
       //'<h2>'.$stationName.'</h2>'.
       '<p class="graph-controls"><input type="date" id="'.$id.'-date-from" /> – <input type="date" id="'.$id.'-date-to" /> <button type="button" id="'.$id.'-change-btn">Show</button></p>'.
       '<p id="'.$id.'-graph"></p>'.
       '<p id="'.$id.'-data-toggle"><a href="#">Show Data</a></p>'.
       '<p id="'.$id.'-table" class="table" style="display: none;"></p>'.
       '</div>'.
       '<script type="text/javascript">initGraph("'.$id.'");</script>';
}

// [flow_graph id="kingston" station_name="Kingston Flow"]
function flow_graph( $atts ) {
    extract( shortcode_atts( array(
        'id' => '',
        'station_name' => '',
    ), $atts ) );
    if ( !$station_name ) {
        $station_name = $id ?: 'Kingston';
    }
    if ( !$id ) {
        $id = $station_name;
    }
    $id = strtolower(preg_replace('/[^a-zA-Z0-9]+/', '-', $id));

    $html = '<script src="//d3js.org/d3.v7.min.js"></script>'.
        '<link rel="stylesheet" href="'.plugin_dir_url(__FILE__).'assets/style.css?v=2">'.
        '<script src="'.plugin_dir_url(__FILE__).'assets/graphs.js?v=5"></script>'.
        '<div class="graphs">'.
        markup($id, $station_name).
        '</div>';
    return $html;
}
add_shortcode('flow_graph', 'flow_graph');
?>
