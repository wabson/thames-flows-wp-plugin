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
       '<script type="text/javascript">document.getElementById("'.$id.'-date-from").value = then.toISOString().split("T")[0]; document.getElementById("'.$id.'-date-to").value = now.toISOString().split("T")[0]; document.getElementById("'.$id.'-change-btn").addEventListener("click", function() { plotGraph(this.id.replace("-change-btn", ""))}); plotGraph("'.$id.'"); document.querySelector("#'.$id.'-data-toggle a").addEventListener("click", function(evt) { evt.stopPropagation(); evt.preventDefault(); var tableEl = document.getElementById(this.parentNode.id.replace("-data-toggle", "-table")); tableEl.style.display = tableEl.style.display === "none" ? "" : "none"; }); window.addEventListener("orientationchange", function() { plotGraph("'.$id.'"); }); if (screen && screen.orientation && screen.orientation.addEventListener) { screen.orientation.addEventListener("change", function(e) { plotGraph("'.$id.'"); });}</script>';
}

// [flow_graph station_name="Kingston"]
function flow_graph( $atts ) {
    extract( shortcode_atts( array(
        'station_name' => 'Kingston',
    ), $atts ) );
    $id = strtolower(preg_replace('/[^a-zA-Z0-9]+/', '-', $station_name));

    $html = '<script src="//d3js.org/d3.v3.min.js"></script>'.
        '<script src="'.plugin_dir_url(__FILE__).'assets/d3-tip-0.9.1.js"></script>'.

        '<link rel="stylesheet" href="'.plugin_dir_url(__FILE__).'assets/style.css?v=2">'.
        '<script src="'.plugin_dir_url(__FILE__).'assets/graphs.js?v=4"></script>'.
        '<div class="graphs">'.
        markup($id, $station_name).
        '</div>';
    return $html;
}
add_shortcode('flow_graph', 'flow_graph');
?>
