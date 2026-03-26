# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A WordPress plugin that displays water flow rate measurements from Thames gauging stations as interactive D3.js visualizations. It registers a `[flow_graph]` shortcode with `id` and `station_name` parameters.

Supported stations: Kingston, Walton, Maidenhead, Reading.

## Architecture

**Entry point:** `index.php` — WordPress plugin header, shortcode registration, HTML/JS output, and CDN asset loading.

**Frontend visualization:** `assets/graphs.js` — D3.js v3 chart logic. The main function is `plotGraph()`, which queries the external data API, renders an SVG area/line chart with tooltips, weekend shading, and an optional data table.

**Data source:** External API at `https://wabson.org/flowdata/sqlite.php` queried with SQLite-style parameters from the frontend JS.

**External libraries loaded via CDN (no build step):**
- D3.js v3
- jQuery 1.9.1 + jQuery UI 1.10.4

**Bundled library:** `assets/d3-tip-0.9.1.js` — third-party D3 tooltip plugin.

## Development

No build pipeline — this is plain PHP + JS. To develop:

1. Copy/symlink the plugin directory into a WordPress installation's `wp-content/plugins/` folder.
2. Activate the plugin in the WordPress admin.
3. Add the shortcode to a page: `[flow_graph id="kingston" station_name="Kingston Flow"]`

Changes to `assets/graphs.js` and `assets/style.css` take effect on browser reload (no compilation needed).
