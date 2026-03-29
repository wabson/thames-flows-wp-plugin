# Thames Flow Plugin

A WordPress plugin that displays water flow rate measurements from Thames gauging stations as interactive D3.js visualisations.

## Features

- Area/line chart with hover tooltips showing flow rate and timestamp
- Weekend shading and day boundary markers
- Adjustable date range picker
- Expandable data table
- Responsive to screen orientation changes

## Supported stations

Kingston, Walton, Maidenhead, Reading

## Usage

Add the shortcode to any WordPress page or post:

```
[flow_graph station_name="Kingston"]
```

To use a custom HTML element ID (useful when embedding multiple graphs on the same page):

```
[flow_graph id="kingston" station_name="Kingston"]
[flow_graph id="walton" station_name="Walton"]
```

The `station_name` value is passed directly to the data API. The `id` controls the HTML element ID prefix used for the graph; if omitted it is derived from `station_name`.

## Development

No build pipeline — the plugin is plain PHP and JavaScript.

**Prerequisites:** Python 3 (for the local preview server), a WordPress installation for full plugin testing.

### Preview with the static test page

```bash
make preview
```

Then open [http://localhost:8080](http://localhost:8080). This serves `index.html`, which renders a Kingston graph directly without WordPress.

### Testing inside WordPress

1. Symlink the `plugin/` directory into your WordPress installation:
   ```bash
   ln -s /path/to/thames-flow-plugin/plugin /path/to/wordpress/wp-content/plugins/thames-flow-plugin
   ```
2. Activate the plugin in the WordPress admin under **Plugins**.
3. Add the shortcode to a page and preview it.

Changes to `plugin/assets/graphs.js` and `plugin/assets/style.css` take effect on browser reload. Changes to `plugin/index.php` take effect on the next page load (clear any PHP opcode cache if changes are not reflected).

## Deployment

Copy or symlink the `plugin/` directory into the `wp-content/plugins/` folder of the target WordPress installation, then activate the plugin via the WordPress admin.

## Architecture

| File | Purpose |
|---|---|
| `plugin/index.php` | WordPress plugin header, shortcode registration, HTML output and asset loading |
| `plugin/assets/graphs.js` | D3.js v7 chart logic — `initGraph()` wires up controls, `plotGraph()` / `_plotGraph()` fetch data and render the SVG |
| `plugin/assets/style.css` | Chart and tooltip styles |
| `index.html` | Static test page (no WordPress required) |

Data is fetched from an AWS Lambda function at `https://pubsm4kw3kv5thp2m6zsgfzlwi0tzxyh.lambda-url.eu-west-2.on.aws/` with `station_name`, `start`, and `end` query parameters.
