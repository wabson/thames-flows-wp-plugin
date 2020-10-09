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
   return '<div class="graph flow-graph" id="'.$id.'">'.
       //'<h2>'.$stationName.'</h2>'.
       '<p><input type="text" id="'.$id.'-date-from" class="date-picker" /> – <input type="text" id="'.$id.'-date-to" class="date-picker" /><button id="'.$id.'-change-btn">Show</button></p>'.
       '<p id="'.$id.'-graph"></p>'.
       '<p id="'.$id.'-data-toggle"><a href="#">Show Data</a></p>'.
       '<p id="'.$id.'-table" class="table" style="display: none;"></p>'.
       '</div>'.
       '<script type="text/javascript">$("#'.$id.'-date-from").datepicker({ dateFormat: "dd/mm/yy" }); $("#'.$id.'-date-from").datepicker("setDate", then); $("#'.$id.'-date-to").datepicker({ dateFormat: "dd/mm/yy" }); $("#'.$id.'-date-to").datepicker("setDate", now); $("#'.$id.'-change-btn").on("click", function() { plotGraph(this.id.replace("-change-btn", ""))}); plotGraph("'.$id.'"); $("#'.$id.'-data-toggle a").on("click", function(evt) { evt.stopPropagation(); evt.preventDefault(); $("#" + this.parentNode.id.replace("-data-toggle", "-table")).toggle(); })</script>';
}

// [flow_graph id="kingston" station_name="Kingston Flow"]
function flow_graph( $atts ) {
    extract( shortcode_atts( array(
        'id' => 'kingston',
        'station_name' => 'Kingston Flow',
    ), $atts ) );

    $html = '<script src="//d3js.org/d3.v3.min.js"></script>'.
        '<script src="'.plugin_dir_url(__FILE__).'assets/d3-tip-0.9.1.js"></script>'.
        '<link rel="stylesheet" href="//code.jquery.com/ui/1.10.4/themes/smoothness/jquery-ui.css">'.
        '<script src="//code.jquery.com/jquery-1.9.1.js"></script>'.
        '<script src="//code.jquery.com/ui/1.10.4/jquery-ui.js"></script>'.
        '<link rel="stylesheet" href="'.plugin_dir_url(__FILE__).'assets/style.css">'.
        '<script src="'.plugin_dir_url(__FILE__).'assets/graphs.js"></script>'.
        '<div class="graphs">'.
        markup($id, $station_name).
        '</div>';
    return $html;
}
add_shortcode('flow_graph', 'flow_graph');
?>
